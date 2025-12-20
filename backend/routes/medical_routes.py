from flask import Blueprint, request, jsonify, current_app
from extensions import db
from models.medical_model import MedicalRecord, MedicalDocument, MedicalFolder
from models.access_model import AccessRequest
from models.user_model import User
from flask_jwt_extended import jwt_required, get_jwt_identity

from datetime import datetime
import os
from werkzeug.utils import secure_filename

medical_bp = Blueprint('medical', __name__)

@medical_bp.route('/api/medical-record', methods=['GET'])
@jwt_required()
def get_record():
    current_user_id = get_jwt_identity()
    user_id = request.args.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'Missing user_id'}), 400

    # Authorization Check
    if current_user_id != user_id:
        # Check if requester is a doctor with approved access
        access = AccessRequest.query.filter_by(
            patient_id=user_id,
            doctor_id=current_user_id,
            status='approved'
        ).first()
        
        if not access:
            return jsonify({'error': 'Unauthorized. You do not have permission to view this record.'}), 403

    record = MedicalRecord.query.filter_by(user_id=user_id).first()
    
    if not record:
        # Only create if it's the patient themselves
        if current_user_id == user_id:
            record = MedicalRecord(user_id=user_id)
            db.session.add(record)
            db.session.commit()
        else:
            return jsonify({'error': 'Record not found'}), 404
        
    return jsonify(record.to_dict())

@medical_bp.route('/api/medical-record', methods=['PUT'])
@jwt_required()
def update_record():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    user_id = data.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'Missing user_id'}), 400
        
    # Strict Owner Access for modification
    if current_user_id != user_id:
        return jsonify({'error': 'Unauthorized. Only the patient can modify their record.'}), 403
        
    record = MedicalRecord.query.filter_by(user_id=user_id).first()
    if not record:
        return jsonify({'error': 'Record not found'}), 404
        
    # Update fields
    if 'date_of_birth' in data:
        try:
            record.date_of_birth = datetime.strptime(data['date_of_birth'], '%Y-%m-%d').date()
        except:
            pass # Handle invalid date format
            
    fields = ['gender', 'blood_type', 'height', 'weight', 'allergies', 
              'chronic_conditions', 'current_medications', 'family_history',
              'emergency_contact_name', 'emergency_contact_phone',
              'general_observations', 'current_symptoms']
              
    for field in fields:
        if field in data:
            setattr(record, field, data[field])
            
    try:
        db.session.commit()
        return jsonify(record.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@medical_bp.route('/api/medical-record/documents', methods=['POST'])
@jwt_required()
def upload_document():
    current_user_id = get_jwt_identity()
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
        
    file = request.files['file']
    user_id = request.form.get('user_id')
    
    if not user_id or file.filename == '':
        return jsonify({'error': 'Missing data'}), 400

    if current_user_id != user_id:
        return jsonify({'error': 'Unauthorized. Only the patient can upload documents.'}), 403
        
    record = MedicalRecord.query.filter_by(user_id=user_id).first()
    if not record:
        return jsonify({'error': 'Record not found'}), 404

    filename = secure_filename(file.filename)
    # Use same upload folder logic as chat
    upload_folder = os.path.join(current_app.root_path, 'static', 'uploads')
    os.makedirs(upload_folder, exist_ok=True)
    
    # Save file
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S_')
    unique_filename = timestamp + filename
    file.save(os.path.join(upload_folder, unique_filename))
    
    file_url = f'http://localhost:5000/static/uploads/{unique_filename}'
    file_type = 'image' if filename.lower().endswith(('.png', '.jpg', '.jpeg')) else 'pdf'
    
    # Get file size
    file.seek(0, os.SEEK_END)
    file_size_bytes = file.tell()
    file.seek(0)
    
    # Format size (KB/MB)
    if file_size_bytes < 1024 * 1024:
        size = f"{file_size_bytes // 1024} KB"
    else:
        size = f"{file_size_bytes // (1024 * 1024):.1f} MB"

    folder_id = request.form.get('folder_id')
    
    document = MedicalDocument(
        record_id=record.id,
        name=filename,
        file_url=file_url,
        file_type=file_type,
        size=size,
        folder_id=int(folder_id) if folder_id else None
    )
    
    db.session.add(document)
    db.session.commit()
    
    return jsonify(document.to_dict()), 201

@medical_bp.route('/api/medical-record/folders', methods=['POST'])
@jwt_required()
def create_folder():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    user_id = data.get('user_id')
    name = data.get('name')
    
    if not user_id or not name:
        return jsonify({'error': 'Missing data'}), 400
        
    if current_user_id != user_id:
        return jsonify({'error': 'Unauthorized. Only the patient can create folders.'}), 403
        
    record = MedicalRecord.query.filter_by(user_id=user_id).first()
    if not record:
        return jsonify({'error': 'Record not found'}), 404
        
    folder = MedicalFolder(
        record_id=record.id,
        name=name,
        description=data.get('description'),
        color=data.get('color', 'bg-blue-500')
    )
    
    db.session.add(folder)
    db.session.commit()
    return jsonify(folder.to_dict()), 201

@medical_bp.route('/api/medical-record/folders/<int:folder_id>', methods=['DELETE'])
@jwt_required()
def delete_folder(folder_id):
    current_user_id = get_jwt_identity()
    folder = MedicalFolder.query.get(folder_id)
    if not folder:
        return jsonify({'error': 'Folder not found'}), 404
        
    # Check ownership via record
    record = MedicalRecord.query.get(folder.record_id)
    if not record or record.user_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403
        
    try:
        db.session.delete(folder)
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@medical_bp.route('/api/medical-record/documents/<int:doc_id>', methods=['DELETE'])
@jwt_required()
def delete_document(doc_id):
    current_user_id = get_jwt_identity()
    document = MedicalDocument.query.get(doc_id)
    if not document:
        return jsonify({'error': 'Document not found'}), 404
        
    # Check ownership via record
    record = MedicalRecord.query.get(document.record_id)
    if not record or record.user_id != current_user_id:
         return jsonify({'error': 'Unauthorized'}), 403
        
    try:
        # Optional: Delete actual file from disk here
        db.session.delete(document)
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
