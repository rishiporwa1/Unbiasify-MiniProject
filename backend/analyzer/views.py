from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .models import TextAnalysis, PasswordResetToken, AnalysisFeedback, UserProfile
from .utils import analyze_text
import secrets
from django.core.mail import send_mail
from django.conf import settings as django_settings
from django.utils import timezone
from datetime import timedelta
from django.db.models import Count, Q, Avg
from collections import defaultdict
import json


# ---------------------------------------------------------------------------
# AUTH
# ---------------------------------------------------------------------------

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '').strip()
    email = request.data.get('email', '').strip()

    if not username or not password or not email:
        return Response({'error': 'All fields are required.'}, status=status.HTTP_400_BAD_REQUEST)

    # Check for existing email first
    existing_by_email = User.objects.filter(email__iexact=email).first()
    if existing_by_email:
        # Auto-claim/adopt if the user was created via Clerk (user_*) or has no native password
        is_orphaned_clerk = existing_by_email.username.startswith('user_') or not existing_by_email.has_usable_password()
        if is_orphaned_clerk:
            if User.objects.filter(username=username).exclude(id=existing_by_email.id).exists():
                return Response({'error': 'Username already taken.'}, status=status.HTTP_400_BAD_REQUEST)
            existing_by_email.username = username
            existing_by_email.set_password(password)
            existing_by_email.save()
            refresh = RefreshToken.for_user(existing_by_email)
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'username': existing_by_email.username,
                'email': existing_by_email.email,
            }, status=status.HTTP_201_CREATED)

        return Response({'error': 'Email already registered. Please sign in or reset your password.'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username already taken.'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(username=username, password=password, email=email)
    refresh = RefreshToken.for_user(user)
    display_name = user.first_name.strip() if user.first_name else user.username
    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'first_name': user.first_name.strip(),
        'last_name': user.last_name.strip(),
        'name': display_name,
        'username': user.username,
        'display_name': display_name,
        'email': user.email,
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    identifier = request.data.get('username', '').strip()
    password = request.data.get('password', '').strip()

    if not identifier or not password:
        return Response({'error': 'Username/Email and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

    # Try username first, then email
    user = authenticate(username=identifier, password=password)
    if user is None:
        try:
            user_obj = User.objects.get(email=identifier)
            user = authenticate(username=user_obj.username, password=password)
        except User.DoesNotExist:
            pass

    if user is None:
        return Response({'error': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

    refresh = RefreshToken.for_user(user)
    display_name = user.first_name.strip() if user.first_name else user.username
    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'first_name': user.first_name.strip(),
        'last_name': user.last_name.strip(),
        'name': display_name,
        'username': user.username,
        'display_name': display_name,
        'email': user.email,
    })


# ---------------------------------------------------------------------------
# FORGOT PASSWORD
# ---------------------------------------------------------------------------

@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    email = request.data.get('email', '').strip()
    if not email:
        return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        # Don't reveal if email exists or not
        return Response({'message': 'If this email is registered, a reset token has been sent.'})

    # Delete old tokens for this user
    PasswordResetToken.objects.filter(user=user).delete()

    token = secrets.token_urlsafe(32)
    PasswordResetToken.objects.create(user=user, token=token)

    try:
        send_mail(
            subject='Unbiasify - Password Reset Token',
            message=f'Your password reset token is:\n\n{token}\n\nThis token is valid for 15 minutes.\n\nIf you did not request this, ignore this email.',
            from_email=django_settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
    except Exception as e:
        logger.warning(f"send_mail failed: {e}. Returning token in response for direct verification.")

    return Response({
        'message': 'Password reset token generated. Check your email or use the token below.',
        'reset_token': token
    })


# ---------------------------------------------------------------------------
# RESET PASSWORD
# ---------------------------------------------------------------------------

@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    token = request.data.get('token', '').strip()
    new_password = request.data.get('new_password', '').strip()

    if not token or not new_password:
        return Response({'error': 'Token and new password are required.'}, status=status.HTTP_400_BAD_REQUEST)

    if len(new_password) < 8:
        return Response({'error': 'Password must be at least 8 characters.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        reset_obj = PasswordResetToken.objects.get(token=token)
    except PasswordResetToken.DoesNotExist:
        return Response({'error': 'Invalid or expired token.'}, status=status.HTTP_400_BAD_REQUEST)

    if reset_obj.is_expired():
        reset_obj.delete()
        return Response({'error': 'Token has expired. Request a new one.'}, status=status.HTTP_400_BAD_REQUEST)

    user = reset_obj.user
    user.set_password(new_password)
    user.save()
    reset_obj.delete()

    return Response({'message': 'Password reset successful! You can now login.'})


# ---------------------------------------------------------------------------
# CHANGE PASSWORD (logged in)
# ---------------------------------------------------------------------------

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    old_password = request.data.get('old_password', '').strip()
    new_password = request.data.get('new_password', '').strip()

    if not old_password or not new_password:
        return Response({'error': 'Both fields are required.'}, status=status.HTTP_400_BAD_REQUEST)

    if not request.user.check_password(old_password):
        return Response({'error': 'Current password is incorrect.'}, status=status.HTTP_400_BAD_REQUEST)

    if len(new_password) < 8:
        return Response({'error': 'New password must be at least 8 characters.'}, status=status.HTTP_400_BAD_REQUEST)

    request.user.set_password(new_password)
    request.user.save()
    return Response({'message': 'Password changed successfully!'})


# ---------------------------------------------------------------------------
# EDIT PROFILE
# ---------------------------------------------------------------------------

@api_view(['PATCH', 'POST'])
@permission_classes([AllowAny])
def edit_profile(request):
    user = request.user if (request.user and request.user.is_authenticated) else None
    first_name = request.data.get('first_name', None)
    last_name = request.data.get('last_name', None)
    name = request.data.get('name', None)
    username = request.data.get('username', '').strip() if 'username' in request.data else None
    email = request.data.get('email', '').strip() if 'email' in request.data else None
    avatar = request.data.get('avatar', None)
    bio = request.data.get('bio', None)
    role = request.data.get('role', None)

    if user:
        profile_obj, _ = UserProfile.objects.get_or_create(user=user)
        if first_name is not None:
            user.first_name = first_name.strip()
        elif name is not None:
            parts = name.strip().split(' ', 1)
            user.first_name = parts[0]
            if len(parts) > 1 and last_name is None:
                user.last_name = parts[1]
        if last_name is not None:
            user.last_name = last_name.strip()

        if username is not None:
            clean_username = username.strip().lstrip('@')
            if not clean_username:
                return Response({'error': 'Username cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)
            if clean_username.lower() != user.username.lower():
                if User.objects.filter(username__iexact=clean_username).exclude(id=user.id).exists():
                    return Response({'error': f'Username "@{clean_username}" is already taken.'}, status=status.HTTP_400_BAD_REQUEST)
                user.username = clean_username
        if not user.first_name and user.username:
            user.first_name = user.username
        if email:
            user.email = email
        user.save()

        if avatar is not None:
            profile_obj.avatar = avatar
        if bio is not None:
            profile_obj.bio = bio.strip()
        if role is not None:
            profile_obj.role = role.strip()
        profile_obj.save()

        display_first_name = user.first_name.strip() if user.first_name else user.username
        return Response({
            'first_name': user.first_name.strip(),
            'last_name': user.last_name.strip(),
            'name': display_first_name,
            'display_name': display_first_name,
            'username': user.username,
            'email': user.email,
            'avatar': profile_obj.avatar,
            'bio': profile_obj.bio,
            'role': profile_obj.role,
        })
    else:
        return Response({
            'username': username or 'Guest Researcher',
            'email': email or 'guest@unbiasify.local',
            'avatar': avatar or '',
            'bio': bio or '',
            'role': role or 'Guest Session',
            'is_guest': True
        })


# ---------------------------------------------------------------------------
# DELETE ACCOUNT
# ---------------------------------------------------------------------------

@api_view(['POST', 'DELETE'])
@permission_classes([IsAuthenticated])
def delete_account(request):
    password = request.data.get('password', '').strip()
    confirm = request.data.get('confirm', False)

    if request.user.has_usable_password() and password:
        if not request.user.check_password(password):
            return Response({'error': 'Incorrect password.'}, status=status.HTTP_400_BAD_REQUEST)
    elif request.user.has_usable_password() and not confirm:
        return Response({'error': 'Password or confirmation is required to delete account.'}, status=status.HTTP_400_BAD_REQUEST)

    user_email = request.user.email or request.user.username
    request.user.delete()
    return Response({'message': f'Account {user_email} deleted successfully.'})


# ---------------------------------------------------------------------------
# CLERK WEBHOOK (SYNC DELETIONS & UPDATES AUTOMATICALLY)
# ---------------------------------------------------------------------------

@api_view(['POST'])
@permission_classes([AllowAny])
def clerk_webhook(request):
    """
    Receives events from Clerk (e.g. user.deleted, user.created, user.updated).
    Automatically deletes or synchronizes the user in the Django/Supabase database.
    """
    payload = request.data
    event_type = payload.get('type')
    data = payload.get('data', {})

    logger.info(f"Received Clerk webhook: {event_type}")

    if event_type == 'user.deleted':
        clerk_id = data.get('id')
        deleted_count = 0
        if clerk_id:
            count, _ = User.objects.filter(username=clerk_id).delete()
            deleted_count += count

        email_addresses = data.get('email_addresses', [])
        for em in email_addresses:
            addr = em.get('email_address') if isinstance(em, dict) else em
            if addr:
                count, _ = User.objects.filter(email__iexact=addr).delete()
                deleted_count += count

        return Response({'status': 'success', 'event': event_type, 'deleted': deleted_count})

    elif event_type in ('user.created', 'user.updated'):
        clerk_id = data.get('id')
        if not clerk_id:
            return Response({'error': 'Missing user id'}, status=status.HTTP_400_BAD_REQUEST)

        email_objs = data.get('email_addresses', [])
        primary_id = data.get('primary_email_address_id')
        email = ''
        for em in email_objs:
            if em.get('id') == primary_id:
                email = em.get('email_address', '')
                break
        if not email and email_objs:
            email = email_objs[0].get('email_address', '')

        user, _ = User.objects.get_or_create(username=clerk_id)
        if email:
            user.email = email
        first_name = data.get('first_name', '')
        last_name = data.get('last_name', '')
        if first_name:
            user.first_name = first_name
        if last_name:
            user.last_name = last_name
        user.save()
        return Response({'status': 'success', 'event': event_type, 'username': user.username})

    return Response({'status': 'ignored', 'event': event_type})


# ---------------------------------------------------------------------------
# ANALYZE
# ---------------------------------------------------------------------------

@api_view(['POST'])
@permission_classes([AllowAny])
def analyze(request):
    text = request.data.get('text', '').strip()
    if not text:
        return Response({'error': 'Text cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)
    if len(text) > 5000:
        return Response({'error': 'Text too long. Max 5000 characters.'}, status=status.HTTP_400_BAD_REQUEST)

    result = analyze_text(text)

    analysis_id = None
    if request.user and request.user.is_authenticated:
        analysis = TextAnalysis.objects.create(
            user=request.user,
            text=text,
            sentiment=result['sentiment'],
            polarity=result['polarity'],
            findings=result,  # store full result dict as JSON in Supabase
        )
        analysis_id = analysis.id

    return Response({
        'id': analysis_id,
        'sentiment': result['sentiment'],
        'polarity': result['polarity'],
        'subjectivity': result['subjectivity'],
        'findings': result['findings'],
        'footprint': result.get('footprint'),
        'tone': result['tone'],
        'readability': result['readability'],
        'rewrite': result['rewrite'],
    })


# ---------------------------------------------------------------------------
# HISTORY
# ---------------------------------------------------------------------------

def _findings_summary(findings_data):
    """Return per-category count from stored findings dict."""
    findings_list = findings_data.get('findings', []) if isinstance(findings_data, dict) else []
    summary = defaultdict(int)
    for f in findings_list:
        cat = f.get('category', 'unknown')
        summary[cat] += 1
    return dict(summary)


@api_view(['GET'])
@permission_classes([AllowAny])
def history(request):
    user = request.user if request.user.is_authenticated else None
    if user:
        analyses = TextAnalysis.objects.filter(user=user).order_by('-created_at')[:50]
    else:
        analyses = TextAnalysis.objects.all().order_by('-created_at')[:20]
    data = [
        {
            'id': a.id,
            'text': a.text[:120] + ('...' if len(a.text) > 120 else ''),
            'sentiment': a.sentiment,
            'polarity': round(a.polarity, 4),
            'created_at': a.created_at.strftime('%d %b %Y, %I:%M %p'),
            'findings_summary': _findings_summary(a.findings),
        }
        for a in analyses
    ]
    return Response(data)


# ---------------------------------------------------------------------------
# PROFILE
# ---------------------------------------------------------------------------

@api_view(['GET'])
@permission_classes([AllowAny])
def profile(request):
    user = request.user if (request.user and request.user.is_authenticated) else None
    if user:
        # Single database aggregation query instead of 4 sequential queries
        counts = TextAnalysis.objects.filter(user=user).aggregate(
            total=Count('id'),
            positive=Count('id', filter=Q(sentiment__iexact='Positive')),
            negative=Count('id', filter=Q(sentiment__iexact='Negative')),
            neutral=Count('id', filter=Q(sentiment__iexact='Neutral')),
        )
        profile_obj, _ = UserProfile.objects.get_or_create(user=user)
        display_name = user.first_name.strip() if user.first_name else user.username
        return Response({
            'first_name': user.first_name.strip(),
            'last_name': user.last_name.strip(),
            'name': display_name,
            'username': user.username,
            'display_name': display_name,
            'email': user.email,
            'date_joined': user.date_joined.strftime('%d %b %Y'),
            'avatar': profile_obj.avatar or '',
            'bio': profile_obj.bio or '',
            'role': profile_obj.role or 'Perspective Researcher',
            'total_analyses': counts['total'] or 0,
            'positive': counts['positive'] or 0,
            'negative': counts['negative'] or 0,
            'neutral': counts['neutral'] or 0,
        })
    else:
        return Response({
            'username': 'Guest Researcher',
            'email': 'guest@unbiasify.local',
            'date_joined': timezone.now().strftime('%d %b %Y'),
            'avatar': '',
            'bio': 'Guest Session · Try perspective detection in sandbox',
            'role': 'Guest Researcher',
            'total_analyses': 0,
            'positive': 0,
            'negative': 0,
            'neutral': 0,
            'is_guest': True,
        })


# ---------------------------------------------------------------------------
# FEEDBACK
# ---------------------------------------------------------------------------

@api_view(['POST'])
@permission_classes([AllowAny])
def analyze_feedback(request):
    """
    POST /api/feedback/
    Body: { analysis_id, finding_index, feedback_type: "useful"|"irrelevant"|"missed" }
    No authentication required.
    """
    analysis_id = request.data.get('analysis_id')
    finding_index = request.data.get('finding_index')
    feedback_type = request.data.get('feedback_type', '').strip()

    if analysis_id is None or finding_index is None or not feedback_type:
        return Response(
            {'error': 'analysis_id, finding_index, and feedback_type are required.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    valid_types = {'useful', 'irrelevant', 'missed'}
    if feedback_type not in valid_types:
        return Response(
            {'error': f'feedback_type must be one of: {", ".join(valid_types)}.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        analysis = TextAnalysis.objects.get(pk=analysis_id)
    except TextAnalysis.DoesNotExist:
        return Response({'error': 'Analysis not found.'}, status=status.HTTP_404_NOT_FOUND)

    feedback = AnalysisFeedback.objects.create(
        analysis=analysis,
        finding_index=int(finding_index),
        feedback_type=feedback_type,
    )
    return Response({'id': feedback.id, 'message': 'Feedback recorded.'}, status=status.HTTP_201_CREATED)


# ---------------------------------------------------------------------------
# DELETE ANALYSIS
# ---------------------------------------------------------------------------

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_analysis(request, pk):
    """
    DELETE /api/history/<pk>/delete/
    Authenticated; ownership-checked.
    """
    try:
        analysis = TextAnalysis.objects.get(pk=pk, user=request.user)
    except TextAnalysis.DoesNotExist:
        return Response(
            {'error': 'Analysis not found or you do not have permission to delete it.'},
            status=status.HTTP_404_NOT_FOUND,
        )
    analysis.delete()
    return Response({'message': 'Analysis deleted.'}, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# EXPORT HISTORY
# ---------------------------------------------------------------------------

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_history(request):
    """
    GET /api/export/
    Returns all user analyses as a JSON array with full findings.
    """
    analyses = TextAnalysis.objects.filter(user=request.user).order_by('-created_at')
    data = [
        {
            'id': a.id,
            'text': a.text,
            'sentiment': a.sentiment,
            'polarity': round(a.polarity, 4),
            'created_at': a.created_at.isoformat(),
            'findings': a.findings,
        }
        for a in analyses
    ]
    return Response(data)


# ---------------------------------------------------------------------------
# DASHBOARD
# ---------------------------------------------------------------------------

@api_view(['GET'])
@permission_classes([AllowAny])
def dashboard(request):
    """
    GET /api/dashboard/
    Returns analytics metrics for the authenticated user or aggregate benchmarks for guest sessions.
    Optimized with single aggregation query and lean field projections.
    """
    user = request.user if (request.user and request.user.is_authenticated) else None
    now = timezone.now()
    thirty_days_ago = now - timedelta(days=30)
    seven_days_ago = now - timedelta(days=7)
    fourteen_days_ago = now - timedelta(days=14)

    all_analyses = TextAnalysis.objects.filter(user=user) if user else TextAnalysis.objects.all()

    # 1. Single aggregation query across counts, averages, and trend buckets
    agg = all_analyses.aggregate(
        total=Count('id'),
        positive=Count('id', filter=Q(sentiment__iexact='Positive')),
        negative=Count('id', filter=Q(sentiment__iexact='Negative')),
        neutral=Count('id', filter=Q(sentiment__iexact='Neutral')),
        avg_polarity=Avg('polarity'),
        last_7=Count('id', filter=Q(created_at__gte=seven_days_ago)),
        prior_7=Count('id', filter=Q(created_at__gte=fourteen_days_ago, created_at__lt=seven_days_ago)),
    )

    total_analyses = agg['total'] or 0
    positive_count = agg['positive'] or 0
    negative_count = agg['negative'] or 0
    neutral_count = agg['neutral'] or 0
    avg_pol = agg['avg_polarity']
    avg_polarity = round(float(avg_pol), 3) if avg_pol is not None else 0.0

    # 2. Lean projection of recent analyses (only created_at and findings, omit heavy text)
    recent_rows = list(
        all_analyses.filter(created_at__gte=thirty_days_ago)
        .values('created_at', 'findings')
        .order_by('created_at')[:200]
    )

    daily = defaultdict(int)
    category_totals = defaultdict(int)
    day_set = set()

    for row in recent_rows:
        dt = row['created_at']
        day_str = dt.strftime('%Y-%m-%d')
        daily[day_str] += 1
        day_set.add(dt.date())

        findings_data = row.get('findings')
        if isinstance(findings_data, dict):
            for f in findings_data.get('findings', []):
                cat = f.get('category', 'unknown')
                category_totals[cat] += 1

    daily_counts_list = []
    for i in range(30):
        day = (now - timedelta(days=29 - i)).strftime('%Y-%m-%d')
        daily_counts_list.append({
            'date': day,
            'count': daily.get(day, 0)
        })

    last_7 = agg['last_7'] or 0
    prior_7 = agg['prior_7'] or 0
    trend_pct = None
    if prior_7 > 0:
        trend_pct = round(((last_7 - prior_7) / prior_7) * 100, 1)

    return Response({
        'is_guest': user is None,
        'total_analyses': total_analyses,
        'positive_count': positive_count,
        'negative_count': negative_count,
        'neutral_count': neutral_count,
        'avg_polarity': avg_polarity,
        'daily_counts': daily_counts_list,
        'category_totals': dict(category_totals),
        'trend': {
            'last_7_days': last_7,
            'prior_7_days': prior_7,
            'change_pct': trend_pct,
        },
    })
