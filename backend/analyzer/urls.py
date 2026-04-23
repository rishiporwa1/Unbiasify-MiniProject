from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register),
    path('login/', views.login),
    path('analyze/', views.analyze),
    path('history/', views.history),
    path('profile/', views.profile),
]