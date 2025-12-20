import sys
import os

# Add backend to path so imports work
sys.path.append(os.path.dirname(__file__))

from services.ai_service import AIModelService

print("--- Starting Standalone Model Load Test ---")
service = AIModelService()
service.load_model()
print("--- Test Finished ---")

if service._model:
    print("SUCCESS: Model loaded.")
else:
    print("FAILURE: Model is None.")
