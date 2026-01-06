import os
import requests
from pinatapy import PinataPy
from dotenv import load_dotenv

load_dotenv()

class PinataService:
    def __init__(self):
        # Load Pinata API keys from environment variables
        self.api_key = os.getenv('API_Key')
        self.api_secret = os.getenv('API_Secret')
        
        # Initialize Pinata client
        self.pinata = PinataPy(self.api_key, self.api_secret)
    
    def upload_file(self, file_path, file_name=None):
        """
        Upload a file to IPFS via Pinata
        
        Args:
            file_path (str): Path to the file
            file_name (str, optional): Custom name for the file. Defaults to None.
            
        Returns:
            str: IPFS hash (CID) of the uploaded file
        """
        # Prepare metadata
        metadata = {
            "name": file_name or os.path.basename(file_path),
        }
        
        # Upload file to Pinata
        response = self.pinata.pin_file_to_ipfs(file_path, metadata=metadata)
        
        # Extract and return IPFS hash
        ipfs_hash = response['IpfsHash']
        return ipfs_hash
    
    def get_file_url(self, ipfs_hash):
        """
        Get the URL to access a file on IPFS
        
        Args:
            ipfs_hash (str): IPFS hash (CID) of the file
            
        Returns:
            str: URL to access the file
        """
        return f"https://gateway.pinata.cloud/ipfs/{ipfs_hash}"

# Create singleton instance
pinata_service = PinataService()
