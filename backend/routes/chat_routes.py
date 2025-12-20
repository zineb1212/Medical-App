from flask import Blueprint, request, jsonify
from extensions import db
from models.chat_model import Message
from sqlalchemy import or_, and_
import os
from werkzeug.utils import secure_filename
from flask import current_app, url_for

chat_bp = Blueprint('chat', __name__)

@chat_bp.route('/api/messages', methods=['POST'])
def send_message():
    data = request.get_json()
    
    new_message = Message(
        sender_id=data['sender_id'],
        receiver_id=data['receiver_id'],
        content=data['content'],
        attachment_url=data.get('attachment_url'),
        attachment_type=data.get('attachment_type')
    )
    
    db.session.add(new_message)
    db.session.commit()
    
    return jsonify(new_message.to_dict()), 201

@chat_bp.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file:
        filename = secure_filename(file.filename)
        # Ensure uploads directory exists
        upload_folder = os.path.join(current_app.root_path, 'static', 'uploads')
        os.makedirs(upload_folder, exist_ok=True)
        
        file.save(os.path.join(upload_folder, filename))
        
        # Determine file type
        file_type = 'file'
        if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif')):
            file_type = 'image'
            
        return jsonify({
            'url': f'http://localhost:5000/static/uploads/{filename}',
            'type': file_type
        }), 201

@chat_bp.route('/api/messages', methods=['GET'])
def get_messages():
    user1_id = request.args.get('user1_id')
    user2_id = request.args.get('user2_id')
    
    if not user1_id or not user2_id:
        return jsonify({'error': 'Missing user_id parameters'}), 400
        
    messages = Message.query.filter(
        or_(
            and_(Message.sender_id == user1_id, Message.receiver_id == user2_id),
            and_(Message.sender_id == user2_id, Message.receiver_id == user1_id)
        )
    ).order_by(Message.timestamp.asc()).all()
    
    return jsonify([msg.to_dict() for msg in messages])

@chat_bp.route('/api/contacts', methods=['GET'])
def get_contacts():
    try:
        from models.user_model import User
        role = request.args.get('role')
        if role:
            users = User.query.filter_by(role=role).all()
        else:
            users = User.query.all()
        return jsonify([user.to_dict() for user in users])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@chat_bp.route('/api/notifications/unread-count', methods=['GET'])
def get_unread_count():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'Missing user_id'}), 400
        
    try:
        from models.user_model import User
        from models.access_model import AccessRequest
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        # 1. Unread Chat Messages
        msg_count = Message.query.filter_by(receiver_id=user_id, is_read=False).count()
        
        # 2. Access Request Notifications
        access_count = 0
        if user.role == 'patient':
            # Patient sees PENDING requests
            access_count = AccessRequest.query.filter_by(patient_id=user_id, status='pending').count()
            
            # Patient also sees UNSEEN consultations
            from models.access_log_model import AccessLog
            consultation_count = AccessLog.query.filter_by(patient_id=user_id, seen=False).count()
            access_count += consultation_count
            
        elif user.role == 'doctor':
             # Doctor sees APPROVED/REJECTED requests that are NOT SEEN
             access_count = AccessRequest.query.filter(
                 AccessRequest.doctor_id == user_id,
                 AccessRequest.status.in_(['approved', 'rejected']),
                 AccessRequest.seen == False
             ).count()
             
        return jsonify({'count': msg_count + access_count})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@chat_bp.route('/api/messages/mark-read', methods=['POST'])
def mark_messages_read():
    data = request.get_json()
    user_id = data.get('user_id') # The user reading the messages (receiver)
    sender_id = data.get('sender_id') # The user who sent the messages
    
    if not user_id or not sender_id:
        return jsonify({'error': 'Missing ids'}), 400
        
    try:
        # Mark all messages from sender_id to user_id as read
        Message.query.filter_by(sender_id=sender_id, receiver_id=user_id, is_read=False).update({'is_read': True})
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@chat_bp.route('/api/notifications/unread-messages', methods=['GET'])
def get_unread_messages():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'Missing user_id'}), 400
        
    try:
        from models.user_model import User
        from models.access_model import AccessRequest
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        notifications = []
        
        # 1. Messages
        messages = Message.query.filter_by(receiver_id=user_id, is_read=False).all()
        for msg in messages:
            notifications.append({
                'type': 'message',
                'id': msg.id,
                'sender_id': msg.sender_id,
                'content': msg.content,
                'timestamp': msg.timestamp.isoformat()
            })
            
        # 2. Access Requests
        access_requests = []
        if user.role == 'patient':
            # Pending requests
            access_requests = AccessRequest.query.filter_by(patient_id=user_id, status='pending').all()
        elif user.role == 'doctor':
             # Responses
             access_requests = AccessRequest.query.filter(
                 AccessRequest.doctor_id == user_id,
                 AccessRequest.status.in_(['approved', 'rejected']),
                 AccessRequest.seen == False
             ).all()
             
        for req in access_requests:
            content = ""
            sender_id = ""
            if user.role == 'patient':
                doc = User.query.get(req.doctor_id)
                sender_name = doc.name if doc else req.doctor_id
                content = f"Dr. {sender_name} souhaite accéder à votre dossier."
                sender_id = req.doctor_id
            else:
                 pat = User.query.get(req.patient_id)
                 pat_name = pat.name if pat else req.patient_id
                 status_text = "accepté" if req.status == 'approved' else "refusé"
                 content = f"Le patient {pat_name} a {status_text} votre demande."
                 sender_id = req.patient_id

            notifications.append({
                'type': 'access',
                'id': req.id,
                'status': req.status,
                'sender_id': sender_id, 
                'content': content,
                'timestamp': req.created_at.isoformat() if req.created_at else ""
            })

        # 3. New Consultations (For Patients)
        if user.role == 'patient':
            from models.access_log_model import AccessLog
            unseen_logs = AccessLog.query.filter_by(patient_id=user_id, seen=False).all()
            
            for log in unseen_logs:
                 doc = User.query.get(log.doctor_id)
                 sender_name = doc.name if doc else log.doctor_id
                 notifications.append({
                     'type': 'consultation',
                     'id': log.id,
                     'sender_id': log.doctor_id,
                     'content': f"Votre dossier a été consulté par Dr. {sender_name}.",
                     'timestamp': log.timestamp.isoformat()
                 })

        # Sort by timestamp desc
        notifications.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return jsonify(notifications)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
