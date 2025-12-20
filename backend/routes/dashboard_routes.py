from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.user_model import User
from models.access_model import AccessRequest
from models.access_log_model import AccessLog
from models.chat_model import Message
from models.medical_model import MedicalRecord, MedicalFolder
from extensions import db
from datetime import datetime, date

dashboard_bp = Blueprint('dashboard_bp', __name__)

@dashboard_bp.route('/api/dashboard/patient/stats', methods=['GET'])
@jwt_required()
def get_patient_stats():
    current_user_id = get_jwt_identity()

    # 1. Appointments (Mock for now, or use AccessRequest with 'appointment' type if we had one?)
    # We don't have appointment model. We'll return 0 or mock. 
    # Let's count Pending Access Requests as "Pending Appointments" proxy maybe? No that's confusing.
    # We will just return 0 for now until Appointment model exists.
    appointments_count = 0 
    
    # 2. My Doctors (Approved Access Requests)
    my_doctors_count = AccessRequest.query.filter_by(patient_id=current_user_id, status='approved').count()
    
    # 3. Dossiers (Folders)
    record = MedicalRecord.query.filter_by(user_id=current_user_id).first()
    folders_count = len(record.folders) if record else 0
    
    # 4. Recent History (Access Logs)
    logs = AccessLog.query.filter_by(patient_id=current_user_id).order_by(AccessLog.timestamp.desc()).limit(5).all()
    recent_history = []
    for log in logs:
        doc = User.query.get(log.doctor_id)
        doc_name = doc.name if doc else log.doctor_id
        recent_history.append({
            'id': log.id,
            'type': log.action_type if log.action_type else 'Consultation',
            'doctor': f"Dr. {doc_name}",
            'date': log.timestamp.strftime("%d %b %Y"),
            'status': 'Terminé'
        })

    # 5. My Doctors List
    requests = AccessRequest.query.filter_by(patient_id=current_user_id, status='approved').all()
    my_doctors_list = []
    for req in requests:
         doc = User.query.get(req.doctor_id)
         if doc:
             my_doctors_list.append({
                 'id': doc.id,
                 'name': doc.name,
                 'specialty': 'Généraliste', # Mock
                 'avatar': '/placeholder.svg',
                 'online': True # Mock
             })
        
    return jsonify({
        'stats': [
            {'label': "Rendez-vous", 'value': str(appointments_count), 'subtitle': "ce mois"},
            {'label': "Mes Médecins", 'value': str(my_doctors_count), 'subtitle': "spécialistes"},
            {'label': "Dossiers", 'value': str(folders_count), 'subtitle': "médicaux"}
        ],
        'recentHistory': recent_history,
        'myDoctors': my_doctors_list
    }), 200

@dashboard_bp.route('/api/dashboard/doctor/stats', methods=['GET'])
@jwt_required()
def get_doctor_stats():
    current_user_id = get_jwt_identity()
    
    # 1. Patients (Approved Access Requests where I am the doctor)
    patients_count = AccessRequest.query.filter_by(doctor_id=current_user_id, status='approved').count()
    
    # 2. Consultations (Logs where I am the doctor)
    # Ideally "Today".
    today = date.today()
    # logs_today = AccessLog.query.filter(AccessLog.doctor_id == current_user_id, db.func.date(AccessLog.timestamp) == today).count()
    # Simple count for now
    consultations_count = AccessLog.query.filter_by(doctor_id=current_user_id).count()
    
    # 3. Messages (Unread)
    unread_messages = Message.query.filter_by(receiver_id=current_user_id, is_read=False).count()
    
    # 4. Recent Activity (Logs created by me)
    logs = AccessLog.query.filter_by(doctor_id=current_user_id).order_by(AccessLog.timestamp.desc()).limit(5).all()
    recent_activity = []
    for log in logs:
        pat = User.query.get(log.patient_id)
        pat_name = pat.name if pat else log.patient_id
        desc = f"Consultation dossier {pat_name}"
        if log.action_type == 'message_sent':
            desc = f"Message envoyé à {pat_name}"
        elif log.consultation_note:
            desc = f"Note ajoutée pour {pat_name}"
            
        recent_activity.append({
            'id': log.id,
            'desc': desc,
            'time': log.timestamp.strftime("%H:%M %d/%m"), # simplified
            'icon': 'Activity' # Frontend maps this string to icon
        })
        
    return jsonify({
        'stats': [
            {'label': "Patients", 'value': str(patients_count), 'subtitle': "suivis"},
            {'label': "Consultations", 'value': str(consultations_count), 'subtitle': "total"},
            {'label': "Messages", 'value': str(unread_messages), 'subtitle': "non lus"}
        ],
        'recentActivity': recent_activity
    }), 200

@dashboard_bp.route('/api/dashboard/doctors', methods=['GET'])
def get_all_doctors():
    # Public endpoint or authenticated? Let's say Authenticated.
    from models.user_model import User
    doctors = User.query.filter_by(role='doctor').all()
    results = []
    for d in doctors:
        results.append({
            'id': d.id,
            'name': d.name,
            'specialty': 'Généraliste', # We don't have specialty in User model yet! Mocking.
            'avatar': '/placeholder.svg',
            'online': True # Mock
        })
    return jsonify(results), 200
