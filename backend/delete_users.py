from app import create_app
from extensions import db
from models.user_model import User
from models.chat_model import Message

app = create_app()

EMAILS_TO_DELETE = [
    "patient@test.com",          # Marie Dupont
    "test_patient_flow@test.com" # Test Patient
]

with app.app_context():
    print("--- STARTING CLEANUP ---")
    
    for email in EMAILS_TO_DELETE:
        user = User.query.get(email)
        if user:
            print(f"Found user: {user.name} ({user.id})")
            
            # Delete associated messages first (though cascade might handle it, safer to be explicit or let alchemy handle it if configured)
            # Assuming checking generic foreign key constraints, usually cascade delete is set on DB level or ORM level.
            # Let's try deleting user.
            
            # Deleting messages involving this user to be clean
            Message.query.filter((Message.sender_id == email) | (Message.receiver_id == email)).delete()
            print(f" - Deleted messages for {email}")
            
            db.session.delete(user)
            print(f" - Deleted user {email}")
        else:
            print(f"User {email} not found.")
            
    db.session.commit()
    print("--- CLEANUP COMPLETE ---")
    
    print("\nRemaining Users:")
    users = User.query.all()
    for u in users:
        print(f" - {u.name} ({u.id})")
