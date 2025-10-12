"""
Infection reporting and risk assessments endpoints
Track infections and calculate exposure risks
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List
from backend.models import InfectionReport, InfectionResponse, RiskPrediction, SuperSpreaderResponse
from backend.database import get_db, Neo4jConnection
from backend.services.ml_service import get_ml_service, MLService
from backend.services.ai_service import get_ai_service, AIService
from backend.services.network_service import NetworkService
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/infections", tags=["infections"])


@router.post("/report", response_model=InfectionResponse)
async def report_infection(
        report: InfectionReport,
        db: Neo4jConnection = Depends(get_db),
):
    """
    Report an infection for an individual
    """
    # Check if individual exists
    check_query = "MATCH (p:Individual {unique_id: $unique_id}) RETURN p"
    check_result = db.execute_query(check_query, {"unique_id": report.unique_id})

    if not check_result:
        raise HTTPException(
            status_code=404,
            detail=f"Individual '{report.unique_id}' not found"
        )

    # Update infection status
    query = """
        MATCH (p:Individual {unique_id: $unique_id})
        SET p.infected = true,
            p.infection_date = date($infection_date),
            p.symptoms = $symptoms,
            p.severity = $severity,
            p.updated_at = datetime()
        WITH p
        MATCH (p)-[r:MET_AT]-(contact:Individual)
        WHERE r.contact_date >= date($infection_date) - duration({days: 14})
        RETURN p.unique_id as unique_id,
               p.infected as infected,
               p.infection_date as infection_date,
               count(DISTINCT contact) as exposed_contacts
        """

    result = db.execute_write(query, {
        "unique_id": report.unique_id,
        "infection_date": str(report.infection_date),
        "symptoms": report.symptoms,
        "severity": report.severity,
    })

    if not result:
        raise HTTPException(status_code=500, detail="Failed to report infection")

    data = result[0]

    return {
        "unique_id": data["unique_id"],
        "infected": data["infected"],
        "infection_date": str(data["infection_date"]),
        "exposed_contacts": data["exposed_contacts"],
        "message": f"Infection reported for {report.unique_id}. {data['exposed_contacts']} contacts potentially exposed."
    }


@router.get("/risk/{unique_id}", response_model=RiskPrediction)
async def get_infection_risk(
        unique_id: str,
        ml_service: MLService = Depends(get_ml_service),
        ai_service: AIService = Depends(get_ai_service),
        db: Neo4jConnection = Depends(get_db),
):
    """
    Calculate infection risk for an individual
    """
    # Check if individual exists
    check_query = "MATCH (p:Individual {unique_id: $unique_id}) RETURN p.infected as infected"
    check_result = db.execute_query(check_query, {"unique_id": unique_id})

    if not check_result:
        raise HTTPException(
            status_code=404,
            detail=f"Individual '{unique_id}' not found"
        )

    if check_result[0]["infected"]:
        return {
            "unique_id": unique_id,
            "risk_score": 1.0,
            "risk_level": "INFECTED",
            "factors": {"status": "already_infected"},
            "explanation": "This individual is already infected.",
        }

    # Calculate risk using ML
    risk_data = ml_service.predict_infection_risk(unique_id)

    # Generative AI explanation
    explanation = ai_service.generate_risk_explanation(unique_id, risk_data)

    return {
        "unique_id": unique_id,
        "risk_score": risk_data["risk_score"],
        "risk_level": risk_data["risk_level"],
        "factors": {
            "exposed_contacts": risk_data['exposed_contacts'],
            "total_contacts": risk_data['total_contacts'],
        },
        "explanation": explanation,
    }


@router.get("/superspreaders", response_model=SuperSpreaderResponse)
async def get_super_spreaders(
        threshold: int = 10,
        ai_service: AIService = Depends(get_ai_service),
):
    """
    Identify potential superspreaders in the network
    """
    network_service = NetworkService()
    superspreaders = network_service.find_superspreaders(threshold)

    if not superspreaders:
        return {"alert": "No superspreaders found", "count": 0, "superspreaders": []}

    # Generate AI alert
    alert = ai_service.generate_superspreader_alert(superspreaders)

    return {
        "alert": alert,
        "count": len(superspreaders),
        "superspreaders": superspreaders,
    }


@router.get("/exposure-chains/{source_id}")
async def get_exposure_chains(
        source_id: str,
        max_depth: int = 5,
        db: Neo4jConnection = Depends(get_db),
):
    """
    Trace infection exposure chains from a source
    """
    # Verify source is infected
    check_query = """
        MATCH (p:Individual {unique_id: $source_id})
        RETURN p.infected as infected
        """

    check_result = db.execute_query(check_query, {"source_id": source_id})

    if not check_result:
        raise HTTPException(
            status_code=404,
            detail=f"Individual '{source_id}' not found"
        )

    if not check_result[0]['infected']:
        raise HTTPException(
            status_code=400,
            detail=f"Individual '{source_id}' is not infected"
        )

    network_service = NetworkService()
    chains = network_service.calculate_infection_chains(source_id, max_depth)

    return chains


@router.get("/statistics")
async def get_infection_statistics(
        db: Neo4jConnection = Depends(get_db),
):
    """
    Get overall infection statistics
    """
    query = """
            MATCH (p:Individual)
            WITH count(p) as total, 
                 sum(CASE WHEN p.infected THEN 1 ELSE 0 END) as infected
            RETURN total,
                   infected,
                   CASE 
                       WHEN total = 0 THEN 0.0 
                       ELSE toFloat(infected) / total 
                   END as infection_rate
            """

    result = db.execute_query(query)

    if not result:
        return {
            "total_individuals": 0,
            "infected_count": 0,
            "infection_rate": 0.0,
        }

    data = result[0]

    # Get recent infections (last 7 days)
    recent_query = """
        MATCH (p:Individual)
        WHERE p.infected = true 
        AND p.infection_date >= date() - duration({days: 7})
        RETURN count(p) as recent_infections
        """

    recent_result = db.execute_query(recent_query)
    recent_infections = recent_result[0]['recent_infections'] if recent_result else 0

    # Get severity breakdown
    severity_query = """
        MATCH (p:Individual {infected: true})
        WHERE p.severity IS NOT NULL
        RETURN p.severity as severity, count(p) as count
        """

    severity_result = db.execute_query(severity_query)
    severity_breakdown = {r['severity']: r['count'] for r in severity_result}

    return {
        "total_individuals": data['total'],
        "infected_count": data['infected'],
        "infection_rate": round(data['infection_rate'] * 100, 2),
        "recent_infections_7days": recent_infections,
        "severity_breakdown": severity_breakdown,
    }


@router.delete("/clear/{unique_id}")
async def clear_infection(
        unique_id: str,
        db: Neo4jConnection = Depends(get_db),
):
    """
    Mark an individual as recovered (clear infection status)
    """
    query = """
        MATCH (p:Individual {unique_id: $unique_id})
        WHERE p.infected = true
        SET p.infected = false,
            p.recovery_date = date(),
            p.updated_at = datetime()
        RETURN p.unique_id as unique_id
        """

    result = db.execute_query(query, {"unique_id": unique_id})

    if not result:
        raise HTTPException(
            status_code=404,
            detail=f"Infected individual '{unique_id}' not found"
        )

    return {
        "message": f"Infection cleared for {unique_id}. Marked as recovered.",
    }
