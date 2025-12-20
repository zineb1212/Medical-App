import requests
import json

try:
    print("Testing connection to http://127.0.0.1:5000/api/ai/chat...")
    response = requests.post(
        "http://127.0.0.1:5000/api/ai/chat",
        json={"query": "test connection", "context": {}},
        headers={"Content-Type": "application/json"},
        timeout=5
    )
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Connection Failed: {e}")
