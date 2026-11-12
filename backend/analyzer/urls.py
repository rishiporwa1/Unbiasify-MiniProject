from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register),
    path('login/', views.login),
    path('analyze/', views.analyze),
    path('history/', views.history),
    path('profile/', views.profile),
    path('profile/edit/', views.edit_profile),
    path('forgot-password/', views.forgot_password),
    path('reset-password/', views.reset_password),
    path('change-password/', views.change_password),
    path('delete-account/', views.delete_account),
    # New endpoints
    path('feedback/', views.analyze_feedback),
    path('history/<int:pk>/delete/', views.delete_analysis),
    path('export/', views.export_history),
    path('dashboard/', views.dashboard),
]
