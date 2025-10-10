# 🦠 PandemicNet AI

> **Real-World Pandemic Network Intelligence**  
> Turn invisible human networks into visual, measurable, explainable systems.

![Phase](https://img.shields.io/badge/Phase-1%20Complete-success)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688)
![Neo4j](https://img.shields.io/badge/Neo4j-5.x-008CC1)
![Python](https://img.shields.io/badge/Python-3.11+-blue)

---

## 🎯 What is PandemicNet?

PandemicNet AI is a **real-time pandemic network simulation and visualization system** that:

- 📊 **Models human contact networks** using graph database technology
- 🧠 **Predicts infection spread** with machine learning
- 🤖 **Generates AI-powered insights** using Gemini AI
- 🔬 **Enables contact tracing** through network analysis
- 📈 **Visualizes network dynamics** in real-time

### Core Principle

> "Show that science and the real world aren't two different things — they're one connected network we can see, measure,
> and understand."

---

## ✨ Features

### Phase 1 (Current) ✅

- ✅ **FastAPI Backend** - High-performance async API
- ✅ **Neo4j Graph Database** - Native graph operations for contact networks
- ✅ **Machine Learning** - Risk prediction with Random Forest
- ✅ **Gemini AI Integration** - Natural language explanations
- ✅ **Contact Tracing** - Multi-degree network analysis
- ✅ **Streamlit UI** - Interactive debug interface
- ✅ **Network Analytics** - Centrality, communities, superspreaders
- ✅ **Infection Modeling** - Exposure chains and risk scoring

### Coming Soon 🚀

- 📍 **Phase 2**: Next.js + D3.js + Mapbox visualization
- 🤖 **Phase 3**: AI agents with LangGraph
- 💉 **Phase 4**: Vaccination tracking
- 🏥 **Phase 5**: Resource allocation dashboard

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Streamlit UI                       │
│              (Debug & Testing Interface)             │
└──────────────────┬──────────────────────────────────┘
                   │ HTTP/REST
┌──────────────────▼──────────────────────────────────┐
│              FastAPI Backend                         │
│  ┌────────────┬──────────────┬──────────────┐       │
│  │  Routers   │   Services   │   Models     │       │
│  │            │              │              │       │
│  │ Individuals│ ML Service   │  Pydantic    │       │
│  │ Contacts   │ AI Service   │  Validation  │       │
│  │ Infections │ Network Svc  │              │       │
│  │ Graph      │              │              │       │
│  └────────────┴──────────────┴──────────────┘       │
└──────────────────┬──────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
┌───────▼────────┐   ┌────────▼────────┐
│   Neo4j DB     │   │   Gemini AI     │
│  Graph Storage │   │  Explanations   │
└────────────────┘   └─────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.11+**
- **Neo4j Desktop** (local) or **Neo4j Aura** (cloud)
- **Gemini API Key** ([Get it here](https://makersuite.google.com/app/apikey))

### 1. Install Neo4j Desktop

1. Download from [neo4j.com/download](https://neo4j.com/download/)
2. Create a new project: "PandemicNet"
3. Create a database:
    - Name: `pandemicnet-local`
    - Password: `password123` (or your choice)
4. Start the database (wait for green status)

### 2. Clone & Setup

```bash
# Clone repository
git clone https://github.com/DannyMikeGanzaRwabuhama/pandemicnet-ai.git
cd pandemicnet-ai

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Configure Environment

Create `.env` file in root directory:

```bash
# Neo4j Configuration
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password123
NEO4J_DATABASE=pandemicnet-local

# Gemini AI
GOOGLE_API_KEY=your_gemini_api_key_here

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=True
```

### 4. Run the Application

**Terminal 1 - Start FastAPI Backend:**

```bash
python -m backend.main
```

**Terminal 2 - Start Streamlit UI:**

```bash
streamlit run streamlit_ui/app.py
```

### 5. Generate Test Data

Open browser to:

- **API Docs**: http://localhost:8000/docs
- **Streamlit UI**: http://localhost:8501

In Streamlit sidebar:

1. Click "🎲 Generate Test Data"
2. Wait for completion
3. Explore the network!

---

## 📖 API Documentation

### Base URL

```
http://localhost:8000
```

### Key Endpoints

#### **Individuals**

```bash
POST   /individuals/          # Create individual
GET    /individuals/{id}      # Get individual
GET    /individuals/          # List all
DELETE /individuals/{id}      # Delete individual
```

#### **Contacts**

```bash
POST   /contacts/                    # Create contact
GET    /contacts/{id}/direct         # Get direct contacts
GET    /contacts/{id}/trace          # Full contact trace
GET    /contacts/{id}/path/{target}  # Find connection path
```

#### **Infections**

```bash
POST   /infections/report            # Report infection
GET    /infections/risk/{id}         # Calculate risk
GET    /infections/superspreaders    # Identify superspreaders
GET    /infections/exposure-chains/{id}  # Trace exposure
```

#### **Network Graph**

```bash
GET    /graph/network          # Full network data
GET    /graph/centrality       # Most connected nodes
GET    /graph/communities      # Detect communities
GET    /graph/degrees/{id}     # Six degrees analysis
```

---

## 💡 Usage Examples

### Create an Individual

```python
import requests

response = requests.post("http://localhost:8000/individuals/", json={
    "unique_id": "alice123",
    "phone_number": "0781234567",
    "location": "Kigali"
})
print(response.json())
```

### Add a Contact

```python
response = requests.post("http://localhost:8000/contacts/", json={
    "individual_id": "alice123",
    "contact_id": "bob456",
    "contact_date": "2025-10-09",
    "proximity": "close",
    "duration_minutes": 60
})
```

### Report Infection

```python
response = requests.post("http://localhost:8000/infections/report", json={
    "unique_id": "alice123",
    "infection_date": "2025-10-09",
    "severity": "moderate"
})
print(response.json()['message'])
```

### Trace Contacts

```python
response = requests.get("http://localhost:8000/contacts/alice123/trace")
result = response.json()

print(f"Direct contacts: {len(result['direct_contacts'])}")
print(f"Predicted contacts: {len(result['predicted_contacts'])}")
print(f"AI Insight: {result['ai_insights']}")
```

---

## 🧪 Testing

### Manual Testing with Streamlit

1. Open http://localhost:8501
2. Generate test data (50 individuals recommended)
3. Navigate through tabs:
    - **Individuals**: Add/search people
    - **Contacts**: Create relationships
    - **Infections**: Report cases
    - **Network Analysis**: View graph
    - **Contact Tracing**: Run ML predictions

### API Testing with Swagger

1. Open http://localhost:8000/docs
2. Use "Try it out" on any endpoint
3. Interactive API exploration

---

## 🗂️ Project Structure

```
pandemicnet/
├── backend/
│   ├── main.py              # FastAPI app
│   ├── config.py            # Configuration
│   ├── database.py          # Neo4j connection
│   ├── models.py            # Pydantic schemas
│   ├── routers/
│   │   ├── individuals.py   # Person CRUD
│   │   ├── contacts.py      # Contact management
│   │   ├── infections.py    # Infection tracking
│   │   └── graph.py         # Network analysis
│   ├── services/
│   │   ├── ml_service.py    # ML predictions
│   │   ├── ai_service.py    # Gemini AI
│   │   └── network_service.py  # Graph algorithms
│   └── utils/
│       ├── validators.py    # Validation logic
│       └── seed_data.py     # Test data generator
├── streamlit_ui/
│   └── app.py               # Streamlit interface
├── models/                  # ML model storage
├── .env                     # Environment config
├── requirements.txt         # Dependencies
└── README.md               # This file
```

---

## 🔧 Configuration

### Environment Variables

| Variable         | Description          | Default                 |
|------------------|----------------------|-------------------------|
| `NEO4J_URI`      | Neo4j connection URI | `bolt://localhost:7687` |
| `NEO4J_USER`     | Neo4j username       | `neo4j`                 |
| `NEO4J_PASSWORD` | Neo4j password       | `password123`           |
| `NEO4J_DATABASE` | Neo4j database       | `pandemicnet-local`     |
| `GOOGLE_API_KEY` | Gemini API key       | Required                |
| `API_HOST`       | FastAPI host         | `0.0.0.0`               |
| `API_PORT`       | FastAPI port         | `8000`                  |
| `DEBUG`          | Debug mode           | `True`                  |

---

## 🤝 Contributing

### Development Workflow

1. **Create feature branch**: `git checkout -b feature/amazing-feature`
2. **Make changes**: Follow existing code structure
3. **Test**: Run both FastAPI and Streamlit
4. **Commit**: Use descriptive messages
5. **Push**: `git push origin feature/amazing-feature`

### Code Style

- **Python**: Follow PEP 8
- **Type hints**: Required for all functions
- **Docstrings**: Use for all modules/classes/functions
- **Error handling**: Always use try/except for external calls

---

## 🐛 Troubleshooting

### Neo4j Connection Issues

```bash
# Test connection
python -c "from neo4j import GraphDatabase; driver = GraphDatabase.driver('bolt://localhost:7687', auth=('neo4j', 'password123')); driver.verify_connectivity(); print('✅ Connected')"
```

### Gemini API Errors

```bash
# Verify API key
export GOOGLE_API_KEY=your_key_here
python -c "import google.generativeai as genai; genai.configure(api_key='your_key'); print('✅ API Key Valid')"
```

### Port Already in Use

```bash
# Change port in .env
API_PORT=8001  # Instead of 8000

# Or kill existing process (Linux/Mac)
lsof -ti:8000 | xargs kill -9
```

---

## 📊 Performance

- **Graph Queries**: < 100ms (local Neo4j)
- **ML Predictions**: < 50ms (cached model)
- **AI Explanations**: 1-3s (Gemini API)
- **Full Contact Trace**: < 500ms (100 nodes)

---

## 🛣️ Roadmap

### Phase 2 - Visualization (Week 2)

- [ ] Next.js 15 frontend
- [ ] D3.js force-directed graph
- [ ] Mapbox/Leaflet integration
- [ ] Real-time WebSocket updates

### Phase 3 - AI Agents (Week 3)

- [ ] LangGraph agent framework
- [ ] Autonomous network simulation
- [ ] Hybrid real/synthetic data
- [ ] Agent evaluation metrics

### Phase 4 - Advanced Features

- [ ] Vaccination tracking
- [ ] Resource allocation
- [ ] Public health dashboard
- [ ] Graph Neural Networks (GNN)

---

## 📜 License

MIT License - see LICENSE file for details

---

## 🙏 Acknowledgments

- **Neo4j** - Graph database platform
- **FastAPI** - Modern Python web framework
- **Google Gemini** - AI explanations
- **Streamlit** - Rapid UI development
- **scikit-learn** - Machine learning

---

## 📧 Contact

**Project Lead**: GANZA RWABUHAMA Danny Mike  
**Email**: hc10u72fn@mozmail.com  
**GitHub**: github.com/DannyMikeGanzaRwabuhama/pandemicnet-ai

---

## 🌟 Star History

If this project helps you, please ⭐ star the repo!

---

**Built with ❤️ for public health and network science**