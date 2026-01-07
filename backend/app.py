from flask import Flask
from flask_cors import CORS
from config import Config
from extensions import db, migrate, jwt

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Initialize plugins
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    CORS(app) # Enable CORS for all routes
    
    # Register Blueprints
    from routes.chat_routes import chat_bp
    from routes.auth_routes import auth_bp
    from routes.medical_routes import medical_bp
    from routes.ai_routes import ai_bp
    from routes.blockchain_routes import blockchain_bp
    from routes.appointment_routes import appointment_bp
    app.register_blueprint(chat_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(medical_bp)
    app.register_blueprint(ai_bp)
    app.register_blueprint(blockchain_bp)
    app.register_blueprint(appointment_bp)
    
    from routes.access_routes import access_bp
    app.register_blueprint(access_bp)

    from routes.dashboard_routes import dashboard_bp
    app.register_blueprint(dashboard_bp)
    
    return app

app = create_app()

if __name__ == '__main__':
    # Import all models here to ensure they are known to SQLAlchemy before create_all
    from models.user_model import User
    from models.chat_model import Message
    from models.medical_model import MedicalFolder, MedicalDocument, MedicalRecord
    from models.access_model import AccessRequest
    from models.access_log_model import AccessLog
    from models.ai_history_model import AIHistory
    from models.appointment_model import Appointment

    with app.app_context():
        try:
            # ... existing tables ...
            db.create_all()
            print("Database initialized successfully!")
        except Exception as e:
            print("\n" + "="*50)
            print("CRITICAL ERROR: DATABASE CONNECTION FAILED")
            print("="*50)
            print(f"Details: {e}")
            print("="*50)
            print("Please ensure your PostgreSQL server is running.")
            print("You can verify this by checking standard Windows Services or running 'pg_ctl status'.")
            print("="*50 + "\n")
            # Do not exit, allow app to run (but DB features will fail)
        
    app.run(host='0.0.0.0', debug=True, port=5000)
