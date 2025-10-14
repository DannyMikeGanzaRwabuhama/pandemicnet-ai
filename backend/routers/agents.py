"""
Agent Control API Endpoints
Real-time control and monitoring of AI agents
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import Optional, List
from datetime import date, datetime
import logging
from pydantic import BaseModel

# Import orchestrator (will be available after Phase 3 setup)
try:
    from agents.orchestrator import orchestrator
    from agents.config import get_agent_config

    AGENTS_AVAILABLE = True
except ImportError:
    AGENTS_AVAILABLE = False
    logging.warning("⚠️ Agent system not available. Install Phase 3 dependencies.")

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/agents", tags=["agents"])


# ==================== REQUEST MODELS ====================

class SimulationStartRequest(BaseModel):
    """Request to start simulation"""
    days: int = 30
    start_date: Optional[str] = None
    initial_population: Optional[int] = None


class SimulationDayRequest(BaseModel):
    """Request to run single day"""
    simulation_day: int
    current_date: str


class AgentConfigUpdate(BaseModel):
    """Update agent configuration"""
    movement_probability: Optional[float] = None
    avg_daily_contacts: Optional[int] = None
    base_infection_rate: Optional[float] = None
    enable_auto_interventions: Optional[bool] = None


# ==================== SIMULATION STATE ====================

# Global simulation state
simulation_state = {
    "running": False,
    "current_day": 0,
    "total_days": 0,
    "results": [],
    "latest_state": None,
    "start_time": None,
    "error": None
}


async def run_simulation_background(days: int, start_date: date):
    """Background task to run simulation"""
    global simulation_state

    try:
        simulation_state["running"] = True
        simulation_state["current_day"] = 0
        simulation_state["total_days"] = days
        simulation_state["start_time"] = datetime.now()
        simulation_state["error"] = None

        results = await orchestrator.run_simulation(days=days, start_date=start_date)

        simulation_state["results"] = [
            {
                "day": r.get("simulation_day"),
                "date": r.get("current_date").isoformat() if r.get("current_date") else None,
                "new_infections": len(r.get("newly_infected", [])),
                "total_infected": r.get("total_infected", 0),
                "r_value": r.get("r_value", 0),
                "outbreak_detected": r.get("outbreak_detected", False),
                "contacts_created": r.get("contacts_created_today", 0)
            }
            for r in results
        ]

        simulation_state["latest_state"] = results[-1] if results else None
        simulation_state["running"] = False

        logger.info(f"✅ Simulation complete: {days} days")

    except Exception as e:
        logger.error(f"❌ Simulation failed: {e}")
        simulation_state["error"] = str(e)
        simulation_state["running"] = False


# ==================== ENDPOINTS ====================

@router.get("/available")
async def check_agents_available():
    """Check if agent system is available"""
    return {
        "available": AGENTS_AVAILABLE,
        "message": "Agent system ready" if AGENTS_AVAILABLE else "Install requirements-agents.txt"
    }


@router.get("/config")
async def get_agent_config():
    """Get current agent configuration"""
    if not AGENTS_AVAILABLE:
        raise HTTPException(status_code=503, detail="Agent system not available")

    config = get_agent_config()

    return {
        "movement_probability": config.movement_probability,
        "avg_daily_contacts": config.avg_daily_contacts,
        "base_infection_rate": config.base_infection_rate,
        "infection_factors": config.infection_factors,
        "locations": config.locations,
        "enable_auto_interventions": config.enable_auto_interventions,
        "outbreak_threshold": config.outbreak_threshold,
        "superspreader_threshold": config.superspreader_threshold
    }


@router.post("/config")
async def update_agent_config(updates: AgentConfigUpdate):
    """Update agent configuration"""
    if not AGENTS_AVAILABLE:
        raise HTTPException(status_code=503, detail="Agent system not available")

    config = get_agent_config()

    if updates.movement_probability is not None:
        config.movement_probability = updates.movement_probability
    if updates.avg_daily_contacts is not None:
        config.avg_daily_contacts = updates.avg_daily_contacts
    if updates.base_infection_rate is not None:
        config.base_infection_rate = updates.base_infection_rate
    if updates.enable_auto_interventions is not None:
        config.enable_auto_interventions = updates.enable_auto_interventions

    return {"message": "Configuration updated", "config": await get_agent_config()}


@router.post("/simulation/start")
async def start_simulation(
        request: SimulationStartRequest,
        background_tasks: BackgroundTasks
):
    """Start multi-day simulation in background"""
    if not AGENTS_AVAILABLE:
        raise HTTPException(status_code=503, detail="Agent system not available")

    if simulation_state["running"]:
        raise HTTPException(status_code=409, detail="Simulation already running")

    start_date = date.fromisoformat(request.start_date) if request.start_date else date.today()

    # Run in background
    background_tasks.add_task(run_simulation_background, request.days, start_date)

    return {
        "message": f"Simulation started: {request.days} days",
        "start_date": start_date.isoformat(),
        "days": request.days
    }


@router.post("/simulation/day")
async def run_single_day(request: SimulationDayRequest):
    """Run simulation for a single day"""
    if not AGENTS_AVAILABLE:
        raise HTTPException(status_code=503, detail="Agent system not available")

    if simulation_state["running"]:
        raise HTTPException(status_code=409, detail="Simulation already running")

    current_date = date.fromisoformat(request.current_date)

    result = await orchestrator.run_single_day(
        request.simulation_day,
        current_date
    )

    # Update state
    simulation_state["current_day"] = request.simulation_day
    simulation_state["latest_state"] = result

    return {
        "day": request.simulation_day,
        "date": request.current_date,
        "new_infections": len(result.get("newly_infected", [])),
        "total_infected": result.get("total_infected", 0),
        "r_value": result.get("r_value", 0),
        "outbreak_detected": result.get("outbreak_detected", False),
        "contacts_created": result.get("contacts_created_today", 0),
        "interventions": result.get("interventions_active", []),
        "alerts": result.get("alerts", []),
        "analysis": result.get("daily_analysis"),
        "execution_time": result.get("execution_time", 0)
    }


@router.get("/simulation/status")
async def get_simulation_status():
    """Get current simulation status"""
    if not AGENTS_AVAILABLE:
        raise HTTPException(status_code=503, detail="Agent system not available")

    return {
        "running": simulation_state["running"],
        "current_day": simulation_state["current_day"],
        "total_days": simulation_state["total_days"],
        "progress": (
            simulation_state["current_day"] / simulation_state["total_days"] * 100
            if simulation_state["total_days"] > 0 else 0
        ),
        "start_time": simulation_state["start_time"].isoformat() if simulation_state["start_time"] else None,
        "error": simulation_state["error"],
        "has_results": len(simulation_state["results"]) > 0
    }


@router.get("/simulation/results")
async def get_simulation_results(
        limit: Optional[int] = None,
        from_day: Optional[int] = None,
        to_day: Optional[int] = None
):
    """Get simulation results with optional filtering"""
    if not AGENTS_AVAILABLE:
        raise HTTPException(status_code=503, detail="Agent system not available")

    results = simulation_state["results"]

    # Filter by day range
    if from_day is not None:
        results = [r for r in results if r["day"] >= from_day]
    if to_day is not None:
        results = [r for r in results if r["day"] <= to_day]

    # Limit results
    if limit:
        results = results[:limit]

    return {
        "total_days": len(results),
        "results": results
    }


@router.get("/simulation/latest")
async def get_latest_state():
    """Get latest simulation state"""
    if not AGENTS_AVAILABLE:
        raise HTTPException(status_code=503, detail="Agent system not available")

    if not simulation_state["latest_state"]:
        return {"message": "No simulation run yet"}

    state = simulation_state["latest_state"]

    return {
        "day": state.get("simulation_day"),
        "date": state.get("current_date").isoformat() if state.get("current_date") else None,
        "total_individuals": state.get("total_individuals", 0),
        "new_infections": len(state.get("newly_infected", [])),
        "total_infected": state.get("total_infected", 0),
        "active_infections": len(state.get("active_infections", [])),
        "r_value": state.get("r_value", 0),
        "outbreak_detected": state.get("outbreak_detected", False),
        "contacts_created_today": state.get("contacts_created_today", 0),
        "total_contacts": state.get("total_contacts", 0),
        "network_density": state.get("network_density", 0),
        "superspreaders": state.get("superspreaders", []),
        "quarantined": len(state.get("quarantined", [])),
        "tested_today": len(state.get("tested_today", [])),
        "interventions": state.get("interventions_active", []),
        "alerts": state.get("alerts", []),
        "analysis": state.get("daily_analysis"),
        "recommendations": state.get("recommendations", []),
        "execution_time": state.get("execution_time", 0)
    }


@router.post("/simulation/stop")
async def stop_simulation():
    """Stop running simulation"""
    if not AGENTS_AVAILABLE:
        raise HTTPException(status_code=503, detail="Agent system not available")

    if not simulation_state["running"]:
        return {"message": "No simulation running"}

    simulation_state["running"] = False

    return {"message": "Simulation stopped"}


@router.delete("/simulation/clear")
async def clear_simulation_results():
    """Clear all simulation results"""
    if not AGENTS_AVAILABLE:
        raise HTTPException(status_code=503, detail="Agent system not available")

    simulation_state["results"] = []
    simulation_state["latest_state"] = None
    simulation_state["current_day"] = 0
    simulation_state["total_days"] = 0
    simulation_state["error"] = None

    return {"message": "Simulation results cleared"}


@router.get("/workflow")
async def get_workflow_diagram():
    """Get ASCII diagram of agent workflow"""
    if not AGENTS_AVAILABLE:
        raise HTTPException(status_code=503, detail="Agent system not available")

    return {
        "diagram": orchestrator.get_workflow_diagram()
    }