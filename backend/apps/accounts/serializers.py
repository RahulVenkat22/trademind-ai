import secrets
import string

from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


def generate_password(length: int = 12) -> str:
    """Generate a reasonably strong random password."""
    alphabet = string.ascii_letters + string.digits + "!@#$%&*"
    # Ensure at least one of each class for password validators.
    while True:
        pwd = "".join(secrets.choice(alphabet) for _ in range(length))
        if (
            any(c.islower() for c in pwd)
            and any(c.isupper() for c in pwd)
            and any(c.isdigit() for c in pwd)
        ):
            return pwd


class UserSerializer(serializers.ModelSerializer):
    """Read serializer for user records."""

    class Meta:
        model = User
        fields = ["id", "username", "email", "is_staff", "is_superuser", "created_at"]
        read_only_fields = fields


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password", "is_staff", "is_superuser"]

    def create(self, validated_data):
        # Generate a password if none was supplied; expose it so the view can email it.
        raw_password = validated_data.pop("password", "") or generate_password()
        user = User(**validated_data)
        user.set_password(raw_password)
        user.save()
        # Stash the plaintext for the view (never persisted/serialized).
        user._raw_password = raw_password
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password", "is_staff", "is_superuser"]

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class LoginSerializer(TokenObtainPairSerializer):
    """JWT login by email that also returns the serialized user profile."""

    # Use email as the login identifier instead of the default username.
    username_field = "email"

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data
