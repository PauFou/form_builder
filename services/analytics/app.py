"""
Analytics Service - ClickHouse-based analytics for form events
"""
import os
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import uuid

from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from clickhouse_driver import Client
from decouple import config
import redis
import orjson
import pandas as pd

# Configuration
CLICKHOUSE_HOST = config("CLICKHOUSE_HOST", default="localhost")
CLICKHOUSE_PORT = config("CLICKHOUSE_PORT", default=9000, cast=int)
CLICKHOUSE_DB = config("CLICKHOUSE_DB", default="forms_analytics")
CLICKHOUSE_USER = config("CLICKHOUSE_USER", default="default")
CLICKHOUSE_PASSWORD = config("CLICKHOUSE_PASSWORD", default="")
REDIS_URL = config("REDIS_URL", default="redis://localhost:6379/1")

# Initialize clients
clickhouse = Client(
    host=CLICKHOUSE_HOST,
    port=CLICKHOUSE_PORT,
    database=CLICKHOUSE_DB,
    user=CLICKHOUSE_USER,
    password=CLICKHOUSE_PASSWORD,
)

redis_client = redis.from_url(REDIS_URL, decode_responses=True)

# Models
class Event(BaseModel):
    event_type: str
    form_id: str
    organization_id: str
    respondent_id: str
    session_id: str
    timestamp: Optional[datetime] = None
    step_id: Optional[str] = None
    field_id: Optional[str] = None
    field_type: Optional[str] = None
    field_value: Optional[str] = None
    error_type: Optional[str] = None
    error_message: Optional[str] = None
    outcome_id: Optional[str] = None
    submission_id: Optional[str] = None
    is_partial: bool = False
    device_type: Optional[str] = None
    browser: Optional[str] = None
    os: Optional[str] = None
    country_code: Optional[str] = None
    page_load_time_ms: Optional[int] = None
    time_to_interactive_ms: Optional[int] = None
    time_on_step_ms: Optional[int] = None
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None
    referrer_domain: Optional[str] = None

class FunnelStep(BaseModel):
    step_name: str
    count: int
    conversion_rate: float

class FormAnalytics(BaseModel):
    form_id: str
    period: str
    views: int
    starts: int
    completions: int
    completion_rate: float
    avg_completion_time_seconds: float
    drop_off_rate: float
    error_rate: float
    device_breakdown: Dict[str, int]
    top_drop_off_points: List[Dict[str, Any]]

class DashboardWidget(BaseModel):
    widget_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    widget_type: str
    title: str
    query: str
    config: Dict[str, Any] = {}

class Dashboard(BaseModel):
    name: str
    description: str = ""
    widgets: List[DashboardWidget] = []

# Lifespan for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Initializing analytics service...")
    yield
    # Shutdown
    print("Shutting down analytics service...")

# Create FastAPI app
app = FastAPI(
    title="Forms Analytics API",
    description="Real-time analytics for form interactions",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Endpoints
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "analytics"}

@app.post("/events")
async def track_event(event: Event):
    """Track a single event"""
    try:
        # Prepare event data
        event_data = event.model_dump(exclude_none=True)
        if not event_data.get("timestamp"):
            event_data["timestamp"] = datetime.utcnow()
        
        # Insert into ClickHouse
        clickhouse.execute(
            """
            INSERT INTO events (
                event_type, form_id, organization_id, respondent_id, session_id,
                timestamp, step_id, field_id, field_type, field_value,
                error_type, error_message, outcome_id, submission_id, is_partial,
                device_type, browser, os, country_code,
                page_load_time_ms, time_to_interactive_ms, time_on_step_ms,
                utm_source, utm_medium, utm_campaign, referrer_domain
            ) VALUES
            """,
            [tuple(event_data.get(k) for k in [
                "event_type", "form_id", "organization_id", "respondent_id", "session_id",
                "timestamp", "step_id", "field_id", "field_type", "field_value",
                "error_type", "error_message", "outcome_id", "submission_id", "is_partial",
                "device_type", "browser", "os", "country_code",
                "page_load_time_ms", "time_to_interactive_ms", "time_on_step_ms",
                "utm_source", "utm_medium", "utm_campaign", "referrer_domain"
            ])]
        )
        
        # Update real-time counters in Redis
        cache_key = f"form:stats:{event.form_id}:{datetime.utcnow().strftime('%Y%m%d')}"
        redis_client.hincrby(cache_key, event.event_type, 1)
        redis_client.expire(cache_key, 86400)  # 24 hours
        
        return {"status": "success", "event_id": event_data.get("event_id")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/events/batch")
async def track_events_batch(events: List[Event]):
    """Track multiple events in batch"""
    try:
        # Prepare batch data
        batch_data = []
        for event in events:
            event_data = event.model_dump(exclude_none=True)
            if not event_data.get("timestamp"):
                event_data["timestamp"] = datetime.utcnow()
            batch_data.append(tuple(event_data.get(k) for k in [
                "event_type", "form_id", "organization_id", "respondent_id", "session_id",
                "timestamp", "step_id", "field_id", "field_type", "field_value",
                "error_type", "error_message", "outcome_id", "submission_id", "is_partial",
                "device_type", "browser", "os", "country_code",
                "page_load_time_ms", "time_to_interactive_ms", "time_on_step_ms",
                "utm_source", "utm_medium", "utm_campaign", "referrer_domain"
            ]))
        
        # Batch insert
        clickhouse.execute(
            """
            INSERT INTO events (
                event_type, form_id, organization_id, respondent_id, session_id,
                timestamp, step_id, field_id, field_type, field_value,
                error_type, error_message, outcome_id, submission_id, is_partial,
                device_type, browser, os, country_code,
                page_load_time_ms, time_to_interactive_ms, time_on_step_ms,
                utm_source, utm_medium, utm_campaign, referrer_domain
            ) VALUES
            """,
            batch_data
        )
        
        return {"status": "success", "count": len(events)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/analytics/form/{form_id}")
async def get_form_analytics(
    form_id: str,
    organization_id: str,
    start_date: Optional[datetime] = Query(default=None),
    end_date: Optional[datetime] = Query(default=None)
):
    """Get analytics for a specific form"""
    try:
        # Default date range: last 30 days
        if not end_date:
            end_date = datetime.utcnow()
        if not start_date:
            start_date = end_date - timedelta(days=30)
        
        # Check cache first
        cache_key = f"analytics:{form_id}:{start_date.date()}:{end_date.date()}"
        cached = redis_client.get(cache_key)
        if cached:
            return orjson.loads(cached)
        
        # Query ClickHouse
        query = """
        SELECT
            countIf(event_type = 'form_view') as views,
            countIf(event_type = 'form_start') as starts,
            countIf(event_type = 'form_submit') as completions,
            countIf(event_type = 'form_submit') / countIf(event_type = 'form_view') as completion_rate,
            avg(time_on_step_ms) / 1000 as avg_completion_time_seconds,
            countIf(event_type = 'form_abandon') / countIf(event_type = 'form_start') as drop_off_rate,
            countIf(event_type = 'field_error') / count() as error_rate
        FROM events
        WHERE form_id = %(form_id)s
            AND organization_id = %(organization_id)s
            AND timestamp >= %(start_date)s
            AND timestamp <= %(end_date)s
        """
        
        results = clickhouse.execute(
            query,
            {
                "form_id": form_id,
                "organization_id": organization_id,
                "start_date": start_date,
                "end_date": end_date
            }
        )
        
        # Device breakdown
        device_query = """
        SELECT
            device_type,
            count() as count
        FROM events
        WHERE form_id = %(form_id)s
            AND organization_id = %(organization_id)s
            AND timestamp >= %(start_date)s
            AND timestamp <= %(end_date)s
            AND event_type = 'form_view'
        GROUP BY device_type
        """
        
        device_results = clickhouse.execute(
            device_query,
            {
                "form_id": form_id,
                "organization_id": organization_id,
                "start_date": start_date,
                "end_date": end_date
            }
        )
        
        # Top drop-off points
        drop_off_query = """
        WITH step_starts AS (
            SELECT
                step_id,
                count() as started
            FROM events
            WHERE form_id = %(form_id)s
                AND organization_id = %(organization_id)s
                AND timestamp >= %(start_date)s
                AND timestamp <= %(end_date)s
                AND event_type = 'step_view'
            GROUP BY step_id
        ),
        step_completes AS (
            SELECT
                step_id,
                count() as completed
            FROM events
            WHERE form_id = %(form_id)s
                AND organization_id = %(organization_id)s
                AND timestamp >= %(start_date)s
                AND timestamp <= %(end_date)s
                AND event_type = 'step_complete'
            GROUP BY step_id
        )
        SELECT
            s.step_id,
            s.started,
            coalesce(c.completed, 0) as completed,
            (s.started - coalesce(c.completed, 0)) / s.started as drop_rate
        FROM step_starts s
        LEFT JOIN step_completes c ON s.step_id = c.step_id
        ORDER BY drop_rate DESC
        LIMIT 5
        """
        
        drop_off_results = clickhouse.execute(
            drop_off_query,
            {
                "form_id": form_id,
                "organization_id": organization_id,
                "start_date": start_date,
                "end_date": end_date
            }
        )
        
        # Build response
        if results:
            row = results[0]
            analytics = FormAnalytics(
                form_id=form_id,
                period=f"{start_date.date()} to {end_date.date()}",
                views=row[0],
                starts=row[1],
                completions=row[2],
                completion_rate=float(row[3]) if row[3] else 0,
                avg_completion_time_seconds=float(row[4]) if row[4] else 0,
                drop_off_rate=float(row[5]) if row[5] else 0,
                error_rate=float(row[6]) if row[6] else 0,
                device_breakdown={row[0]: row[1] for row in device_results if row[0]},
                top_drop_off_points=[
                    {
                        "step_id": row[0],
                        "started": row[1],
                        "completed": row[2],
                        "drop_rate": float(row[3])
                    }
                    for row in drop_off_results
                ]
            )
            
            # Cache for 1 hour
            redis_client.setex(
                cache_key,
                3600,
                orjson.dumps(analytics.model_dump())
            )
            
            return analytics.model_dump()
        else:
            return FormAnalytics(
                form_id=form_id,
                period=f"{start_date.date()} to {end_date.date()}",
                views=0,
                starts=0,
                completions=0,
                completion_rate=0,
                avg_completion_time_seconds=0,
                drop_off_rate=0,
                error_rate=0,
                device_breakdown={},
                top_drop_off_points=[]
            ).model_dump()
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/analytics/funnel/{form_id}")
async def get_funnel_analytics(
    form_id: str,
    organization_id: str,
    start_date: Optional[datetime] = Query(default=None),
    end_date: Optional[datetime] = Query(default=None)
):
    """Get funnel analytics for a form"""
    try:
        if not end_date:
            end_date = datetime.utcnow()
        if not start_date:
            start_date = end_date - timedelta(days=30)
        
        # Get funnel checkpoints
        checkpoints_query = """
        SELECT
            checkpoint_id,
            checkpoint_name,
            checkpoint_order
        FROM funnel_checkpoints
        WHERE form_id = %(form_id)s
            AND organization_id = %(organization_id)s
        ORDER BY checkpoint_order
        """
        
        checkpoints = clickhouse.execute(
            checkpoints_query,
            {
                "form_id": form_id,
                "organization_id": organization_id
            }
        )
        
        if not checkpoints:
            # Default funnel: view -> start -> submit
            funnel_query = """
            WITH sessions AS (
                SELECT
                    session_id,
                    max(event_type = 'form_view') as viewed,
                    max(event_type = 'form_start') as started,
                    max(event_type = 'form_submit') as submitted
                FROM events
                WHERE form_id = %(form_id)s
                    AND organization_id = %(organization_id)s
                    AND timestamp >= %(start_date)s
                    AND timestamp <= %(end_date)s
                GROUP BY session_id
            )
            SELECT
                sum(viewed) as views,
                sum(started) as starts,
                sum(submitted) as submissions
            FROM sessions
            """
            
            results = clickhouse.execute(
                funnel_query,
                {
                    "form_id": form_id,
                    "organization_id": organization_id,
                    "start_date": start_date,
                    "end_date": end_date
                }
            )
            
            if results and results[0]:
                views, starts, submissions = results[0]
                funnel_steps = [
                    FunnelStep(
                        step_name="Viewed Form",
                        count=views,
                        conversion_rate=100.0
                    ),
                    FunnelStep(
                        step_name="Started Form",
                        count=starts,
                        conversion_rate=(starts / views * 100) if views > 0 else 0
                    ),
                    FunnelStep(
                        step_name="Submitted Form",
                        count=submissions,
                        conversion_rate=(submissions / views * 100) if views > 0 else 0
                    )
                ]
            else:
                funnel_steps = []
        else:
            # Custom funnel based on checkpoints
            funnel_steps = []
            total_sessions_query = """
            SELECT count(DISTINCT session_id)
            FROM events
            WHERE form_id = %(form_id)s
                AND organization_id = %(organization_id)s
                AND timestamp >= %(start_date)s
                AND timestamp <= %(end_date)s
            """
            
            total_sessions = clickhouse.execute(
                total_sessions_query,
                {
                    "form_id": form_id,
                    "organization_id": organization_id,
                    "start_date": start_date,
                    "end_date": end_date
                }
            )[0][0]
            
            for checkpoint_id, checkpoint_name, _ in checkpoints:
                count_query = """
                SELECT count(DISTINCT session_id)
                FROM events
                WHERE form_id = %(form_id)s
                    AND organization_id = %(organization_id)s
                    AND timestamp >= %(start_date)s
                    AND timestamp <= %(end_date)s
                    AND step_id = %(checkpoint_id)s
                    AND event_type = 'step_view'
                """
                
                count = clickhouse.execute(
                    count_query,
                    {
                        "form_id": form_id,
                        "organization_id": organization_id,
                        "start_date": start_date,
                        "end_date": end_date,
                        "checkpoint_id": checkpoint_id
                    }
                )[0][0]
                
                funnel_steps.append(
                    FunnelStep(
                        step_name=checkpoint_name,
                        count=count,
                        conversion_rate=(count / total_sessions * 100) if total_sessions > 0 else 0
                    )
                )
        
        return {"funnel": [step.model_dump() for step in funnel_steps]}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/analytics/realtime/{form_id}")
async def get_realtime_analytics(form_id: str):
    """Get real-time analytics from Redis cache"""
    try:
        today = datetime.utcnow().strftime('%Y%m%d')
        cache_key = f"form:stats:{form_id}:{today}"
        
        stats = redis_client.hgetall(cache_key)
        
        return {
            "form_id": form_id,
            "date": today,
            "stats": {k: int(v) for k, v in stats.items()}
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/dashboards")
async def create_dashboard(dashboard: Dashboard, organization_id: str):
    """Create a custom dashboard"""
    try:
        dashboard_id = str(uuid.uuid4())
        
        # Convert widgets to tuples for ClickHouse
        widget_tuples = [
            (
                widget.widget_id,
                widget.widget_type,
                widget.title,
                widget.query,
                orjson.dumps(widget.config).decode()
            )
            for widget in dashboard.widgets
        ]
        
        clickhouse.execute(
            """
            INSERT INTO dashboards (dashboard_id, organization_id, name, description, widgets)
            VALUES (%(dashboard_id)s, %(organization_id)s, %(name)s, %(description)s, %(widgets)s)
            """,
            {
                "dashboard_id": dashboard_id,
                "organization_id": organization_id,
                "name": dashboard.name,
                "description": dashboard.description,
                "widgets": widget_tuples
            }
        )
        
        return {"dashboard_id": dashboard_id, "status": "created"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/dashboards/{dashboard_id}")
async def get_dashboard(dashboard_id: str):
    """Get dashboard configuration"""
    try:
        result = clickhouse.execute(
            """
            SELECT name, description, widgets, created_at, updated_at
            FROM dashboards
            WHERE dashboard_id = %(dashboard_id)s
            """,
            {"dashboard_id": dashboard_id}
        )
        
        if not result:
            raise HTTPException(status_code=404, detail="Dashboard not found")
        
        name, description, widgets, created_at, updated_at = result[0]
        
        return {
            "dashboard_id": dashboard_id,
            "name": name,
            "description": description,
            "widgets": [
                {
                    "widget_id": w[0],
                    "widget_type": w[1],
                    "title": w[2],
                    "query": w[3],
                    "config": orjson.loads(w[4]) if w[4] else {}
                }
                for w in widgets
            ],
            "created_at": created_at,
            "updated_at": updated_at
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/dashboards/{dashboard_id}/execute")
async def execute_dashboard_queries(dashboard_id: str):
    """Execute all queries in a dashboard and return results"""
    try:
        # Get dashboard
        dashboard = await get_dashboard(dashboard_id)
        
        results = {}
        for widget in dashboard["widgets"]:
            try:
                # Execute widget query
                widget_results = clickhouse.execute(widget["query"])
                
                # Format results based on widget type
                if widget["widget_type"] == "metric":
                    results[widget["widget_id"]] = {
                        "value": widget_results[0][0] if widget_results else 0,
                        "title": widget["title"]
                    }
                elif widget["widget_type"] in ["line", "bar"]:
                    results[widget["widget_id"]] = {
                        "data": [
                            {"x": row[0], "y": row[1]}
                            for row in widget_results
                        ],
                        "title": widget["title"]
                    }
                elif widget["widget_type"] == "pie":
                    results[widget["widget_id"]] = {
                        "data": [
                            {"label": row[0], "value": row[1]}
                            for row in widget_results
                        ],
                        "title": widget["title"]
                    }
                elif widget["widget_type"] == "table":
                    if widget_results:
                        df = pd.DataFrame(widget_results)
                        results[widget["widget_id"]] = {
                            "data": df.to_dict("records"),
                            "title": widget["title"]
                        }
                    else:
                        results[widget["widget_id"]] = {
                            "data": [],
                            "title": widget["title"]
                        }
                else:
                    results[widget["widget_id"]] = {
                        "data": widget_results,
                        "title": widget["title"]
                    }
            except Exception as e:
                results[widget["widget_id"]] = {
                    "error": str(e),
                    "title": widget["title"]
                }
        
        return results
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)