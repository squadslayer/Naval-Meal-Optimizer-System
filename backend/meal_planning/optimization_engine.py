import pulp
from django.db import models, transaction
from django.db.models import Avg
from datetime import date, timedelta
from itertools import cycle
from .models import *


class MealPlanOptimizer:
    def __init__(self):
        self.problem = None
        self.decision_vars = {}

    def optimize_meal_plan(self, voyage):
        try:
            with transaction.atomic():
                MealPlan.objects.filter(voyage=voyage).delete()
                sailors = self._get_sailor_segments()
                dishes = self._get_suitable_dishes(sailors)
                stock_data = self._get_stock_data()
                satisfaction_weights = self._get_satisfaction_weights()
                nutritional_req = NutritionalRequirement.objects.first()
                if not nutritional_req:
                    return False, "Nutritional requirements not set."

                self.problem = pulp.LpProblem("Meal_Planning", pulp.LpMaximize)
                meal_types = ['breakfast', 'lunch', 'dinner']
                self.decision_vars = {
                    g: {
                        d.id: {
                            day: {
                                m: pulp.LpVariable(f"s_{g}_{d.id}_{day}_{m}", 0, len(s_list), 'Integer') for m in
                                meal_types
                            } for day in range(1, voyage.total_days + 1)
                        } for d in dishes[g]
                    } for g, s_list in sailors.items()
                }

                objective = [
                    satisfaction_weights.get(d, 3.0) * var
                    for g in self.decision_vars for d, days in self.decision_vars[g].items()
                    for day, meals in days.items() for m, var in meals.items()
                ]
                self.problem += pulp.lpSum(objective)

                self._add_sailor_constraints(sailors, voyage.total_days, meal_types)
                self._add_stock_constraints(dishes, stock_data, voyage.total_days)
                self._add_nutritional_constraints(voyage, sailors, dishes, nutritional_req)
                if voyage.total_days >= 7:
                    self._add_variety_constraints(voyage.total_days, meal_types)

                self.problem.solve(pulp.PULP_CBC_CMD(msg=0))

                if self.problem.status == pulp.LpStatusOptimal:
                    self._create_meal_plans(voyage, sailors, meal_types)
                    self._assign_chefs(voyage)
                    self._log_stock_usage(voyage)
                    self._analyze_and_store_nutrition(voyage)
                    return True, "Optimization successful with nutritional analysis."
                else:
                    status_msg = pulp.LpStatus[self.problem.status]
                    if status_msg == 'Infeasible':
                        return False, "Optimization failed: Infeasible. Check stock levels, dish variety, and nutritional constraints."
                    return False, f"Optimization failed: {status_msg}"
        except Exception as e:
            return False, f"An unexpected error occurred: {str(e)}"

    def _get_sailor_segments(self):
        sailors = User.objects.filter(role='sailor').select_related('sailorprofile')
        segments = {}
        [segments.setdefault(s.sailorprofile.category if hasattr(s, 'sailorprofile') else 'General', []).append(s) for s
         in sailors]
        return segments

    def _get_suitable_dishes(self, sailor_segments):
        suitable_dishes = {}
        for segment, sailors in sailor_segments.items():
            if segment == 'General':
                suitable_dishes[segment] = list(Dish.objects.all())
                continue
            profile = sailors[0].sailorprofile
            dishes = Dish.objects.all()
            if profile.preference_type == 'veg':
                dishes = dishes.filter(dish_type='veg')
            if profile.has_gluten_allergy:
                dishes = dishes.filter(has_gluten=False)
            if profile.has_nut_allergy:
                dishes = dishes.filter(has_nuts=False)
            if profile.has_dairy_allergy:
                dishes = dishes.filter(has_dairy=False)
            suitable_dishes[segment] = list(dishes)
        return suitable_dishes

    def _get_stock_data(self):
        return {s.id: s.total_quantity for s in RawStock.objects.all()}

    def _get_satisfaction_weights(self):
        return {r['meal_plan__dish']: r['avg_rating'] for r in
                SatisfactionRating.objects.values('meal_plan__dish').annotate(avg_rating=Avg('rating'))}

    def _add_sailor_constraints(self, sailors, total_days, meal_types):
        for g, s_list in sailors.items():
            for day in range(1, total_days + 1):
                for meal in meal_types:
                    self.problem += pulp.lpSum(self.decision_vars[g][d.id][day][meal] for d in
                                               Dish.objects.filter(id__in=self.decision_vars[g].keys())) == len(s_list)

    def _add_stock_constraints(self, dishes, stock, total_days):
        for stock_id, qty in stock.items():
            usage = [
                ing.quantity_required * self.decision_vars[g][d.id][day][m]
                for g, d_list in dishes.items() for d in d_list for ing in d.ingredients.filter(item_id=stock_id)
                for day in range(1, total_days + 1) for m in ['breakfast', 'lunch', 'dinner']
            ]
            if usage:
                self.problem += pulp.lpSum(usage) <= qty

    def _add_nutritional_constraints(self, voyage, sailors, dishes, req):
        count = sum(len(s) for s in sailors.values())
        nutrition = {d.id: {'protein': d.protein or 0} for g_dishes in dishes.values() for d in g_dishes}
        for day in range(1, voyage.total_days + 1):
            protein = [
                self.decision_vars[g][d.id][day][m] * nutrition[d.id]['protein']
                for g, d_list in dishes.items() for d in d_list for m in ['breakfast', 'lunch', 'dinner']
            ]
            if protein:
                self.problem += pulp.lpSum(protein) >= req.daily_protein * count * 0.9

    def _add_variety_constraints(self, total_days, meal_types):
        for g in self.decision_vars:
            for d_id in self.decision_vars[g]:
                self.problem += pulp.lpSum(
                    self.decision_vars[g][d_id][day][m] for day in range(1, total_days + 1) for m in meal_types) <= 2

    def _create_meal_plans(self, voyage, sailors, meal_types):
        plans, assignments = [], []
        for g, dishes in self.decision_vars.items():
            for d_id, days in dishes.items():
                for day, meals in days.items():
                    for m, var in meals.items():
                        if var.value() and var.value() > 0:
                            plan = MealPlan(voyage=voyage, dish_id=d_id,
                                            meal_date=voyage.start_date + timedelta(days=day - 1), meal_type=m,
                                            quantity_cooked=int(var.value()))
                            plans.append(plan)
        MealPlan.objects.bulk_create(plans)

        for plan in MealPlan.objects.filter(voyage=voyage):
            sailor_group = next(g for g, s_list in sailors.items() if
                                plan.dish_id in {d.id for d in self._get_suitable_dishes({g: s_list})[g]})
            assignments.extend(SailorAssignment(meal_plan=plan, sailor=s, counter_number=(i // 10) + 1) for i, s in
                               enumerate(sailors[sailor_group][:plan.quantity_cooked]))
        SailorAssignment.objects.bulk_create(assignments)

    def _assign_chefs(self, voyage):
        chefs = list(User.objects.filter(role='chef'))
        assignments = []
        if not chefs:
            return
        for plan in MealPlan.objects.filter(voyage=voyage):
            for counter in plan.sailor_assignments.values_list('counter_number', flat=True).distinct():
                assignments.append(
                    ChefAssignment(meal_plan=plan, chef=chefs[(plan.meal_date.toordinal() + counter) % len(chefs)],
                                   counter_number=counter))
        ChefAssignment.objects.bulk_create(assignments, ignore_conflicts=True)

    def _log_stock_usage(self, voyage):
        for plan in MealPlan.objects.filter(voyage=voyage).prefetch_related('dish__ingredients__item'):
            for ing in plan.dish.ingredients.all():
                StockUsageLog.objects.create(item=ing.item, meal_plan=plan,
                                             quantity_used=ing.quantity_required * plan.quantity_cooked,
                                             log_date=plan.meal_date)

    def _analyze_and_store_nutrition(self, voyage):
        req = NutritionalRequirement.objects.first()
        count = User.objects.filter(role='sailor').count()
        for day in range(voyage.total_days):
            analysis_date = voyage.start_date + timedelta(days=day)
            daily_plans = MealPlan.objects.filter(voyage=voyage, meal_date=analysis_date).select_related('dish')
            cals = sum(p.dish.calories * p.quantity_cooked for p in daily_plans if p.dish.calories)
            protein = sum(p.dish.protein * p.quantity_cooked for p in daily_plans if p.dish.protein)
            score = min(1.0, protein / (req.daily_protein * count)) if req and count > 0 else 0.0
            MealNutritionAnalysis.objects.update_or_create(
                voyage=voyage,
                analysis_date=analysis_date,
                defaults={
                    'total_calories_served': cals,
                    'total_protein_served': protein,
                    'nutritional_completeness_score': score
                }
            )