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
    from services.ipfs_service import ipfs_service
    from services.blockchain_service import blockchain_service
    
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
    # Check if it's a PDF
    if not filename.lower().endswith('.pdf'):
        return jsonify({'error': 'Only PDF files are supported for blockchain storage'}), 400
        
    # Use same upload folder logic as chat
    upload_folder = os.path.join(current_app.root_path, 'static', 'uploads')
    os.makedirs(upload_folder, exist_ok=True)
    
    # Save file locally first
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S_')
    unique_filename = timestamp + filename
    file_path = os.path.join(upload_folder, unique_filename)
    file.save(file_path)
    
    # Get file size
    file_size_bytes = os.path.getsize(file_path)
    
    # Format size (KB/MB)
    if file_size_bytes < 1024 * 1024:
        size = f"{file_size_bytes // 1024} KB"
    else:
        size = f"{file_size_bytes // (1024 * 1024):.1f} MB"
    
    try:
        # Upload to IPFS via Pinata
        ipfs_hash = ipfs_service.upload_file(file_path, filename)
        
        # Get MetaMask info if provided
        signature = request.form.get('signature')
        user_address = request.form.get('user_address')
        
        # Store hash on blockchain (with MetaMask if provided)
        if signature and user_address:
            tx_hash = blockchain_service.store_with_metamask_signature(
                ipfs_hash, signature, user_address
            )
        else:
            tx_hash = blockchain_service.store_document_hash(ipfs_hash)
        
        # Generate both URLs
        file_url = f'http://localhost:5000/static/uploads/{unique_filename}'
        ipfs_url = ipfs_service.get_file_url(ipfs_hash)
        
        folder_id = request.form.get('folder_id')
        
        # Create document record with blockchain info
        document = MedicalDocument(
            record_id=record.id,
            name=filename,
            file_url=ipfs_url,  # Use IPFS URL as the main URL
            ipfs_hash=ipfs_hash,
            tx_hash=tx_hash,
            file_type='pdf',
            size=size,
            folder_id=int(folder_id) if folder_id else None
        )
        
        db.session.add(document)
        db.session.commit()
        
        return jsonify(document.to_dict()), 201
    except Exception as e:
        # Log error
        print(f"Error uploading to blockchain: {str(e)}")
        return jsonify({'error': f'Failed to store document on blockchain: {str(e)}'}), 500

@medical_bp.route('/api/medical-record/folders', methods=['GET'])
@jwt_required()
def get_folders():
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
            return jsonify({'error': 'Unauthorized. You do not have permission to view these folders.'}), 403
    
    record = MedicalRecord.query.filter_by(user_id=user_id).first()
    if not record:
        return jsonify({'error': 'Record not found'}), 404
    
    # Get all folders for this record
    folders = MedicalFolder.query.filter_by(record_id=record.id).all()
    return jsonify({
        'folders': [folder.to_dict() for folder in folders]
    })

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

@medical_bp.route('/api/medical-record/documents/<int:doc_id>', methods=['GET'])
@jwt_required()
def get_document(doc_id):
    from services.ipfs_service import ipfs_service
    from services.blockchain_service import blockchain_service
    from models.access_log_model import AccessLog
    
    current_user_id = get_jwt_identity()
    
    # Get document
    document = MedicalDocument.query.get_or_404(doc_id)
    
    # Check if user has access to this document
    record = MedicalRecord.query.get_or_404(document.record_id)
    
    # Only allow patient or doctors with access
    if current_user_id != record.user_id:
        # Check if user is doctor with access
        access = AccessRequest.query.filter_by(
            doctor_id=current_user_id,
            patient_id=record.user_id,
            status='approved'
        ).first()
        
        if not access:
            return jsonify({'error': 'Unauthorized access to medical document'}), 403
    
    # Verify document on blockchain if it has IPFS hash
    if document.ipfs_hash and document.tx_hash:
        try:
            # Verify document owner from blockchain
            owner_address = blockchain_service.verify_document(document.ipfs_hash)
            document_data = document.to_dict()
            document_data['blockchain_verified'] = bool(owner_address)
            
            # Log access for doctors
            if current_user_id != record.user_id:
                log = AccessLog(
                    doctor_id=current_user_id,
                    patient_id=record.user_id,
                    sections_viewed=f"document_{doc_id}",
                    action_type='view_document'
                )
                db.session.add(log)
                db.session.commit()
            
            return jsonify(document_data)
        except Exception as e:
            print(f"Blockchain verification error: {str(e)}")
            # Still return document but mark as unverified
            document_data = document.to_dict()
            document_data['blockchain_verified'] = False
            return jsonify(document_data)
    
    # Log access for non-blockchain documents
    if current_user_id != record.user_id:
        log = AccessLog(
            doctor_id=current_user_id,
            patient_id=record.user_id,
            sections_viewed=f"document_{doc_id}",
            action_type='view_document'
        )
        db.session.add(log)
        db.session.commit()
    
    return jsonify(document.to_dict())
