from extensions import db
from datetime import datetime
import json


class MedicalRecord(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(50), db.ForeignKey('user.id'), nullable=False, unique=True)
    
    # Personal Info
    date_of_birth = db.Column(db.Date)
    gender = db.Column(db.String(20))
    blood_type = db.Column(db.String(5))
    height = db.Column(db.Float) # in cm
    weight = db.Column(db.Float) # in kg
    
    # Medical History (stored as simple text for now, could be JSON)
    allergies = db.Column(db.Text)
    chronic_conditions = db.Column(db.Text)
    current_medications = db.Column(db.Text)
    family_history = db.Column(db.Text)
    
    # Emergency Contact
    emergency_contact_name = db.Column(db.String(100))
    emergency_contact_phone = db.Column(db.String(20))
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Observations
    general_observations = db.Column(db.Text)
    current_symptoms = db.Column(db.Text)

    documents = db.relationship('MedicalDocument', backref='record', lazy=True, cascade="all, delete-orphan")
    folders = db.relationship('MedicalFolder', backref='record', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'date_of_birth': self.date_of_birth.isoformat() if self.date_of_birth else None,
            'gender': self.gender,
            'blood_type': self.blood_type,
            'height': self.height,
            'weight': self.weight,
            'allergies': self.allergies,
            'chronic_conditions': self.chronic_conditions,
            'current_medications': self.current_medications,
            'family_history': self.family_history,
            'emergency_contact_name': self.emergency_contact_name,
            'emergency_contact_phone': self.emergency_contact_phone,
            'general_observations': self.general_observations,
            'current_symptoms': self.current_symptoms,
            'updated_at': self.updated_at.isoformat(),
            'folders': [folder.to_dict() for folder in self.folders],
            # Documents without folders (root level)
            'root_documents': [doc.to_dict() for doc in self.documents if not doc.folder_id]
        }

class MedicalFolder(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    record_id = db.Column(db.Integer, db.ForeignKey('medical_record.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(255))
    color = db.Column(db.String(50), default='bg-blue-500')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Store shared_with as JSON string: ["Dr. A", "Dr. B"]
    shared_with_json = db.Column(db.Text, default='[]')
    
    documents = db.relationship('MedicalDocument', backref='folder', lazy=True, cascade="all, delete-orphan")

    @property
    def shared_with(self):
        try:
            return json.loads(self.shared_with_json)
        except:
            return []

    @shared_with.setter
    def shared_with(self, value):
        self.shared_with_json = json.dumps(value)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'date': self.created_at.strftime("%d %b %Y"),
            'sharedWith': self.shared_with,
            'color': self.color,
            'files': [doc.to_dict() for doc in self.documents]
        }

class MedicalDocument(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    record_id = db.Column(db.Integer, db.ForeignKey('medical_record.id'), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    file_url = db.Column(db.String(500), nullable=False)
    file_type = db.Column(db.String(50)) # pdf, image, etc
    size = db.Column(db.String(50), default="0 KB")
    folder_id = db.Column(db.Integer, db.ForeignKey('medical_folder.id'), nullable=True)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'file_url': self.file_url,
            'file_type': self.file_type,
            'size': self.size,
            'type': self.file_type, # For frontend compatibility
            'date': self.uploaded_at.strftime("%d %b %Y"),
            'uploaded_at': self.uploaded_at.isoformat()
        }
