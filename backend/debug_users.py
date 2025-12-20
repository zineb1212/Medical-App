from app import create_app
from extensions import db
from models.user_model import User

app = create_app()

with app.app_context():
    try:
        users = User.query.all()
        print("Users found:", [u.to_dict() for u in users])
    except Exception as e:
        print("Error:", e)
