from app import app
from extensions import db
from models.access_log_model import AccessLog

def migrate():
    with app.app_context():
        # Create table if not exists
        db.create_all()
        print("Migration successful: access_log table ensured.")

if __name__ == "__main__":
    migrate()
