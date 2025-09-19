from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from rest_framework.test import APIClient
from rest_framework import status
from datetime import date, timedelta
from .models import Voyage, RawStock, Dish, NutritionalRequirement

User = get_user_model()


class AppLogicTests(TestCase):
    def setUp(self):
        # Users
        self.admin_user = User.objects.create_user(username='admin', password='password123', role='admin')
        self.sailor_user = User.objects.create_user(username='sailor', password='password123', role='sailor')
        self.chef_user = User.objects.create_user(username='chef', password='password123', role='chef')

        # API Client
        self.client = APIClient()

    def test_jwt_login_success(self):
        response = self.client.post('/api/login/', {'username': 'admin', 'password': 'password123'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_voyage_date_validation(self):
        with self.assertRaises(ValidationError):
            Voyage(
                name='Invalid Voyage',
                start_date=date.today(),
                end_date=date.today() - timedelta(days=1),
                total_days=0,
                created_by=self.admin_user
            ).full_clean()

    def test_nutritional_model_creation(self):
        req = NutritionalRequirement.objects.create(daily_calories=3000, daily_protein=120)
        self.assertEqual(NutritionalRequirement.objects.count(), 1)
        self.assertEqual(req.daily_protein, 120)

    def test_admin_access_to_stock_api(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/admin/stock/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_sailor_permission_denied_for_stock_api(self):
        self.client.force_authenticate(user=self.sailor_user)
        response = self.client.get('/api/admin/stock/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_chef_permission_denied_for_stock_api(self):
        self.client.force_authenticate(user=self.chef_user)
        response = self.client.get('/api/admin/stock/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_sailor_can_access_own_profile(self):
        self.client.force_authenticate(user=self.sailor_user)
        response = self.client.get('/api/sailor/profile/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)