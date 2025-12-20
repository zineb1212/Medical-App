import requests
import time
import json

model = "tinyllama"
prompt = "Bonjour"

print(f"Testing Ollama with model: {model}...")
start_time = time.time()

try:
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "stream": False
    }
    response = requests.post("http://localhost:11434/api/chat", json=payload, timeout=120)
    
    duration = time.time() - start_time
    print(f"Status: {response.status_code}")
    print(f"Duration: {duration:.2f} seconds")
    
    if response.status_code == 200:
        print("Response:", response.json().get("message", {}).get("content"))
    else:
        print("Error:", response.text)

except Exception as e:
    print(f"Failed: {e}")
