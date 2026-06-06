from rest_framework.permissions import BasePermission


class IsInstructor(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'instructor'


class IsCourseOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        course = obj if hasattr(obj, 'instructor') else obj.course
        return course.instructor == request.user


class IsEnrolledOrOwner(BasePermission):
    """For Chapter access: owner sees all; enrolled student sees public chapters only."""
    def has_object_permission(self, request, view, obj):
        # obj is a Chapter
        if obj.course.instructor == request.user:
            return True
        enrolled = obj.course.enrollments.filter(student=request.user).exists()
        if enrolled and obj.is_public:
            return True
        return False
