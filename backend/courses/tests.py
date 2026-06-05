from django.test import TestCase
from accounts.models import User
from courses.models import Course, Chapter, Enrollment


class CourseModelTest(TestCase):
    def setUp(self):
        self.instructor = User.objects.create_user(
            username='prof', password='pass', role='instructor'
        )

    def test_create_course(self):
        course = Course.objects.create(
            title='Python 101', instructor=self.instructor
        )
        self.assertEqual(course.title, 'Python 101')
        self.assertEqual(course.instructor, self.instructor)

    def test_create_chapter(self):
        course = Course.objects.create(title='Python 101', instructor=self.instructor)
        chapter = Chapter.objects.create(
            course=course, title='Intro', content=[], is_public=True, order=1
        )
        self.assertEqual(chapter.course, course)
        self.assertFalse(Chapter(course=course, title='x', content=[]).is_public)  # default False

    def test_chapter_default_not_public(self):
        course = Course.objects.create(title='C', instructor=self.instructor)
        ch = Chapter.objects.create(course=course, title='ch1', content=[])
        self.assertFalse(ch.is_public)

    def test_enrollment_unique_together(self):
        from django.db import IntegrityError, transaction
        student = User.objects.create_user(username='stu', password='pass', role='student')
        course = Course.objects.create(title='C', instructor=self.instructor)
        Enrollment.objects.create(student=student, course=course)
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Enrollment.objects.create(student=student, course=course)

    def test_enrollment_str(self):
        student = User.objects.create_user(username='stu', password='pass', role='student')
        course = Course.objects.create(title='Django', instructor=self.instructor)
        e = Enrollment.objects.create(student=student, course=course)
        self.assertIn('stu', str(e))
        self.assertIn('Django', str(e))
