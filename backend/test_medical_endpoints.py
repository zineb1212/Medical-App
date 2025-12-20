import requests
import json

BASE_URL = "http://localhost:5000/api"

def test_medical_api():
    print("Testing Medical API...")
    
    # 1. Create/Get Medical Record
    user_id = "test_user_123"
    print(f"\n1. Getting/Creating record for {user_id}...")
    try:
        response = requests.get(f"{BASE_URL}/medical-record?user_id={user_id}")
        if response.status_code == 200:
            print("   Success: Record retrieved")
            record = response.json()
            print(f"   Record ID: {record.get('id')}")
        else:
            print(f"   Failed: {response.status_code} - {response.text}")
            return
    except Exception as e:
        print(f"   Failed to connect: {e}")
        return

    # 2. Update Observations
    print("\n2. Updating observations...")
    update_data = {
        "user_id": user_id,
        "general_observations": "Patient is healthy",
        "current_symptoms": "None",
        "height": 175,
        "weight": 70
    }
    response = requests.put(f"{BASE_URL}/medical-record", json=update_data)
    if response.status_code == 200:
        print("   Success: Record updated")
        data = response.json()
        if data.get('general_observations') == "Patient is healthy":
             print("   Verification: Data matches")
        else:
             print("   Verification: Data MISMATCH")
    else:
        print(f"   Failed: {response.status_code} - {response.text}")

    # 3. Create Folder
    print("\n3. Creating Folder...")
    folder_data = {
        "user_id": user_id,
        "name": "Test Folder",
        "description": "Created by test script"
    }
    folder_id = None
    response = requests.post(f"{BASE_URL}/medical-record/folders", json=folder_data)
    if response.status_code == 201:
        print("   Success: Folder created")
        folder = response.json()
        folder_id = folder.get('id')
        print(f"   Folder ID: {folder_id}")
    else:
        print(f"   Failed: {response.status_code} - {response.text}")

    # 4. Verify Folder in Record
    print("\n4. Verifying Folder in Record...")
    response = requests.get(f"{BASE_URL}/medical-record?user_id={user_id}")
    if response.status_code == 200:
        record = response.json()
        folders = record.get('folders', [])
        found = any(f['id'] == folder_id for f in folders)
        if found:
            print("   Success: Folder found in record")
        else:
            print("   Failed: Folder NOT found in record")
    
    # 5. Delete Folder
    if folder_id:
        print(f"\n5. Deleting Folder {folder_id}...")
        response = requests.delete(f"{BASE_URL}/medical-record/folders/{folder_id}")
        if response.status_code == 200:
            print("   Success: Folder deleted")
        else:
            print(f"   Failed: {response.status_code} - {response.text}")

if __name__ == "__main__":
    test_medical_api()
