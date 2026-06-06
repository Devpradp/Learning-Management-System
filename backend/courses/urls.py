from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CourseViewSet, ChapterViewSet

router = DefaultRouter()
router.register(r'courses', CourseViewSet, basename='course')
router.register(r'chapters', ChapterViewSet, basename='chapter')

# Nested chapters route: /api/courses/{course_pk}/chapters/
course_chapters_list = ChapterViewSet.as_view({
    'get': 'list',
    'post': 'create',
})

urlpatterns = [
    path('', include(router.urls)),
    path('courses/<int:course_pk>/chapters/', course_chapters_list, name='course-chapters'),
]
