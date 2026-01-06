#!/usr/bin/env python3
import os
import psycopg2
from dotenv import load_dotenv
from config import Config

# Load environment variables
load_dotenv()

def update_database_schema():
    """Add missing columns to medical_document table if they don't exist"""
    # Get PostgreSQL connection info from environment or Config
    database_url = os.environ.get('DATABASE_URL') or 'postgresql://postgres:password@localhost:5432/medical_app'
    
    # Parse database URL
    if database_url.startswith('postgresql://'):
        # Extract components from URL
        credentials, rest = database_url.replace('postgresql://', '').split('@')
        username, password = credentials.split(':')
        host_port, dbname = rest.split('/')
        if ':' in host_port:
            host, port = host_port.split(':')
        else:
            host = host_port
            port = '5432'
    else:
        # Default settings (from docker-compose)
        username = 'postgres'
        password = 'password'
        host = 'localhost'
        port = '5432'
        dbname = 'medical_app'
    
    try:
        # Connect to PostgreSQL
        conn = psycopg2.connect(
            dbname=dbname,
            user=username,
            password=password,
            host=host,
            port=port
        )
        conn.autocommit = True
        cursor = conn.cursor()
        
        print(f"Connected to PostgreSQL database: {dbname}")
        
        # Check if medical_document table exists
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'medical_document'
            );
        """)
        table_exists = cursor.fetchone()[0]
        
        if not table_exists:
            print("Table 'medical_document' does not exist. No migration needed.")
            conn.close()
            return
        
        # Check if ipfs_hash column exists
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_name = 'medical_document' AND column_name = 'ipfs_hash'
            );
        """)
        ipfs_hash_exists = cursor.fetchone()[0]
        
        if not ipfs_hash_exists:
            print("Adding 'ipfs_hash' column to medical_document table...")
            cursor.execute("ALTER TABLE medical_document ADD COLUMN ipfs_hash VARCHAR(200);")
            print("Column 'ipfs_hash' added successfully!")
        else:
            print("Column 'ipfs_hash' already exists.")
        
        # Check if tx_hash column exists
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_name = 'medical_document' AND column_name = 'tx_hash'
            );
        """)
        tx_hash_exists = cursor.fetchone()[0]
        
        if not tx_hash_exists:
            print("Adding 'tx_hash' column to medical_document table...")
            cursor.execute("ALTER TABLE medical_document ADD COLUMN tx_hash VARCHAR(200);")
            print("Column 'tx_hash' added successfully!")
        else:
            print("Column 'tx_hash' already exists.")
        
        conn.close()
        print("Database schema update completed successfully!")
        
    except Exception as e:
        print(f"Error updating database schema: {str(e)}")
        return False
    
    return True

if __name__ == "__main__":
    update_database_schema()
