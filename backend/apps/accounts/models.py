from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom user model.

    Admin = is_staff or is_superuser (full access). Regular users are
    read-only. `created_at` mirrors the schema in the project spec.
    """

    email = models.EmailField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    REQUIRED_FIELDS = ["email"]

    @property
    def is_admin(self) -> bool:
        return self.is_staff or self.is_superuser

    def __str__(self) -> str:
        return self.username
