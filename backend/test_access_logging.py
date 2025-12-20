import requests
import json
import time

BASE_URL = "http://localhost:5000/api"

# Helpers
def register(role, name, email, password):
    url = f"{BASE_URL}/auth/register"
    data = {"name": name, "email": email, "password": password, "role": role}
    resp = requests.post(url, json=data)
    # 201 created or 409 already exists (then try login)
    return resp.status_code

def login(email, password):
    res = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password})
    if res.status_code == 200:
        return res.json().get('token'), res.json().get('user').get('id')
    print(f"Login failed for {email}: {res.text}")
    return None, None

def test_logging():
    print("--- Access Logging Verification ---")
    
    pat_email = f"log_pat_{int(time.time())}@test.com"
    doc_email = f"log_doc_{int(time.time())}@test.com"
    pwd = "password123"
    
    register("patient", "Log Patient", pat_email, pwd)
    register("doctor", "Log Doctor", doc_email, pwd)
    
    # 1. Login as Doctor
    doc_token, doc_id = login(doc_email, pwd)
    if not doc_token:
        print("❌ Doctor login failed")
        return

    # 2. Login as Patient
    pat_token, pat_id = login(pat_email, pwd)
    if not pat_token:
        print("❌ Patient login failed")
        return
        
    print(f"Doctor ID: {doc_id}, Patient ID: {pat_id}")

    # 3. Simulate Doctor Viewing Record (Log Access)
    print("\n1. Logging access by doctor...")
    res = requests.post(
        f"{BASE_URL}/access/log-access",
        headers={"Authorization": f"Bearer {doc_token}"},
        json={"patient_id": pat_id, "sections_viewed": "Dossier Complet"}
    )
    if res.status_code == 201:
        log_id = res.json().get('id')
        print(f"   ✅ Log created. ID: {log_id}")
    else:
        print(f"   ❌ Log creation failed: {res.text}")
        return

    # 4. Doctor adds a note (Optional)
    print("\n2. adding a consultation note...")
    res = requests.post(
        f"{BASE_URL}/access/consultation-note",
        headers={"Authorization": f"Bearer {doc_token}"},
        json={"log_id": log_id, "note": "Patient semble en forme. Revoir dans 6 mois.", "action": "None"}
    )
    if res.status_code == 200:
        print("   ✅ Note added successfully.")
    else:
        print(f"   ❌ Note addition failed: {res.text}")

    # 5. Patient Views History
    print("\n3. Patient retrieving access history...")
    res = requests.get(
        f"{BASE_URL}/access/history/{pat_id}",
        headers={"Authorization": f"Bearer {pat_token}"}
    )
    if res.status_code == 200:
        logs = res.json()
        print(f"   ✅ History retrieved. Count: {len(logs)}")
    else:
        print(f"   ❌ History retrieval failed: {res.text}")

    # 6. Doctor Views History (New Check)
    print("\n4. Doctor retrieving access history...")
    res = requests.get(
        f"{BASE_URL}/access/history/{pat_id}",
        headers={"Authorization": f"Bearer {doc_token}"}
    )
    if res.status_code == 200:
        print("   ✅ Doctor can access history.")
    else:
        print(f"   ❌ Doctor denied access to history: {res.text}")

    # 7. Doctor Sends Message (New Check)
    print("\n5. Doctor sending message...")
    msg_data = {
        "sender_id": doc_id,
        "receiver_id": pat_id,
        "content": "Test message post-consultation"
    }
    res = requests.post(f"{BASE_URL}/messages", json=msg_data)
    if res.status_code == 201:
        print("   ✅ Message sent successfully.")
    else:
         print(f"   ❌ Message sending failed: {res.status_code} - {res.text}")
    
        
    # 8. Check Patient Notifications (New Check)
    print("\n6. Checking Patient Notifications...")
    res = requests.get(f"{BASE_URL}/notifications/unread-messages?user_id={pat_id}")
    if res.status_code == 200:
        notifs = res.json()
        print(f"   ✅ Notifications retrieved. Count: {len(notifs)}")
        
        # Look for consultation notification
        consult_notif = next((n for n in notifs if n['type'] == 'consultation'), None)
        if consult_notif:
             print(f"   ✅ Found consultation notification: {consult_notif['content']}")
             # Mark as seen
             print("   Marking log as seen...")
             res_seen = requests.post(
                 f"{BASE_URL}/access/log-seen",
                 json={"log_id": consult_notif['id']},
                 headers={"Authorization": f"Bearer {pat_token}"}
             )
             if res_seen.status_code == 200:
                 print("   ✅ Log marked as seen.")
             else:
                 print(f"   ❌ Failed to mark seen: {res_seen.text}")
        else:
             print("   ❌ No consultation notification found.")
    else:
        print(f"   ❌ Failed to get notifications: {res.text}")

    print("\n--- Verification Completed ---")

if __name__ == "__main__":
    test_logging()
