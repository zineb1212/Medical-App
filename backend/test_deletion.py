import requests
import time

BASE_URL = "http://localhost:5000"

def login_user(email, password):
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": email,
        "password": password
    })
    return response.json()

def run_test():
    print("--- Starting Delete Request Verification ---")

    # 1. Setup Users
    doctor_email = "reject_doc@test.com" # Reusing from previous test
    password = "password123"

    print("1. Logging in doctor...")
    doc_data = login_user(doctor_email, password)
    
    if 'token' not in doc_data:
        print("Doctor login failed (maybe run test_rejection.py first to create users?)")
        # Try registering if not exists
        requests.post(f"{BASE_URL}/api/auth/register", json={
            "name": "Reject Doc",
            "email": doctor_email,
            "password": password,
            "role": "doctor"
        })
        doc_data = login_user(doctor_email, password)
    
    doc_token = doc_data['token']
    doc_id = doc_data['user']['id']

    # 2. Find the rejected request from previous test
    print("\n2. Finding rejected request...")
    headers_doc = {"Authorization": f"Bearer {doc_token}"}
    reqs = requests.get(f"{BASE_URL}/api/access/requests", headers=headers_doc).json()
    
    # Looking for a rejected or revoked request
    target_request = next((r for r in reqs if r['status'] in ['rejected', 'revoked']), None)
    
    if not target_request:
        print("   ❌ No rejected/revoked request found to delete.")
        return
        
    request_id = target_request['id']
    print(f"   Found Request ID: {request_id} (Status: {target_request['status']})")

    # 3. Delete Request
    print("\n3. Deleting request...")
    del_resp = requests.delete(f"{BASE_URL}/api/access/request/{request_id}", headers=headers_doc)
    
    print(f"   Delete Status: {del_resp.status_code}")
    print(f"   Response: {del_resp.json()}")
    
    if del_resp.status_code == 200:
        print("   ✅ Request deleted successfully.")
    else:
        print(f"   ❌ Failed to delete: {del_resp.text}")
        return

    # 4. Verify it's gone
    print("\n4. Verifying verify it's gone...")
    reqs_after = requests.get(f"{BASE_URL}/api/access/requests", headers=headers_doc).json()
    found = next((r for r in reqs_after if r['id'] == request_id), None)
    
    if not found:
        print("   ✅ Request confirmed deleted from list.")
    else:
        print("   ❌ Request STILL PRESENT in list.")

if __name__ == "__main__":
    run_test()
