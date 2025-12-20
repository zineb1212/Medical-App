from app import create_app
from extensions import db
from models.user_model import User

app = create_app()

with app.app_context():
    print("Seeding database...")
    
    # Create tables if they don't exist (though migration should handle this generally)
    db.create_all()
    
    # Check if users exist
    if not User.query.filter_by(id="doctor@test.com").first():
        doctor = User(
            id="doctor@test.com",
            name="Dr. Martin",
            role="doctor",
            avatar_url="/male-doctor-portrait.png"
        )
        doctor.set_password("doctor123")
        db.session.add(doctor)
        print("Added Dr. Martin")

    if not User.query.filter_by(id="patient@test.com").first():
        patient = User(
            id="patient@test.com",
            name="Marie Dupont",
            role="patient",
            avatar_url="/thoughtful-patient.png"
        )
        patient.set_password("123456")
        db.session.add(patient)
        print("Added Marie Dupont")
    
    db.session.commit()
    print("Database seeded successfully!")
