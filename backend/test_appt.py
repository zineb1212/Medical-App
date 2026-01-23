import requests

BASE_URL = "http://127.0.0.1:5000/api"

def test_appointment():
    # 0. Register (Ensure user exists with known password)
    register_payload = {
        "email": "testdoctor@test.com",
        "password": "password",
        "name": "Test Doctor",
        "role": "doctor"
    }
    print(f"Registering/Logging in as {register_payload['email']}...")
    try:
        requests.post(f"{BASE_URL}/auth/register", json=register_payload)
        # Verify if successful or already exists (ignore error if exists, try login)
    except:
        pass

    # 1. Login
    login_payload = {
        "email": "testdoctor@test.com",
        "password": "password"
    }
    
    print(f"Logging in to {BASE_URL}/auth/login...")
    try:
        resp = requests.post(f"{BASE_URL}/auth/login", json=login_payload)
        if resp.status_code != 200:
            print(f"Login failed: {resp.status_code} - {resp.text}")
            return
    except Exception as e:
        print(f"Connection failed: {e}")
        return

    data = resp.json()
    token = data['token'] # Note: key is 'token' based on auth_routes.py
    print("Login successful. Token obtained.")
    
    # 2. Create Appointment
    appt_payload = {
        "patient_id": "patient1@test.com",
        "date": "2026-02-01",
        "time": "10:00",
        "type": "general",
        "mode": "in-person",
        "notes": "Test note"
    }
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    print(f"Creating appointment at {BASE_URL}/appointments...")
    try:
        resp = requests.post(f"{BASE_URL}/appointments", json=appt_payload, headers=headers)
        print(f"Response Status: {resp.status_code}")
        print(f"Response Body: {resp.text}")
    except Exception as e:
        print(f"Request exception: {e}")

if __name__ == "__main__":
    test_appointment()
