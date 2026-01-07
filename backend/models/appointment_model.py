from extensions import db
from datetime import datetime

class Appointment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    doctor_id = db.Column(db.String(50), db.ForeignKey('user.id'), nullable=False)
    patient_id = db.Column(db.String(50), db.ForeignKey('user.id'), nullable=False)
    
    date = db.Column(db.Date, nullable=False)
    time = db.Column(db.Time, nullable=False)
    
    # Status: 'pending', 'confirmed', 'cancelled', 'completed'
    status = db.Column(db.String(20), default='pending', nullable=False)
    
    # Type: 'general', 'followup', 'emergency', 'consultation'
    type = db.Column(db.String(50), default='general')
    
    # Mode: 'in-person', 'video'
    mode = db.Column(db.String(20), default='in-person')
    
    notes = db.Column(db.Text, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships for easy access
    doctor = db.relationship('User', foreign_keys=[doctor_id], backref='doctor_appointments')
    patient = db.relationship('User', foreign_keys=[patient_id], backref='patient_appointments')

    def to_dict(self):
        return {
            'id': self.id,
            'doctor_id': self.doctor_id,
            'patient_id': self.patient_id,
            'patient_name': self.patient.name if self.patient else "Unknown",
            'patient_avatar': self.patient.avatar_url if self.patient else None,
            'doctor_name': self.doctor.name if self.doctor else "Unknown",
            'date': self.date.isoformat(),
            'time': self.time.strftime('%H:%M'),
            'status': self.status,
            'type': self.type,
            'mode': self.mode,
            'notes': self.notes,
            'created_at': self.created_at.isoformat()
        }
