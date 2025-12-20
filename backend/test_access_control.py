
import requests
import json
import time

BASE_URL = "http://localhost:5000/api"

# Helpers
def register(role, name, email, password):
    url = f"{BASE_URL}/auth/register"
    data = {
        "name": name,
        "email": email,
        "password": password,
        "role": role
    }
    resp = requests.post(url, json=data)
    if resp.status_code != 201:
        print(f"Register Failed: {resp.status_code} - {resp.text}")

def login(email, password):
    url = f"{BASE_URL}/auth/login"
    data = {"email": email, "password": password}
    response = requests.post(url, json=data)
    if response.status_code == 200:
        return response.json().get('token')
    print(f"Login Failed: {response.status_code} - {response.text}")
    return None

def test_access_control():
    print("=== Testing Access Control ===")
    
    # 1. Setup Users
    patient_email = f"patient_{int(time.time())}@test.com"
    doctor_email = f"doctor_{int(time.time())}@test.com"
    password = "password123"
    
    print(f"Creating Patient: {patient_email}")
    register("patient", "Test Patient", patient_email, password)
    
    print(f"Creating Doctor: {doctor_email}")
    register("doctor", "Test Doctor", doctor_email, password)
    
    patient_token = login(patient_email, password)
    doctor_token = login(doctor_email, password)
    
    if not patient_token or not doctor_token:
        print("Failed to login users")
        return

    # 2. Patient creates a record (implicitly via GET)
    print("\n[Patient] Initializing Record...")
    headers_pat = {"Authorization": f"Bearer {patient_token}"}
    resp = requests.get(f"{BASE_URL}/medical-record?user_id={patient_email}", headers=headers_pat)
    if resp.status_code == 200:
        print("   Success: Patient accessed own record")
    else:
        print(f"   Failed: {resp.status_code} - {resp.text}")

    # 3. Doctor tries to access record (Should Fail)
    print("\n[Doctor] Trying to access record WITHOUT permission...")
    headers_doc = {"Authorization": f"Bearer {doctor_token}"}
    resp = requests.get(f"{BASE_URL}/medical-record?user_id={patient_email}", headers=headers_doc)
    if resp.status_code == 403:
        print("   Success: Access Denied (Expected)")
    else:
        print(f"   Failed: Expected 403, got {resp.status_code}")

    # 4. Doctor requests access
    print("\n[Doctor] Requesting Access...")
    req_data = {
        "patient_id": patient_email,
        "request_message": "Need access for checkup",
        "duration": "permanent"
    }
    resp = requests.post(f"{BASE_URL}/access/request", json=req_data, headers=headers_doc)
    if resp.status_code == 201:
        req_id = resp.json()['id']
        print(f"   Success: Request sent (ID: {req_id})")
    else:
        print(f"   Failed: {resp.status_code} - {resp.text}")
        return

    # 5. Patient checks requests
    print("\n[Patient] Checking requests...")
    resp = requests.get(f"{BASE_URL}/access/requests", headers=headers_pat)
    requests_list = resp.json()
    if len(requests_list) > 0 and requests_list[0]['id'] == req_id:
        print("   Success: Request found")
    else:
        print("   Failed: Request not found")

    # 6. Patient grants access
    print("\n[Patient] Granting Access...")
    grant_data = {"request_id": req_id}
    resp = requests.post(f"{BASE_URL}/access/grant", json=grant_data, headers=headers_pat)
    if resp.status_code == 200:
        print("   Success: Access Granted")
    else:
         print(f"   Failed: {resp.status_code} - {resp.text}")

    # 7. Doctor tries to access record (Should Succeed)
    print("\n[Doctor] Trying to access record WITH permission...")
    resp = requests.get(f"{BASE_URL}/medical-record?user_id={patient_email}", headers=headers_doc)
    if resp.status_code == 200:
        print("   Success: Access Allowed")
    else:
        print(f"   Failed: {resp.status_code} - {resp.text}")

    # 8. Doctor tries to UPDATE record (Should Fail - Read Only)
    print("\n[Doctor] Trying to UPDATE record (Should Fail)...")
    update_data = {"user_id": patient_email, "general_observations": "Hacked"}
    resp = requests.put(f"{BASE_URL}/medical-record", json=update_data, headers=headers_doc)
    if resp.status_code == 403:
        print("   Success: Update Denied (Read Only Enforcement)")
    else:
         print(f"   Failed: Expected 403, got {resp.status_code}")

    # 9. Patient revokes access
    print("\n[Patient] Revoking Access...")
    revoke_data = {"request_id": req_id}
    resp = requests.post(f"{BASE_URL}/access/revoke", json=revoke_data, headers=headers_pat)
    if resp.status_code == 200:
        print("   Success: Access Revoked")

    # 10. Doctor tries to access record (Should Fail)
    print("\n[Doctor] Trying to access record AFTER revocation...")
    resp = requests.get(f"{BASE_URL}/medical-record?user_id={patient_email}", headers=headers_doc)
    if resp.status_code == 403:
        print("   Success: Access Denied (Expected)")
    else:
        print(f"   Failed: Expected 403, got {resp.status_code}")

if __name__ == "__main__":
    test_access_control()
