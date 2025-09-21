"""
Celery worker for processing form submissions
- Save submissions to database
- Trigger webhooks
- Send to analytics service
"""

import asyncio
import json
import time
from datetime import datetime
from typing import Dict, Any, Optional
from uuid import uuid4

import httpx
import structlog
from celery import Celery
from pydantic_settings import BaseSettings
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Logging setup
logger = structlog.get_logger()

class WorkerSettings(BaseSettings):
    # Database settings
    database_url: str = "postgresql://forms_user:secure_password@localhost:5432/forms_db"
    
    # Celery settings
    celery_broker_url: str = "redis://localhost:6379/0"
    celery_result_backend: str = "redis://localhost:6379/0"
    
    # External services
    api_base_url: str = "http://localhost:8000"
    analytics_base_url: str = "http://localhost:8002"
    
    # Security
    internal_api_key: str = "internal-worker-key"
    
    class Config:
        env_file = ".env"

settings = WorkerSettings()

# Initialize Celery
celery_app = Celery(
    "submission-worker",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend
)

# Celery configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_routes={
        "process_submission": {"queue": "submissions"},
        "send_webhook": {"queue": "webhooks"},
        "send_analytics": {"queue": "analytics"},
    },
    task_default_retry_delay=60,
    task_max_retries=3,
)

# Database connection
engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@celery_app.task(bind=True, name="process_submission")
def process_submission(self, submission_data: Dict[str, Any], submission_id: str):
    """
    Main task to process a form submission
    """
    logger.info("Processing submission", submission_id=submission_id)
    
    try:
        # Save submission to database
        db_submission_id = save_submission_to_db(submission_data)
        
        # Send to analytics (non-blocking)
        send_analytics.delay(submission_data)
        
        # Trigger webhooks (if any)
        trigger_webhooks.delay(submission_data, db_submission_id)
        
        logger.info(
            "Submission processed successfully",
            submission_id=submission_id,
            db_submission_id=db_submission_id
        )
        
        return {"status": "success", "submission_id": db_submission_id}
        
    except Exception as e:
        logger.error(
            "Failed to process submission",
            submission_id=submission_id,
            error=str(e)
        )
        # Retry with exponential backoff
        raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))

def save_submission_to_db(submission_data: Dict[str, Any]) -> str:
    """Save submission to PostgreSQL database"""
    db = SessionLocal()
    try:
        # Get form to validate it exists
        form_query = text("""
            SELECT id, organization_id FROM forms_form 
            WHERE id = :form_id AND status = 'published'
        """)
        form_result = db.execute(form_query, {"form_id": submission_data["form_id"]}).fetchone()
        
        if not form_result:
            raise ValueError(f"Form {submission_data['form_id']} not found or not published")
        
        form_id, organization_id = form_result
        
        # Insert submission
        submission_query = text("""
            INSERT INTO core_submission (
                id, form_id, version, respondent_key, locale,
                started_at, completed_at, metadata_json
            ) VALUES (
                :id, :form_id, :version, :respondent_key, :locale,
                :started_at, :completed_at, :metadata_json
            ) RETURNING id
        """)
        
        completed_at = None if submission_data["metadata"].get("partial") else datetime.utcnow()
        
        submission_result = db.execute(submission_query, {
            "id": submission_data["id"],
            "form_id": form_id,
            "version": submission_data["version"],
            "respondent_key": submission_data["respondent_key"],
            "locale": submission_data["locale"],
            "started_at": datetime.utcnow(),
            "completed_at": completed_at,
            "metadata_json": json.dumps(submission_data["metadata"])
        }).fetchone()
        
        db_submission_id = submission_result[0]
        
        # Insert answers
        for block_id, value in submission_data["answers"].items():
            answer_query = text("""
                INSERT INTO core_answer (
                    id, submission_id, block_id, type, value_json,
                    created_at, updated_at
                ) VALUES (
                    :id, :submission_id, :block_id, :type, :value_json,
                    :created_at, :updated_at
                )
            """)
            
            db.execute(answer_query, {
                "id": str(uuid4()),
                "submission_id": db_submission_id,
                "block_id": block_id,
                "type": "text",  # Default type, could be inferred from form schema
                "value_json": json.dumps(value),
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            })
        
        db.commit()
        logger.info("Submission saved to database", submission_id=db_submission_id)
        return db_submission_id
        
    except Exception as e:
        db.rollback()
        logger.error("Failed to save submission to database", error=str(e))
        raise
    finally:
        db.close()

@celery_app.task(bind=True, name="send_analytics")
def send_analytics(self, submission_data: Dict[str, Any]):
    """Send submission data to analytics service"""
    try:
        analytics_payload = {
            "event_type": "submission",
            "form_id": submission_data["form_id"],
            "submission_id": submission_data["id"],
            "timestamp": submission_data["metadata"]["submitted_at"],
            "partial": submission_data["metadata"].get("partial", False),
            "metadata": {
                "locale": submission_data["locale"],
                "client_ip": submission_data["metadata"].get("client_ip"),
                "user_agent": submission_data["metadata"].get("user_agent"),
            }
        }
        
        # Send to analytics service (async)
        with httpx.Client() as client:
            response = client.post(
                f"{settings.analytics_base_url}/events",
                json=analytics_payload,
                headers={"Authorization": f"Bearer {settings.internal_api_key}"},
                timeout=10
            )
            response.raise_for_status()
        
        logger.info("Analytics event sent", submission_id=submission_data["id"])
        
    except Exception as e:
        logger.error(
            "Failed to send analytics event",
            submission_id=submission_data["id"],
            error=str(e)
        )
        # Don't fail the main task for analytics issues
        return {"status": "failed", "error": str(e)}

@celery_app.task(bind=True, name="trigger_webhooks")
def trigger_webhooks(self, submission_data: Dict[str, Any], db_submission_id: str):
    """Trigger webhooks for the form"""
    db = SessionLocal()
    try:
        # Get webhooks for the form's organization
        webhook_query = text("""
            SELECT w.id, w.url, w.secret, w.headers_json, w.active
            FROM webhooks_webhook w
            JOIN forms_form f ON f.organization_id = w.organization_id
            WHERE f.id = :form_id AND w.active = true
        """)
        
        webhooks = db.execute(webhook_query, {"form_id": submission_data["form_id"]}).fetchall()
        
        for webhook in webhooks:
            webhook_id, url, secret, headers_json, active = webhook
            
            # Queue individual webhook delivery
            send_webhook.delay(
                webhook_id,
                url,
                secret,
                headers_json,
                submission_data,
                db_submission_id
            )
        
        logger.info(
            "Webhooks queued",
            submission_id=db_submission_id,
            webhook_count=len(webhooks)
        )
        
    except Exception as e:
        logger.error(
            "Failed to queue webhooks",
            submission_id=db_submission_id,
            error=str(e)
        )
    finally:
        db.close()

@celery_app.task(bind=True, name="send_webhook", max_retries=5)
def send_webhook(
    self,
    webhook_id: str,
    url: str,
    secret: str,
    headers_json: Optional[str],
    submission_data: Dict[str, Any],
    db_submission_id: str
):
    """Send webhook with retry logic"""
    import hmac
    import hashlib
    
    try:
        # Prepare webhook payload
        payload = {
            "event": "submission.created" if not submission_data["metadata"].get("partial") else "submission.partial",
            "submission": {
                "id": db_submission_id,
                "form_id": submission_data["form_id"],
                "respondent_key": submission_data["respondent_key"],
                "locale": submission_data["locale"],
                "answers": submission_data["answers"],
                "metadata": submission_data["metadata"],
                "created_at": submission_data["metadata"]["submitted_at"]
            }
        }
        
        payload_json = json.dumps(payload, separators=(",", ":"))
        payload_bytes = payload_json.encode("utf-8")
        
        # Generate HMAC signature
        signature = hmac.new(
            secret.encode("utf-8"),
            payload_bytes,
            hashlib.sha256
        ).hexdigest()
        
        # Prepare headers
        headers = {
            "Content-Type": "application/json",
            "X-Forms-Signature": f"sha256={signature}",
            "X-Forms-Delivery": str(uuid4()),
            "User-Agent": "Forms-Webhooks/1.0"
        }
        
        # Add custom headers
        if headers_json:
            custom_headers = json.loads(headers_json)
            headers.update(custom_headers)
        
        # Send webhook
        with httpx.Client() as client:
            response = client.post(
                url,
                data=payload_bytes,
                headers=headers,
                timeout=30
            )
            response.raise_for_status()
        
        # Log successful delivery
        logger.info(
            "Webhook delivered successfully",
            webhook_id=webhook_id,
            submission_id=db_submission_id,
            status_code=response.status_code
        )
        
        # Record delivery in database
        record_webhook_delivery(
            webhook_id,
            db_submission_id,
            "success",
            response.status_code,
            None,
            self.request.retries + 1
        )
        
    except Exception as e:
        logger.error(
            "Webhook delivery failed",
            webhook_id=webhook_id,
            submission_id=db_submission_id,
            error=str(e),
            retry_count=self.request.retries
        )
        
        # Record failed delivery
        record_webhook_delivery(
            webhook_id,
            db_submission_id,
            "failed",
            None,
            str(e),
            self.request.retries + 1
        )
        
        # Retry with exponential backoff
        countdown = 60 * (2 ** self.request.retries)
        raise self.retry(exc=e, countdown=countdown, max_retries=5)

def record_webhook_delivery(
    webhook_id: str,
    submission_id: str,
    status: str,
    status_code: Optional[int],
    error: Optional[str],
    attempt: int
):
    """Record webhook delivery attempt in database"""
    db = SessionLocal()
    try:
        delivery_query = text("""
            INSERT INTO webhooks_webhookdelivery (
                id, webhook_id, submission_id, status, attempt,
                status_code, error, sent_at, created_at, updated_at
            ) VALUES (
                :id, :webhook_id, :submission_id, :status, :attempt,
                :status_code, :error, :sent_at, :created_at, :updated_at
            )
        """)
        
        db.execute(delivery_query, {
            "id": str(uuid4()),
            "webhook_id": webhook_id,
            "submission_id": submission_id,
            "status": status,
            "attempt": attempt,
            "status_code": status_code,
            "error": error,
            "sent_at": datetime.utcnow(),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })
        
        db.commit()
        
    except Exception as e:
        logger.error("Failed to record webhook delivery", error=str(e))
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    celery_app.start()