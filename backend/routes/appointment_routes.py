from flask import Blueprint, request, jsonify
from extensions import db
from models.appointment_model import Appointment
from models.user_model import User
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

appointment_bp = Blueprint('appointment', __name__)
from flask_cors import cross_origin


@appointment_bp.route('/api/appointments', methods=['GET'])
@cross_origin()
@jwt_required()
def get_appointments():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Filters
    date_str = request.args.get('date')
    
    query = Appointment.query

    # If doctor, show their appointments. If patient, show theirs.
    if user.role == 'doctor':
        query = query.filter_by(doctor_id=current_user_id)
    else:
        query = query.filter_by(patient_id=current_user_id)

    if date_str:
        try:
            date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
            query = query.filter_by(date=date_obj)
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400

    appointments = query.order_by(Appointment.date, Appointment.time).all()
    return jsonify([appt.to_dict() for appt in appointments])

@appointment_bp.route('/api/appointments', methods=['POST', 'OPTIONS'])
@cross_origin()
@jwt_required()
def create_appointment():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    patient_id = data.get('patient_id') # If doctor creates it, they specify patient
    doctor_id = data.get('doctor_id')   # If patient creates it, they specify doctor
    
    # Determine roles
    creator = User.query.get(current_user_id)
    
    if creator.role == 'doctor':
        final_doctor_id = current_user_id
        final_patient_id = patient_id
        # Optional: Verify patient exists
    else:
        final_patient_id = current_user_id
        final_doctor_id = doctor_id
    
    if not final_patient_id or not final_doctor_id:
        return jsonify({'error': 'Doctor and Patient are required'}), 400

    try:
        date_obj = datetime.strptime(data.get('date'), '%Y-%m-%d').date()
        time_obj = datetime.strptime(data.get('time'), '%H:%M').time()
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid date (YYYY-MM-DD) or time (HH:MM)'}), 400

    appointment = Appointment(
        doctor_id=final_doctor_id,
        patient_id=final_patient_id,
        date=date_obj,
        time=time_obj,
        type=data.get('type', 'general'),
        mode=data.get('mode', 'in-person'),
        notes=data.get('notes', ''),
        status='confirmed' if creator.role == 'doctor' else 'pending'
    )
    
    db.session.add(appointment)
    db.session.commit()
    
    return jsonify(appointment.to_dict()), 201

@appointment_bp.route('/api/appointments/<int:appt_id>', methods=['PUT', 'OPTIONS'])
@cross_origin()
@jwt_required()
def update_appointment(appt_id):
    current_user_id = get_jwt_identity()
    appointment = Appointment.query.get_or_404(appt_id)
    
    # Check authorization
    if appointment.doctor_id != current_user_id and appointment.patient_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    
    if 'status' in data:
        appointment.status = data['status']
    if 'notes' in data:
        appointment.notes = data['notes']
        
    db.session.commit()
    return jsonify(appointment.to_dict())

@appointment_bp.route('/api/appointments/<int:appt_id>', methods=['DELETE', 'OPTIONS'])
@cross_origin()
@jwt_required()
def delete_appointment(appt_id):
    current_user_id = get_jwt_identity()
    appointment = Appointment.query.get_or_404(appt_id)
    
    # Check authorization
    if appointment.doctor_id != current_user_id and appointment.patient_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403
        
    db.session.delete(appointment)
    db.session.commit()
    return jsonify({'message': 'Appointment deleted'})
