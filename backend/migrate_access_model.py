
from app import app, db
from models.access_model import AccessRequest

def migrate():
    with app.app_context():
        # Create table if not exists
        if not db.inspect(db.engine).has_table("access_request"):
            print("Creating access_request table...")
            AccessRequest.__table__.create(db.engine)
            print("Done!")
        else:
            print("access_request table already exists.")

if __name__ == "__main__":
    migrate()
