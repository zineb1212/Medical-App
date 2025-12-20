from flask import Blueprint, request, jsonify
from extensions import db
from models.user_model import User
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import datetime

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    role = data.get('role') # Optional, but good to verify

    user = User.query.filter_by(id=email).first()

    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    if role and user.role != role:
        return jsonify({'error': 'Invalid role for this user'}), 401

    # Create JWT
    access_token = create_access_token(identity=user.id, expires_delta=datetime.timedelta(days=1))

    return jsonify({
        'token': access_token,
        'user': user.to_dict()
    }), 200

@auth_bp.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    name = data.get('name')
    role = data.get('role', 'patient') # Default to patient

    if not email or not password or not name:
        return jsonify({'error': 'Missing fields'}), 400

    if User.query.filter_by(id=email).first():
        return jsonify({'error': 'User already exists'}), 400

    new_user = User(
        id=email,
        name=name,
        role=role,
        avatar_url="/placeholder-user.jpg"
    )
    new_user.set_password(password)
    
    db.session.add(new_user)
    db.session.commit()

    # Auto logic after register
    access_token = create_access_token(identity=new_user.id, expires_delta=datetime.timedelta(days=1))

    return jsonify({
        'token': access_token,
        'user': new_user.to_dict()
    }), 201

@auth_bp.route('/api/auth/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
        
    data = request.get_json()
    name = data.get('name')
    avatar_url = data.get('avatar_url')
    
    if name:
        user.name = name
    if avatar_url:
        user.avatar_url = avatar_url
        
    db.session.commit()
    return jsonify({'user': user.to_dict()}), 200
