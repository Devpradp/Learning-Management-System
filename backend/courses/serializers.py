from rest_framework import serializers
from accounts.serializers import UserSerializer
from .models import Course, Chapter, Enrollment


class CourseSerializer(serializers.ModelSerializer):
    instructor = UserSerializer(read_only=True)
    is_owner = serializers.SerializerMethodField()
    is_enrolled = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = ['id', 'title', 'description', 'instructor', 'created_at', 'is_owner', 'is_enrolled']
        read_only_fields = ['id', 'created_at']

    def get_is_owner(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.instructor == request.user
        return False

    def get_is_enrolled(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.enrollments.filter(student=request.user).exists()
        return False


class ChapterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Chapter
        fields = ['id', 'course', 'title', 'content', 'is_public', 'order', 'created_at', 'updated_at']
        read_only_fields = ['id', 'course', 'created_at', 'updated_at']


class EnrollmentSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)

    class Meta:
        model = Enrollment
        fields = ['id', 'course', 'student', 'created_at']
        read_only_fields = ['id', 'created_at']
