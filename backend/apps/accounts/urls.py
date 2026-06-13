from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from django.urls import path

from .views import LoginView, LogoutView, MeView, UserViewSet

# No trailing slash to match the frontend's axios client.
router = DefaultRouter(trailing_slash="")
router.register(r"users", UserViewSet, basename="user")

urlpatterns = [
    path("auth/login", LoginView.as_view(), name="login"),
    path("auth/logout", LogoutView.as_view(), name="logout"),
    path("auth/refresh", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/me", MeView.as_view(), name="me"),
    *router.urls,
]
