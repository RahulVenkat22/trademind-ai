from rest_framework.permissions import SAFE_METHODS, BasePermission


class IsAdminUser(BasePermission):
    """Allow access only to admin users (is_staff or is_superuser)."""

    def has_permission(self, request, view) -> bool:
        user = request.user
        return bool(user and user.is_authenticated and (user.is_staff or user.is_superuser))


class IsAdminOrReadOnly(BasePermission):
    """Read access for any authenticated user; writes for admins only."""

    def has_permission(self, request, view) -> bool:
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return True
        return user.is_staff or user.is_superuser
