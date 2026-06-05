from django.test import TestCase
from accounts.models import User
from courses.models import Course, Chapter, Enrollment
from rest_framework.test import APITestCase
from rest_framework.authtoken.models import Token
from django.urls import reverse


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


class CourseAPITest(APITestCase):
    def setUp(self):
        self.instructor = User.objects.create_user(
            username='instructor1', password='pass123', role='instructor'
        )
        self.instructor2 = User.objects.create_user(
            username='instructor2', password='pass123', role='instructor'
        )
        self.student = User.objects.create_user(
            username='student1', password='pass123', role='student'
        )
        self.instructor_token = Token.objects.create(user=self.instructor)
        self.instructor2_token = Token.objects.create(user=self.instructor2)
        self.student_token = Token.objects.create(user=self.student)

        self.course = Course.objects.create(
            title='Existing Course', instructor=self.instructor
        )

    def auth(self, token):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')

    def deauth(self):
        self.client.credentials()

    def test_instructor_can_create_course(self):
        self.auth(self.instructor_token)
        response = self.client.post('/api/courses/', {'title': 'New Course', 'description': 'Desc'})
        self.assertEqual(response.status_code, 201)

    def test_student_cannot_create_course(self):
        self.auth(self.student_token)
        response = self.client.post('/api/courses/', {'title': 'New Course', 'description': 'Desc'})
        self.assertEqual(response.status_code, 403)

    def test_unauthenticated_cannot_create_course(self):
        self.deauth()
        response = self.client.post('/api/courses/', {'title': 'New Course', 'description': 'Desc'})
        self.assertEqual(response.status_code, 401)

    def test_list_courses_authenticated(self):
        self.auth(self.instructor_token)
        response = self.client.get('/api/courses/')
        self.assertEqual(response.status_code, 200)
        self.assertGreater(len(response.data), 0)
        # Check that is_owner and is_enrolled fields are present
        first = response.data[0]
        self.assertIn('is_owner', first)
        self.assertIn('is_enrolled', first)

    def test_owner_can_update_course(self):
        self.auth(self.instructor_token)
        response = self.client.patch(f'/api/courses/{self.course.id}/', {'title': 'Updated Title'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['title'], 'Updated Title')

    def test_non_owner_cannot_update_course(self):
        self.auth(self.instructor2_token)
        response = self.client.patch(f'/api/courses/{self.course.id}/', {'title': 'Hacked Title'})
        self.assertEqual(response.status_code, 403)

    def test_owner_can_delete_course(self):
        self.auth(self.instructor_token)
        response = self.client.delete(f'/api/courses/{self.course.id}/')
        self.assertEqual(response.status_code, 204)

    def test_student_can_enroll(self):
        self.auth(self.student_token)
        response = self.client.post(f'/api/courses/{self.course.id}/enroll/')
        self.assertEqual(response.status_code, 201)

    def test_student_can_leave(self):
        self.auth(self.student_token)
        Enrollment.objects.create(student=self.student, course=self.course)
        response = self.client.delete(f'/api/courses/{self.course.id}/enroll/')
        self.assertEqual(response.status_code, 204)

    def test_double_enroll_returns_400(self):
        self.auth(self.student_token)
        self.client.post(f'/api/courses/{self.course.id}/enroll/')
        response = self.client.post(f'/api/courses/{self.course.id}/enroll/')
        self.assertEqual(response.status_code, 400)


class ChapterAPITest(APITestCase):
    def setUp(self):
        self.instructor = User.objects.create_user(
            username='chap_instructor', password='pass123', role='instructor'
        )
        self.other_instructor = User.objects.create_user(
            username='other_instructor', password='pass123', role='instructor'
        )
        self.enrolled_student = User.objects.create_user(
            username='enrolled_student', password='pass123', role='student'
        )
        self.non_enrolled_student = User.objects.create_user(
            username='non_enrolled_student', password='pass123', role='student'
        )
        self.instructor_token = Token.objects.create(user=self.instructor)
        self.other_instructor_token = Token.objects.create(user=self.other_instructor)
        self.enrolled_token = Token.objects.create(user=self.enrolled_student)
        self.non_enrolled_token = Token.objects.create(user=self.non_enrolled_student)

        self.course = Course.objects.create(
            title='Chapter Test Course', instructor=self.instructor
        )
        self.public_chapter = Chapter.objects.create(
            course=self.course, title='Public Chapter', content=[], is_public=True, order=1
        )
        self.private_chapter = Chapter.objects.create(
            course=self.course, title='Private Chapter', content=[], is_public=False, order=2
        )
        Enrollment.objects.create(student=self.enrolled_student, course=self.course)

    def auth(self, token):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')

    def deauth(self):
        self.client.credentials()

    def test_owner_sees_all_chapters(self):
        self.auth(self.instructor_token)
        response = self.client.get(f'/api/courses/{self.course.id}/chapters/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 2)

    def test_enrolled_student_sees_only_public_chapters(self):
        self.auth(self.enrolled_token)
        response = self.client.get(f'/api/courses/{self.course.id}/chapters/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'Public Chapter')

    def test_non_enrolled_student_gets_403_on_chapter_list(self):
        self.auth(self.non_enrolled_token)
        response = self.client.get(f'/api/courses/{self.course.id}/chapters/')
        self.assertEqual(response.status_code, 403)

    def test_unauthenticated_gets_401_on_chapter_list(self):
        self.deauth()
        response = self.client.get(f'/api/courses/{self.course.id}/chapters/')
        self.assertEqual(response.status_code, 401)

    def test_owner_can_create_chapter(self):
        self.auth(self.instructor_token)
        response = self.client.post(
            f'/api/courses/{self.course.id}/chapters/',
            {'title': 'New Chapter', 'content': [], 'is_public': True, 'order': 3},
            format='json'
        )
        self.assertEqual(response.status_code, 201)

    def test_non_owner_cannot_create_chapter(self):
        self.auth(self.enrolled_token)
        response = self.client.post(
            f'/api/courses/{self.course.id}/chapters/',
            {'title': 'Hacked Chapter', 'content': [], 'is_public': True, 'order': 3},
            format='json'
        )
        self.assertEqual(response.status_code, 403)

    def test_owner_can_update_chapter(self):
        self.auth(self.instructor_token)
        response = self.client.patch(
            f'/api/chapters/{self.public_chapter.id}/',
            {'title': 'Updated Chapter'}
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['title'], 'Updated Chapter')

    def test_non_owner_cannot_update_chapter(self):
        self.auth(self.other_instructor_token)
        response = self.client.patch(
            f'/api/chapters/{self.public_chapter.id}/',
            {'title': 'Hacked Chapter'}
        )
        self.assertEqual(response.status_code, 403)

    def test_non_enrolled_cannot_retrieve_private_chapter(self):
        self.auth(self.non_enrolled_token)
        response = self.client.get(f'/api/chapters/{self.private_chapter.id}/')
        self.assertEqual(response.status_code, 403)

    def test_enrolled_student_can_retrieve_public_chapter(self):
        self.auth(self.enrolled_token)
        response = self.client.get(f'/api/chapters/{self.public_chapter.id}/')
        self.assertEqual(response.status_code, 200)

    def test_enrolled_student_cannot_retrieve_private_chapter(self):
        self.auth(self.enrolled_token)
        response = self.client.get(f'/api/chapters/{self.private_chapter.id}/')
        self.assertEqual(response.status_code, 403)

    def test_owner_can_retrieve_private_chapter(self):
        self.auth(self.instructor_token)
        response = self.client.get(f'/api/chapters/{self.private_chapter.id}/')
        self.assertEqual(response.status_code, 200)
