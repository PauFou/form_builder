#!/usr/bin/env python3
import requests
import json

url = "http://localhost:8888/v1/auth/login/"
data = {
    "email": "dev@local.com",
    "password": "dev123"
}

try:
    response = requests.post(url, json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"Error: {e}")
    print(f"Response text: {response.text if 'response' in locals() else 'No response'}")
