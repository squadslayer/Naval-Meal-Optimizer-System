from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.LoginView.as_view(), name='login'),
    path('admin/actions/', views.AdminActionView.as_view(), name='admin_actions'),
    path('admin/stock/', views.StockManagementView.as_view(), name='stock_list'),
    path('admin/stock/<int:pk>/', views.StockManagementView.as_view(), name='stock_detail'),
    path('admin/dishes/', views.DishManagementView.as_view(), name='dish_list'),
    path('admin/dishes/<int:pk>/', views.DishManagementView.as_view(), name='dish_detail'),
    path('admin/analytics/', views.AnalyticsView.as_view(), name='analytics'),
    path('sailor/profile/', views.SailorProfileView.as_view(), name='sailor_profile'),
    path('sailor/feedback/', views.FeedbackView.as_view(), name='submit_feedback'),
    path('sailor/meal-plans/', views.SailorMealPlanView.as_view(), name='sailor_meal_plans'),
    # --- NEW URL FOR CHEF DASHBOARD ---
    path('chef/assignments/', views.ChefAssignmentView.as_view(), name='chef_assignments'),
]