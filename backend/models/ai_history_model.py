from extensions import db
from datetime import datetime

class AIHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(50), db.ForeignKey('user.id'), nullable=False)
    session_id = db.Column(db.String(50), nullable=True) # Grouping sessions
    action_type = db.Column(db.String(20), nullable=False) # 'chat', 'mri', 'record'
    input_data = db.Column(db.Text) # Query text or image path
    output_data = db.Column(db.Text) # JSON result as string
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'session_id': self.session_id,
            'action_type': self.action_type,
            'input_data': self.input_data,
            'output_data': self.output_data,
            'timestamp': self.timestamp.isoformat()
        }
