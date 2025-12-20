from app import create_app
from extensions import db
from models.ai_history_model import AIHistory

app = create_app()

with app.app_context():
    print("Dropping AIHistory table to apply schema changes...")
    AIHistory.__table__.drop(db.engine)
    print("Creating AIHistory table with new session_id column...")
    AIHistory.__table__.create(db.engine)
    print("Done!")
