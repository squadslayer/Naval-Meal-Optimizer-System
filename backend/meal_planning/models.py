from django.db import models
from django.db.models import F
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from datetime import date
from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import logging

logger = logging.getLogger(__name__)


class User(AbstractUser):
    ROLE_CHOICES = [('admin', 'Admin'), ('chef', 'Chef'), ('sailor', 'Sailor')]
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='sailor')
    created_at = models.DateTimeField(auto_now_add=True)


class SailorProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    preference_type = models.CharField(max_length=10, choices=[('veg', 'Vegetarian'), ('non_veg', 'Non-Vegetarian')],
                                       default='non_veg')
    has_gluten_allergy = models.BooleanField(default=False)
    has_nut_allergy = models.BooleanField(default=False)
    has_dairy_allergy = models.BooleanField(default=False)

    @property
    def category(self):
        allergies = [name for flag, name in [(self.has_gluten_allergy, 'Gluten'), (self.has_nut_allergy, 'Nut'),
                                             (self.has_dairy_allergy, 'Dairy')] if flag]
        base = 'Veg' if self.preference_type == 'veg' else 'Non-Veg'
        return f"{base} with {', '.join(allergies)} Allergies" if allergies else base


class RawStock(models.Model):
    item_name = models.CharField(max_length=100, unique=True)
    total_quantity = models.FloatField(validators=[MinValueValidator(0)])
    unit = models.CharField(max_length=10, choices=[('kg', 'Kilograms'), ('liters', 'Liters'), ('pieces', 'Pieces'),
                                                    ('grams', 'Grams')])
    reorder_level = models.FloatField(validators=[MinValueValidator(0)], default=10)

    @property
    def needs_reorder(self):
        return self.total_quantity < self.reorder_level


class Dish(models.Model):
    dish_name = models.CharField(max_length=100, unique=True)
    dish_type = models.CharField(max_length=10, choices=[('veg', 'Vegetarian'), ('non_veg', 'Non-Vegetarian')])
    has_gluten = models.BooleanField(default=False)
    has_nuts = models.BooleanField(default=False)
    has_dairy = models.BooleanField(default=False)
    calories = models.FloatField(validators=[MinValueValidator(0)], null=True, blank=True)
    protein = models.FloatField(validators=[MinValueValidator(0)], null=True, blank=True)
    carbs = models.FloatField(validators=[MinValueValidator(0)], null=True, blank=True)
    fats = models.FloatField(validators=[MinValueValidator(0)], null=True, blank=True)


class DishIngredient(models.Model):
    dish = models.ForeignKey(Dish, on_delete=models.CASCADE, related_name='ingredients')
    item = models.ForeignKey(RawStock, on_delete=models.CASCADE)
    quantity_required = models.FloatField(validators=[MinValueValidator(0)])

    class Meta:
        unique_together = ('dish', 'item')


class Voyage(models.Model):
    name = models.CharField(max_length=100)
    start_date = models.DateField()
    end_date = models.DateField()
    total_days = models.IntegerField(validators=[MinValueValidator(1)])
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)

    def clean(self):
        if self.end_date < self.start_date:
            raise ValidationError("End date cannot be before start date.")
        if self.total_days != (self.end_date - self.start_date).days + 1:
            raise ValidationError("Total days does not match date range.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


class MealPlan(models.Model):
    voyage = models.ForeignKey(Voyage, on_delete=models.CASCADE, related_name='meal_plans')
    dish = models.ForeignKey(Dish, on_delete=models.CASCADE)
    meal_date = models.DateField()
    meal_type = models.CharField(max_length=10,
                                 choices=[('breakfast', 'Breakfast'), ('lunch', 'Lunch'), ('dinner', 'Dinner')])
    quantity_cooked = models.IntegerField(validators=[MinValueValidator(1)])

    class Meta:
        unique_together = ('voyage', 'meal_date', 'meal_type', 'dish')


class SailorAssignment(models.Model):
    meal_plan = models.ForeignKey(MealPlan, on_delete=models.CASCADE, related_name='sailor_assignments')
    sailor = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'role': 'sailor'})
    counter_number = models.IntegerField(validators=[MinValueValidator(1)])

    class Meta:
        unique_together = ('meal_plan', 'sailor')


class ChefAssignment(models.Model):
    meal_plan = models.ForeignKey(MealPlan, on_delete=models.CASCADE, related_name='chef_assignments')
    chef = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'role': 'chef'})
    counter_number = models.IntegerField(validators=[MinValueValidator(1)])

    class Meta:
        unique_together = ('meal_plan', 'chef', 'counter_number')


class StockUsageLog(models.Model):
    item = models.ForeignKey(RawStock, on_delete=models.CASCADE, related_name='usage_logs')
    meal_plan = models.ForeignKey(MealPlan, on_delete=models.CASCADE, related_name='stock_usage')
    quantity_used = models.FloatField(validators=[MinValueValidator(0)])
    log_date = models.DateField(default=date.today)


class SatisfactionRating(models.Model):
    sailor = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'role': 'sailor'})
    meal_plan = models.ForeignKey(MealPlan, on_delete=models.CASCADE, related_name='ratings')
    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comments = models.TextField(blank=True)

    class Meta:
        unique_together = ('sailor', 'meal_plan')


class NutritionalRequirement(models.Model):
    name = models.CharField(max_length=100, default="Standard Sailor Requirement")
    daily_calories = models.IntegerField(default=2500)
    daily_protein = models.FloatField(default=100)


class MealNutritionAnalysis(models.Model):
    voyage = models.ForeignKey(Voyage, on_delete=models.CASCADE)
    analysis_date = models.DateField()
    total_calories_served = models.FloatField()
    total_protein_served = models.FloatField()
    nutritional_completeness_score = models.FloatField()

    class Meta:
        unique_together = ('voyage', 'analysis_date')


class WasteTracking(models.Model):
    meal_plan = models.ForeignKey(MealPlan, on_delete=models.CASCADE)
    predicted_waste_percentage = models.FloatField(null=True, blank=True)
    actual_waste_kg = models.FloatField(null=True, blank=True)


# === SIGNALS ===
@receiver(post_save, sender=User)
def create_sailor_profile(sender, instance, created, **kwargs):
    if created and instance.role == 'sailor':
        SailorProfile.objects.create(user=instance)


@receiver(post_save, sender=StockUsageLog)
def handle_stock_usage(sender, instance, created, **kwargs):
    if created:
        stock_item = instance.item
        RawStock.objects.filter(pk=stock_item.pk).update(total_quantity=F('total_quantity') - instance.quantity_used)
        stock_item.refresh_from_db()
        if stock_item.needs_reorder:
            try:
                channel_layer = get_channel_layer()
                if channel_layer:
                    message = {
                        'type': 'stock_alert',
                        'item_name': stock_item.item_name,
                        'quantity': stock_item.total_quantity,
                        'reorder_level': stock_item.reorder_level
                    }
                    async_to_sync(channel_layer.group_send)('admin_dashboard',
                                                            {'type': 'dashboard.update', 'message': message})
            except Exception as e:
                logger.error(f"Failed to send stock alert for {stock_item.item_name}: {e}")