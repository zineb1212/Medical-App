from app import create_app
from extensions import db
from models.user_model import User
from models.chat_model import Message

app = create_app()

with app.app_context():
    print("--- USERS ---")
    users = User.query.all()
    for u in users:
        print(f"ID: {u.id}, Role: {u.role}, Name: {u.name}")

    print("\n--- MESSAGES ---")
    messages = Message.query.order_by(Message.timestamp).all()
    for m in messages:
        print(f"From: {m.sender_id} -> To: {m.receiver_id} | Read: {m.is_read} | Content: {m.content}")
