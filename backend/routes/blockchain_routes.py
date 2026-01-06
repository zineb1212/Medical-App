from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.blockchain_service import blockchain_service

blockchain_bp = Blueprint('blockchain', __name__)

@blockchain_bp.route('/api/blockchain/network-info', methods=['GET'])
def get_network_info():
    """Get Ganache network information for MetaMask"""
    return jsonify(blockchain_service.get_ganache_network_info())

@blockchain_bp.route('/api/blockchain/store', methods=['POST'])
@jwt_required()
def store_hash():
    """Store IPFS hash on blockchain with MetaMask info"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or not data.get('ipfs_hash'):
        return jsonify({'error': 'Missing IPFS hash'}), 400
    
    ipfs_hash = data.get('ipfs_hash')
    signature = data.get('signature')
    user_address = data.get('user_address')
    
    try:
        # If user provided MetaMask signature and address
        if signature and user_address:
            tx_hash = blockchain_service.store_with_metamask_signature(
                ipfs_hash, signature, user_address
            )
        else:
            # Otherwise use the backend wallet
            tx_hash = blockchain_service.store_document_hash(ipfs_hash)
            
        return jsonify({
            'success': True, 
            'tx_hash': tx_hash,
            'ipfs_hash': ipfs_hash
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@blockchain_bp.route('/api/blockchain/verify', methods=['GET'])
@jwt_required()
def verify_hash():
    """Verify an IPFS hash on the blockchain"""
    ipfs_hash = request.args.get('ipfs_hash')
    
    if not ipfs_hash:
        return jsonify({'error': 'Missing IPFS hash'}), 400
    
    try:
        owner = blockchain_service.verify_document(ipfs_hash)
        return jsonify({
            'verified': bool(owner),
            'owner': owner,
            'ipfs_hash': ipfs_hash
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
