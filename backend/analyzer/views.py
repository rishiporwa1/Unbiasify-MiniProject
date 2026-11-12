from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .models import TextAnalysis, PasswordResetToken, AnalysisFeedback
from .utils import analyze_text
import secrets
from django.core.mail import send_mail
from django.conf import settings as django_settings
from django.utils import timezone
from datetime import timedelta
from django.db.models import Count
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

    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username already taken.'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(email=email).exists():
        return Response({'error': 'Email already registered.'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(username=username, password=password, email=email)
    refresh = RefreshToken.for_user(user)
    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'username': user.username,
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
    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'username': user.username,
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
    except Exception:
        return Response({'error': 'Failed to send email. Please try again later.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return Response({'message': 'If this email is registered, a reset token has been sent.'})


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

@api_view(['PATCH'])
@permission_classes([AllowAny])
def edit_profile(request):
    user = request.user if (request.user and request.user.is_authenticated) else None
    username = request.data.get('username', '').strip()
    email = request.data.get('email', '').strip()

    if not username:
        return Response({'error': 'Username cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)

    if user:
        if user.username.startswith('user_'):
            user.first_name = username
        else:
            if username != user.username and User.objects.filter(username=username).exists():
                return Response({'error': 'Username already taken.'}, status=status.HTTP_400_BAD_REQUEST)
            user.username = username
        if email:
            user.email = email
        user.save()
        display_name = user.first_name if (user.username.startswith('user_') and user.first_name) else user.username
        return Response({'username': display_name, 'email': user.email})
    else:
        return Response({'username': username, 'email': email or 'guest@unbiasify.local', 'is_guest': True})


# ---------------------------------------------------------------------------
# DELETE ACCOUNT
# ---------------------------------------------------------------------------

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def delete_account(request):
    password = request.data.get('password', '').strip()
    if not password:
        return Response({'error': 'Password is required.'}, status=status.HTTP_400_BAD_REQUEST)
    if not request.user.check_password(password):
        return Response({'error': 'Incorrect password.'}, status=status.HTTP_400_BAD_REQUEST)
    request.user.delete()
    return Response({'message': 'Account deleted successfully.'})


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
        total = TextAnalysis.objects.filter(user=user).count()
        positive = TextAnalysis.objects.filter(user=user, sentiment='Positive').count()
        negative = TextAnalysis.objects.filter(user=user, sentiment='Negative').count()
        neutral = TextAnalysis.objects.filter(user=user, sentiment='Neutral').count()
        display_name = user.first_name if (user.username.startswith('user_') and user.first_name) else user.username
        return Response({
            'username': display_name,
            'email': user.email,
            'date_joined': user.date_joined.strftime('%d %b %Y'),
            'total_analyses': total,
            'positive': positive,
            'negative': negative,
            'neutral': neutral,
        })
    else:
        return Response({
            'username': 'Guest Researcher',
            'email': 'guest@unbiasify.local',
            'date_joined': timezone.now().strftime('%d %b %Y'),
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
    """
    user = request.user if (request.user and request.user.is_authenticated) else None
    now = timezone.now()
    thirty_days_ago = now - timedelta(days=30)

    if user:
        all_analyses = TextAnalysis.objects.filter(user=user)
    else:
        all_analyses = TextAnalysis.objects.all()

    total_analyses = all_analyses.count()

    # Last 30-day analyses
    recent = all_analyses.filter(created_at__gte=thirty_days_ago).order_by('created_at')

    # Daily counts
    daily = defaultdict(int)
    for a in recent:
        day_str = a.created_at.strftime('%Y-%m-%d')
        daily[day_str] += 1

    daily_counts_list = []
    for i in range(30):
        day = (now - timedelta(days=29 - i)).strftime('%Y-%m-%d')
        daily_counts_list.append({
            'date': day,
            'count': daily.get(day, 0)
        })

    # Sentiment distribution
    positive_count = all_analyses.filter(sentiment__iexact='Positive').count()
    negative_count = all_analyses.filter(sentiment__iexact='Negative').count()
    neutral_count = all_analyses.filter(sentiment__iexact='Neutral').count()

    # Average polarity
    from django.db.models import Avg
    avg_pol = all_analyses.aggregate(Avg('polarity'))['polarity__avg']
    avg_polarity = round(float(avg_pol), 3) if avg_pol is not None else 0.0

    # Calculate streak (consecutive days with at least 1 analysis)
    streak = 0
    if user:
        check_day = now.date()
        day_analyses = set(all_analyses.values_list('created_at__date', flat=True))
        if check_day in day_analyses or (check_day - timedelta(days=1)) in day_analyses:
            current = check_day if check_day in day_analyses else (check_day - timedelta(days=1))
            while current in day_analyses:
                streak += 1
                current = current - timedelta(days=1)
    else:
        streak = 1

    # Category totals across analyses
    category_totals = defaultdict(int)
    for a in all_analyses[:200]:
        findings_data = a.findings
        if isinstance(findings_data, dict):
            findings_list = findings_data.get('findings', [])
            for f in findings_list:
                cat = f.get('category', 'unknown')
                category_totals[cat] += 1

    # Trend: last 7 days vs prior 7 days
    seven_days_ago = now - timedelta(days=7)
    fourteen_days_ago = now - timedelta(days=14)

    last_7 = all_analyses.filter(created_at__gte=seven_days_ago).count()
    prior_7 = all_analyses.filter(
        created_at__gte=fourteen_days_ago,
        created_at__lt=seven_days_ago,
    ).count()

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
        'streak': streak,
        'daily_counts': daily_counts_list,
        'category_totals': dict(category_totals),
        'trend': {
            'last_7_days': last_7,
            'prior_7_days': prior_7,
            'change_pct': trend_pct,
        },
    })
