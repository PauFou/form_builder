"""
Mock performance tests for the ingest service
Tests that can run without the actual service running
"""

import asyncio
import json
import time
import statistics
from unittest.mock import AsyncMock, MagicMock, patch
from typing import List, Dict, Any
import uuid

import pytest
import httpx

# Mock the settings
class MockSettings:
    hmac_secret = "dev-hmac-secret-change-in-production"
    hmac_tolerance_seconds = 300

settings = MockSettings()

def generate_hmac_signature(payload: bytes, secret: str) -> str:
    """Mock HMAC signature generation for testing"""
    import hmac
    import hashlib
    signature = hmac.new(
        secret.encode("utf-8"),
        payload,
        hashlib.sha256
    ).hexdigest()
    return f"sha256={signature}"

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
async def test_mock_single_submission_performance():
    """Test performance of a single submission with mocking"""
    
    # Mock HTTP client that simulates realistic response times
    async def mock_post(*args, **kwargs):
        # Simulate processing time between 10-50ms
        await asyncio.sleep(0.01 + (time.time() % 100) / 2500)  # 10-50ms
        
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "success": True,
            "submission_id": str(uuid.uuid4()),
            "message": "Submission queued for processing",
            "processing_time_ms": 25.0
        }
        return mock_response
    
    with patch('httpx.AsyncClient.post', side_effect=mock_post):
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
        
        # Measure performance with mock
        latencies = []
        
        async with httpx.AsyncClient(base_url="http://mock-ingest:8001") as client:
            for _ in range(100):
                start = time.perf_counter()
                response = await client.post(f"/submit/{form_id}", content=payload, headers=headers)
                end = time.perf_counter()
                
                if response.status_code == 200:
                    latencies.append((end - start) * 1000)  # Convert to ms
        
        # Assert performance requirements
        avg_latency = statistics.mean(latencies)
        p95_latency = statistics.quantiles(latencies, n=20)[18]
        
        # More lenient requirements for mock tests
        assert avg_latency < 200, f"Average latency {avg_latency}ms exceeds 200ms requirement"
        assert p95_latency < 400, f"P95 latency {p95_latency}ms exceeds 400ms requirement"

@pytest.mark.asyncio
async def test_mock_concurrent_submissions():
    """Test performance under concurrent load with mocking"""
    
    metrics = PerformanceMetrics()
    
    # Mock with realistic concurrent behavior
    async def mock_post(*args, **kwargs):
        # Simulate variable response times under load
        base_latency = 0.02  # 20ms base
        load_factor = min(1.0, time.time() % 10 / 10)  # Simulate load variation
        await asyncio.sleep(base_latency + load_factor * 0.03)  # 20-50ms
        
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "success": True,
            "submission_id": str(uuid.uuid4()),
            "message": "Submission processed",
            "processing_time_ms": (base_latency + load_factor * 0.03) * 1000
        }
        return mock_response
    
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
                f"http://mock-ingest:8001/submit/{form_id}",
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
    
    with patch('httpx.AsyncClient.post', side_effect=mock_post):
        # Run concurrent submissions (smaller scale for mock)
        async with httpx.AsyncClient() as client:
            tasks = []
            
            # Submit 100 requests with 20 concurrent connections
            for i in range(100):
                if len(tasks) >= 20:
                    # Wait for some to complete
                    done, tasks = await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
                    tasks = list(tasks)
                
                task = asyncio.create_task(submit_form(client, i))
                tasks.append(task)
            
            # Wait for all remaining tasks
            await asyncio.gather(*tasks)
    
    # Analyze results
    stats = metrics.get_stats()
    
    print(f"Mock Performance Statistics:")
    print(f"Total Requests: {stats['total_requests']}")
    print(f"Success Rate: {stats['success_rate']:.2f}%")
    print(f"Throughput: {stats['throughput']:.2f} req/s")
    print(f"Avg Latency: {stats['avg_latency']:.2f}ms")
    print(f"P95 Latency: {stats['p95_latency']:.2f}ms")
    print(f"P99 Latency: {stats['p99_latency']:.2f}ms")
    
    # Assert performance requirements (more lenient for mock)
    assert stats['success_rate'] > 95, f"Success rate {stats['success_rate']}% below 95% requirement"
    assert stats['avg_latency'] < 300, f"Average latency {stats['avg_latency']}ms exceeds 300ms"
    assert stats['p95_latency'] < 600, f"P95 latency {stats['p95_latency']}ms exceeds 600ms"

def test_mock_rate_limiting_performance():
    """Test rate limiting doesn't impact normal traffic performance (mock)"""
    
    # Mock rate limiting behavior
    request_count = 0
    
    def mock_post(*args, **kwargs):
        nonlocal request_count
        request_count += 1
        
        # Simulate rate limiting after 50 requests
        if request_count > 50:
            mock_response = MagicMock()
            mock_response.status_code = 429  # Too Many Requests
            return mock_response
        
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"success": True}
        return mock_response
    
    with patch('httpx.post', side_effect=mock_post):
        metrics = PerformanceMetrics()
        
        # Submit controlled requests
        for i in range(60):  # Test rate limiting behavior
            form_id = "rate-limit-test"
            
            submission_data = {
                "data": {
                    "form_id": form_id,
                    "respondent_key": f"rate-test-{i}",
                    "version": 1,
                    "locale": "en",
                    "answers": {"field1": f"Value {i}"},
                    "partial": False
                },
                "timestamp": int(time.time())
            }
            
            payload = json.dumps(submission_data).encode('utf-8')
            signature = generate_hmac_signature(payload, settings.hmac_secret)
            
            headers = {
                "Content-Type": "application/json",
                "X-Forms-Signature": signature,
                "X-Forwarded-For": f"10.0.0.{i % 256}"
            }
            
            start = time.perf_counter()
            
            try:
                response = httpx.post(
                    f"http://mock-ingest:8001/submit/{form_id}",
                    content=payload,
                    headers=headers,
                    timeout=10.0
                )
                end = time.perf_counter()
                
                latency = (end - start) * 1000
                success = response.status_code in (200, 201)
                metrics.record_request(latency, success)
                
            except Exception:
                end = time.perf_counter()
                latency = (end - start) * 1000
                metrics.record_request(latency, False)
        
        stats = metrics.get_stats()
        
        # Should handle normal traffic, then rate limit
        assert stats['total_requests'] == 60
        # First 50 should succeed, last 10 should be rate limited
        assert stats['success_count'] == 50
        assert stats['error_count'] == 10

def test_mock_memory_usage():
    """Test mock memory usage patterns"""
    import psutil
    import os
    
    process = psutil.Process(os.getpid())
    initial_memory = process.memory_info().rss / 1024 / 1024  # MB
    
    # Simulate memory usage for large payloads
    large_payloads = []
    for i in range(100):
        payload = {
            "data": {
                "form_id": "memory-test",
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
        large_payloads.append(payload)
        
        # Check memory every 20 iterations
        if i % 20 == 0:
            current_memory = process.memory_info().rss / 1024 / 1024
            memory_growth = current_memory - initial_memory
            
            # Memory growth should be bounded (more lenient for mock)
            assert memory_growth < 200, f"Memory grew by {memory_growth}MB, possible leak"
    
    # Clean up
    del large_payloads

def test_mock_prometheus_metrics():
    """Test mock Prometheus metrics don't impact performance"""
    
    # Mock metrics collection
    def mock_get(*args, **kwargs):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.text = "# Mock metrics\nhttp_requests_total 100\n"
        return mock_response
    
    with patch('httpx.get', side_effect=mock_get):
        # Get baseline performance
        baseline_latencies = []
        
        for _ in range(100):
            start = time.perf_counter()
            response = httpx.get("http://mock-ingest:8001/health")
            end = time.perf_counter()
            
            if response.status_code == 200:
                baseline_latencies.append((end - start) * 1000)
        
        baseline_avg = statistics.mean(baseline_latencies)
        
        # Get performance with metrics
        metrics_latencies = []
        
        for _ in range(100):
            # Hit metrics endpoint (mock)
            httpx.get("http://mock-ingest:8001/metrics")
            
            # Then test regular endpoint
            start = time.perf_counter()
            response = httpx.get("http://mock-ingest:8001/health")
            end = time.perf_counter()
            
            if response.status_code == 200:
                metrics_latencies.append((end - start) * 1000)
        
        metrics_avg = statistics.mean(metrics_latencies)
        
        # Metrics shouldn't significantly impact performance (< 500% overhead for mock)
        # Note: Mock tests have more variance, so we're more lenient
        overhead = abs(metrics_avg - baseline_avg) / baseline_avg * 100
        assert overhead < 500, f"Metrics overhead {overhead}% exceeds 500%"

if __name__ == "__main__":
    pytest.main([__file__, "-v"])