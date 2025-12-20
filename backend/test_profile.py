import requests
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
        return res.json()['token'], email
    return None, None

def test_profile():
    print("--- Profile Update Verification ---")
    
    # 1. Create User
    print("\n1. Creating User...")
    token, email = register_and_login("patient", "Old Name", "profile_test")
    if not token:
        print("   ❌ Failed to create user")
        return
    print(f"   ✅ User created: {email}, Name: Old Name")
    
    # 2. Update Profile
    print("\n2. Updating Profile (Name & Avatar)...")
    base64_avatar = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
    new_name = "New Updated Name"
    new_avatar = "/uploads/avatar_updated.png" # Simulating URL
    
    res = requests.put(f"{BASE_URL}/auth/profile", 
        json={"name": new_name, "avatar_url": new_avatar},
        headers={"Authorization": f"Bearer {token}"}
    )
    
    if res.status_code == 200:
        data = res.json()
        saved_name = data['user']['name']
        saved_avatar = data['user']['avatar_url']
        if saved_name == new_name and saved_avatar == new_avatar:
            print(f"   ✅ Update successful. Name: {saved_name}")
        else:
            print(f"   ❌ Update returned 200 but data mismatch. Name: {saved_name}")
    else:
        print(f"   ❌ Failed to update profile: {res.status_code}")
        print(res.text)
        return

    # 3. Verify Persistence (Login again)
    print("\n3. Verifying Persistence via Login...")
    res = requests.post(f"{BASE_URL}/auth/login", json={
        "email": email,
        "password": "password123"
    })
    if res.status_code == 200:
        user_data = res.json()['user']
        if user_data['name'] == new_name and user_data['avatar_url'] == new_avatar:
             print("   ✅ Persistence confirmed via login.")
        else:
             print(f"   ❌ Persistence failed. Encoded: {user_data['name']}")
    
    print("\n--- Verification Completed ---")

if __name__ == "__main__":
    test_profile()
