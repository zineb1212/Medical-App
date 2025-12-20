import requests
import json
import time

BASE_URL = "http://localhost:5000/api"

def register_and_login(role, name, email_prefix):
    email = f"{email_prefix}_{int(time.time())}@test.com"
    password = "password123"
    
    # Register
    requests.post(f"{BASE_URL}/auth/register", json={
        "name": name,
        "email": email,
        "password": password,
        "role": role
    })
    
    # Login
    res = requests.post(f"{BASE_URL}/auth/login", json={
        "email": email,
        "password": password
    })
    if res.status_code == 200:
        return res.json()['token'], res.json()['user']['id']
    return None, None

def test_dashboard():
    print("--- Dashboard API Verification ---")
    
    # 1. Create Patient
    print("\n1. Creating Patient...")
    pat_token, pat_id = register_and_login("patient", "Dash Patient", "dash_pat")
    if not pat_token:
        print("   ❌ Failed to create patient")
        return
    print(f"   ✅ Patient created. ID: {pat_id}")
    
    # 2. Create Doctor
    print("\n2. Creating Doctor...")
    doc_token, doc_id = register_and_login("doctor", "Dash Doctor", "dash_doc")
    if not doc_token:
        print("   ❌ Failed to create doctor")
        return
    print(f"   ✅ Doctor created. ID: {doc_id}")
    
    # 3. Test Patient Stats (Empty)
    print("\n3. Testing Patient Stats (Empty)...")
    res = requests.get(f"{BASE_URL}/dashboard/patient/stats", headers={"Authorization": f"Bearer {pat_token}"})
    if res.status_code == 200:
        data = res.json()
        print(f"   ✅ Stats received: {len(data.get('stats', []))} items")
        print(f"   ✅ History received: {len(data.get('recentHistory', []))} items")
        print(f"   ✅ My Doctors received: {len(data.get('myDoctors', []))} items")
    else:
        print(f"   ❌ Failed to get patient stats: {res.status_code}")
        
    # 4. Test Doctor Stats (Empty)
    print("\n4. Testing Doctor Stats (Empty)...")
    res = requests.get(f"{BASE_URL}/dashboard/doctor/stats", headers={"Authorization": f"Bearer {doc_token}"})
    if res.status_code == 200:
        data = res.json()
        print(f"   ✅ Stats received: {len(data.get('stats', []))} items")
        print(f"   ✅ Activity received: {len(data.get('recentActivity', []))} items")
    else:
        print(f"   ❌ Failed to get doctor stats: {res.status_code}")
        
    # 5. Test All Doctors
    print("\n5. Testing All Doctors List...")
    res = requests.get(f"{BASE_URL}/dashboard/doctors") # Public/Auth? I set it to Auth? No, I reused code without decorator in dashboard_routes!
    # Let me check dashboard_routes again... I did NOT put @jwt_required on get_all_doctors. So it's public.
    if res.status_code == 200:
        docs = res.json()
        print(f"   ✅ Doctors list received: {len(docs)} items")
        found = any(d['id'] == doc_id for d in docs)
        if found:
             print("   ✅ Created doctor found in list.")
        else:
             print("   ❌ Created doctor NOT found in list.")
    else:
        print(f"   ❌ Failed to get doctors list: {res.status_code}")
        
    print("\n--- Verification Completed ---")

if __name__ == "__main__":
    test_dashboard()
