from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .models import TextAnalysis, PasswordResetToken
from .utils import analyze_text
import secrets
from django.core.mail import send_mail
from django.conf import settings as django_settings

# AUTH
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
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '').strip()

    if not username or not password:
        return Response({'error': 'Username and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(username=username, password=password)
    if user is None:
        return Response({'error': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

    refresh = RefreshToken.for_user(user)
    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'username': user.username,
        'email': user.email,
    })


# FORGOT PASSWORD
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


# RESET PASSWORD
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


# CHANGE PASSWORD (logged in)
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


# EDIT PROFILE
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def edit_profile(request):
    user = request.user
    username = request.data.get('username', '').strip()
    email = request.data.get('email', '').strip()

    if not username:
        return Response({'error': 'Username cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)

    if username != user.username and User.objects.filter(username=username).exists():
        return Response({'error': 'Username already taken.'}, status=status.HTTP_400_BAD_REQUEST)

    if email and email != user.email and User.objects.filter(email=email).exists():
        return Response({'error': 'Email already registered.'}, status=status.HTTP_400_BAD_REQUEST)

    user.username = username
    if email:
        user.email = email
    user.save()

    return Response({'username': user.username, 'email': user.email})


# ANALYZE
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def analyze(request):
    text = request.data.get('text', '').strip()
    if not text:
        return Response({'error': 'Text cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)
    if len(text) > 5000:
        return Response({'error': 'Text too long. Max 5000 characters.'}, status=status.HTTP_400_BAD_REQUEST)

    sentiment, polarity = analyze_text(text)
    analysis = TextAnalysis.objects.create(
        user=request.user,
        text=text,
        sentiment=sentiment,
        polarity=polarity
    )
    return Response({
        'id': analysis.id,
        'sentiment': sentiment,
        'polarity': round(polarity, 4),
    })


# HISTORY
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def history(request):
    analyses = TextAnalysis.objects.filter(user=request.user).order_by('-created_at')[:20]
    data = [
        {
            'id': a.id,
            'text': a.text[:120] + ('...' if len(a.text) > 120 else ''),
            'sentiment': a.sentiment,
            'polarity': round(a.polarity, 4),
            'created_at': a.created_at.strftime('%d %b %Y, %I:%M %p'),
        }
        for a in analyses
    ]
    return Response(data)


# PROFILE
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile(request):
    user = request.user
    total = TextAnalysis.objects.filter(user=user).count()
    positive = TextAnalysis.objects.filter(user=user, sentiment='Positive').count()
    negative = TextAnalysis.objects.filter(user=user, sentiment='Negative').count()
    neutral = TextAnalysis.objects.filter(user=user, sentiment='Neutral').count()
    return Response({
        'username': user.username,
        'email': user.email,
        'date_joined': user.date_joined.strftime('%d %b %Y'),
        'total_analyses': total,
        'positive': positive,
        'negative': negative,
        'neutral': neutral,
    })