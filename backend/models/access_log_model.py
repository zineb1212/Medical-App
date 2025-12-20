from extensions import db
from datetime import datetime
import json

class AccessLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    doctor_id = db.Column(db.String(50), db.ForeignKey('user.id'), nullable=False)
    patient_id = db.Column(db.String(50), db.ForeignKey('user.id'), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    # What was viewed: 'documents', 'medical_info', 'ai_results', or comma separated string
    sections_viewed = db.Column(db.String(255), default="") 
    
    # Optional note added by doctor after consultation
    consultation_note = db.Column(db.Text, nullable=True)
    
    # Optional action logged (e.g., 'message_sent', 'appointment_suggested')
    action_type = db.Column(db.String(50), nullable=True)
    
    # Notification status
    seen = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            "id": self.id,
            "doctor_id": self.doctor_id,
            "patient_id": self.patient_id,
            "timestamp": self.timestamp.isoformat(),
            "sections_viewed": self.sections_viewed,
            "consultation_note": self.consultation_note,
            "action_type": self.action_type
        }
