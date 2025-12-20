from extensions import db
from datetime import datetime
import json

class AccessRequest(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.String(50), db.ForeignKey('user.id'), nullable=False)
    doctor_id = db.Column(db.String(50), db.ForeignKey('user.id'), nullable=False)
    
    # Status: 'pending', 'approved', 'rejected', 'revoked'
    status = db.Column(db.String(20), default='pending', nullable=False)
    
    request_message = db.Column(db.Text)
    
    # Store access_type as JSON string: ["medical_record", "ai_results"]
    access_type_json = db.Column(db.Text, default='["medical_record", "ai_results"]')
    
    duration = db.Column(db.String(50), default='permanent') # '24h', '7d', 'permanent'
    
    seen = db.Column(db.Boolean, default=False) # For notifications
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    granted_at = db.Column(db.DateTime, nullable=True)
    revoked_at = db.Column(db.DateTime, nullable=True)

    @property
    def access_type(self):
        try:
            return json.loads(self.access_type_json)
        except:
            return []

    @access_type.setter
    def access_type(self, value):
        self.access_type_json = json.dumps(value)

    def to_dict(self):
        return {
            'id': self.id,
            'patient_id': self.patient_id,
            'doctor_id': self.doctor_id,
            'status': self.status,
            'request_message': self.request_message,
            'access_type': self.access_type,
            'duration': self.duration,
            'created_at': self.created_at.isoformat(),
            'granted_at': self.granted_at.isoformat() if self.granted_at else None,
            'revoked_at': self.revoked_at.isoformat() if self.revoked_at else None
        }
