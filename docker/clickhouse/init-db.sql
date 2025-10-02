-- Create analytics database
CREATE DATABASE IF NOT EXISTS forms_analytics;

USE forms_analytics;

-- Form view events
CREATE TABLE IF NOT EXISTS form_views (
    event_id UUID DEFAULT generateUUIDv4(),
    form_id UUID NOT NULL,
    session_id String NOT NULL,
    respondent_key String,
    timestamp DateTime DEFAULT now(),
    date Date DEFAULT toDate(timestamp),
    
    -- User info
    user_agent String,
    ip_address String,
    country_code String,
    region String,
    city String,
    
    -- Device info
    device_type String,
    browser String,
    os String,
    screen_resolution String,
    
    -- Referrer info
    referrer_url String,
    referrer_domain String,
    utm_source String,
    utm_medium String,
    utm_campaign String,
    
    -- Performance metrics
    page_load_time_ms UInt32,
    
    INDEX idx_form_date (form_id, date) TYPE minmax GRANULARITY 1,
    INDEX idx_session (session_id) TYPE bloom_filter GRANULARITY 1
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (form_id, timestamp)
TTL date + INTERVAL 2 YEAR;

-- Form step/field interactions
CREATE TABLE IF NOT EXISTS form_interactions (
    event_id UUID DEFAULT generateUUIDv4(),
    form_id UUID NOT NULL,
    session_id String NOT NULL,
    respondent_key String,
    timestamp DateTime DEFAULT now(),
    date Date DEFAULT toDate(timestamp),
    
    -- Interaction details
    interaction_type Enum('field_focus', 'field_blur', 'field_change', 'step_view', 'step_complete', 'validation_error', 'submit_attempt'),
    field_id String,
    field_type String,
    page_number UInt16,
    
    -- Timing
    time_on_field_ms UInt32,
    time_on_page_ms UInt32,
    
    -- Value info (anonymized)
    value_length UInt32,
    is_empty Bool,
    
    -- Error info
    error_type String,
    error_message String,
    
    INDEX idx_form_session (form_id, session_id) TYPE minmax GRANULARITY 1,
    INDEX idx_interaction_type (interaction_type) TYPE set(0) GRANULARITY 1
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (form_id, session_id, timestamp)
TTL date + INTERVAL 1 YEAR;

-- Form submissions
CREATE TABLE IF NOT EXISTS form_submissions (
    submission_id UUID NOT NULL,
    form_id UUID NOT NULL,
    session_id String NOT NULL,
    respondent_key String,
    timestamp DateTime DEFAULT now(),
    date Date DEFAULT toDate(timestamp),
    
    -- Submission details
    is_complete Bool,
    is_partial Bool,
    completion_rate Float32,
    
    -- Timing metrics
    total_time_ms UInt32,
    time_to_first_interaction_ms UInt32,
    time_per_field_avg_ms UInt32,
    
    -- Field metrics
    fields_completed UInt16,
    fields_total UInt16,
    fields_with_errors UInt16,
    validation_attempts UInt16,
    
    -- Device/Browser
    device_type String,
    browser String,
    os String,
    
    -- Source
    referrer_domain String,
    utm_source String,
    utm_medium String,
    utm_campaign String,
    
    INDEX idx_form_date (form_id, date) TYPE minmax GRANULARITY 1,
    INDEX idx_complete (is_complete) TYPE set(2) GRANULARITY 1
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (form_id, timestamp)
TTL date + INTERVAL 2 YEAR;

-- Form performance metrics (aggregated hourly)
CREATE TABLE IF NOT EXISTS form_performance_hourly (
    form_id UUID NOT NULL,
    hour DateTime NOT NULL,
    
    -- View metrics
    total_views UInt32,
    unique_visitors UInt32,
    
    -- Engagement metrics
    avg_time_on_form_sec Float32,
    bounce_rate Float32,
    
    -- Completion metrics
    started_count UInt32,
    completed_count UInt32,
    partial_count UInt32,
    completion_rate Float32,
    
    -- Performance metrics
    avg_load_time_ms Float32,
    p95_load_time_ms UInt32,
    
    -- Device breakdown
    desktop_views UInt32,
    mobile_views UInt32,
    tablet_views UInt32,
    
    -- Top countries (JSON)
    top_countries String,
    
    -- Top referrers (JSON)
    top_referrers String
) ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(hour)
ORDER BY (form_id, hour)
TTL hour + INTERVAL 1 YEAR;

-- Field-level analytics
CREATE TABLE IF NOT EXISTS field_analytics (
    form_id UUID NOT NULL,
    field_id String NOT NULL,
    date Date NOT NULL,
    
    -- Interaction metrics
    total_interactions UInt32,
    unique_users UInt32,
    
    -- Completion metrics
    completed_count UInt32,
    skipped_count UInt32,
    error_count UInt32,
    
    -- Time metrics
    avg_time_to_complete_ms Float32,
    p50_time_ms UInt32,
    p95_time_ms UInt32,
    
    -- Error breakdown (JSON)
    error_types String,
    
    -- Drop-off rate
    drop_off_rate Float32
) ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (form_id, field_id, date)
TTL date + INTERVAL 6 MONTH;

-- Funnel analysis view
CREATE MATERIALIZED VIEW IF NOT EXISTS form_funnel_mv
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (form_id, date)
AS
SELECT
    form_id,
    toDate(timestamp) as date,
    countDistinct(session_id) as sessions,
    countDistinctIf(session_id, interaction_type = 'step_view' AND page_number = 1) as step_1_views,
    countDistinctIf(session_id, interaction_type = 'step_complete' AND page_number = 1) as step_1_completes,
    countDistinctIf(session_id, interaction_type = 'step_view' AND page_number = 2) as step_2_views,
    countDistinctIf(session_id, interaction_type = 'step_complete' AND page_number = 2) as step_2_completes,
    countDistinctIf(session_id, interaction_type = 'submit_attempt') as submit_attempts
FROM form_interactions
GROUP BY form_id, date;

-- Create indexes for common queries
ALTER TABLE form_views ADD INDEX idx_country (country_code) TYPE set(100) GRANULARITY 4;
ALTER TABLE form_views ADD INDEX idx_browser (browser) TYPE set(50) GRANULARITY 4;
ALTER TABLE form_submissions ADD INDEX idx_utm_source (utm_source) TYPE set(100) GRANULARITY 4;