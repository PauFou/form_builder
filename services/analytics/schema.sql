-- ClickHouse schema for form analytics
-- Optimized for high-volume event ingestion and real-time analytics

-- Events table (main fact table)
CREATE TABLE IF NOT EXISTS events (
    -- Event identification
    event_id UUID DEFAULT generateUUIDv4(),
    event_type Enum8(
        'form_view' = 1,
        'form_start' = 2,
        'step_view' = 3,
        'field_focus' = 4,
        'field_change' = 5,
        'field_error' = 6,
        'step_complete' = 7,
        'form_submit' = 8,
        'form_abandon' = 9,
        'outcome_reached' = 10,
        'payment_initiated' = 11,
        'payment_completed' = 12,
        'partial_save' = 13
    ),
    timestamp DateTime64(3) DEFAULT now(),
    
    -- Form context
    form_id UUID,
    form_version UInt32,
    organization_id UUID,
    
    -- User context
    respondent_id String,  -- Anonymous ID or authenticated user ID
    session_id String,
    
    -- Event details
    step_id String,
    field_id String,
    field_type String,
    field_value String,  -- Anonymized/hashed for PII protection
    error_type String,
    error_message String,
    outcome_id String,
    
    -- Submission context
    submission_id Nullable(UUID),
    is_partial UInt8 DEFAULT 0,
    
    -- Device & location
    device_type Enum8('desktop' = 1, 'mobile' = 2, 'tablet' = 3),
    browser String,
    os String,
    country_code FixedString(2),
    region String,
    city String,
    
    -- Performance metrics
    page_load_time_ms UInt32,
    time_to_interactive_ms UInt32,
    time_on_step_ms UInt32,
    
    -- UTM parameters
    utm_source String,
    utm_medium String,
    utm_campaign String,
    utm_term String,
    utm_content String,
    
    -- Referrer
    referrer_domain String,
    referrer_path String,
    
    -- Indexes for partitioning and sorting
    INDEX idx_form_id form_id TYPE bloom_filter GRANULARITY 4,
    INDEX idx_respondent respondent_id TYPE bloom_filter GRANULARITY 4
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (organization_id, form_id, timestamp)
TTL timestamp + INTERVAL 2 YEAR
SETTINGS index_granularity = 8192;

-- Aggregated session view for faster analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS session_analytics
ENGINE = AggregatingMergeTree()
PARTITION BY toYYYYMM(session_start)
ORDER BY (organization_id, form_id, session_date)
AS SELECT
    organization_id,
    form_id,
    toDate(min(timestamp)) as session_date,
    session_id,
    respondent_id,
    
    min(timestamp) as session_start,
    max(timestamp) as session_end,
    
    -- Funnel metrics
    countIf(event_type = 'form_view') as views,
    countIf(event_type = 'form_start') as starts,
    countIf(event_type = 'form_submit') as completions,
    countIf(event_type = 'form_abandon') as abandons,
    
    -- Engagement metrics
    count(DISTINCT step_id) as unique_steps_viewed,
    countIf(event_type = 'field_error') as total_errors,
    sum(time_on_step_ms) as total_time_ms,
    
    -- Device info
    any(device_type) as device_type,
    any(browser) as browser,
    any(country_code) as country_code,
    
    -- Attribution
    any(utm_source) as utm_source,
    any(utm_campaign) as utm_campaign,
    any(referrer_domain) as referrer_domain
FROM events
GROUP BY organization_id, form_id, session_id, respondent_id;

-- Form performance metrics (hourly rollup)
CREATE MATERIALIZED VIEW IF NOT EXISTS form_performance_hourly
ENGINE = AggregatingMergeTree()
PARTITION BY toYYYYMM(hour)
ORDER BY (organization_id, form_id, hour)
AS SELECT
    organization_id,
    form_id,
    toStartOfHour(timestamp) as hour,
    
    -- Volume metrics
    count() as total_events,
    countIf(event_type = 'form_view') as views,
    countIf(event_type = 'form_start') as starts,
    countIf(event_type = 'form_submit') as completions,
    
    -- Conversion rates
    countIf(event_type = 'form_submit') / countIf(event_type = 'form_view') as view_to_complete_rate,
    countIf(event_type = 'form_submit') / countIf(event_type = 'form_start') as start_to_complete_rate,
    
    -- Performance percentiles
    quantile(0.5)(page_load_time_ms) as p50_load_time,
    quantile(0.95)(page_load_time_ms) as p95_load_time,
    quantile(0.5)(time_to_interactive_ms) as p50_tti,
    quantile(0.95)(time_to_interactive_ms) as p95_tti,
    
    -- Error rate
    countIf(event_type = 'field_error') / count() as error_rate
FROM events
WHERE timestamp >= now() - INTERVAL 30 DAY
GROUP BY organization_id, form_id, hour;

-- Field-level analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS field_analytics
ENGINE = AggregatingMergeTree()
PARTITION BY toYYYYMM(day)
ORDER BY (organization_id, form_id, field_id, day)
AS SELECT
    organization_id,
    form_id,
    field_id,
    field_type,
    toDate(timestamp) as day,
    
    -- Interaction metrics
    countIf(event_type = 'field_focus') as focuses,
    countIf(event_type = 'field_change') as changes,
    countIf(event_type = 'field_error') as errors,
    
    -- Time metrics
    avg(time_on_step_ms) as avg_time_ms,
    
    -- Error analysis
    groupArray(error_type) as error_types,
    count(DISTINCT respondent_id) as unique_users
FROM events
WHERE field_id != ''
GROUP BY organization_id, form_id, field_id, field_type, day;

-- Drop-off funnel analysis
CREATE TABLE IF NOT EXISTS funnel_checkpoints (
    organization_id UUID,
    form_id UUID,
    checkpoint_order UInt8,
    checkpoint_type Enum8('page' = 1, 'field' = 2, 'custom' = 3),
    checkpoint_id String,
    checkpoint_name String
) ENGINE = MergeTree()
ORDER BY (organization_id, form_id, checkpoint_order);

-- Custom dashboards configuration
CREATE TABLE IF NOT EXISTS dashboards (
    dashboard_id UUID DEFAULT generateUUIDv4(),
    organization_id UUID,
    name String,
    description String,
    widgets Array(Tuple(
        widget_id String,
        widget_type Enum8('line' = 1, 'bar' = 2, 'pie' = 3, 'funnel' = 4, 'table' = 5, 'metric' = 6),
        title String,
        query String,
        config String  -- JSON configuration
    )),
    created_at DateTime DEFAULT now(),
    updated_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (organization_id, dashboard_id);

-- Saved segments for analysis
CREATE TABLE IF NOT EXISTS segments (
    segment_id UUID DEFAULT generateUUIDv4(),
    organization_id UUID,
    name String,
    description String,
    filters String,  -- JSON filter configuration
    created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (organization_id, segment_id);