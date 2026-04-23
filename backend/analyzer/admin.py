from django.contrib import admin
from .models import TextAnalysis

@admin.register(TextAnalysis)
class TextAnalysisAdmin(admin.ModelAdmin):
    list_display = ('user', 'sentiment', 'polarity', 'created_at')
    list_filter = ('sentiment',)
    search_fields = ('user__username', 'text')