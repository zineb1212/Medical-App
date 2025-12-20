import os
import numpy as np
from PIL import Image
import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import img_to_array

# Constants
MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'models', 'mri_best_model.keras')
TUMOR_TYPES = {
    0: 'Glioma',
    1: 'Meningioma', 
    2: 'No Tumor',
    3: 'Pituitary'
}

class AIModelService:
    _instance = None
    _model = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(AIModelService, cls).__new__(cls)
            cls._instance.load_model()
        return cls._instance

    def load_model(self):
        print(f"DEBUG: Calculated Model Path: {MODEL_PATH}")
        print(f"DEBUG: File exists? {os.path.exists(MODEL_PATH)}")
        try:
            if os.path.exists(MODEL_PATH):
                print(f"Loading AI Model from {MODEL_PATH}...")
                self._model = load_model(MODEL_PATH, compile=False)
                print("AI Model loaded successfully.")
            else:
                print(f"Error: Model file not found at {MODEL_PATH}")
                self._model = None
        except Exception as e:
            print(f"CRITICAL ERROR loading model: {e}")
            self._model = None

    def predict_mri(self, image_path):
        if not self._model:
            print("WARNING: Model not loaded. Using MOCK fallback for demonstration.")
            # Mock logic for demo purposes
            import random
            mock_types = ['Glioma', 'Meningioma', 'Hypophyse', 'Non Tumeur']
            mock_diagnosis = random.choice(mock_types)
            mock_confidence = round(random.uniform(85.0, 99.0), 2)
            mock_scores = {t: round(random.uniform(0.01, 0.1), 4) for t in mock_types}
            mock_scores[mock_diagnosis] = round(mock_confidence / 100, 4)
            
            return {
                "diagnosis": mock_diagnosis,
                "confidence": mock_confidence,
                "raw_scores": mock_scores,
                "note": "Mode Démontration (Modèle non chargé)"
            }

        try:
            # Load and preprocess image
            img = Image.open(image_path)
            img = img.resize((150, 150)) # Assuming model expects 150x150, adjust if needed
            
            # Simple preprocessing - adjust based on how model was trained
            img_array = img_to_array(img)
            img_array = np.expand_dims(img_array, axis=0) # Add batch dimension
            img_array = img_array / 255.0 # Normalize

            # Predict
            predictions = self._model.predict(img_array)
            score = tf.nn.softmax(predictions[0])
            
            # Get class with highest probability
            class_index = np.argmax(predictions[0])
            confidence = 100 * np.max(score)
            
            result = {
                "diagnosis": TUMOR_TYPES.get(class_index, "Unknown"),
                "confidence": round(confidence, 2),
                "raw_scores": {TUMOR_TYPES.get(i, str(i)): round(float(pred), 4) for i, pred in enumerate(predictions[0])}
            }
            return result

        except Exception as e:
            print(f"Prediction Error: {e}")
            return {"error": str(e)}

    def analyze_text(self, query, context=None):
        """
        Chat AI with OpenAI support and Dynamic Fallback.
        """
        query_lower = query.lower()
        
        # 1. Try Ollama (Free/Local) if configured
        ollama_model = os.environ.get("OLLAMA_MODEL")
        if ollama_model:
            try:
                import requests
                # Handle potential typo in user model name by logging it
                print(f"Using Ollama Model: {ollama_model}")
                
                # Force French for small models
                system_prompt = "Tu es MediBrain, un assistant médical utile. Tu dois toujours répondre en français. Sois bref et professionnel."
                if context:
                    system_prompt += f" Contexte : L'utilisateur a {len(context.get('folders', []))} dossiers."
                
                # TinyLlama often needs the instruction in the user prompt too
                full_query = f"{query} (Réponds en français)"

                # Ollama API structure
                payload = {
                     "model": ollama_model,
                     "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": full_query}
                    ],
                    "stream": False
                }
                
                response = requests.post("http://localhost:11434/api/chat", json=payload, timeout=120)
                if response.status_code == 200:
                    data = response.json()
                    return {"response": data.get("message", {}).get("content", "No content"), "source": f"MediBrain (Ollama: {ollama_model})"}
                else:
                    return {"response": f"⚠️ Erreur Ollama ({response.status_code}): {response.text}", "source": "System Error"}
            
            except Exception as e:
                print(f"Ollama Connection Error: {e}")
                return {"response": f"❌ Impossible de joindre Ollama: {str(e)}. Vérifiez que 'ollama serve' tourne sur votre PC.", "source": "System Error"}

        # 2. Try OpenAI if available
        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
             return {"response": "⚠️ Aucune IA configurée (Ni OpenAI, ni Ollama).", "source": "System"}

        try:
            from openai import OpenAI
            client = OpenAI(api_key=api_key)
            
            system_prompt = "You are MediBrain, a helpful medical assistant. Answer in French, pleasantly and professionally."
            if context:
                system_prompt += f" Context: User has {len(context.get('folders', []))} records."
            
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": query}
                ]
            )
            return {"response": response.choices[0].message.content, "source": "MediBrain (OpenAI)"}
        except Exception as e:
            print(f"OpenAI Error: {e}")
            return {"response": f"❌ Erreur OpenAI : {str(e)}", "source": "System Error"}

    def _get_fallback_response(self, query_lower, context):
        # Deprecated: Static fallback removed as per user request
        return {"response": "Le mode hors-ligne est désactivé. Veuillez configurer OpenAI.", "source": "System"}

    def analyze_record(self, record_data):
        """
        Risk analysis based on record data (mock logic).
        """
        risk_score = 10 # Base risk
        risk_factors = []

        # Analyze History
        family_history = (record_data.get('family_history') or '').lower()
        if "tumeur" in family_history or "cancer" in family_history:
            risk_score += 30
            risk_factors.append("Antécédents familiaux de tumeur/cancer")

        # Analyze Symptoms
        symptoms = (record_data.get('current_symptoms') or '').lower()
        if "maux de tête" in symptoms or "céphalées" in symptoms:
            risk_score += 15
            risk_factors.append("Maux de tête fréquents")
        if "vision" in symptoms:
            risk_score += 20
            risk_factors.append("Troubles de la vision")

        # Analyze Conditions
        conditions = (record_data.get('chronic_conditions') or '').lower()
        if "hypertension" in conditions:
            risk_score += 5
            risk_factors.append("Hypertension")

        # Cap score
        risk_score = min(risk_score, 100)

        level = "Faible"
        if risk_score > 30: level = "Modéré"
        if risk_score > 60: level = "Élevé"

        return {
            "risk_score": risk_score,
            "risk_level": level,
            "risk_factors": risk_factors,
            "recommendation": "Consultez un spécialiste pour un bilan approfondi." if risk_score > 40 else "Continuez votre suivi régulier."
        }
