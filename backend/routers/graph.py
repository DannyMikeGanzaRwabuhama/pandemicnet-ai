"""
Network graph analysis endpoints
Advanced graph queries and visualizations
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from backend.database import get_db, Neo4jConnection
from backend.services.network_service import NetworkService
from backend.services.ai_service import get_ai_service, AIService
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/graph", tags=["graph"])


@router.get("/network")
async def get_full_network(
        limit: int = Query(default=100, ge=1, le=1000),
        db: Neo4jConnection = Depends(get_db),
):
    """
    Get the full network graph for visualization
    Returns nodes and edges
    """
    # Get nodes
    nodes_query = """
        MATCH (p:Individual)
        OPTIONAL MATCH (p)-[r:MET_AT]-()
        RETURN p.unique_id as id,
               p.infected as infected,
               p.location as location,
               count(r) as connections
        LIMIT $limit
        """

    nodes = db.execute_query(nodes_query, {"limit": limit})

    # Get edges
    edges_query = """
        MATCH (p1:Individual)-[r:MET_AT]-(p2:Individual)
        WHERE p1.unique_id < p2.unique_id
        RETURN p1.unique_id as source,
               p2.unique_id as target,
               r.contact_date as date,
               r.venue_id as venue
        LIMIT $limit
        """

    edges = db.execute_query(edges_query, {"limit": limit})

    return {
        "nodes": nodes,
        "edges": edges,
        "total_nodes": len(nodes),
        "total_edges": len(edges),
    }


@router.get("/centrality")
async def get_network_centrality(
        limit: int = Query(default=10, ge=1, le=50),
):
    """
    Get most connected individuals (highes degree centrality)
    """
    network_service = NetworkService()
    centrality = network_service.get_network_centrality(limit)

    return {
        "most_connected": centrality,
        "count": len(centrality)
    }


@router.get("/communities")
async def detect_communities(
):
    """
    Detect communities/clusters in the network
    """
    network_service = NetworkService()

    try:
        communities = network_service.detect_communities()

        # Group by community
        community_groups = {}
        for record in communities:
            comm_id = record.get('community', 0)
            if comm_id not in community_groups:
                community_groups[comm_id] = []
            community_groups[comm_id].append(record['unique_id'])

        return {
            "total_communities": len(community_groups),
            "communities": [
                {
                    "community_id": comm_id,
                    "members": members,
                    "size": len(members)
                }
                for comm_id, members in community_groups.items()
            ]
        }
    except Exception as e:
        logger.error(f"Community detection failed: {e}")
        raise HTTPException(
            status_code=500,
            detail="Community detection not available. Ensure Neo4j GDS is installed."
        )


@router.get("/statistics")
async def get_network_statistics(
        ai_service: AIService = Depends(get_ai_service),
):
    """
    Get comprehensive network statistics
    """
    network_service = NetworkService()
    stats = network_service.get_network_statistics()

    # Generate AI insights
    insights = ai_service.generate_network_insights(stats)

    return {
        "statistics": stats,
        "ai_insights": insights,
    }


@router.get("/degrees/{unique_id}")
async def get_degrees_of_separation(
        unique_id: str,
        max_depth: int = Query(default=6, ge=1, le=10),
        db: Neo4jConnection = Depends(get_db),
):
    """
    Calculate degrees of separation from a person (Six Degrees)
    """
    # Check if person exists
    check_query = "MATCH (p:Individual {unique_id: $unique_id}) RETURN p"
    check_result = db.execute_query(check_query, {"unique_id": unique_id})

    if not check_result:
        raise HTTPException(
            status_code=404,
            detail=f"Individual '{unique_id}' not found"
        )

    network_service = NetworkService()
    degrees = network_service.calculate_degrees_of_separation(unique_id, max_depth)

    # Calculate totals per degree
    degree_counts = {deg: len(people) for deg, people in degrees.items()}

    return {
        "source": unique_id,
        "max_depth": max_depth,
        "degrees": degrees,
        "degree_counts": degree_counts,
        "total_reachable": sum(degree_counts.values()),
    }


@router.get("/visualize/{unique_id}")
async def get_personal_network(
        unique_id: str,
        depth: int = Query(default=2, ge=1, le=4),
        db: Neo4jConnection = Depends(get_db),
):
    """
    Get personal network for visualization (ego network)
    """
    query = """
        MATCH path = (center:Individual {unique_id: $unique_id})-[:MET_AT*1..%d]-(person:Individual)
        WITH center, person, min(length(path)) as distance
        OPTIONAL MATCH (person)-[r:MET_AT]-(other:Individual)
        WHERE other IN [n IN nodes(path) | n]
        RETURN DISTINCT person.unique_id as id,
               person.infected as infected,
               distance,
               count(r) as connections
        """ % depth

    nodes = db.execute_query(query, {"unique_id": unique_id})

    # Add center node
    center_query = """
        MATCH (p:Individual {unique_id: $unique_id})
        OPTIONAL MATCH (p)-[r:MET_AT]-()
        RETURN p.unique_id as id,
               p.infected as infected,
               0 as distance,
               count(r) as connections
        """

    center_node = db.execute_query(center_query, {"unique_id": unique_id})
    nodes = center_node + nodes

    # Get edges within this subgraph
    node_ids = [n['id'] for n in nodes]

    edges_query = """
        MATCH (p1:Individual)-[r:MET_AT]-(p2:Individual)
        WHERE p1.unique_id IN $node_ids AND p2.unique_id IN $node_ids
        AND p1.unique_id < p2.unique_id
        RETURN p1.unique_id as source,
               p2.unique_id as target,
               r.contact_date as date
        """

    edges = db.execute_query(edges_query, {"node_ids": node_ids})

    return {
        "center": unique_id,
        "depth": depth,
        "nodes": nodes,
        "edges": edges,
    }


@router.post("/clear")
async def clear_network(
        confirm: bool = Query(default=False),
        db: Neo4jConnection = Depends(get_db),
):
    """
        ⚠️ DANGER: Clear the entire network database
        """
    if not confirm:
        raise HTTPException(
            status_code=400,
            detail="Set confirm=true to clear the database"
        )

    db.clear_database()

    return {
        "message": "⚠️ Network cleared! All data deleted.",
        "warning": "This action cannot be undone"
    }


@router.get("/export")
async def export_network(
        export_format: str = Query(default="json", regex="^(json|csv)$"),
        db: Neo4jConnection = Depends(get_db)
):
    """
    Export network data in various formats
    """
    if export_format == "json":
        # Get all data
        # Get all data
        nodes_query = "MATCH (p:Individual) RETURN properties(p) as node"
        nodes = db.execute_query(nodes_query)

        edges_query = """
                MATCH (p1:Individual)-[r:MET_AT]-(p2:Individual)
                RETURN p1.unique_id as source, 
                       p2.unique_id as target, 
                       properties(r) as relationship
                """
        edges = db.execute_query(edges_query)

        return {
            "format": "json",
            "nodes": nodes,
            "edges": edges,
            "exported_at": "2025-10-09"
        }

    # CSV format would require additional formatting
    raise HTTPException(status_code=501, detail="CSV export not yet implemented")
