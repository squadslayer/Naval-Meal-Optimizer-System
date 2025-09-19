from celery import shared_task
from .optimization_engine import MealPlanOptimizer
from .models import Voyage
import logging

logger = logging.getLogger(__name__)


@shared_task
def run_meal_plan_optimization(voyage_id):
    """
    Celery task to run the meal plan optimization in the background.
    """
    try:
        voyage = Voyage.objects.get(id=voyage_id)
        logger.info(f"Starting meal plan optimization for voyage: {voyage.name}")

        optimizer = MealPlanOptimizer()
        success, message = optimizer.optimize_meal_plan(voyage)

        if success:
            logger.info(f"Successfully optimized meal plan for voyage: {voyage.name}. Message: {message}")
        else:
            logger.error(f"Failed to optimize meal plan for voyage: {voyage.name}. Message: {message}")

        return {'success': success, 'message': message}
    except Voyage.DoesNotExist:
        logger.error(f"Voyage with id={voyage_id} not found.")
        return {'success': False, 'message': 'Voyage not found.'}
    except Exception as e:
        logger.error(f"An unexpected error occurred during optimization for voyage {voyage_id}: {e}", exc_info=True)
        return {'success': False, 'message': 'An unexpected error occurred.'}