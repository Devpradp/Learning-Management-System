from django.test import TestCase
from accounts.models import User


class UserModelTest(TestCase):
    def test_create_instructor(self):
        u = User.objects.create_user(username='prof', password='pass', role='instructor')
        self.assertEqual(u.role, 'instructor')

    def test_create_student(self):
        u = User.objects.create_user(username='stu', password='pass', role='student')
        self.assertEqual(u.role, 'student')

    def test_default_role_is_student(self):
        u = User.objects.create_user(username='x', password='pass')
        self.assertEqual(u.role, 'student')
