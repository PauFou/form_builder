#!/usr/bin/env python3
"""
Test script for the ingest service
"""

import hashlib
import hmac
import json
import time
from uuid import uuid4

import httpx


def generate_hmac_signature(payload: bytes, secret: str) -> str:
    """Generate HMAC signature for payload"""
    signature = hmac.new(
        secret.encode("utf-8"),
        payload,
        hashlib.sha256
    ).hexdigest()
    return f"sha256={signature}"


def test_submission():
    """Test form submission endpoint"""
    
    # Configuration
    ingest_url = "http://localhost:8001"
    hmac_secret = "dev-hmac-secret-change-in-production"  # Should match settings
    form_id = "test-form-123"
    
    # Prepare test submission
    submission_data = {
        "data": {
            "form_id": form_id,
            "respondent_key": f"test-respondent-{uuid4()}",
            "version": 1,
            "locale": "en",
            "answers": {
                "field1": "Test answer 1",
                "field2": "Test answer 2",
                "field3": 42
            },
            "metadata": {
                "test": True,
                "browser": "test-browser"
            },
            "partial": False
        },
        "idempotency_key": str(uuid4()),
        "timestamp": int(time.time())
    }
    
    # Convert to JSON
    payload_json = json.dumps(submission_data, separators=(",", ":"))
    payload_bytes = payload_json.encode("utf-8")
    
    # Generate HMAC signature
    signature = generate_hmac_signature(payload_bytes, hmac_secret)
    
    # Prepare headers
    headers = {
        "Content-Type": "application/json",
        "X-Forms-Signature": signature,
        "X-Forms-Timestamp": str(submission_data["timestamp"]),
        "User-Agent": "Test-Client/1.0"
    }
    
    print(f"Testing submission to: {ingest_url}/submit/{form_id}")
    print(f"Payload size: {len(payload_bytes)} bytes")
    print(f"HMAC signature: {signature}")
    print()
    
    try:
        with httpx.Client() as client:
            response = client.post(
                f"{ingest_url}/submit/{form_id}",
                data=payload_bytes,
                headers=headers,
                timeout=30
            )
            
            print(f"Response status: {response.status_code}")
            print(f"Response headers: {dict(response.headers)}")
            print(f"Response body: {response.text}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"\n✅ Submission successful!")
                print(f"Submission ID: {result.get('submission_id')}")
                print(f"Processing time: {result.get('processing_time_ms')}ms")
            else:
                print(f"\n❌ Submission failed!")
                print(f"Error: {response.text}")
                
    except Exception as e:
        print(f"❌ Request failed: {e}")


def test_health_check():
    """Test health check endpoint"""
    ingest_url = "http://localhost:8001"
    
    print(f"Testing health check: {ingest_url}/health")
    
    try:
        with httpx.Client() as client:
            response = client.get(f"{ingest_url}/health", timeout=10)
            
            print(f"Response status: {response.status_code}")
            print(f"Response body: {response.text}")
            
            if response.status_code == 200:
                print("✅ Health check passed!")
            else:
                print("❌ Health check failed!")
                
    except Exception as e:
        print(f"❌ Health check failed: {e}")


def test_readiness_check():
    """Test readiness check endpoint"""
    ingest_url = "http://localhost:8001"
    
    print(f"Testing readiness check: {ingest_url}/ready")
    
    try:
        with httpx.Client() as client:
            response = client.get(f"{ingest_url}/ready", timeout=10)
            
            print(f"Response status: {response.status_code}")
            print(f"Response body: {response.text}")
            
            if response.status_code == 200:
                print("✅ Readiness check passed!")
            else:
                print("❌ Service not ready!")
                
    except Exception as e:
        print(f"❌ Readiness check failed: {e}")


def test_metrics():
    """Test metrics endpoint"""
    ingest_url = "http://localhost:8001"
    
    print(f"Testing metrics endpoint: {ingest_url}/metrics")
    
    try:
        with httpx.Client() as client:
            response = client.get(f"{ingest_url}/metrics", timeout=10)
            
            print(f"Response status: {response.status_code}")
            print(f"Content-Type: {response.headers.get('content-type')}")
            
            if response.status_code == 200:
                metrics_lines = response.text.split('\n')
                print(f"Metrics lines: {len([l for l in metrics_lines if l and not l.startswith('#')])}")
                print("✅ Metrics endpoint working!")
            else:
                print("❌ Metrics endpoint failed!")
                
    except Exception as e:
        print(f"❌ Metrics request failed: {e}")


def test_invalid_signature():
    """Test submission with invalid HMAC signature"""
    ingest_url = "http://localhost:8001"
    form_id = "test-form-123"
    
    submission_data = {
        "data": {
            "form_id": form_id,
            "respondent_key": f"test-respondent-{uuid4()}",
            "version": 1,
            "locale": "en",
            "answers": {"field1": "test"},
            "partial": False
        },
        "timestamp": int(time.time())
    }
    
    payload_json = json.dumps(submission_data)
    payload_bytes = payload_json.encode("utf-8")
    
    # Invalid signature
    headers = {
        "Content-Type": "application/json",
        "X-Forms-Signature": "sha256=invalid-signature",
        "User-Agent": "Test-Client/1.0"
    }
    
    print(f"Testing invalid signature...")
    
    try:
        with httpx.Client() as client:
            response = client.post(
                f"{ingest_url}/submit/{form_id}",
                data=payload_bytes,
                headers=headers,
                timeout=30
            )
            
            print(f"Response status: {response.status_code}")
            print(f"Response body: {response.text}")
            
            if response.status_code == 401:
                print("✅ Invalid signature correctly rejected!")
            else:
                print("❌ Invalid signature should have been rejected!")
                
    except Exception as e:
        print(f"❌ Request failed: {e}")


if __name__ == "__main__":
    print("🚀 Testing Forms Ingest Service")
    print("=" * 50)
    
    print("\n1. Health Check")
    print("-" * 20)
    test_health_check()
    
    print("\n2. Readiness Check")
    print("-" * 20)
    test_readiness_check()
    
    print("\n3. Metrics Endpoint")
    print("-" * 20)
    test_metrics()
    
    print("\n4. Valid Submission")
    print("-" * 20)
    test_submission()
    
    print("\n5. Invalid Signature Test")
    print("-" * 20)
    test_invalid_signature()
    
    print("\n🏁 Testing complete!")