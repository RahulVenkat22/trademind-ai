from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ("username", "email", "is_staff", "is_superuser", "created_at")
    list_filter = ("is_staff", "is_superuser")
    ordering = ("-created_at",)
    readonly_fields = ("created_at",)
