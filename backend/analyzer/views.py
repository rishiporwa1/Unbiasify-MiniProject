from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import TextAnalysis
from .utils import analyze_text

@api_view(['POST'])
def analyze(request):
    text = request.data.get("text", "")

    sentiment, polarity = analyze_text(text)

    TextAnalysis.objects.create(
        text=text,
        sentiment=sentiment,
        polarity=polarity
    )

    return Response({
        "sentiment": sentiment,
        "polarity": polarity
    })
