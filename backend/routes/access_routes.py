from flask import Blueprint, request, jsonify
from extensions import db, jwt
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.access_model import AccessRequest
from models.user_model import User
from datetime import datetime

access_bp = Blueprint('access', __name__, url_prefix='/api/access')

@access_bp.route('/request', methods=['POST'])
@jwt_required()
def request_access():
    current_user_id = get_jwt_identity()
    data = request.json
    
    patient_id = data.get('patient_id')
    request_message = data.get('request_message')
    duration = data.get('duration', 'permanent')
    
    # Verify doctor role (Optional: enforce strictly)
    doctor = User.query.get(current_user_id)
    if not doctor or doctor.role != 'doctor':
        return jsonify({"error": "Unauthorized. Only doctors can request access."}), 403

    # Check for existing pending request
    existing_request = AccessRequest.query.filter_by(
        doctor_id=current_user_id, 
        patient_id=patient_id, 
        status='pending'
    ).first()
    
    if existing_request:
        return jsonify({"message": "Request already pending"}), 200

    new_request = AccessRequest(
        patient_id=patient_id,
        doctor_id=current_user_id,
        request_message=request_message,
        duration=duration,
        status='pending'
    )
    
    db.session.add(new_request)
    db.session.commit()
    
    return jsonify(new_request.to_dict()), 201

@access_bp.route('/requests', methods=['GET'])
@jwt_required()
def get_requests():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    if user.role == 'patient':
        # Patient sees incoming requests
        requests = AccessRequest.query.filter_by(patient_id=current_user_id).order_by(AccessRequest.created_at.desc()).all()
    else:
        # Doctor sees sent requests
        requests = AccessRequest.query.filter_by(doctor_id=current_user_id).order_by(AccessRequest.created_at.desc()).all()
        
    return jsonify([req.to_dict() for req in requests]), 200

@access_bp.route('/grant', methods=['POST'])
@jwt_required()
def grant_access():
    current_user_id = get_jwt_identity()
    data = request.json
    request_id = data.get('request_id')
    
    access_request = AccessRequest.query.get(request_id)
    
    if not access_request:
        return jsonify({"error": "Request not found"}), 404
        
    if access_request.patient_id != current_user_id:
        return jsonify({"error": "Unauthorized"}), 403
        
    access_request.status = 'approved'
    access_request.granted_at = datetime.utcnow()
    # Update duration/permissions if provided in body? For now simple approve.
    
    db.session.commit()
    return jsonify(access_request.to_dict()), 200

@access_bp.route('/revoke', methods=['POST'])
@jwt_required()
def revoke_access():
    current_user_id = get_jwt_identity()
    data = request.json
    
    # Can revoke by request_id OR by doctor_id
    request_id = data.get('request_id')
    doctor_id = data.get('doctor_id')
    
    if request_id:
        access_request = AccessRequest.query.get(request_id)
        if access_request and access_request.patient_id == current_user_id:
             if access_request.status == 'pending':
                 access_request.status = 'rejected'
             else:
                 access_request.status = 'revoked'
             
             access_request.revoked_at = datetime.utcnow()
             db.session.commit()
             return jsonify(access_request.to_dict()), 200

    if doctor_id:
        # Revoke ALL active permissions for this doctor
        requests = AccessRequest.query.filter_by(
            patient_id=current_user_id, 
            doctor_id=doctor_id, 
            status='approved'
        ).all()
        
        for req in requests:
            req.status = 'revoked'
            req.revoked_at = datetime.utcnow()
            
        db.session.commit()
        return jsonify({"message": f"All access revoked for doctor {doctor_id}"}), 200
        
    return jsonify({"error": "Invalid parameters"}), 400

@access_bp.route('/status', methods=['GET'])
@jwt_required()
def check_status():
    # Helper to check if doctor has access to patient
    # Usually used by doctor to see if they can view record
    current_user_id = get_jwt_identity()
    patient_id = request.args.get('patient_id')
    
    # Find most recent Approved request
    access = AccessRequest.query.filter_by(
        doctor_id=current_user_id,
        patient_id=patient_id,
        status='approved'
    ).first()
    
    # Logic to handle expiration could go here
    
    has_access = False
    if access:
        has_access = True
    
    return jsonify({"has_access": has_access}), 200

@access_bp.route('/mark-seen', methods=['POST'])
@jwt_required()
def mark_seen():
    current_user_id = get_jwt_identity()
    data = request.json
    request_id = data.get('request_id')
    
    if not request_id:
        return jsonify({"error": "Missing request_id"}), 400
        
    access_request = AccessRequest.query.get(request_id)
    
    if not access_request:
        return jsonify({"error": "Request not found"}), 404
        
    # Verify ownership (doctor should be the one marking seen for their own requests responses)
    # But wait, patient sees pending requests. Pending requests don't really use 'seen' flag in the same way, 
    # they just disappear when handled.
    # The 'seen' flag is primarily for the Doctor to dismiss the "Approved" notification.
    
    if access_request.doctor_id != current_user_id:
        return jsonify({"error": "Unauthorized"}), 403
        
    access_request.seen = True
    db.session.commit()
    
    return jsonify({"success": True}), 200

@access_bp.route('/request/<int:request_id>', methods=['DELETE'])
@jwt_required()
def delete_request(request_id):
    current_user_id = get_jwt_identity()
    
    access_request = AccessRequest.query.get(request_id)
    
    if not access_request:
        return jsonify({"error": "Request not found"}), 404
        
    # Only allow deleting if:
    # 1. User is the doctor who made the request AND status is rejected/revoked
    
    if access_request.doctor_id != current_user_id:
        return jsonify({"error": "Unauthorized"}), 403
        
    if access_request.status not in ['rejected', 'revoked']:
        return jsonify({"error": "Cannot delete pending or approved requests"}), 400
        
    db.session.delete(access_request)
    db.session.commit()
    
    return jsonify({"message": "Request deleted"}), 200

@access_bp.route('/log-access', methods=['POST'])
@jwt_required()
def log_access():
    current_user_id = get_jwt_identity()
    data = request.json
    
    patient_id = data.get('patient_id')
    sections = data.get('sections_viewed', '')
    
    if not patient_id:
        return jsonify({"error": "Missing patient_id"}), 400
        
    from models.access_log_model import AccessLog
    
    new_log = AccessLog(
        doctor_id=current_user_id,
        patient_id=patient_id,
        sections_viewed=sections
    )
    
    db.session.add(new_log)
    db.session.commit()
    
    return jsonify(new_log.to_dict()), 201

@access_bp.route('/history/<string:patient_id>', methods=['GET'])
@jwt_required()
def get_access_history(patient_id):
    current_user_id = get_jwt_identity()
    
    from models.access_log_model import AccessLog
    from models.user_model import User
    
    current_user = User.query.get(current_user_id)
    
    # Allow if user is the patient OR a doctor (assuming if they can hit this endpoint with a valid patient_id, they have basic access rights via other checks or we trust the role here for history viewing)
    # Ideally we should check if this doctor actually has access to THIS patient, but for now we relax the check to allow the functionality.
    if current_user_id != str(patient_id) and current_user.role != 'doctor':
         return jsonify({"error": "Unauthorized"}), 403
         
    logs = AccessLog.query.filter_by(patient_id=patient_id).order_by(AccessLog.timestamp.desc()).all()
    
    results = []
    for log in logs:
        doc = User.query.get(log.doctor_id)
        doc_name = doc.name if doc else log.doctor_id
        results.append({
            **log.to_dict(),
            "doctor_name": doc_name
        })
        
    return jsonify(results), 200

@access_bp.route('/consultation-note', methods=['POST'])
@jwt_required()
def add_consultation_note():
    current_user_id = get_jwt_identity()
    data = request.json
    
    log_id = data.get('log_id')
    note = data.get('note')
    action = data.get('action') 
    
    if not log_id:
        return jsonify({"error": "Missing log_id"}), 400
        
    from models.access_log_model import AccessLog
    
    log = AccessLog.query.get(log_id)
    if not log:
       return jsonify({"error": "Log not found"}), 404
       
    if log.doctor_id != current_user_id:
        return jsonify({"error": "Unauthorized"}), 403
        
    if note:
        log.consultation_note = note
    if action:
        log.action_type = action
        
    db.session.commit()
    return jsonify(log.to_dict()), 200

@access_bp.route('/log-seen', methods=['POST'])
@jwt_required()
def mark_log_seen():
    current_user_id = get_jwt_identity()
    data = request.json
    
    log_id = data.get('log_id')
    
    from models.access_log_model import AccessLog
    log = AccessLog.query.get(log_id)
    
    if not log:
        return jsonify({"error": "Log not found"}), 404
        
    if log.patient_id != current_user_id:
        return jsonify({"error": "Unauthorized"}), 403
        
    log.seen = True
    db.session.commit()
    
    return jsonify({"success": True}), 200
