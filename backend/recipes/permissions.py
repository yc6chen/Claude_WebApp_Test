from rest_framework import permissions


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to edit it.
    Read permissions are allowed for any authenticated user.
    """

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed for any request (GET, HEAD, OPTIONS)
        if request.method in permissions.SAFE_METHODS:
            # For private recipes, only the owner can read
            if hasattr(obj, 'is_private') and obj.is_private:
                return obj.owner == request.user
            return True

        # Write permissions are only allowed to the owner
        return obj.owner == request.user


class IsOwner(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to access it.
    """

    def has_object_permission(self, request, view, obj):
        return obj.owner == request.user
