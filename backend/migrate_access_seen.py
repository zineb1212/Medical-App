from app import app
from extensions import db
from sqlalchemy import text, inspect

def migrate():
    with app.app_context():
        inspector = inspect(db.engine)
        columns = [col['name'] for col in inspector.get_columns('access_request')]
        
        if 'seen' not in columns:
            print("Adding 'seen' column to access_request table (PostgreSQL)...")
            with db.engine.connect() as conn:
                conn.execute(text("ALTER TABLE access_request ADD COLUMN seen BOOLEAN DEFAULT FALSE"))
                conn.commit()
            print("Migration successful: 'seen' column added.")
        else:
            print("'seen' column already exists.")

if __name__ == "__main__":
    migrate()
