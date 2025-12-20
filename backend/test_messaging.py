import requests
import time

BASE_URL = "http://localhost:5000"
DOCTOR_ID = "doctor@test.com"
NEW_PATIENT_ID = "test_patient_flow@test.com"
NEW_PATIENT_PASS = "password"

def test_flow():
    print("1. Registering new patient...")
    res = requests.post(f"{BASE_URL}/auth/register", json={
        "name": "Test Patient",
        "email": NEW_PATIENT_ID,
        "password": NEW_PATIENT_PASS,
        "role": "patient"
    })
    
    if res.status_code not in [201, 400]: # 400 if already exists
        print("Failed to register:", res.text)
        return
    print("Patient registered/exists.")

    print("\n2. Doctor sends message to Patient...")
    res = requests.post(f"{BASE_URL}/api/messages", json={
        "sender_id": DOCTOR_ID,
        "receiver_id": NEW_PATIENT_ID,
        "content": "Hello from Doctor"
    })
    print("Send status:", res.status_code)

    print("\n3. Patient checks messages...")
    res = requests.get(f"{BASE_URL}/api/messages", params={
        "user1_id": NEW_PATIENT_ID,
        "user2_id": DOCTOR_ID
    })
    msgs = res.json()
    print(f"Found {len(msgs)} messages.")
    found_doc_msg = any(m['content'] == "Hello from Doctor" for m in msgs)
    print("Patient sees doctor message:", found_doc_msg)

    print("\n4. Patient sends message to Doctor...")
    res = requests.post(f"{BASE_URL}/api/messages", json={
        "sender_id": NEW_PATIENT_ID,
        "receiver_id": DOCTOR_ID,
        "content": "Hello from Patient"
    })
    print("Send status:", res.status_code)

    print("\n5. Doctor checks messages...")
    res = requests.get(f"{BASE_URL}/api/messages", params={
        "user1_id": DOCTOR_ID,
        "user2_id": NEW_PATIENT_ID
    })
    msgs = res.json()
    print(f"Found {len(msgs)} messages.")
    found_pat_msg = any(m['content'] == "Hello from Patient" for m in msgs)
    print("Doctor sees patient message:", found_pat_msg)

    print("\n6. Check Doctor Notifications...")
    # NOTE: Doctor reads messages immediately in step 5? No, GET doesn't mark query as read unless specified (but MessagesView endpoint does MARK READ? No, mark-read is separate call).
    
    res = requests.get(f"{BASE_URL}/api/notifications/unread-count", params={"user_id": DOCTOR_ID})
    print("Doctor unread count:", res.json())
    
    res = requests.get(f"{BASE_URL}/api/notifications/unread-messages", params={"user_id": DOCTOR_ID})
    unread_msgs = res.json()
    found_notif = any(m['content'] == "Hello from Patient" for m in unread_msgs)
    print("Doctor has notification for patient message:", found_notif)

if __name__ == "__main__":
    test_flow()
