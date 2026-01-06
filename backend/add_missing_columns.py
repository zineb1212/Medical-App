#!/usr/bin/env python3
"""
Script to add missing ipfs_hash and tx_hash columns to medical_document table in PostgreSQL
"""
import psycopg2
import os
from dotenv import load_dotenv
from config import Config

# Load environment variables
load_dotenv()

# Get database connection string from config
db_uri = Config.SQLALCHEMY_DATABASE_URI

# Parse connection string
if db_uri.startswith('postgresql://'):
    # Extract components from URI
    userpass_host, dbname = db_uri.split('/')[-2:]
    if '@' in userpass_host:
        userpass, host = userpass_host.split('@')
        if ':' in userpass:
            user, password = userpass.split(':')
        else:
            user = userpass
            password = ''
    else:
        host = userpass_host
        user = password = ''
    
    if ':' in host:
        host, port = host.split(':')
    else:
        port = '5432'
    
    if '?' in dbname:
        dbname = dbname.split('?')[0]
else:
    print(f"Error: Database URI is not PostgreSQL format: {db_uri}")
    exit(1)

try:
    # Connect to the database
    print(f"Connecting to PostgreSQL database: {dbname} on {host}:{port} as {user}")
    conn = psycopg2.connect(
        dbname=dbname,
        user=user,
        password=password,
        host=host,
        port=port
    )
    conn.autocommit = True
    cursor = conn.cursor()
    
    # Check if the table exists
    cursor.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public'
            AND table_name = 'medical_document'
        );
    """)
    
    if not cursor.fetchone()[0]:
        print("Error: 'medical_document' table does not exist. Create database tables first.")
        conn.close()
        exit(1)
    
    # Check if ipfs_hash column exists
    cursor.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public'
            AND table_name = 'medical_document' 
            AND column_name = 'ipfs_hash'
        );
    """)
    
    ipfs_hash_exists = cursor.fetchone()[0]
    if not ipfs_hash_exists:
        print("Adding 'ipfs_hash' column...")
        cursor.execute("ALTER TABLE medical_document ADD COLUMN ipfs_hash VARCHAR(200);")
        print("✅ Added 'ipfs_hash' column")
    else:
        print("✅ 'ipfs_hash' column already exists")
    
    # Check if tx_hash column exists
    cursor.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public'
            AND table_name = 'medical_document' 
            AND column_name = 'tx_hash'
        );
    """)
    
    tx_hash_exists = cursor.fetchone()[0]
    if not tx_hash_exists:
        print("Adding 'tx_hash' column...")
        cursor.execute("ALTER TABLE medical_document ADD COLUMN tx_hash VARCHAR(200);")
        print("✅ Added 'tx_hash' column")
    else:
        print("✅ 'tx_hash' column already exists")
    
    print("\n✅ Database migration completed successfully!")
    conn.close()

except Exception as e:
    print(f"❌ Error performing database migration: {str(e)}")
    exit(1)
