from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report, roc_auc_score
)
from sklearn.impute import SimpleImputer
import joblib
import os
import json
from datetime import datetime

# Import all ML models
from sklearn.ensemble import (
    RandomForestClassifier,
    GradientBoostingClassifier,
    AdaBoostClassifier,
    ExtraTreesClassifier,
    BaggingClassifier,
    VotingClassifier
)
from sklearn.tree import DecisionTreeClassifier
from sklearn.linear_model import LogisticRegression, RidgeClassifier, SGDClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.neural_network import MLPClassifier
from sklearn.discriminant_analysis import LinearDiscriminantAnalysis, QuadraticDiscriminantAnalysis

# XGBoost, LightGBM, CatBoost
try:
    from xgboost import XGBClassifier
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False

try:
    from lightgbm import LGBMClassifier
    LIGHTGBM_AVAILABLE = True
except ImportError:
    LIGHTGBM_AVAILABLE = False

try:
    from catboost import CatBoostClassifier
    CATBOOST_AVAILABLE = True
except ImportError:
    CATBOOST_AVAILABLE = False

app = FastAPI(title="Stock ML Service", version="1.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store trained models in memory
trained_models = {}
model_history = []

# Available models configuration
AVAILABLE_MODELS = {
    "random_forest": {
        "name": "Random Forest",
        "class": RandomForestClassifier,
        "params": {"n_estimators": 100, "max_depth": 10, "random_state": 42, "n_jobs": -1},
        "description": "Ensemble of decision trees with bagging"
    },
    "extra_trees": {
        "name": "Extra Trees",
        "class": ExtraTreesClassifier,
        "params": {"n_estimators": 100, "max_depth": 10, "random_state": 42, "n_jobs": -1},
        "description": "Extremely randomized trees"
    },
    "gradient_boosting": {
        "name": "Gradient Boosting",
        "class": GradientBoostingClassifier,
        "params": {"n_estimators": 100, "max_depth": 5, "learning_rate": 0.1, "random_state": 42},
        "description": "Sequential ensemble with gradient descent"
    },
    "adaboost": {
        "name": "AdaBoost",
        "class": AdaBoostClassifier,
        "params": {"n_estimators": 100, "learning_rate": 0.1, "random_state": 42, "algorithm": "SAMME"},
        "description": "Adaptive boosting algorithm"
    },
    "bagging": {
        "name": "Bagging Classifier",
        "class": BaggingClassifier,
        "params": {"n_estimators": 50, "random_state": 42, "n_jobs": -1},
        "description": "Bootstrap aggregating"
    },
    "decision_tree": {
        "name": "Decision Tree",
        "class": DecisionTreeClassifier,
        "params": {"max_depth": 10, "random_state": 42},
        "description": "Single decision tree classifier"
    },
    "logistic_regression": {
        "name": "Logistic Regression",
        "class": LogisticRegression,
        "params": {"max_iter": 1000, "random_state": 42, "n_jobs": -1},
        "description": "Linear model for classification"
    },
    "ridge_classifier": {
        "name": "Ridge Classifier",
        "class": RidgeClassifier,
        "params": {"random_state": 42},
        "description": "Ridge regression for classification"
    },
    "sgd_classifier": {
        "name": "SGD Classifier",
        "class": SGDClassifier,
        "params": {"max_iter": 1000, "random_state": 42, "n_jobs": -1},
        "description": "Stochastic Gradient Descent"
    },
    "svm": {
        "name": "Support Vector Machine",
        "class": SVC,
        "params": {"kernel": "rbf", "probability": True, "random_state": 42},
        "description": "Support Vector Classifier with RBF kernel"
    },
    "svm_linear": {
        "name": "SVM Linear",
        "class": SVC,
        "params": {"kernel": "linear", "probability": True, "random_state": 42},
        "description": "Support Vector Classifier with linear kernel"
    },
    "knn": {
        "name": "K-Nearest Neighbors",
        "class": KNeighborsClassifier,
        "params": {"n_neighbors": 5, "n_jobs": -1},
        "description": "Instance-based learning"
    },
    "naive_bayes": {
        "name": "Naive Bayes",
        "class": GaussianNB,
        "params": {},
        "description": "Gaussian Naive Bayes"
    },
    "mlp": {
        "name": "Neural Network (MLP)",
        "class": MLPClassifier,
        "params": {"hidden_layer_sizes": (100, 50), "max_iter": 500, "random_state": 42},
        "description": "Multi-layer Perceptron"
    },
    "lda": {
        "name": "Linear Discriminant Analysis",
        "class": LinearDiscriminantAnalysis,
        "params": {},
        "description": "Linear Discriminant Analysis"
    },
    "qda": {
        "name": "Quadratic Discriminant Analysis",
        "class": QuadraticDiscriminantAnalysis,
        "params": {},
        "description": "Quadratic Discriminant Analysis"
    }
}

# Add XGBoost if available
if XGBOOST_AVAILABLE:
    AVAILABLE_MODELS["xgboost"] = {
        "name": "XGBoost",
        "class": XGBClassifier,
        "params": {"n_estimators": 100, "max_depth": 6, "learning_rate": 0.1, "random_state": 42, "n_jobs": -1, "eval_metric": "logloss"},
        "description": "Extreme Gradient Boosting"
    }

# Add LightGBM if available
if LIGHTGBM_AVAILABLE:
    AVAILABLE_MODELS["lightgbm"] = {
        "name": "LightGBM",
        "class": LGBMClassifier,
        "params": {"n_estimators": 100, "max_depth": 6, "learning_rate": 0.1, "random_state": 42, "n_jobs": -1, "verbose": -1},
        "description": "Light Gradient Boosting Machine"
    }

# Add CatBoost if available
if CATBOOST_AVAILABLE:
    AVAILABLE_MODELS["catboost"] = {
        "name": "CatBoost",
        "class": CatBoostClassifier,
        "params": {"iterations": 100, "depth": 6, "learning_rate": 0.1, "random_state": 42, "verbose": False},
        "description": "Categorical Boosting"
    }


class TrainRequest(BaseModel):
    data: List[Dict[str, Any]]
    features: List[str]
    target: str
    model_type: str
    test_size: float = 0.2
    cross_validation: bool = True
    cv_folds: int = 5
    custom_params: Optional[Dict[str, Any]] = None
    model_name: Optional[str] = None  # Custom name for the model


class PredictRequest(BaseModel):
    data: List[Dict[str, Any]]
    features: List[str]
    model_id: str


class CompareModelsRequest(BaseModel):
    data: List[Dict[str, Any]]
    features: List[str]
    target: str
    models: List[str]
    test_size: float = 0.2


class FeatureImportanceRequest(BaseModel):
    model_id: str
    top_n: int = 20


@app.get("/")
def read_root():
    return {"message": "Stock ML Service is running", "version": "1.0.0"}


@app.get("/models")
def get_available_models():
    """Get list of all available ML models"""
    models = []
    for key, config in AVAILABLE_MODELS.items():
        models.append({
            "id": key,
            "name": config["name"],
            "description": config["description"],
            "default_params": config["params"]
        })
    return {"models": models, "total": len(models)}


@app.get("/trained-models")
def get_trained_models():
    """Get list of trained models"""
    models = []
    for model_id, model_data in trained_models.items():
        models.append({
            "id": model_id,
            "model_type": model_data["model_type"],
            "model_name": model_data["model_name"],
            "features": model_data["features"],
            "target": model_data["target"],
            "metrics": model_data["metrics"],
            "trained_at": model_data["trained_at"]
        })
    return {"models": models}


@app.post("/train")
def train_model(request: TrainRequest):
    """Train a machine learning model"""
    try:
        # Validate model type
        if request.model_type not in AVAILABLE_MODELS:
            raise HTTPException(status_code=400, detail=f"Unknown model type: {request.model_type}")
        
        # Convert data to DataFrame
        df = pd.DataFrame(request.data)
        
        # Validate features and target
        missing_features = [f for f in request.features if f not in df.columns]
        if missing_features:
            raise HTTPException(status_code=400, detail=f"Missing features: {missing_features}")
        
        if request.target not in df.columns:
            raise HTTPException(status_code=400, detail=f"Target column not found: {request.target}")
        
        # Prepare features and target
        X = df[request.features].copy()
        y = df[request.target].copy()
        
        # Handle missing values
        imputer = SimpleImputer(strategy='median')
        X = pd.DataFrame(imputer.fit_transform(X), columns=request.features)
        
        # Remove rows where target is null
        mask = y.notna()
        X = X[mask]
        y = y[mask]
        
        # Encode target if needed
        label_encoder = None
        original_classes = None
        if y.dtype == 'object' or isinstance(y.iloc[0], str):
            label_encoder = LabelEncoder()
            original_classes = y.unique().tolist()
            y = label_encoder.fit_transform(y)
        else:
            original_classes = sorted(y.unique().tolist())
        
        # Scale features
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y, test_size=request.test_size, random_state=42, stratify=y
        )
        
        # Get model configuration
        model_config = AVAILABLE_MODELS[request.model_type]
        params = model_config["params"].copy()
        
        # Apply custom params if provided
        if request.custom_params:
            params.update(request.custom_params)
        
        # Create and train model
        model = model_config["class"](**params)
        model.fit(X_train, y_train)
        
        # Predictions
        y_pred = model.predict(X_test)
        y_pred_train = model.predict(X_train)
        
        # Calculate metrics
        metrics = {
            "accuracy": float(accuracy_score(y_test, y_pred)),
            "precision": float(precision_score(y_test, y_pred, average='weighted', zero_division=0)),
            "recall": float(recall_score(y_test, y_pred, average='weighted', zero_division=0)),
            "f1_score": float(f1_score(y_test, y_pred, average='weighted', zero_division=0)),
            "train_accuracy": float(accuracy_score(y_train, y_pred_train)),
            "confusion_matrix": confusion_matrix(y_test, y_pred).tolist(),
            "classification_report": classification_report(y_test, y_pred, output_dict=True, zero_division=0)
        }
        
        # Calculate ROC AUC for binary classification
        if len(original_classes) == 2:
            try:
                if hasattr(model, 'predict_proba'):
                    y_proba = model.predict_proba(X_test)[:, 1]
                    metrics["roc_auc"] = float(roc_auc_score(y_test, y_proba))
            except:
                pass
        
        # Cross validation if requested
        cv_scores = None
        if request.cross_validation:
            try:
                cv = StratifiedKFold(n_splits=request.cv_folds, shuffle=True, random_state=42)
                cv_scores = cross_val_score(model_config["class"](**params), X_scaled, y, cv=cv, scoring='accuracy')
                metrics["cv_scores"] = cv_scores.tolist()
                metrics["cv_mean"] = float(cv_scores.mean())
                metrics["cv_std"] = float(cv_scores.std())
            except Exception as e:
                metrics["cv_error"] = str(e)
        
        # Get feature importance if available
        feature_importance = None
        if hasattr(model, 'feature_importances_'):
            importance = model.feature_importances_
            feature_importance = [
                {"feature": f, "importance": float(imp)}
                for f, imp in sorted(zip(request.features, importance), key=lambda x: x[1], reverse=True)
            ]
        elif hasattr(model, 'coef_'):
            importance = np.abs(model.coef_).mean(axis=0) if len(model.coef_.shape) > 1 else np.abs(model.coef_)
            feature_importance = [
                {"feature": f, "importance": float(imp)}
                for f, imp in sorted(zip(request.features, importance), key=lambda x: x[1], reverse=True)
            ]
        
        # Generate model ID
        model_id = f"{request.model_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Use custom name if provided, otherwise use default model name
        display_name = request.model_name if request.model_name else model_config["name"]
        
        # Store model
        trained_models[model_id] = {
            "model": model,
            "scaler": scaler,
            "imputer": imputer,
            "label_encoder": label_encoder,
            "model_type": request.model_type,
            "model_name": display_name,
            "features": request.features,
            "target": request.target,
            "original_classes": original_classes,
            "metrics": metrics,
            "feature_importance": feature_importance,
            "params": params,
            "trained_at": datetime.now().isoformat(),
            "data_shape": {"samples": len(df), "features": len(request.features)}
        }
        
        # Add to history
        model_history.append({
            "model_id": model_id,
            "model_type": request.model_type,
            "model_name": display_name,
            "accuracy": metrics["accuracy"],
            "trained_at": datetime.now().isoformat()
        })
        
        return {
            "success": True,
            "model_id": model_id,
            "model_name": display_name,
            "model_type_name": model_config["name"],
            "metrics": metrics,
            "feature_importance": feature_importance,
            "data_info": {
                "total_samples": len(df),
                "train_samples": len(X_train),
                "test_samples": len(X_test),
                "features_count": len(request.features),
                "classes": original_classes
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict")
def predict(request: PredictRequest):
    """Make predictions using a trained model"""
    try:
        if request.model_id not in trained_models:
            raise HTTPException(status_code=404, detail=f"Model not found: {request.model_id}")
        
        model_data = trained_models[request.model_id]
        model = model_data["model"]
        scaler = model_data["scaler"]
        imputer = model_data["imputer"]
        label_encoder = model_data["label_encoder"]
        
        # Convert data to DataFrame
        df = pd.DataFrame(request.data)
        
        # Validate features
        missing_features = [f for f in request.features if f not in df.columns]
        if missing_features:
            raise HTTPException(status_code=400, detail=f"Missing features: {missing_features}")
        
        # Prepare features
        X = df[request.features].copy()
        
        # Handle missing values
        X = pd.DataFrame(imputer.transform(X), columns=request.features)
        
        # Scale features
        X_scaled = scaler.transform(X)
        
        # Make predictions
        predictions = model.predict(X_scaled)
        
        # Get probabilities if available
        probabilities = None
        if hasattr(model, 'predict_proba'):
            probabilities = model.predict_proba(X_scaled).tolist()
        
        # Decode labels if needed
        if label_encoder:
            predictions = label_encoder.inverse_transform(predictions)
        
        return {
            "success": True,
            "predictions": predictions.tolist(),
            "probabilities": probabilities,
            "model_id": request.model_id,
            "model_name": model_data["model_name"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/compare")
def compare_models(request: CompareModelsRequest):
    """Compare multiple models on the same dataset"""
    try:
        # Convert data to DataFrame
        df = pd.DataFrame(request.data)
        
        # Validate features and target
        missing_features = [f for f in request.features if f not in df.columns]
        if missing_features:
            raise HTTPException(status_code=400, detail=f"Missing features: {missing_features}")
        
        if request.target not in df.columns:
            raise HTTPException(status_code=400, detail=f"Target column not found: {request.target}")
        
        # Prepare features and target
        X = df[request.features].copy()
        y = df[request.target].copy()
        
        # Handle missing values
        imputer = SimpleImputer(strategy='median')
        X = pd.DataFrame(imputer.fit_transform(X), columns=request.features)
        
        # Remove rows where target is null
        mask = y.notna()
        X = X[mask]
        y = y[mask]
        
        # Encode target if needed
        label_encoder = None
        if y.dtype == 'object' or isinstance(y.iloc[0], str):
            label_encoder = LabelEncoder()
            y = label_encoder.fit_transform(y)
        
        # Scale features
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y, test_size=request.test_size, random_state=42, stratify=y
        )
        
        results = []
        
        for model_type in request.models:
            if model_type not in AVAILABLE_MODELS:
                results.append({
                    "model_type": model_type,
                    "error": f"Unknown model type: {model_type}"
                })
                continue
            
            try:
                model_config = AVAILABLE_MODELS[model_type]
                model = model_config["class"](**model_config["params"])
                model.fit(X_train, y_train)
                
                y_pred = model.predict(X_test)
                
                accuracy = float(accuracy_score(y_test, y_pred))
                precision = float(precision_score(y_test, y_pred, average='weighted', zero_division=0))
                recall = float(recall_score(y_test, y_pred, average='weighted', zero_division=0))
                f1 = float(f1_score(y_test, y_pred, average='weighted', zero_division=0))
                
                results.append({
                    "model_type": model_type,
                    "model_name": model_config["name"],
                    "accuracy": accuracy,
                    "precision": precision,
                    "recall": recall,
                    "f1_score": f1
                })
                
            except Exception as e:
                results.append({
                    "model_type": model_type,
                    "model_name": model_config["name"],
                    "error": str(e)
                })
        
        # Sort by accuracy
        results.sort(key=lambda x: x.get("accuracy", 0), reverse=True)
        
        return {
            "success": True,
            "results": results,
            "data_info": {
                "total_samples": len(df),
                "train_samples": len(X_train),
                "test_samples": len(X_test)
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/feature-importance/{model_id}")
def get_feature_importance(model_id: str, top_n: int = 20):
    """Get feature importance for a trained model"""
    if model_id not in trained_models:
        raise HTTPException(status_code=404, detail=f"Model not found: {model_id}")
    
    model_data = trained_models[model_id]
    feature_importance = model_data.get("feature_importance")
    
    if not feature_importance:
        raise HTTPException(status_code=400, detail="Feature importance not available for this model")
    
    return {
        "model_id": model_id,
        "model_name": model_data["model_name"],
        "feature_importance": feature_importance[:top_n]
    }


@app.delete("/models/{model_id}")
def delete_model(model_id: str):
    """Delete a trained model"""
    if model_id not in trained_models:
        raise HTTPException(status_code=404, detail=f"Model not found: {model_id}")
    
    del trained_models[model_id]
    return {"success": True, "message": f"Model {model_id} deleted"}


@app.get("/history")
def get_training_history():
    """Get training history"""
    return {"history": model_history}


@app.post("/save-model/{model_id}")
def save_model(model_id: str):
    """Save a trained model to disk"""
    if model_id not in trained_models:
        raise HTTPException(status_code=404, detail=f"Model not found: {model_id}")
    
    try:
        model_data = trained_models[model_id]
        
        # Create models directory if not exists
        os.makedirs("saved_models", exist_ok=True)
        
        # Save model
        filepath = f"saved_models/{model_id}.joblib"
        joblib.dump(model_data, filepath)
        
        return {"success": True, "filepath": filepath}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/load-model/{model_id}")
def load_model(model_id: str):
    """Load a saved model from disk"""
    try:
        filepath = f"saved_models/{model_id}.joblib"
        if not os.path.exists(filepath):
            raise HTTPException(status_code=404, detail=f"Saved model not found: {filepath}")
        
        model_data = joblib.load(filepath)
        trained_models[model_id] = model_data
        
        return {"success": True, "model_id": model_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
