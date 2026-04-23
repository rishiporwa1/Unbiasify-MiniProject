from django.db import models
from django.contrib.auth.models import User


class TextAnalysis(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='analyses')
    text = models.TextField()
    sentiment = models.CharField(max_length=20)
    polarity = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.sentiment} ({self.polarity})"