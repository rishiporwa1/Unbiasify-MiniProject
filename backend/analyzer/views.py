from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .models import TextAnalysis
from .utils import analyze_text


# ─── AUTH ────────────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '').strip()
    email = request.data.get('email', '').strip()

    if not username or not password:
        return Response({'error': 'Username and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username already taken.'}, status=status.HTTP_400_BAD_REQUEST)

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


# ─── ANALYZE ─────────────────────────────────────────────────────────────────

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


# ─── HISTORY ─────────────────────────────────────────────────────────────────

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


# ─── PROFILE ─────────────────────────────────────────────────────────────────

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