import requests
import json

BASE_URL = "http://localhost:5000/api/ai"

def test_chat():
    print("\n--- Testing Chat AI ---")
    payload = {"query": "J'ai  mal à la tête et j'ai peur d'une tumeur", "context": {}}
    try:
        response = requests.post(f"{BASE_URL}/chat", json=payload)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Error: {e}")

def test_record_analysis():
    print("\n--- Testing Record Analysis ---")
    # Using the seeded patient ID
    payload = {"user_id": "patient@test.com"} 
    try:
        response = requests.post(f"{BASE_URL}/analyze-record", json=payload)
        print(f"Status: {response.status_code}")
        if response.status_code != 200:
            print(f"Error Body: {response.text}")
        else:
            print(f"Result: {response.json()}")
    except Exception as e:
        print(f"Exception: {e}")

def test_mri():
    print("\n--- Testing MRI Analysis ---")
    try:
        files = {'file': open('test_mri.jpg', 'rb')}
        response = requests.post(f"{BASE_URL}/analyze-mri", files=files)
        print(f"Status: {response.status_code}")
        print(f"Result: {response.json()}")
    except Exception as e:
        print(f"Error: {e}")

def test_history():
    print("\n--- Testing History ---")
    payload = {"user_id": "patient@test.com"}
    try:
        response = requests.get(f"{BASE_URL}/history", params=payload)
        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"History Items: {len(data)}")
        if len(data) > 0:
            print(f"Latest: {data[0]['action_type']}")
    except Exception as e:
         print(f"Error: {e}")

if __name__ == "__main__":
    test_chat()
    test_record_analysis()
    test_mri()
    test_history()
