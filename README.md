# 🦠 PandemicNet AI

> **Real-World Pandemic Network Intelligence & Autonomous Agentic Simulation**  
> Turn invisible human contact networks into visual, measurable, explainable, and simulated systems.

![Phase](https://img.shields.io/badge/Phases_1--3-Complete-success)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-009688)
![Next.js](https://img.shields.io/badge/Next.js-15.1-black)
![LangGraph](https://img.shields.io/badge/LangGraph-0.2+-orange)
![Neo4j](https://img.shields.io/badge/Neo4j-5.x-008CC1)
![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.12-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6)

---

## 🎯 What is PandemicNet?

PandemicNet AI is an end-to-end pandemic network intelligence and multi-agent simulation platform. By bridging graph database algorithms, machine learning risk modeling, generative AI reasoning, and multi-agent systems, PandemicNet provides an intuitive and mathematically grounded environment to study, predict, and mitigate disease transmission.

- 📊 **Graph Contact Networks**: Model complex social graphs and spatial encounters using native Neo4j graph algorithms.
- 🧠 **ML Risk Prediction**: Predict secondary transmission probabilities using Scikit-Learn Random Forest models.
- 🤖 **Autonomous Multi-Agent Simulation**: Simulate human mobility, viral transmission, outbreak detection, and intervention policies via LangGraph.
- 🔬 **Deep Contact Tracing**: Execute multi-degree exposure queries with automated superspreader detection.
- 🌐 **Modern Visual Analytics**: Explore interactive force-directed graphs (D3.js), geospatial distributions (Leaflet), and real-time agent controls via Next.js 15.
- 💡 **Generative AI Insights**: Generate contextual epidemiological summaries and policy recommendations powered by Google Gemini AI.

---

## ✨ Features by Phase

### Phase 1: Core Backend & Machine Learning ✅
- **High-Performance Async API**: Built with FastAPI, Starlette, and Pydantic v2 schemas.
- **Neo4j Graph Database**: Native Cypher queries for individuals, contacts, exposure paths, centrality, and community detection.
- **Machine Learning Service**: Random Forest classifier evaluating duration, proximity, ventilation, and contact history.
- **Gemini AI Integration**: Natural language insights explaining transmission risks and clinical context.
- **Streamlit Exploratory UI**: Rapid prototyping and testing interface for data seeding and manual graph inspection.

### Phase 2: Next.js 15 Web Interface ✅
- **Next.js 15 App Router**: Modern React 19 and TypeScript architecture styled with Tailwind CSS and Lucide icons.
- **Interactive Network Graph**: Force-directed D3.js visualization with zoom, drag, node filtering, and risk-level indicators.
- **Geospatial Map View**: Leaflet-based mapping displaying infection hotspots, geographic clusters, and regional coordinates.
- **Deep Contact Tracing View**: Detailed breakdown of direct contacts, ML-predicted secondary exposures, and automated AI advice.
- **Analytics Dashboard**: Aggregated transmission statistics, community clusters, and degree distribution metrics.
- **Agent Control Dashboard**: Real-time simulation control panel with parameter adjustments, live polling, and execution logs.

### Phase 3: LangGraph Multi-Agent Simulation ✅
- **Cyclic Agentic Workflow**: Orchestrated using LangGraph state graphs with 6 specialized autonomous agents:
  1. **Movement Simulator**: Simulates mobility patterns, location check-ins, and spatial gatherings.
  2. **Contact Simulator**: Generates contact interactions based on spatial overlap, duration, and environmental proximity.
  3. **Infection Simulator**: Applies probabilistic viral transmission models to susceptible contacts.
  4. **Outbreak Detector**: Tracks case velocity, calculates the effective reproduction number ($R_t$), and identifies superspreaders.
  5. **Intervention Recommender**: Selects and triggers targeted interventions (quarantines, movement limits, testing surges).
  6. **Report Generator**: Synthesizes daily epidemiological reports with natural language summaries via Gemini AI.
- **Dual Execution Interfaces**:
  - **Interactive CLI Runner** (`run_simulation.py`): Step-by-step or automated batch simulation from the terminal.
  - **REST API Endpoints** (`/agents/*`): Asynchronous background simulation control wired directly into the Next.js UI.

### Upcoming Roadmap 🚀
- 💉 **Phase 4**: Vaccination tracking, waning immunity modeling, and strain mutation dynamics.
- 🏥 **Phase 5**: Healthcare resource allocation (ICU beds, medical supplies) and Graph Neural Network (GNN) integration.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             USER INTERFACES                                 │
│  ┌────────────────────────────────────┐    ┌─────────────────────────────┐  │
│  │   Next.js 15 Web Application       │    │     Streamlit Debug UI      │  │
│  │   (D3 Graph, Leaflet Map, Agents)  │    │     (Rapid Exploration)     │  │
│  └─────────────────┬──────────────────┘    └──────────────┬──────────────┘  │
└────────────────────┼──────────────────────────────────────┼─────────────────┘
                     │ HTTP / REST                          │ HTTP / REST
┌────────────────────▼──────────────────────────────────────▼─────────────────┐
│                           FASTAPI BACKEND                                   │
│  ┌───────────────┬──────────────┬──────────────┬──────────────┬──────────┐  │
│  │ /individuals  │  /contacts   │ /infections  │    /graph    │ /agents  │  │
│  └───────┬───────┴──────┬───────┴──────┬───────┴──────┬───────┴────┬─────┘  │
│          │              │              │              │            │        │
│  ┌───────▼──────────────▼──────────────▼──────────────▼──────┐     │        │
│  │                     Application Services                  │     │        │
│  │   • NetworkService  • MLService (RandomForest) • AIService│     │        │
│  └──────────────────────────────┬────────────────────────────┘     │        │
└─────────────────────────────────┼──────────────────────────────────┼────────┘
                                  │                                  │
         ┌────────────────────────┴──────────────┐                   │
         │                                       │                   │
┌────────▼──────────────┐             ┌──────────▼──────────┐        │
│       Neo4j DB        │             │    Gemini AI API    │        │
│ (Graph Relationships) │             │ (NLP Explanations)  │        │
└───────────────────────┘             └──────────▲──────────┘        │
                                                 │                   │
┌────────────────────────────────────────────────┼───────────────────▼────────┐
│                   LANGGRAPH MULTI-AGENT SIMULATION ENGINE                   │
│                                                                             │
│  ┌───────────────┐     ┌───────────────┐     ┌───────────────┐              │
│  │ 1. Movement   │ ──> │  2. Contact   │ ──> │ 3. Infection  │              │
│  │   Simulator   │     │   Simulator   │     │   Simulator   │              │
│  └───────────────┘     └───────────────┘     └───────┬───────┘              │
│                                                      │                      │
│  ┌───────────────┐     ┌───────────────┐     ┌───────▼───────┐              │
│  │   6. Report   │ <── │ 5.Intervention│ <── │  4. Outbreak  │              │
│  │   Generator   │     │  Recommender  │     │   Detector    │              │
│  └───────┬───────┘     └───────────────┘     └───────────────┘              │
│          │                                                                  │
│          └───────────────> [ State Cycle / Next Day ]                       │
│                                                                             │
│  Executable via: CLI (`python run_simulation.py`) or API (`/agents/simulate`)│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🗂️ Project Structure

```
pnet-ai/
├── agents/                       # LangGraph Multi-Agent Simulation Engine
│   ├── config.py                 # Simulation parameters & defaults
│   ├── orchestrator.py           # LangGraph StateGraph workflow definition
│   ├── state.py                  # SimulationState typed dictionary
│   ├── sim/                      # Physical and biological simulation agents
│   │   ├── movement_sim.py       # Spatial mobility agent
│   │   ├── contact_sim.py        # Proximity interaction agent
│   │   └── infection_sim.py      # Transmission calculation agent
│   ├── analysis/                 # Epidemiological intelligence agents
│   │   ├── outbreak_detector.py  # Reproduction rate (Rt) & superspreader detection
│   │   ├── intervention.py       # Policy recommendation agent
│   │   └── reporter.py           # Natural language summary agent (Gemini)
│   └── tools/
│       └── api_tools.py          # Asynchronous backend client for agents
├── backend/                      # FastAPI Application
│   ├── main.py                   # App entrypoint & CORS configuration
│   ├── config.py                 # Pydantic Settings & environment parsing
│   ├── database.py               # Neo4j driver connection & schema setup
│   ├── models.py                 # Pydantic schemas (Node, Edge, Risk, etc.)
│   ├── routers/                  # API endpoints
│   │   ├── individuals.py        # Individuals CRUD
│   │   ├── contacts.py           # Contact logging & tracing
│   │   ├── infections.py         # Infection reporting & risk predictions
│   │   ├── graph.py              # Centrality, communities, and degree analysis
│   │   └── agents.py             # Agent simulation management & status
│   ├── services/                 # Business logic & ML/AI models
│   │   ├── ml_service.py         # Scikit-learn Random Forest model
│   │   ├── ai_service.py         # Google Gemini LLM wrapper
│   │   └── network_service.py    # Graph metrics & community queries
│   └── utils/
│       ├── seed_data.py          # Synthetic population generator
│       └── validators.py         # Request validators
├── frontend/                     # Next.js 15 Web Application
│   ├── app/                      # Next.js App Router pages
│   │   ├── page.tsx              # Overview dashboard
│   │   ├── network/page.tsx      # D3 interactive graph page
│   │   ├── map/page.tsx          # Leaflet geospatial distribution page
│   │   ├── trace/page.tsx        # Deep contact tracing page
│   │   ├── agents/page.tsx       # Multi-agent simulation control dashboard
│   │   └── analytics/page.tsx    # Epidemiological analytics page
│   ├── components/               # React components (D3, Leaflet, Dashboard)
│   ├── lib/                      # API client (`api.ts`) and TypeScript types
│   ├── package.json              # Frontend npm dependencies
│   └── tailwind.config.ts        # Tailwind CSS configuration
├── streamlit_ui/                 # Streamlit Prototype UI
│   └── app.py                    # Streamlit interface
├── tests/                        # Automated Pytest Suite
│   └── test_api.py               # API endpoint and health tests
├── models/                       # Serialized machine learning models
├── run_simulation.py             # Standalone CLI runner for agent simulations
├── pytest.ini                    # Pytest configuration
├── requirements.txt              # Core backend dependencies
├── requirements-agents.txt       # Agent & LangGraph dependencies
├── .env.example                  # Environment configuration template
└── README.md                     # Project documentation
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python**: 3.11 or 3.12
- **Node.js**: 18+ (tested on Node 20 / 22 / 24) and **npm**
- **Neo4j**: Local instance (Neo4j Desktop / Docker) or cloud instance (Neo4j Aura)
- **Gemini API Key**: Google AI Studio API key ([Get one here](https://aistudio.google.com/))

---

### 1. Environment Setup

```bash
# Clone the repository
git clone https://github.com/DannyMikeGanzaRwabuhama/pandemicnet-ai.git
cd pandemicnet-ai

# Create and activate Python virtual environment
python3 -m venv venv
source venv/bin/activate       # On Windows: venv\Scripts\activate

# Install backend dependencies
pip install -r requirements.txt

# Install agent simulation dependencies
pip install -r requirements-agents.txt
```

---

### 2. Configure Environment Variables

Copy the example environment file and adjust your credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```env
# Neo4j Graph Database
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password123
NEO4J_DATABASE=neo4j

# Google Gemini API
GOOGLE_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash

# Backend API Configuration
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=True
CORS_ORIGINS=["http://localhost:3000","http://localhost:8501"]

# Agent Simulation
AGENT_SIMULATION_DAYS=30
AGENT_ENABLE_GEMINI=True
AGENT_API_BASE_URL=http://localhost:8000
```

---

### 3. Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

---

### 4. Running the Stack

You can run each layer in separate terminal tabs:

#### **Terminal 1: FastAPI Backend**
```bash
source venv/bin/activate
python -m backend.main
```
*API running at `http://localhost:8000` | OpenAPI docs at `http://localhost:8000/docs`*

#### **Terminal 2: Next.js 15 Web Application**
```bash
cd frontend
npm run dev
```
*Web dashboard available at `http://localhost:3000`*

#### **Terminal 3 (Optional): Streamlit Prototype UI**
```bash
source venv/bin/activate
streamlit run streamlit_ui/app.py
```
*Streamlit available at `http://localhost:8501`*

#### **Terminal 4 (Optional): Agent Simulation CLI**
```bash
source venv/bin/activate
# Interactive step-by-step mode:
python run_simulation.py --interactive

# Automated 14-day batch mode:
python run_simulation.py --days 14
```

---

## 📖 API Documentation

The backend exposes an interactive OpenAPI Swagger UI at `http://localhost:8000/docs`.

### Key Endpoints

| Category | Method | Endpoint | Description |
|---|---|---|---|
| **System** | `GET` | `/health` | Health check & model status |
| **Individuals** | `POST` | `/individuals/` | Create a new individual |
| | `GET` | `/individuals/` | List individuals with pagination |
| | `GET` | `/individuals/{id}` | Retrieve individual profile |
| | `DELETE` | `/individuals/{id}` | Remove individual from network |
| **Contacts** | `POST` | `/contacts/` | Record a contact event between two individuals |
| | `GET` | `/contacts/{id}/direct` | Retrieve 1st-degree contacts |
| | `GET` | `/contacts/{id}/trace` | Multi-degree contact trace with ML predictions |
| | `GET` | `/contacts/{id}/path/{target}` | Shortest transmission path between two nodes |
| **Infections** | `POST` | `/infections/report` | Report a confirmed infection case |
| | `GET` | `/infections/risk/{id}` | Evaluate individual transmission risk |
| | `GET` | `/infections/superspreaders`| Identify high-degree potential superspreaders |
| | `GET` | `/infections/exposure-chains/{id}` | Extract historical infection trees |
| **Graph Analysis**| `GET` | `/graph/network` | Export graph nodes and edges (D3-compatible) |
| | `GET` | `/graph/centrality` | Degree, betweenness, and closeness centrality |
| | `GET` | `/graph/communities` | Detect graph clusters/communities |
| | `GET` | `/graph/stats` | High-level graph topology statistics |
| **Agent Simulation** | `POST` | `/agents/simulate` | Trigger background simulation run |
| | `GET` | `/agents/status` | Current simulation status and progress |
| | `GET` | `/agents/results` | Historical simulation logs and day metrics |
| | `GET` | `/agents/config` | Read current agent simulation parameters |
| | `POST` | `/agents/config` | Update agent simulation parameters |
| | `GET` | `/agents/workflow-diagram` | Mermaid representation of LangGraph workflow |
| | `POST` | `/agents/reset` | Clear simulation state and memory |
| **Utility** | `POST` | `/seed` | Generate synthetic population and contact graph |

---

## 🧪 Testing & Verification

### Backend Tests
The backend test suite verifies endpoint availability, Pydantic validation, exception handling, and agent configuration:

```bash
pytest
```

### Frontend Build & Lint
Verify Next.js TypeScript types and compile the production build:

```bash
cd frontend
npm run build
```

---

## 🛡️ Security & Architecture Notes

- **Resilient Database Connectivity**: The backend handles transient database unavailability gracefully on startup and re-establishes connectivity automatically when Neo4j becomes reachable.
- **Typed Validation**: All inbound payloads and query parameters are strictly validated via Pydantic v2 schemas.
- **Clean Toolchain**: Dependencies have been curated and verified against current ecosystem standards (FastAPI 0.109+, LangGraph 0.2+, Next.js 15.1, React 19).

---

## 🤝 Contributing

1. **Fork the Repository**
2. **Create a Feature Branch**: `git checkout -b feature/your-feature-name`
3. **Commit Your Changes**: `git commit -m "feat: describe your change"`
4. **Push to Your Branch**: `git push origin feature/your-feature-name`
5. **Open a Pull Request**

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 📧 Contact & Authors

**Project Lead**: GANZA RWABUHAMA Danny Mike  
**Email**: hc10u72fn@mozmail.com  
**GitHub**: [DannyMikeGanzaRwabuhama/pandemicnet-ai](https://github.com/DannyMikeGanzaRwabuhama/pandemicnet-ai)
