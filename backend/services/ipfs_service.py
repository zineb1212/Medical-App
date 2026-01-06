import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

class IPFSService:
    def __init__(self):
        # Load Pinata API keys from environment variables
        self.pinata_api_key = os.getenv('API_Key')
        self.pinata_api_secret = os.getenv('API_Secret')
        
        # Base URLs
        self.pinata_base_url = "https://api.pinata.cloud"
        self.ipfs_gateway = "https://gateway.pinata.cloud/ipfs"
    
    def upload_file(self, file_path, file_name=None):
        """
        Upload a file to IPFS via direct Pinata API call
        
        Args:
            file_path (str): Path to the file
            file_name (str, optional): Custom name for the file. Defaults to None.
            
        Returns:
            str: IPFS hash (CID) of the uploaded file
        """
        # Prepare headers with authentication
        headers = {
            'pinata_api_key': self.pinata_api_key,
            'pinata_secret_api_key': self.pinata_api_secret
        }
        
        # Prepare metadata
        metadata = {
            "name": file_name or os.path.basename(file_path),
        }
        
        # Prepare the multipart form data
        with open(file_path, 'rb') as file:
            files = {
                'file': (os.path.basename(file_path), file),
            }
            
            data = {
                'pinataMetadata': json.dumps({"name": metadata["name"]})
            }
            
            # Make the direct API call to Pinata
            response = requests.post(
                f"{self.pinata_base_url}/pinning/pinFileToIPFS",
                files=files,
                data=data,
                headers=headers
            )
            
            if response.status_code != 200:
                raise Exception(f"Error uploading to IPFS: {response.text}")
                
            # Extract and return IPFS hash
            response_json = response.json()
            ipfs_hash = response_json['IpfsHash']
            return ipfs_hash
    
    def get_file_url(self, ipfs_hash):
        """
        Get the URL to access a file on IPFS
        
        Args:
            ipfs_hash (str): IPFS hash (CID) of the file
            
        Returns:
            str: URL to access the file
        """
        return f"{self.ipfs_gateway}/{ipfs_hash}"
    
    def pin_hash(self, ipfs_hash, name=None):
        """
        Pin an existing IPFS hash to Pinata
        
        Args:
            ipfs_hash (str): IPFS hash to pin
            name (str, optional): Name for the pinned item
            
        Returns:
            bool: Success status
        """
        url = f"{self.pinata_base_url}/pinning/pinByHash"
        
        headers = {
            'Content-Type': 'application/json',
            'pinata_api_key': self.pinata_api_key,
            'pinata_secret_api_key': self.pinata_api_secret
        }
        
        payload = {
            "hashToPin": ipfs_hash
        }
        
        if name:
            payload["pinataMetadata"] = {"name": name}
            
        response = requests.post(url, headers=headers, json=payload)
        
        if response.status_code != 200:
            raise Exception(f"Failed to pin hash: {response.text}")
            
        return True
    
    def unpin(self, ipfs_hash):
        """
        Remove a pinned hash from Pinata
        
        Args:
            ipfs_hash (str): IPFS hash to unpin
            
        Returns:
            bool: Success status
        """
        url = f"{self.pinata_base_url}/pinning/unpin/{ipfs_hash}"
        
        headers = {
            'pinata_api_key': self.pinata_api_key,
            'pinata_secret_api_key': self.pinata_api_secret
        }
        
        response = requests.delete(url, headers=headers)
        
        if response.status_code != 200:
            raise Exception(f"Failed to unpin hash: {response.text}")
            
        return True

# Create singleton instance
ipfs_service = IPFSService()
