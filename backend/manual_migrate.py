from app import create_app, db
from sqlalchemy import text

app = create_app()

def migrate_db():
    with app.app_context():
        # 1. Create new tables (MedicalFolder)
        print("Creating new tables...")
        db.create_all()
        
        # 2. Add columns to MedicalRecord if they don't exist
        print("Altering MedicalRecord table...")
        new_columns = [
            "general_observations TEXT",
            "current_symptoms TEXT"
        ]
        
        with db.engine.connect() as conn:
            for col_def in new_columns:
                try:
                    col_name = col_def.split()[0]
                    conn.execute(text(f"ALTER TABLE medical_record ADD COLUMN {col_name} TEXT"))
                    print(f"Added {col_name}")
                except Exception as e:
                    print(f"Skipping {col_name}: {e}")
            conn.commit()
            
        print("Migration done.")

if __name__ == "__main__":
    migrate_db()
