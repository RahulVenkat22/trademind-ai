from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend

User = get_user_model()


class EmailBackend(ModelBackend):
    """Authenticate by email instead of username.

    SimpleJWT passes the login identifier under the serializer's
    ``username_field`` (set to ``email`` on LoginSerializer), so it arrives
    here as the ``email`` kwarg. We fall back to ``username`` so the backend
    also works for any code path that still authenticates by username.
    """

    def authenticate(self, request, username=None, password=None, **kwargs):
        email = kwargs.get("email", username)
        if email is None or password is None:
            return None
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return None
        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None
