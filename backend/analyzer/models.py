from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta


class TextAnalysis(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='analyses')
    text = models.TextField()
    sentiment = models.CharField(max_length=20)
    polarity = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)
    # Full analysis result stored as JSON (findings, tone, readability, rewrite, etc.)
    findings = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return f"{self.user.username} - {self.sentiment} ({self.polarity})"


class PasswordResetToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    token = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_expired(self):
        return timezone.now() > self.created_at + timedelta(minutes=15)

    def __str__(self):
        return f"{self.user.username} - {self.token[:10]}..."


class AnalysisFeedback(models.Model):
    """Stores per-finding user feedback (useful / irrelevant / missed)."""
    FEEDBACK_CHOICES = [
        ('useful',     'Useful'),
        ('irrelevant', 'Irrelevant'),
        ('missed',     'Missed'),
    ]

    analysis = models.ForeignKey(
        TextAnalysis,
        on_delete=models.CASCADE,
        related_name='feedbacks'
    )
    finding_index = models.IntegerField()
    feedback_type = models.CharField(max_length=20, choices=FEEDBACK_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return (
            f"Feedback on analysis {self.analysis_id} "
            f"finding #{self.finding_index}: {self.feedback_type}"
        )
