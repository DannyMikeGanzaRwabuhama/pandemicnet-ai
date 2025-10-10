"""
Machine Learning service for risk prediction
Trains and uses models to predict contact likelihood and infection risk
"""
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import numpy as np
import pickle
import os
from pathlib import Path
from typing import Dict, List, Tuple
import logging
from backend.config import get_settings
from backend.database import get_db
from datetime import date

logger = logging.getLogger(__name__)
settings = get_settings()


class MLService:
    """Machine learning service for contact and risk prediction"""

    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.model_path = settings.ml_model_path
        self.db = get_db()
        self._load_or_create_model()

    def _load_or_create_model(self):
        """Load existing model or create new one"""
        if os.path.exists(self.model_path):
            try:
                with open(self.model_path, "rb") as f:
                    saved_data = pickle.load(f)
                    self.model = saved_data["model"]
                    self.scaler = saved_data["scaler"]
                logger.info(f"✅ Loaded ML model from {self.model_path}")
            except Exception as e:
                logger.warning(f"⚠️ Failed to load model: {e}. Creating new model.")
                self._create_new_model()
        else:
            self._create_new_model()

    def _create_new_model(self):
        """Create a new Random Forest model"""
        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            min_samples_split=5,
            random_state=42
        )
        logger.info("✅ Created new ML model")

    def save_model(self):
        """Save the trained model to disk"""
        Path(self.model_path).parent.mkdir(parents=True, exist_ok=True)

        with open(self.model_path, 'wb') as f:
            pickle.dump({
                'model': self.model,
                'scaler': self.scaler
            }, f)

            logger.info(f"💾 Model saved to {self.model_path}")

    @staticmethod
    def extract_features(data: Dict) -> np.ndarray:
        """
        Extract features from contact data
        Features: contact_count, days_since_contact, mutual_contacts,
                proximity_score, duration_score
        """

        contact_count = data.get('contact_count', 0)
        days_ago = data.get('days_since_contact', 30)
        mutual_contacts = data.get('mutual_contacts', 0)
        proximity = data.get('proximity', 'medium')
        duration_minutes = data.get('duration_minutes', 30)

        # Probability scoring
        proximity_scores = {'close': 1.0, 'medium': 0.5, 'far': 0.2}
        proximity_score = proximity_scores.get(proximity, 0.5)

        # Duration scoring (normalized)
        duration_score = min(duration_minutes / 60.0, 2.0)  # Cap at 2 hours

        # Recency score (inverse of days)
        recency_score = 1.0 / (1.0 + days_ago / 7.0)  # Decay over weeks

        features = [
            contact_count,
            days_ago,
            mutual_contacts,
            proximity_score,
            duration_score,
            recency_score
        ]

        return np.array(features).reshape(1, -1)

    def train_model(self, training_data: List[Dict] = None):
        """
        Train the model on contact data
        If not data provided, generates synthetic training data
        """
        if training_data is None:
            training_data = self._generate_synthetic_training_data()

        X = []
        y = []

        for sample in training_data:
            features = self.extract_features(sample)
            X.append(features[0])
            y.append(sample['is_contact'])

        X = np.array(X)
        y = np.array(y)

        # Scale features
        X_scaled = self.scaler.fit_transform(X)

        # Train model
        self.model.fit(X_scaled, y)

        # Calculate accuracy
        accuracy = self.model.score(X_scaled, y)
        logger.info(f"🎯 Model trained with accuracy: {accuracy:.2%}")

        # Save model
        self.save_model()

        return {
            "status": "success",
            "accuracy": accuracy,
            "samples": len(training_data)
        }

    def predict_contact_probability(self, data: Dict) -> Tuple[float, Dict]:
        """
        Predict probability of contact
        Returns (probability, explanation_data)
        """
        if self.model is None:
            logger.warning("Model not trained. Training with synthetic data...")
            self.train_model()

        features = self.extract_features(data)
        features_scaled = self.scaler.transform(features)

        probability = self.model.predict_proba(features_scaled)[0][1]

        # Get feature importance
        feature_names = [
            'contact_count', 'days_ago', 'mutual_contacts',
            'proximity_score', 'duration_score', 'recency_score'
        ]

        explanation = {
            "probability": float(probability),
            "risk_level": self._get_risk_level(probability),
            "features": dict(zip(feature_names, features[0])),
            "top_factors": self._get_top_factors(features[0], feature_names)
        }

        return probability, explanation

    @staticmethod
    def _get_risk_level(probability: float) -> str:
        """Convert probability to risk level"""
        if probability >= 0.7:
            return "HIGH"
        elif probability >= 0.4:
            return "MEDIUM"
        else:
            return "LOW"

    def _get_top_factors(self, features: np.ndarray, feature_names: List[str]) -> List[str]:
        """Identify top contributing factors"""
        feature_importance = self.model.feature_importances_

        # Sort by importance
        importance_pairs = list(zip(feature_names, feature_importance, features))
        importance_pairs.sort(key=lambda x: x[1], reverse=True)

        top_factors = []
        for name, importance, value in importance_pairs[:3]:
            top_factors.append(f"{name}: {value:.2f} (importance: {importance:.2%})")

        return top_factors

    def predict_infection_risk(self, person_id: str) -> Dict:
        """
        Calculate infection risk for a person based on their contact network
        """
        # Get person's contacts
        query = """
                MATCH (p:Individual {unique_id: $person_id})-[r:MET_AT]-(contact:Individual)
                WHERE r.contact_date >= date() - duration({days: 14})
                RETURN contact.unique_id as contact_id,
                       contact.infected as is_infected,
                       r.contact_date as contact_date,
                       r.proximity as proximity,
                       r.duration_minutes as duration
                """

        contacts = self.db.execute_query(query, {"person_id": person_id})

        if not contacts:
            return {
                "person_id": person_id,
                "risk_score": 0.0,
                "risk_level": "LOW",
                "exposed_contacts": 0,
                "explanation": "No recent contacts found"
            }

        # Calculate risk based on infected contacts
        total_risk = 0.0
        infected_contacts = []

        for contact in contacts:
            if contact['is_infected']:
                contact_date_native = contact['contact_date'].to_native() if hasattr(contact['contact_date'],
                                                                                     'to_native') else contact[
                    'contact_date']

                days_ago = (date.today() - contact_date_native).days

                proximity = contact.get('proximity', 'medium')
                duration = contact.get('duration', 30)

                # Calculate contact-specific risk
                contact_data = {
                    'contact_count': 1,
                    'days_since_contact': days_ago,
                    'mutual_contacts': 0,
                    'proximity': proximity,
                    'duration_minutes': duration
                }

                contact_risk, _ = self.predict_contact_probability(contact_data)
                total_risk += contact_risk

                infected_contacts.append({
                    "contact_id": contact['contact_id'],
                    "days_ago": days_ago,
                    "risk_contribution": contact_risk
                })

        # Normalize risk score
        risk_score = min(total_risk, 1.0)

        return {
            "person_id": person_id,
            "risk_score": float(risk_score),
            "risk_level": self._get_risk_level(risk_score),
            "exposed_contacts": len(infected_contacts),
            "total_contacts": len(contacts),
            "infected_contacts": infected_contacts,
            "explanation": f"Risk calculated from {len(contacts)} contacts in last 14 days"
        }

    def _generate_synthetic_training_data(self, n_samples: int = 1000) -> List[Dict]:
        """Generate synthetic training data for initial model training"""
        logger.info(f"🎲 Generating {n_samples} synthetic training samples")

        np.random.seed(42)
        training_data = []

        for _ in range(n_samples):
            # Generate realistic contact patterns
            contact_count = np.random.randint(1, 50)
            days_ago = np.random.randint(0, 30)
            mutual_contacts = np.random.randint(0, min(contact_count, 20))
            proximity = np.random.choice(['close', 'medium', 'far'], p=[0.3, 0.5, 0.2])
            duration = np.random.randint(5, 240)

            # Generate label based on realistic rules
            is_contact = self._synthetic_contact_rule(
                contact_count, days_ago, mutual_contacts, proximity, duration
            )

            training_data.append({
                "contact_count": contact_count,
                "days_since_contact": days_ago,
                "mutual_contacts": mutual_contacts,
                "proximity": proximity,
                "duration_minutes": duration,
                "is_contact": is_contact
            })

        return training_data

    @staticmethod
    def _synthetic_contact_rule(contact_count, days_ago, mutual_contacts, proximity, duration) -> int:
        """Rules for generating synthetic contact labels"""
        score = 0

        # More contacts = higher probability
        score += contact_count / 50.0

        # Recent contacts more likely
        score += max(0, (30 - days_ago) / 30.0)

        # Mutual contacts increase probability
        score += mutual_contacts / 20.0

        # Proximity matters
        proximity_weight = {'close': 0.8, 'medium': 0.4, 'far': 0.1}
        score += proximity_weight[proximity]

        # Duration matters
        score += min(duration / 120.0, 0.5)

        # Add some randomness
        score += np.random.uniform(-0.2, 0.2)

        # Threshold at 0.5
        return 1 if score > 1.5 else 0

    def batch_predict_contacts(self, person_id: str) -> List[Dict]:
        """
        Predict all potential second-degree contacts for a person
        Returns list of predicted contacts with confidence scores
        """
        query = """
                MATCH (p:Individual {unique_id: $person_id})-[:MET_AT]-(first:Individual)-[:MET_AT]-(second:Individual)
                WHERE p <> second 
                AND NOT (p)-[:MET_AT]-(second)
                WITH second, first, count(DISTINCT first) as mutual_count
                MATCH (second)-[r:MET_AT]-()
                WITH second, mutual_count, 
                     count(r) as contact_count,
                     max(r.contact_date) as last_contact
                RETURN DISTINCT second.unique_id as unique_id,
                       contact_count,
                       mutual_count,
                       last_contact
                LIMIT 50
                """

        results = self.db.execute_query(query, {"person_id": person_id})

        predictions = []
        for record in results:
            last_contact_native = record['last_contact']
            if last_contact_native and hasattr(last_contact_native, 'to_native'):
                last_contact_native = last_contact_native.to_native()

            days_ago = (date.today() - last_contact_native).days if last_contact_native else 30

            data = {
                'contact_count': record['contact_count'],
                'days_since_contact': days_ago,
                'mutual_contacts': record['mutual_count'],
                'proximity': 'medium',
                'duration_minutes': 30
            }

            probability, explanation = self.predict_contact_probability(data)

            predictions.append({
                'unique_id': record['unique_id'],
                'confidence': probability,
                'risk_level': explanation['risk_level'],
                'factors': explanation['features']
            })

        # Sort by confidence
        predictions.sort(key=lambda x: x['confidence'], reverse=True)

        return predictions


# Global ML service instance
ml_service = MLService()


def get_ml_service() -> MLService:
    """Dependency injection for FastAPI routes"""
    return ml_service
