from celery import Celery
from app.core.config import get_settings

settings = get_settings()

celery_app = Celery(
    'rag_worker',
    broker=settings.get_celery_broker_url(),
    backend=settings.get_celery_result_backend(),
)

# Task Discovery
celery_app.autodiscover_tasks(['worker'])

# Optional: Import tasks directly to ensure registration
from worker import tasks
