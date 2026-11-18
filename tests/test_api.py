import pytest
from fastapi.testclient import TestClient
from backend.main import app

@pytest.fixture
def client():
    return TestClient(app)

def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Welcome to PandemicNet AI"
    assert data["health"] == "/health"

def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "database" in data
    assert "ml_model" in data

def test_agents_available(client):
    response = client.get("/agents/available")
    assert response.status_code == 200
    data = response.json()
    assert data["available"] is True

def test_agents_workflow(client):
    response = client.get("/agents/workflow")
    assert response.status_code == 200
    data = response.json()
    assert "diagram" in data
    assert len(data["diagram"]) > 0

def test_agents_config(client):
    response = client.get("/agents/config")
    assert response.status_code == 200
    data = response.json()
    assert "movement_probability" in data
    assert "base_infection_rate" in data
