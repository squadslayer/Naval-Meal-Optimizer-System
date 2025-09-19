from django.contrib import admin
from .models import (
    User, SailorProfile, RawStock, Dish, DishIngredient,
    Voyage, MealPlan, StockUsageLog, SatisfactionRating
)

# Registering models to make them available in the admin panel
admin.site.register(User)
admin.site.register(SailorProfile)
admin.site.register(RawStock)
admin.site.register(Dish)
admin.site.register(DishIngredient)
admin.site.register(Voyage)
admin.site.register(MealPlan)
admin.site.register(StockUsageLog)
admin.site.register(SatisfactionRating)