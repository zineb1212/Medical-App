from app import app
from extensions import db
from sqlalchemy import text

def migrate():
    with app.app_context():
        # Check if column exists
        inspector = db.inspect(db.engine)
        columns = [col['name'] for col in inspector.get_columns('access_log')]
        
        if 'seen' not in columns:
            print("Adding 'seen' column to access_log table...")
            with db.engine.connect() as conn:
                conn.execute(text("ALTER TABLE access_log ADD COLUMN seen BOOLEAN DEFAULT FALSE"))
                conn.commit()
            print("Migration successful.")
        else:
            print("'seen' column already exists.")

if __name__ == "__main__":
    migrate()
