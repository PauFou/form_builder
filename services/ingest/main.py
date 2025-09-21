"""
Edge Ingest Service for Form Submissions
- HMAC validation for security
- Rate limiting to prevent abuse
- Idempotency keys for duplicate prevention
- Queue submissions to workers for processing
"""

import asyncio
import hashlib
import hmac
import json
import time
from datetime import datetime, timedelta
from typing import Dict, Optional, List, Any
from uuid import uuid4

import redis.asyncio as redis
import structlog
from fastapi import FastAPI, HTTPException, Request, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, ValidationError
from pydantic_settings import BaseSettings
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from starlette.responses import Response
from celery import Celery

# Logging setup
logger = structlog.get_logger()

# Metrics
submission_counter = Counter('submissions_total', 'Total submissions received', ['form_id', 'status'])
submission_duration = Histogram('submission_processing_seconds', 'Time spent processing submissions')
rate_limit_counter = Counter('rate_limits_total', 'Total rate limit hits', ['endpoint'])
hmac_validation_counter = Counter('hmac_validations_total', 'HMAC validation attempts', ['status'])

class Settings(BaseSettings):
    # Server settings
    host: str = "0.0.0.0"
    port: int = 8001
    debug: bool = False
    
    # Security settings
    hmac_secret: str = Field(..., env="HMAC_SECRET")
    hmac_tolerance_seconds: int = 300  # 5 minutes
    
    # Redis settings
    redis_url: str = Field("redis://localhost:6379", env="REDIS_URL")
    
    # Rate limiting
    rate_limit_per_minute: int = 60
    rate_limit_burst: int = 10
    
    # Queue settings
    celery_broker_url: str = Field("redis://localhost:6379/0", env="CELERY_BROKER_URL")
    
    # Database settings (for form validation)
    database_url: str = Field("postgresql://forms_user:secure_password@localhost:5432/forms_db", env="DATABASE_URL")
    
    # CORS settings
    cors_origins: List[str] = ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"]
    
    class Config:
        env_file = ".env"

settings = Settings()

# Initialize FastAPI app
app = FastAPI(
    title="Forms Ingest Service",
    description="Edge service for ingesting form submissions with HMAC validation",
    version="1.0.0",
    debug=settings.debug
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Trust proxy headers
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["*"])

# Initialize Redis connection
redis_client = None

# Initialize Celery for queuing
celery_app = Celery(
    "ingest",
    broker=settings.celery_broker_url,
    backend=settings.celery_broker_url
)

# Pydantic models
class SubmissionData(BaseModel):
    form_id: str = Field(..., description="Form ID")
    respondent_key: str = Field(..., description="Unique respondent identifier")
    version: int = Field(1, description="Form version")
    locale: str = Field("en", description="Response locale")
    answers: Dict[str, Any] = Field(..., description="Form answers")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional metadata")
    partial: bool = Field(False, description="Whether this is a partial submission")

class SubmissionRequest(BaseModel):
    data: SubmissionData
    idempotency_key: Optional[str] = Field(None, description="Idempotency key for duplicate prevention")
    timestamp: int = Field(..., description="Unix timestamp when request was created")

class SubmissionResponse(BaseModel):
    success: bool
    submission_id: Optional[str] = None
    message: str
    processing_time_ms: float

# Startup/shutdown events
@app.on_event("startup")
async def startup_event():
    global redis_client
    redis_client = redis.from_url(settings.redis_url, decode_responses=True)
    logger.info("Ingest service started", redis_url=settings.redis_url)

@app.on_event("shutdown")
async def shutdown_event():
    if redis_client:
        await redis_client.close()
    logger.info("Ingest service stopped")

# Dependency for Redis client
async def get_redis() -> redis.Redis:
    return redis_client

# HMAC validation
def validate_hmac_signature(payload: bytes, signature: str, secret: str) -> bool:
    """Validate HMAC signature for request authenticity"""
    if not signature.startswith("sha256="):
        return False
    
    expected_signature = hmac.new(
        secret.encode("utf-8"),
        payload,
        hashlib.sha256
    ).hexdigest()
    
    provided_signature = signature[7:]  # Remove 'sha256=' prefix
    
    # Use hmac.compare_digest for timing attack protection
    is_valid = hmac.compare_digest(expected_signature, provided_signature)
    
    hmac_validation_counter.labels(status="valid" if is_valid else "invalid").inc()
    return is_valid

def validate_timestamp(timestamp: int, tolerance_seconds: int = 300) -> bool:
    """Validate timestamp is within tolerance to prevent replay attacks"""
    current_time = int(time.time())
    time_diff = abs(current_time - timestamp)
    return time_diff <= tolerance_seconds

# Rate limiting
async def check_rate_limit(redis_client: redis.Redis, client_ip: str, form_id: str) -> bool:
    """Check if client has exceeded rate limits"""
    current_minute = int(time.time() // 60)
    key = f"rate_limit:{client_ip}:{form_id}:{current_minute}"
    
    try:
        current_count = await redis_client.get(key)
        if current_count is None:
            await redis_client.setex(key, 60, 1)
            return True
        
        if int(current_count) >= settings.rate_limit_per_minute:
            rate_limit_counter.labels(endpoint="submit").inc()
            return False
        
        await redis_client.incr(key)
        return True
    except Exception as e:
        logger.error("Rate limit check failed", error=str(e))
        return True  # Fail open

# Idempotency check
async def check_idempotency(redis_client: redis.Redis, idempotency_key: str, form_id: str) -> Optional[str]:
    """Check if request has already been processed"""
    if not idempotency_key:
        return None
    
    key = f"idempotency:{form_id}:{idempotency_key}"
    existing_submission = await redis_client.get(key)
    
    if existing_submission:
        logger.info("Duplicate submission detected", idempotency_key=idempotency_key, form_id=form_id)
        return existing_submission
    
    return None

async def store_idempotency(redis_client: redis.Redis, idempotency_key: str, form_id: str, submission_id: str):
    """Store idempotency key to prevent duplicates"""
    if idempotency_key:
        key = f"idempotency:{form_id}:{idempotency_key}"
        # Store for 24 hours
        await redis_client.setex(key, 86400, submission_id)

# Form validation
async def validate_form_exists(form_id: str) -> bool:
    """Validate that form exists and is published"""
    # This would typically check the database
    # For now, we'll assume all forms are valid
    # TODO: Implement actual form validation
    return True

# Queue submission for processing
def queue_submission(submission_data: Dict[str, Any], submission_id: str):
    """Queue submission for background processing"""
    celery_app.send_task(
        "process_submission",
        args=[submission_data, submission_id],
        queue="submissions"
    )

# Main submission endpoint
@app.post("/submit/{form_id}", response_model=SubmissionResponse)
async def submit_form(
    form_id: str,
    request: Request,
    redis_client: redis.Redis = Depends(get_redis)
):
    """
    Submit form data with HMAC validation, rate limiting, and idempotency
    """
    start_time = time.time()
    client_ip = request.client.host
    
    try:
        # Get request body and headers
        body = await request.body()
        signature = request.headers.get("X-Forms-Signature")
        
        if not signature:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing HMAC signature"
            )
        
        # Validate HMAC signature
        if not validate_hmac_signature(body, signature, settings.hmac_secret):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid HMAC signature"
            )
        
        # Parse request body
        try:
            submission_request = SubmissionRequest.model_validate_json(body)
        except ValidationError as e:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid request format: {e}"
            )
        
        # Validate timestamp
        if not validate_timestamp(submission_request.timestamp, settings.hmac_tolerance_seconds):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Request timestamp outside tolerance window"
            )
        
        # Check rate limiting
        if not await check_rate_limit(redis_client, client_ip, form_id):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded"
            )
        
        # Validate form exists
        if not await validate_form_exists(form_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Form not found or not published"
            )
        
        # Check idempotency
        if submission_request.idempotency_key:
            existing_submission = await check_idempotency(
                redis_client, 
                submission_request.idempotency_key, 
                form_id
            )
            if existing_submission:
                processing_time = (time.time() - start_time) * 1000
                return SubmissionResponse(
                    success=True,
                    submission_id=existing_submission,
                    message="Submission already processed (idempotent)",
                    processing_time_ms=processing_time
                )
        
        # Generate submission ID
        submission_id = str(uuid4())
        
        # Prepare submission data
        submission_data = {
            "id": submission_id,
            "form_id": form_id,
            "respondent_key": submission_request.data.respondent_key,
            "version": submission_request.data.version,
            "locale": submission_request.data.locale,
            "answers": submission_request.data.answers,
            "metadata": {
                **submission_request.data.metadata,
                "client_ip": client_ip,
                "user_agent": request.headers.get("User-Agent", ""),
                "submitted_at": datetime.utcnow().isoformat(),
                "partial": submission_request.data.partial
            }
        }
        
        # Store idempotency key
        if submission_request.idempotency_key:
            await store_idempotency(
                redis_client,
                submission_request.idempotency_key,
                form_id,
                submission_id
            )
        
        # Queue for processing
        queue_submission(submission_data, submission_id)
        
        # Record metrics
        submission_counter.labels(
            form_id=form_id, 
            status="partial" if submission_request.data.partial else "complete"
        ).inc()
        
        processing_time = (time.time() - start_time) * 1000
        submission_duration.observe(processing_time / 1000)
        
        logger.info(
            "Submission queued successfully",
            submission_id=submission_id,
            form_id=form_id,
            partial=submission_request.data.partial,
            processing_time_ms=processing_time
        )
        
        return SubmissionResponse(
            success=True,
            submission_id=submission_id,
            message="Submission queued for processing",
            processing_time_ms=processing_time
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Submission processing failed", error=str(e), form_id=form_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

# Health check endpoints
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "ingest", "version": "1.0.0"}

@app.get("/ready")
async def readiness_check(redis_client: redis.Redis = Depends(get_redis)):
    """Readiness check with dependencies"""
    try:
        await redis_client.ping()
        return {"status": "ready", "dependencies": {"redis": "ok"}}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Service not ready: {e}"
        )

# Metrics endpoint
@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint"""
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

# CORS preflight
@app.options("/submit/{form_id}")
async def submit_form_options(form_id: str):
    """Handle CORS preflight requests"""
    return JSONResponse({"status": "ok"})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="info" if not settings.debug else "debug"
    )