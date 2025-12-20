import requests
import json

BASE_URL = "http://localhost:5000"

def register_user(name, email, password, role):
    response = requests.post(f"{BASE_URL}/api/auth/register", json={
        "name": name,
        "email": email,
        "password": password,
        "role": role
    })
    return response.json()

def login_user(email, password):
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": email,
        "password": password
    })
    return response.json()

def run_test():
    print("--- Starting Notification System Verification ---")

    # 1. Setup Users
    doctor_email = "notif_doc@test.com"
    patient_email = "notif_pat@test.com"
    password = "password123"

    print("1. Registering/Logging in users...")
    register_user("Notif Doc", doctor_email, password, "doctor")
    register_user("Notif Patient", patient_email, password, "patient")

    doc_data = login_user(doctor_email, password)
    pat_data = login_user(patient_email, password)
    
    doc_token = doc_data['token']
    pat_token = pat_data['token']
    doc_id = doc_data['user']['id']
    pat_id = pat_data['user']['id']

    print(f"   Doctor ID: {doc_id}")
    print(f"   Patient ID: {pat_id}")

    # 2. Doctor requests access
    print("\n2. Doctor requesting access...")
    headers_doc = {"Authorization": f"Bearer {doc_token}"}
    req_resp = requests.post(f"{BASE_URL}/api/access/request", json={
        "patient_id": pat_id,
        "request_message": "Need access for test"
    }, headers=headers_doc)
    
    if req_resp.status_code == 201:
        print("   Access requested.")
    elif req_resp.status_code == 200:
        print("   Access request already pending.")
    else:
        print(f"   Failed to request access: {req_resp.text}")
        return

    # 3. Check Patient Notifications
    print("\n3. Checking Patient Notifications (Unread Count & Messages)...")
    count_resp = requests.get(f"{BASE_URL}/api/notifications/unread-count?user_id={pat_id}")
    print(f"   Unread Count: {count_resp.json()}")
    
    msgs_resp = requests.get(f"{BASE_URL}/api/notifications/unread-messages?user_id={pat_id}")
    notifications = msgs_resp.json()
    print(f"   Notifications: {len(notifications)}")
    
    access_notif = next((n for n in notifications if n['type'] == 'access'), None)
    if access_notif:
        print("   ✅ Found Access Notification for Patient.")
        request_id = access_notif['id']
    else:
        print("   ❌ Access Notification NOT found for Patient.")
        return

    # 4. Patient Grants Access
    print("\n4. Patient Granting Access...")
    headers_pat = {"Authorization": f"Bearer {pat_token}"}
    grant_resp = requests.post(f"{BASE_URL}/api/access/grant", json={
        "request_id": request_id
    }, headers=headers_pat)
    
    if grant_resp.status_code == 200:
        print("   Access granted.")
    else:
        print(f"   Failed to grant access: {grant_resp.text}")
        return

    # 5. Check Doctor Notifications (Access Approved)
    print("\n5. Checking Doctor Notifications...")
    count_resp = requests.get(f"{BASE_URL}/api/notifications/unread-count?user_id={doc_id}")
    print(f"   Unread Count: {count_resp.json()}")

    msgs_resp = requests.get(f"{BASE_URL}/api/notifications/unread-messages?user_id={doc_id}")
    notifications = msgs_resp.json()
    
    approved_notif = next((n for n in notifications if n['type'] == 'access' and n['status'] == 'approved'), None)
    if approved_notif:
        print("   ✅ Found Approved Notification for Doctor.")
    else:
        print("   ❌ Approved Notification NOT found for Doctor.")
        return

    # 6. Doctor Marks as Seen
    print("\n6. Doctor Mark Seen...")
    seen_resp = requests.post(f"{BASE_URL}/api/access/mark-seen", json={
        "request_id": request_id
    }, headers=headers_doc)
    
    if seen_resp.status_code == 200:
        print("   Marked as seen.")
    else:
        print(f"   Failed to mark seen: {seen_resp.text}")

    # 7. Verify Doctor Unread Count is 0 (or decreased)
    print("\n7. Verifying Doctor Count Decreased...")
    count_resp = requests.get(f"{BASE_URL}/api/notifications/unread-count?user_id={doc_id}")
    final_count = count_resp.json()['count']
    print(f"   Final Unread Count: {final_count}")
    
    if final_count == 0: # Assuming no other messages
        print("   ✅ Count is 0. Verification Successful!")
    else:
        print(f"   ⚠️ Count is {final_count}. Check if other messages exist.")

if __name__ == "__main__":
    run_test()
