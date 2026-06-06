from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Course, Chapter, Enrollment
from .serializers import CourseSerializer, ChapterSerializer, EnrollmentSerializer
from .permissions import IsInstructor, IsCourseOwner, IsEnrolledOrOwner


class CourseViewSet(viewsets.ModelViewSet):
    serializer_class = CourseSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'instructor':
            return Course.objects.filter(instructor=user)
        return Course.objects.all()

    def get_permissions(self):
        if self.action == 'create':
            return [IsAuthenticated(), IsInstructor()]
        elif self.action in ('update', 'partial_update', 'destroy'):
            return [IsAuthenticated(), IsCourseOwner()]
        elif self.action == 'enroll':
            return [IsAuthenticated()]
        else:
            # list, retrieve
            return [IsAuthenticated()]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def perform_create(self, serializer):
        serializer.save(instructor=self.request.user)

    def get_object(self):
        obj = super().get_object()
        # Check object-level permissions for actions that need them
        if self.action in ('update', 'partial_update', 'destroy'):
            self.check_object_permissions(self.request, obj)
        return obj

    @action(detail=True, methods=['post', 'delete'])
    def enroll(self, request, pk=None):
        course = self.get_object()
        if request.method == 'POST':
            if Enrollment.objects.filter(student=request.user, course=course).exists():
                return Response({'detail': 'Already enrolled.'}, status=status.HTTP_400_BAD_REQUEST)
            enrollment = Enrollment.objects.create(student=request.user, course=course)
            serializer = EnrollmentSerializer(enrollment)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            # DELETE
            try:
                enrollment = Enrollment.objects.get(student=request.user, course=course)
                enrollment.delete()
                return Response(status=status.HTTP_204_NO_CONTENT)
            except Enrollment.DoesNotExist:
                return Response({'detail': 'Not enrolled.'}, status=status.HTTP_404_NOT_FOUND)


class ChapterViewSet(viewsets.ModelViewSet):
    serializer_class = ChapterSerializer

    def get_permissions(self):
        if self.action == 'list':
            return [IsAuthenticated()]
        elif self.action == 'retrieve':
            return [IsAuthenticated(), IsEnrolledOrOwner()]
        else:
            return [IsAuthenticated(), IsCourseOwner()]

    def get_queryset(self):
        # For nested routes (list/create), course_pk is in kwargs
        course_pk = self.kwargs.get('course_pk')
        if course_pk:
            return Chapter.objects.filter(course_id=course_pk)
        # For flat routes (retrieve/update/destroy), filter by pk
        return Chapter.objects.all()

    def list(self, request, *args, **kwargs):
        course_pk = self.kwargs.get('course_pk')
        try:
            course = Course.objects.get(pk=course_pk)
        except Course.DoesNotExist:
            return Response({'detail': 'Course not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Owner sees all chapters
        if course.instructor == request.user:
            queryset = Chapter.objects.filter(course=course)
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)

        # Check enrollment
        is_enrolled = course.enrollments.filter(student=request.user).exists()
        if not is_enrolled:
            return Response({'detail': 'You are not enrolled in this course.'}, status=status.HTTP_403_FORBIDDEN)

        # Enrolled student sees only public chapters
        queryset = Chapter.objects.filter(course=course, is_public=True)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        course_pk = self.kwargs.get('course_pk')
        try:
            course = Course.objects.get(pk=course_pk)
        except Course.DoesNotExist:
            return Response({'detail': 'Course not found.'}, status=status.HTTP_404_NOT_FOUND)

        if course.instructor != request.user:
            return Response({'detail': 'You do not own this course.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(course=course)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def get_object(self):
        obj = super().get_object()
        self.check_object_permissions(self.request, obj)
        return obj

    def update(self, request, *args, **kwargs):
        chapter = self.get_object()
        if chapter.course.instructor != request.user:
            return Response({'detail': 'You do not own this course.'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        chapter = self.get_object()
        if chapter.course.instructor != request.user:
            return Response({'detail': 'You do not own this course.'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)
