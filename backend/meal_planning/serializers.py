from rest_framework import serializers
from .models import *

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'last_name', 'role')

class SailorProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = SailorProfile
        fields = ('preference_type', 'has_gluten_allergy', 'has_nut_allergy', 'has_dairy_allergy')

class RawStockSerializer(serializers.ModelSerializer):
    needs_reorder = serializers.BooleanField(read_only=True)

    class Meta:
        model = RawStock
        fields = ('id', 'item_name', 'total_quantity', 'unit', 'reorder_level', 'needs_reorder')

class DishSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dish
        fields = '__all__'

class VoyageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Voyage
        fields = ('name', 'start_date', 'end_date', 'total_days')

class SatisfactionRatingSerializer(serializers.ModelSerializer):
    class Meta:
        model = SatisfactionRating
        fields = ('meal_plan', 'rating', 'comments')
        read_only_fields = ('sailor',)

class MealNutritionAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = MealNutritionAnalysis
        fields = '__all__'
class DishNameSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dish
        fields = ['dish_name']

class SailorMealPlanSerializer(serializers.ModelSerializer):
    dish = DishNameSerializer(read_only=True)

    class Meta:
        model = MealPlan
        fields = ['id', 'meal_date', 'meal_type', 'dish']