from flask import Blueprint, request, jsonify
from services.ai_service import AIModelService
import os
import json
from werkzeug.utils import secure_filename
from datetime import datetime
from models.medical_model import MedicalRecord
from models.ai_history_model import AIHistory
from extensions import db

ai_bp = Blueprint('ai', __name__)
ai_service = AIModelService()

@ai_bp.route('/api/ai/chat', methods=['POST'])
def chat():
    data = request.get_json()
    query = data.get('query')
    # Use user_id from context or auth (assuming mock auth handling for now, frontend sends it in context)
    context_data = data.get('context', {}) 
    user_id = context_data.get('user_id') or "anonymous"

    if not query:
        return jsonify({'error': 'No query provided'}), 400

    result = ai_service.analyze_text(query, context_data)
    
    # Save History
    if user_id != "anonymous":
        history = AIHistory(
            user_id=user_id,
            session_id=context_data.get('session_id'),
            action_type='chat',
            input_data=query,
            output_data=json.dumps(result)
        )
        db.session.add(history)
        db.session.commit()

    return jsonify(result)

@ai_bp.route('/api/ai/analyze-mri', methods=['POST'])
def analyze_mri():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    user_id = request.form.get('user_id') or "anonymous" 

    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    # Save temp file
    temp_dir = os.path.join(os.getcwd(), 'temp_uploads')
    os.makedirs(temp_dir, exist_ok=True)
    
    filename = secure_filename(file.filename)
    filepath = os.path.join(temp_dir, filename)
    file.save(filepath)

    try:
        # Predict
        result = ai_service.predict_mri(filepath)
        
        # Save History
        if user_id != "anonymous":
             history = AIHistory(
                user_id=user_id,
                action_type='mri',
                input_data=f"Image: {filename}",
                output_data=json.dumps(result)
            )
             db.session.add(history)
             db.session.commit()

        # Cleanup
        if os.path.exists(filepath):
            os.remove(filepath)
            
        return jsonify(result)
        
    except Exception as e:
        if os.path.exists(filepath):
            os.remove(filepath)
        return jsonify({'error': str(e)}), 500

@ai_bp.route('/api/ai/analyze-record', methods=['POST'])
def analyze_record():
    data = request.get_json()
    user_id = data.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'User ID required'}), 400
        
    # Fetch record
    record = MedicalRecord.query.filter_by(user_id=user_id).first()
    if not record:
        return jsonify({'error': 'Medical record not found'}), 404
        
    # Convert to dict for analysis
    record_data = record.to_dict()
    
    result = ai_service.analyze_record(record_data)
    
    # Save History
    history = AIHistory(
        user_id=user_id,
        action_type='record',
        input_data="Analyse complète du dossier",
        output_data=json.dumps(result)
    )
    db.session.add(history)
    db.session.commit()

    return jsonify(result)

@ai_bp.route('/api/ai/history', methods=['GET'])
def get_history():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'User ID required'}), 400
        
    history = AIHistory.query.filter_by(user_id=user_id).order_by(AIHistory.timestamp.desc()).all()
    return jsonify([h.to_dict() for h in history])

@ai_bp.route('/api/ai/history/<int:history_id>', methods=['DELETE'])
def delete_history_item(history_id):
    history_item = AIHistory.query.get(history_id)
    if not history_item:
        return jsonify({'error': 'History item not found'}), 404
        
    try:
        db.session.delete(history_item)
        db.session.commit()
        return jsonify({'message': 'Item deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
