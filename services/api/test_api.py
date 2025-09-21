#!/usr/bin/env python
import requests
import json

# Test basic health endpoint
print("Testing health endpoint...")
try:
    response = requests.get("http://localhost:8000/health/")
    print(f"Health: {response.json()}")
except Exception as e:
    print(f"Health check failed: {e}")

print("\n" + "="*50 + "\n")

# Test login endpoint with detailed error handling
print("Testing login endpoint...")
login_data = {
    "email": "test@example.com", 
    "password": "password123"
}

try:
    response = requests.post(
        "http://localhost:8000/v1/auth/login/",
        json=login_data,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"Status code: {response.status_code}")
    print(f"Headers: {dict(response.headers)}")
    
    if response.status_code == 200:
        print(f"Success! Response: {response.json()}")
    else:
        print("Error response:")
        print(response.text[:500] if len(response.text) > 500 else response.text)
        
except requests.exceptions.RequestException as e:
    print(f"Request failed: {e}")
except json.JSONDecodeError as e:
    print(f"Invalid JSON response: {e}")
    print(f"Raw response: {response.text[:500]}")