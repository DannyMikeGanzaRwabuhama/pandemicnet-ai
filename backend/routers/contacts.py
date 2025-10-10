"""
Contact management and tracing endpoints
Create contacts and perform contact tracing
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List
from backend.models import (
    ContactCreate, ContactResponse, ContactTraceResult,
)
from backend.database import get_db, Neo4jConnection
from backend.services.network_service import NetworkService
from backend.services.ml_service import get_ml_service, MLService
from backend.services.ai_service import get_ai_service, AIService
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/contacts", tags=["contacts"])


@router.post("/", response_model=ContactResponse, status_code=201)
async def create_contact(
        contact: ContactCreate,
        db: Neo4jConnection = Depends(get_db),
):
    """
    Create a contact relationship between two individuals
    """
    # Verify both individuals exist
    check_query = """
        MATCH (i1:Individual {unique_id: $id1})
        MATCH (i2:Individual {unique_id: $id2})
        RETURN i1, i2
        """

    check_result = db.execute_query(check_query, {
        "id1": contact.individual_id,
        "id2": contact.contact_id,
    })

    if not check_result:
        raise HTTPException(
            status_code=404,
            detail=f"One or both individuals not found"
        )

    # Create bidirectional contact relationship
    query = """
        MATCH (i1:Individual {unique_id: $id1})
        MATCH (i2:Individual {unique_id: $id2})
        MERGE (i1)-[r:MET_AT {
            contact_date: date($contact_date),
            venue_id: $venue_id,
            duration_minutes: $duration,
            proximity: $proximity,
            created_at: datetime()
        }]-(i2)
        RETURN i1.unique_id as individual_id,
               i2.unique_id as contact_id,
               r.contact_date as contact_date,
               r.venue_id as venue_id,
               r.duration_minutes as duration_minutes,
               r.proximity as proximity,
               i2.infected as contact_infected
        """

    result = db.execute_query(query, {
        "id1": contact.individual_id,
        "id2": contact.contact_id,
        "contact_date": str(contact.contact_date),
        "venue_id": contact.venue_id,
        "duration": contact.duration_minutes,
        "proximity": contact.proximity,
    })

    if not result:
        raise HTTPException(status_code=500, detail="Failed to create contact")

    contact_data = result[0]

    return {
        "individual_id": contact_data["individual_id"],
        "contact_id": contact_data["contact_id"],
        "contact_date": str(contact_data["contact_date"]),
        "venue_id": contact_data.get("venue_id"),
        "duration_minutes": contact_data.get("duration_minutes"),
        "proximity": contact_data.get("proximity"),
        "contact_infected": contact_data["contact_infected"],
    }


@router.get("/{unique_id}/direct", response_model=List[ContactResponse])
async def get_direct_contacts(
        unique_id: str,
        days: int = Query(default=14, ge=1, le=365),
        db: Neo4jConnection = Depends(get_db),
):
    """
    Get direct contacts for an individual within specified days
    """
    check_query = """
    MATCH (p:Individual {unique_id: $unique_id})-[r:MET_AT]-(contact:Individual)
        WHERE r.contact_date >= date() - duration({days: $days})
        RETURN p.unique_id as individual_id,
               contact.unique_id as contact_id,
               r.contact_date as contact_date,
               r.venue_id as venue_id,
               r.duration_minutes as duration_minutes,
               r.proximity as proximity,
               contact.infected as contact_infected
        ORDER BY r.contact_date DESC
        """

    results = db.execute_query(check_query, {"unique_id": unique_id, "days": days})

    if not results:
        # Check if person exists
        check_query = "MATCH (p:Individual {unique_id: $unique_id}) RETURN p"
        check_result = db.execute_query(check_query, {"unique_id": unique_id})
        if not check_result:
            raise HTTPException(status_code=404, detail=f"Individual '{unique_id}' not found")
        return []

    contacts = []
    for record in results:
        contacts.append({
            "individual_id": record['individual_id'],
            "contact_id": record['contact_id'],
            "contact_date": str(record['contact_date']),
            "venue_id": record.get('venue_id'),
            "duration_minutes": record.get('duration_minutes'),
            "proximity": record.get('proximity'),
            "contact_infected": record['contact_infected']
        })

    return contacts


@router.get("/{unique_id}/trace", response_model=ContactTraceResult)
async def trace_contacts(
        unique_id: str,
        days: int = Query(default=14, ge=1, le=365),
        db: Neo4jConnection = Depends(get_db),
        ml_service: MLService = Depends(get_ml_service),
        ai_service: AIService = Depends(get_ai_service),
):
    """
    Comprehensive contact tracing with ML prediction and AI insights
    """
    # Check if person exists
    check_query = "MATCH (p:Individual {unique_id: $unique_id}) RETURN p"
    check_result = db.execute_query(check_query, {"unique_id": unique_id})
    if not check_result:
        raise HTTPException(status_code=404, detail=f"Individual '{unique_id}' not found")

    # Get direct contacts
    direct_query = """
        MATCH (p:Individual {unique_id: $unique_id})-[r:MET_AT]-(contact:Individual)
        WHERE r.contact_date >= date() - duration({days: $days})
        RETURN p.unique_id as individual_id,
               contact.unique_id as contact_id,
               r.contact_date as contact_date,
               r.venue_id as venue_id,
               r.duration_minutes as duration_minutes,
               r.proximity as proximity,
               contact.infected as contact_infected
        ORDER BY r.contact_date DESC
        """

    direct_results = db.execute_query(direct_query, {"unique_id": unique_id, "days": days})

    direct_contacts = []
    for record in direct_results:
        direct_contacts.append({
            "individual_id": record['individual_id'],
            "contact_id": record['contact_id'],
            "contact_date": str(record['contact_date']),
            "venue_id": record.get('venue_id'),
            "duration_minutes": record.get('duration_minutes'),
            "proximity": record.get('proximity'),
            "contact_infected": record['contact_infected']
        })

    # Get predicted contacts using ML
    predicted_contacts_data = ml_service.batch_predict_contacts(unique_id)

    predicted_contacts = []
    for pred in predicted_contacts_data[:10]:  # Top 10 predictions
        # Generate AI explanation
        explanation = ai_service.generate_contact_explanation(
            pred['unique_id'],
            pred['confidence'],
            pred['factors']
        )

        predicted_contacts.append({
            "unique_id": pred['unique_id'],
            "risk_score": pred['confidence'],
            "risk_level": pred['risk_level'],
            "factors": pred['factors'],
            "explanation": explanation
        })

    # Calculate degrees of separation
    network_service = NetworkService()
    degrees = network_service.calculate_degrees_of_separation(unique_id, max_depth=6)

    # Get network statistics
    stats = network_service.get_network_statistics()
    network_stats = {
        "total_individuals": stats['total_individuals'],
        "total_contacts": stats['total_contacts'],
        "infected_count": stats['infected_count'],
        "average_contacts": stats['average_contacts'],
        "max_degree_separation": max(degrees.keys()) if degrees else 0,
        "clusters": 1  # Simplified for now
    }

    # Generate AI insights
    ai_insights = ai_service.generate_network_insights(stats)

    return {
        "traced_individual": unique_id,
        "direct_contacts": direct_contacts,
        "predicted_contacts": predicted_contacts,
        "degrees_of_separation": degrees,
        "network_stats": network_stats,
        "ai_insights": ai_insights,
    }


@router.get("/{unique_id}/path/{target_id}")
async def find_connection_path(
        unique_id: str,
        target_id: str,
):
    """
    Find the shortest path between two individuals
    """
    network_service = NetworkService()
    path = network_service.find_shortest_path(unique_id, target_id)

    if not path:
        raise HTTPException(
            status_code=404,
            detail=f"No connection found between '{unique_id}' and '{target_id}'"
        )

    return {
        "from": unique_id,
        "to": target_id,
        "path": path,
        "degrees": len(path) - 1,
    }


@router.delete("/{individual_id}/{contact_id}")
async def delete_contact(
        individual_id: str,
        contact_id: str,
        db: Neo4jConnection = Depends(get_db),
):
    """
    Delete a contact relationship
    """
    query = """
        MATCH (i1:Individual {unique_id: $id1})-[r:MET_AT]-(i2:Individual {unique_id: $id2})
        DELETE r
        RETURN count(r) as deleted
        """

    result = db.execute_write(query, {
        "id1": individual_id,
        "id2": contact_id
    })

    if not result or result[0]['deleted'] == 0:
        raise HTTPException(
            status_code=404,
            detail=f"No connection found between '{individual_id}' and '{contact_id}'"
        )

    return {"message": "Contact deleted successfully"}


@router.get("/bulk/recent")
async def get_recent_contacts(
        days: int = Query(default=7, ge=1, le=90),
        limit: int = Query(default=50, ge=1, le=100),
        db: Neo4jConnection = Depends(get_db),
):
    """
    Get all recent contacts in the network
    """
    query = """
        MATCH (i1:Individual)-[r:MET_AT]-(i2:Individual)
        WHERE r.contact_date >= date() - duration({days: $days})
        RETURN DISTINCT i1.unique_id as individual_id,
               i2.unique_id as contact_id,
               r.contact_date as contact_date,
               r.venue_id as venue_id,
               i1.infected as individual_infected,
               i2.infected as contact_infected
        ORDER BY r.contact_date DESC
        LIMIT $limit
        """

    results = db.execute_query(query, {
        "days": days,
        "limit": limit,
    })

    contacts = []
    for record in results:
        contacts.append({
            "individual_id": record['individual_id'],
            "contact_id": record['contact_id'],
            "contact_date": str(record['contact_date']),
            "venue_id": record.get('venue_id'),
            "individual_infected": record['individual_infected'],
            "contact_infected": record['contact_infected'],
        })

    return {
        "total": len(contacts),
        "days": days,
        "contacts": contacts,
    }
