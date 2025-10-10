"""
Individual/Person management endpoints
CRUD operations for individuals in the network
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List
from backend.models import IndividualCreate, IndividualResponse
from backend.database import get_db, Neo4jConnection
from backend.services.ml_service import get_ml_service, MLService
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/individuals", tags=["individuals"])


@router.post("/", response_model=IndividualResponse, status_code=201)
async def create_individual(
        individual: IndividualCreate,
        db: Neo4jConnection = Depends(get_db),
):
    """
    Create a new individual in the network
    """
    try:
        query = """
                CREATE (i:Individual {
                    unique_id: $unique_id,
                    phone_number: $phone_number,
                    location: $location,
                    infected: false,
                    created_at: datetime()
                })
                RETURN i.unique_id as unique_id,
                       i.phone_number as phone_number,
                       i.location as location,
                       i.infected as infected
                """
        result = db.execute_write(query, {
            "unique_id": individual.unique_id,
            "phone_number": individual.phone_number,
            "location": individual.location,
        })

        if not result:
            raise HTTPException(status_code=500, detail="Failed to create individual")

        return {
            "unique_id": result[0]['unique_id'],
            "phone_number": result[0]['phone_number'],
            "infected": result[0]['infected'],
            "infection_date": None,
            "location": result[0].get('location'),
            "risk_score": 0.0,
            "contact_count": 0
        }

    except Exception as e:
        if "already exists" in str(e).lower() or "constraint" in str(e).lower():
            raise HTTPException(status_code=409, detail=f"Individual with ID '{individual.unique_id}' already exists"
                                )
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{unique_id}", response_model=IndividualResponse)
async def get_individual(
        unique_id: str,
        db: Neo4jConnection = Depends(get_db),
        ml_service: MLService = Depends(get_ml_service),
):
    """
    Get individual details by unique_id
    """
    query = """
        MATCH (i:Individual {unique_id: $unique_id})
        OPTIONAL MATCH (i)-[r:MET_AT]-()
        RETURN i.unique_id as unique_id,
               i.phone_number as phone_number,
               i.infected as infected,
               i.infection_date as infection_date,
               i.location as location,
               count(r) as contact_count
        """

    result = db.execute_query(query, {"unique_id": unique_id})

    if not result:
        raise HTTPException(status_code=404, detail=f"Individual '{unique_id}' not found")

    person = result[0]

    # Calculate risk score if not infected
    risk_score = 0.0
    if not person['infected']:
        try:
            risk_data = ml_service.predict_infection_risk(unique_id)
            risk_score = risk_data['risk_score']
        except Exception as e:
            logger.warning(f"Failed to calculate risk score: {e}")

    return {
        "unique_id": person['unique_id'],
        "phone_number": person['phone_number'],
        "infected": person['infected'],
        "infection_date": str(person['infection_date']) if person['infection_date'] else None,
        "location": person.get('location'),
        "risk_score": risk_score,
        "contact_count": person['contact_count']
    }


@router.get("/", response_model=List[IndividualResponse])
async def list_individuals(
        limit: int = 50,
        infected_only: bool = False,
        db: Neo4jConnection = Depends(get_db),
):
    """List all individuals in the network"""
    infected_filter = "WHERE i.infected = true" if infected_only else ""

    query = f"""
        MATCH (i:Individual)
        {infected_filter}
        OPTIONAL MATCH (i)-[r:MET_AT]-()
        WITH i.unique_id as unique_id,
             i.phone_number as phone_number,
             i.infected as infected,
             i.infection_date as infection_date,
             i.location as location,
             i.created_at as created_at,
             count(r) as contact_count
        RETURN unique_id,
               phone_number,
               infected,
               infection_date,
               location,
               contact_count
        ORDER BY created_at DESC
        LIMIT $limit
        """

    results = db.execute_query(query, {"limit": limit})

    individuals = []
    for person in results:
        individuals.append({
            "unique_id": person['unique_id'],
            "phone_number": person['phone_number'],
            "infected": person['infected'],
            "infection_date": str(person['infection_date']) if person['infection_date'] else None,
            "location": person.get('location'),
            "risk_score": None,
            "contact_count": person['contact_count']
        })

    return individuals


@router.delete("/{unique_id}")
async def delete_individual(
        unique_id: str,
        db: Neo4jConnection = Depends(get_db),
):
    """
    Delete an individual and all their relationships
    """
    query = """
        MATCH (i:Individual {unique_id: $unique_id})
        DETACH DELETE i
        RETURN count(i) as deleted
        """

    result = db.execute_write(query, {"unique_id": unique_id})
    if not result or result[0]['deleted'] == 0:
        raise HTTPException(status_code=404, detail=f"Individual '{unique_id}' not found")

    return {"message": f"Individual '{unique_id}' deleted successfully"}


@router.put("/{unique_id}", response_model=IndividualResponse)
async def update_individual(
        unique_id: str,
        updates: IndividualCreate,
        db: Neo4jConnection = Depends(get_db),
):
    """Update individual information"""
    query = """
        MATCH (i:Individual {unique_id: $unique_id})
        SET i.phone_number = $phone_number,
            i.location = $location,
            i.updated_at = datetime()
        OPTIONAL MATCH (i)-[r:MET_AT]-()
        RETURN i.unique_id as unique_id,
               i.phone_number as phone_number,
               i.infected as infected,
               i.infection_date as infection_date,
               i.location as location,
               count(r) as contact_count
        """

    result = db.execute_write(query, {
        "unique_id": unique_id,
        "phone_number": updates.phone_number,
        "location": updates.location,
    })

    if not result:
        raise HTTPException(status_code=404, detail=f"Individual '{unique_id}' not found")

    person = result[0]

    return {
        "unique_id": person['unique_id'],
        "phone_number": person['phone_number'],
        "infected": person['infected'],
        "infection_date": str(person['infection_date']) if person['infection_date'] else None,
        "location": person.get('location'),
        "risk_score": None,
        "contact_count": person['contact_count']
    }
