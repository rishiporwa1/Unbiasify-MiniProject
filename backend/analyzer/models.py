from django.db import models

class TextAnalysis(models.Model):
    text = models.TextField()
    sentiment = models.CharField(max_length=20)
    polarity = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sentiment} ({self.polarity})"

