from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework.authtoken.models import Token
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


class RegisterAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = reverse('auth-register')

    def test_register_instructor(self):
        res = self.client.post(self.url, {
            'username': 'prof1', 'password': 'pass123', 'role': 'instructor'
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn('token', res.data)
        self.assertEqual(res.data['user']['role'], 'instructor')

    def test_register_student(self):
        res = self.client.post(self.url, {
            'username': 'stu1', 'password': 'pass123', 'role': 'student'
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['user']['role'], 'student')

    def test_register_invalid_role(self):
        res = self.client.post(self.url, {
            'username': 'bad', 'password': 'pass123', 'role': 'admin'
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_duplicate_username(self):
        User.objects.create_user(username='dup', password='pass', role='student')
        res = self.client.post(self.url, {
            'username': 'dup', 'password': 'pass123', 'role': 'student'
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_short_password_rejected(self):
        res = self.client.post(self.url, {
            'username': 'usr', 'password': 'ab', 'role': 'student'
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


class LoginAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = reverse('auth-login')
        self.user = User.objects.create_user(username='u', password='pass123', role='student')

    def test_login_success(self):
        res = self.client.post(self.url, {'username': 'u', 'password': 'pass123'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('token', res.data)

    def test_login_wrong_password(self):
        res = self.client.post(self.url, {'username': 'u', 'password': 'wrong'})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


class MeAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = reverse('auth-me')
        self.user = User.objects.create_user(username='u', password='p', role='instructor')
        self.token = Token.objects.create(user=self.user)

    def test_me_authenticated(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['username'], 'u')
        self.assertEqual(res.data['role'], 'instructor')

    def test_me_unauthenticated(self):
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
