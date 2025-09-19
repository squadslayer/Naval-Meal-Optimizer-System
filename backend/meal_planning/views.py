from django.db import transaction
from django.contrib.auth import authenticate
from django.db.models import Count, Avg, Sum
from datetime import date, timedelta
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from .permissions import IsAdminUser, IsChefUser, IsSailorUser
from .models import *
from .serializers import *
from .tasks import run_meal_plan_optimization

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username, password = request.data.get('username'), request.data.get('password')
        user = authenticate(username=username, password=password)
        if user:
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': UserSerializer(user).data
            })
        return Response({'error': 'Invalid Credentials'}, status=status.HTTP_401_UNAUTHORIZED)

class AdminActionView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        action = request.data.get('action')

        if action == 'create_voyage':
            serializer = VoyageSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            try:
                with transaction.atomic():
                    Voyage.objects.update(is_active=False)
                    voyage = serializer.save(created_by=request.user, is_active=True)
                return Response({'success': True, 'voyage_id': voyage.id}, status=status.HTTP_201_CREATED)
            except ValidationError as e:
                return Response({'error': e.message_dict}, status=status.HTTP_400_BAD_REQUEST)

        elif action == 'optimize_meals':
            voyage = Voyage.objects.filter(is_active=True).first()
            if not voyage:
                return Response({'error': 'No active voyage'}, status=status.HTTP_400_BAD_REQUEST)

            run_meal_plan_optimization.delay(voyage.id)
            message = f"Meal plan optimization has been started for voyage '{voyage.name}'. This may take a few moments."
            return Response({'success': True, 'message': message})

        return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)

class StockManagementView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        return Response(RawStockSerializer(RawStock.objects.all(), many=True).data)

    def post(self, request):
        serializer = RawStockSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        try:
            stock = RawStock.objects.get(pk=pk)
        except RawStock.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        serializer = RawStockSerializer(stock, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class DishManagementView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        return Response(DishSerializer(Dish.objects.all(), many=True).data)

    def post(self, request):
        serializer = DishSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        try:
            dish = Dish.objects.get(pk=pk)
        except Dish.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        serializer = DishSerializer(dish, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SailorProfileView(APIView):
    permission_classes = [IsSailorUser]

    def get(self, request):
        profile, _ = SailorProfile.objects.get_or_create(user=request.user)
        return Response(SailorProfileSerializer(profile).data)

    def put(self, request):
        profile, _ = SailorProfile.objects.get_or_create(user=request.user)
        serializer = SailorProfileSerializer(profile, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class FeedbackView(APIView):
    permission_classes = [IsSailorUser]

    def post(self, request):
        serializer = SatisfactionRatingSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(sailor=request.user)
            return Response({'success': True}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AnalyticsView(APIView):
    permission_classes = [IsAdminUser]

    @method_decorator(cache_page(60 * 15))
    def get(self, request):
        days = int(request.query_params.get('days', 7))
        start_date = date.today() - timedelta(days=days)
        stock = StockUsageLog.objects.filter(log_date__gte=start_date).values('item__item_name').annotate(
            total=Sum('quantity_used')).order_by('-total')
        satisfaction = SatisfactionRating.objects.filter(meal_plan__meal_date__gte=start_date).values(
            'meal_plan__dish__dish_name').annotate(avg=Avg('rating')).order_by('-avg')
        return Response({'stock_usage': list(stock), 'satisfaction': list(satisfaction)})
class SailorMealPlanView(APIView):
    permission_classes = [IsSailorUser]

    def get(self, request):
        # Find all meal plan assignments for the current sailor
        assignments = SailorAssignment.objects.filter(sailor=request.user).select_related('meal_plan__dish')
        # Extract the actual MealPlan objects from the assignments
        meal_plans = [assignment.meal_plan for assignment in assignments]
        serializer = SailorMealPlanSerializer(meal_plans, many=True)
        return Response(serializer.data)