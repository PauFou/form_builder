"""
Performance tests for the ingest service
Tests throughput, latency, and resource usage under load
"""

import asyncio
import json
import time
import statistics
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from typing import List, Dict, Any
import uuid

import pytest
import httpx
from locust import HttpUser, task, between, events
from prometheus_client.parser import text_string_to_metric_families

from ..main import app, settings, generate_hmac_signature


class PerformanceMetrics:
    """Track performance metrics during tests"""
    
    def __init__(self):
        self.latencies: List[float] = []
        self.success_count = 0
        self.error_count = 0
        self.start_time = time.time()
    
    def record_request(self, latency: float, success: bool):
        self.latencies.append(latency)
        if success:
            self.success_count += 1
        else:
            self.error_count += 1
    
    def get_stats(self) -> Dict[str, Any]:
        if not self.latencies:
            return {}
        
        duration = time.time() - self.start_time
        
        return {
            "total_requests": len(self.latencies),
            "success_count": self.success_count,
            "error_count": self.error_count,
            "success_rate": self.success_count / len(self.latencies) * 100,
            "throughput": len(self.latencies) / duration,
            "min_latency": min(self.latencies),
            "max_latency": max(self.latencies),
            "avg_latency": statistics.mean(self.latencies),
            "p50_latency": statistics.median(self.latencies),
            "p95_latency": statistics.quantiles(self.latencies, n=20)[18] if len(self.latencies) > 20 else max(self.latencies),
            "p99_latency": statistics.quantiles(self.latencies, n=100)[98] if len(self.latencies) > 100 else max(self.latencies),
        }


@pytest.mark.asyncio
async def test_single_submission_performance():
    """Test performance of a single submission"""
    
    async with httpx.AsyncClient(base_url="http://localhost:8001") as client:
        form_id = str(uuid.uuid4())
        
        submission_data = {
            "data": {
                "form_id": form_id,
                "respondent_key": f"perf-test-{uuid.uuid4()}",
                "version": 1,
                "locale": "en",
                "answers": {
                    "field1": "test value",
                    "field2": 42,
                    "field3": ["option1", "option2"]
                },
                "metadata": {
                    "test": True
                },
                "partial": False
            },
            "idempotency_key": str(uuid.uuid4()),
            "timestamp": int(time.time())
        }
        
        payload = json.dumps(submission_data).encode('utf-8')
        signature = generate_hmac_signature(payload, settings.hmac_secret)
        
        headers = {
            "Content-Type": "application/json",
            "X-Forms-Signature": signature
        }
        
        # Warm up
        await client.post(f"/submit/{form_id}", content=payload, headers=headers)
        
        # Measure performance
        latencies = []
        
        for _ in range(100):
            start = time.perf_counter()
            response = await client.post(f"/submit/{form_id}", content=payload, headers=headers)
            end = time.perf_counter()
            
            if response.status_code == 200:
                latencies.append((end - start) * 1000)  # Convert to ms
        
        # Assert performance requirements
        avg_latency = statistics.mean(latencies)
        p95_latency = statistics.quantiles(latencies, n=20)[18]
        
        assert avg_latency < 100, f"Average latency {avg_latency}ms exceeds 100ms requirement"
        assert p95_latency < 200, f"P95 latency {p95_latency}ms exceeds 200ms requirement"


@pytest.mark.asyncio
async def test_concurrent_submissions():
    """Test performance under concurrent load"""
    
    metrics = PerformanceMetrics()
    
    async def submit_form(client: httpx.AsyncClient, index: int):
        form_id = "concurrent-test-form"
        
        submission_data = {
            "data": {
                "form_id": form_id,
                "respondent_key": f"concurrent-{index}-{uuid.uuid4()}",
                "version": 1,
                "locale": "en",
                "answers": {
                    "field1": f"Concurrent submission {index}",
                    "field2": index
                },
                "partial": False
            },
            "timestamp": int(time.time())
        }
        
        payload = json.dumps(submission_data).encode('utf-8')
        signature = generate_hmac_signature(payload, settings.hmac_secret)
        
        headers = {
            "Content-Type": "application/json",
            "X-Forms-Signature": signature
        }
        
        start = time.perf_counter()
        try:
            response = await client.post(
                f"http://localhost:8001/submit/{form_id}",
                content=payload,
                headers=headers,
                timeout=10.0
            )
            end = time.perf_counter()
            
            latency = (end - start) * 1000
            success = response.status_code in (200, 201)
            metrics.record_request(latency, success)
            
        except Exception as e:
            end = time.perf_counter()
            latency = (end - start) * 1000
            metrics.record_request(latency, False)
    
    # Run concurrent submissions
    async with httpx.AsyncClient() as client:
        tasks = []
        
        # Submit 1000 requests with 50 concurrent connections
        for i in range(1000):
            if len(tasks) >= 50:
                # Wait for some to complete
                done, tasks = await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
                tasks = list(tasks)
            
            task = asyncio.create_task(submit_form(client, i))
            tasks.append(task)
        
        # Wait for all remaining tasks
        await asyncio.gather(*tasks)
    
    # Analyze results
    stats = metrics.get_stats()
    
    print(f"Performance Statistics:")
    print(f"Total Requests: {stats['total_requests']}")
    print(f"Success Rate: {stats['success_rate']:.2f}%")
    print(f"Throughput: {stats['throughput']:.2f} req/s")
    print(f"Avg Latency: {stats['avg_latency']:.2f}ms")
    print(f"P95 Latency: {stats['p95_latency']:.2f}ms")
    print(f"P99 Latency: {stats['p99_latency']:.2f}ms")
    
    # Assert performance requirements
    assert stats['success_rate'] > 99, f"Success rate {stats['success_rate']}% below 99% requirement"
    assert stats['avg_latency'] < 200, f"Average latency {stats['avg_latency']}ms exceeds 200ms"
    assert stats['p95_latency'] < 500, f"P95 latency {stats['p95_latency']}ms exceeds 500ms"


def test_rate_limiting_performance():
    """Test rate limiting doesn't impact normal traffic performance"""
    
    metrics = PerformanceMetrics()
    
    def submit_form(index: int) -> tuple[float, bool]:
        form_id = "rate-limit-test"
        
        submission_data = {
            "data": {
                "form_id": form_id,
                "respondent_key": f"rate-test-{index}",
                "version": 1,
                "locale": "en",
                "answers": {"field1": f"Value {index}"},
                "partial": False
            },
            "timestamp": int(time.time())
        }
        
        payload = json.dumps(submission_data).encode('utf-8')
        signature = generate_hmac_signature(payload, settings.hmac_secret)
        
        headers = {
            "Content-Type": "application/json",
            "X-Forms-Signature": signature,
            "X-Forwarded-For": f"10.0.0.{index % 256}"  # Distribute across IPs
        }
        
        start = time.perf_counter()
        
        try:
            response = httpx.post(
                f"http://localhost:8001/submit/{form_id}",
                content=payload,
                headers=headers,
                timeout=10.0
            )
            end = time.perf_counter()
            
            latency = (end - start) * 1000
            success = response.status_code in (200, 201)
            return latency, success
            
        except Exception:
            end = time.perf_counter()
            latency = (end - start) * 1000
            return latency, False
    
    # Submit requests at controlled rate
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = []
        
        # Submit 600 requests over 60 seconds (10 req/s)
        for i in range(600):
            future = executor.submit(submit_form, i)
            futures.append(future)
            time.sleep(0.1)  # 10 requests per second
        
        # Collect results
        for future in as_completed(futures):
            latency, success = future.result()
            metrics.record_request(latency, success)
    
    stats = metrics.get_stats()
    
    # Should handle normal traffic without rate limiting
    assert stats['success_rate'] > 95, f"Success rate {stats['success_rate']}% too low"
    assert stats['avg_latency'] < 150, f"Rate limiting impacting performance"


def test_memory_usage_under_load():
    """Test memory usage doesn't grow unbounded under load"""
    
    import psutil
    import os
    
    process = psutil.Process(os.getpid())
    initial_memory = process.memory_info().rss / 1024 / 1024  # MB
    
    # Submit many requests
    for i in range(1000):
        form_id = "memory-test"
        
        submission_data = {
            "data": {
                "form_id": form_id,
                "respondent_key": f"memory-{i}",
                "version": 1,
                "locale": "en",
                "answers": {
                    f"field_{j}": f"Value {j}" * 100  # Large payload
                    for j in range(10)
                },
                "partial": False
            },
            "timestamp": int(time.time())
        }
        
        payload = json.dumps(submission_data).encode('utf-8')
        signature = generate_hmac_signature(payload, settings.hmac_secret)
        
        headers = {
            "Content-Type": "application/json",
            "X-Forms-Signature": signature
        }
        
        try:
            httpx.post(
                f"http://localhost:8001/submit/{form_id}",
                content=payload,
                headers=headers,
                timeout=5.0
            )
        except:
            pass
        
        # Check memory every 100 requests
        if i % 100 == 0:
            current_memory = process.memory_info().rss / 1024 / 1024
            memory_growth = current_memory - initial_memory
            
            # Memory growth should be bounded
            assert memory_growth < 100, f"Memory grew by {memory_growth}MB, possible leak"


def test_prometheus_metrics_performance():
    """Test Prometheus metrics don't impact performance"""
    
    # Get baseline performance without metrics
    baseline_latencies = []
    
    for _ in range(100):
        start = time.perf_counter()
        response = httpx.get("http://localhost:8001/health")
        end = time.perf_counter()
        
        if response.status_code == 200:
            baseline_latencies.append((end - start) * 1000)
    
    baseline_avg = statistics.mean(baseline_latencies)
    
    # Get performance with metrics endpoint
    metrics_latencies = []
    
    for _ in range(100):
        # Hit metrics endpoint
        httpx.get("http://localhost:8001/metrics")
        
        # Then test regular endpoint
        start = time.perf_counter()
        response = httpx.get("http://localhost:8001/health")
        end = time.perf_counter()
        
        if response.status_code == 200:
            metrics_latencies.append((end - start) * 1000)
    
    metrics_avg = statistics.mean(metrics_latencies)
    
    # Metrics shouldn't significantly impact performance (< 10% overhead)
    overhead = (metrics_avg - baseline_avg) / baseline_avg * 100
    assert overhead < 10, f"Metrics overhead {overhead}% exceeds 10%"


# Locust load testing configuration
class IngestServiceUser(HttpUser):
    """Locust user for load testing the ingest service"""
    
    wait_time = between(0.1, 0.5)
    
    def on_start(self):
        """Setup before starting load test"""
        self.form_id = str(uuid.uuid4())
        self.submission_count = 0
    
    @task(10)
    def submit_form(self):
        """Submit a form"""
        self.submission_count += 1
        
        submission_data = {
            "data": {
                "form_id": self.form_id,
                "respondent_key": f"locust-{self.submission_count}-{uuid.uuid4()}",
                "version": 1,
                "locale": "en",
                "answers": {
                    "field1": f"Load test submission {self.submission_count}",
                    "field2": self.submission_count,
                    "field3": ["option1", "option2", "option3"]
                },
                "metadata": {
                    "load_test": True,
                    "user_id": self.user
                },
                "partial": False
            },
            "idempotency_key": str(uuid.uuid4()),
            "timestamp": int(time.time())
        }
        
        payload = json.dumps(submission_data)
        signature = generate_hmac_signature(
            payload.encode('utf-8'),
            "dev-hmac-secret-change-in-production"  # Use test secret
        )
        
        headers = {
            "Content-Type": "application/json",
            "X-Forms-Signature": signature
        }
        
        with self.client.post(
            f"/submit/{self.form_id}",
            data=payload,
            headers=headers,
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Got status code {response.status_code}")
    
    @task(2)
    def check_health(self):
        """Check health endpoint"""
        self.client.get("/health")
    
    @task(1)
    def get_metrics(self):
        """Get Prometheus metrics"""
        self.client.get("/metrics")


# Custom event handlers for Locust
@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    """Print performance summary when test stops"""
    if environment.stats.total.fail_ratio > 0.01:
        print(f"Test failed with {environment.stats.total.fail_ratio * 100:.2f}% error rate")
    
    print(f"Total requests: {environment.stats.total.num_requests}")
    print(f"RPS: {environment.stats.total.current_rps:.2f}")
    print(f"Average response time: {environment.stats.total.avg_response_time:.2f}ms")
    print(f"P95 response time: {environment.stats.total.get_response_time_percentile(0.95):.2f}ms")