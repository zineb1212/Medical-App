from app import create_app
from extensions import db
from models.user_model import User

app = create_app()

with app.app_context():
    # Delete existing users so we can re-create them with hashed passwords
    try:
        db.session.query(User).delete()
        db.session.commit()
        print("Cleared users table.")
    except Exception as e:
        print("Error clearing table:", e)
        db.session.rollback()

    # Re-run seed logic manually here or just rely on seed.py later
    # Let's just do it here
    doctor = User(
        id="doctor@test.com",
        name="Dr. Martin",
        role="doctor",
        avatar_url="/male-doctor-portrait.png"
    )
    doctor.set_password("doctor123")
    db.session.add(doctor)

    patient = User(
        id="patient@test.com",
        name="Marie Dupont",
        role="patient",
        avatar_url="/thoughtful-patient.png"
    )
    patient.set_password("123456")
    db.session.add(patient)
    
    db.session.commit()
    print("Database re-seeded with passwords!")
