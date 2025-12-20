from app import app
from extensions import db
from sqlalchemy import text

def check_schema():
    with app.app_context():
        with db.engine.connect() as conn:
            result = conn.execute(text("PRAGMA table_info(access_request)"))
            columns = [row[1] for row in result.fetchall()]
            print(f"Columns in access_request: {columns}")
            if 'seen' in columns:
                print("PASSED: 'seen' column exists.")
            else:
                print("FAILED: 'seen' column MISSING.")

if __name__ == "__main__":
    check_schema()
