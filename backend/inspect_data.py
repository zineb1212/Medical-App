from app import create_app
from extensions import db
from models.medical_model import MedicalRecord, MedicalFolder
from models.user_model import User

app = create_app()

def inspect_db():
    with app.app_context():
        print("--- Users ---")
        users = User.query.all()
        for u in users:
            print(f"ID: {u.id}, Name: {u.name}")
            
        print("\n--- Medical Records ---")
        records = MedicalRecord.query.all()
        for r in records:
            print(f"Record ID: {r.id}, User ID: {r.user_id}")
            
        print("\n--- Medical Folders ---")
        folders = MedicalFolder.query.all()
        for f in folders:
            print(f"Folder ID: {f.id}, Name: {f.name}, Record ID: {f.record_id}")

if __name__ == "__main__":
    inspect_db()
