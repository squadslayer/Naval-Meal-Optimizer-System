from rest_framework import serializers
from .models import *


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'last_name', 'role', 'email')
        read_only_fields = ('id',)


class UserManagementSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'last_name', 'role', 'email', 'password')
        extra_kwargs = {
            'password': {'write_only': True, 'required': False},
        }

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


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

    def validate(self, data):
        """
        Custom validation to check dates and total_days. This is the correct
        place for this logic in a DRF application.
        """
        # 1. Check that end_date is not before start_date
        if data['end_date'] < data['start_date']:
            raise serializers.ValidationError({"end_date": "End date cannot be before the start date."})

        # 2. Check that the provided total_days matches the date range
        calculated_days = (data['end_date'] - data['start_date']).days + 1
        if data['total_days'] != calculated_days:
            raise serializers.ValidationError({
                "total_days": f"The duration for the selected dates is {calculated_days} days, not {data['total_days']}."
            })

        return data


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


class ChefMealPlanSerializer(serializers.ModelSerializer):
    dish = DishNameSerializer(read_only=True)

    class Meta:
        model = MealPlan
        fields = ['id', 'meal_date', 'meal_type', 'dish']


class ChefAssignmentSerializer(serializers.ModelSerializer):
    meal_plan = ChefMealPlanSerializer(read_only=True)

    class Meta:
        model = ChefAssignment
        fields = ['id', 'meal_plan', 'counter_number']