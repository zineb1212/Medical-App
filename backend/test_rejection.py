import requests
import time

BASE_URL = "http://localhost:5000"

def register_user(name, email, password, role):
    requests.post(f"{BASE_URL}/api/auth/register", json={
        "name": name,
        "email": email,
        "password": password,
        "role": role
    })

def login_user(email, password):
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": email,
        "password": password
    })
    return response.json()

def run_test():
    print("--- Starting Rejection Notification Verification ---")

    # 1. Setup Users
    doctor_email = "reject_doc@test.com"
    patient_email = "reject_pat@test.com"
    password = "password123"

    print("1. Registering/Logging in users...")
    register_user("Reject Doc", doctor_email, password, "doctor")
    register_user("Reject Patient", patient_email, password, "patient")

    doc_data = login_user(doctor_email, password)
    pat_data = login_user(patient_email, password)
    
    doc_token = doc_data['token']
    pat_token = pat_data['token']
    doc_id = doc_data['user']['id']
    pat_id = pat_data['user']['id']

    # 2. Doctor requests access
    print("\n2. Doctor requesting access...")
    headers_doc = {"Authorization": f"Bearer {doc_token}"}
    req_resp = requests.post(f"{BASE_URL}/api/access/request", json={
        "patient_id": pat_id,
        "request_message": "Can I please access?"
    }, headers=headers_doc)
    
    request_data = req_resp.json()
    if 'message' in request_data:
        # pending probably
        print("   Request exists/pending")
        # Need to find the request ID if it was already pending from previous run
        # but since emails are unique for this test script, it should be new or we handle it.
        # Let's just fetch patient requests to find it.
    else:
        print("   Access requested.")
        
    # 3. Patient Finds Request
    print("\n3. Patient finding request...")
    headers_pat = {"Authorization": f"Bearer {pat_token}"}
    pat_reqs = requests.get(f"{BASE_URL}/api/access/requests", headers=headers_pat).json()
    
    # Sort descending created_at usually, but let's find the one from this doc
    target_request = next((r for r in pat_reqs if r['doctor_id'] == doc_id and r['status'] == 'pending'), None)
    
    if not target_request:
        print("   ❌ No pending request found for patient.")
        return
        
    print(f"   Found Request ID: {target_request['id']}")

    # 4. Patient Rejects (Revokes pending)
    print("\n4. Patient Rejecting (Revoking pending)...")
    # In the UI, the 'Refuser' button calls revokeAccess endpoint
    revoke_resp = requests.post(f"{BASE_URL}/api/access/revoke", json={
        "request_id": target_request['id']
    }, headers=headers_pat)
    
    print(f"   Revoke/Reject Status: {revoke_resp.status_code}")
    print(f"   Response: {revoke_resp.json()}")
    
    if revoke_resp.json().get('status') == 'rejected':
        print("   ✅ Status successfully updated to 'rejected'.")
    else:
        print(f"   ❌ Status is '{revoke_resp.json().get('status')}', expected 'rejected'.")

    # 5. Check Doctor Notifications
    print("\n5. Checking Doctor Notifications (Expected 'Refusé')...")
    # Wait a moment just in case
    
    msgs_resp = requests.get(f"{BASE_URL}/api/notifications/unread-messages?user_id={doc_id}")
    notifications = msgs_resp.json()
    
    rejected_notif = next((n for n in notifications if n['type'] == 'access' and n['status'] == 'rejected'), None)
    
    if rejected_notif:
        print(f"   ✅ Found Notification: {rejected_notif['content']}")
    else:
        print("   ❌ Rejection Notification NOT found for Doctor.")
        print(f"   Found notifications: {notifications}")

if __name__ == "__main__":
    run_test()
