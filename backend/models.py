"""
Pydantic models for request/response validation
Defines data schemas for API endpoints
"""
from pydantic import BaseModel, Field, field_validator, ValidationInfo
from typing import Optional, List
from datetime import date
import re


class IndividualCreate(BaseModel):
    """Schema for creating a new individual"""
    unique_id: str = Field(..., min_length=2, max_length=50)
    phone_number: Optional[str] = Field(None, min_length=7, max_length=20)
    location: Optional[str] = None

    @field_validator('unique_id')
    @classmethod
    def validate_unique_id(cls, v):
        """Ensure unique_id contains at least one letter"""
        if not re.search(r'[a-zA-Z]', v):
            raise ValueError('unique_id must contain at least letters')
        if not re.match(r'^[a-zA-Z0-9_]+$', v):
            raise ValueError('unique_id can only contain letters, numbers, and underscores')
        return v.lower()

    @field_validator('phone_number')
    @classmethod
    def validate_phone_number(cls, v):
        """Validate phone number format"""
        if v and not re.match(r'^\d{7,}$', v):
            raise ValueError('phone_number must be at least 7 digits(numbers only)')
        return v


class IndividualResponse(BaseModel):
    """Schema for individual response"""
    unique_id: str
    phone_number: Optional[str]
    infected: bool
    infection_date: Optional[str]
    location: Optional[str]
    risk_score: Optional[float]
    contact_count: int = 0


class ContactCreate(BaseModel):
    """Schema for creating a contact relationship"""
    individual_id: str = Field(..., description="Unique ID of first person")
    contact_id: str = Field(..., description="Unique ID of second person")
    contact_date: date = Field(default_factory=date.today)
    venue_id: Optional[str] = None
    duration_minutes: Optional[int] = Field(None, ge=1, le=1440)
    proximity: Optional[str] = Field(None, description="close, medium, far")

    @field_validator('contact_id')
    @classmethod
    def validate_not_self_contact(cls, v, info: ValidationInfo):
        """Ensure person can't be their own contact"""
        if info.data.get('individual_id') == v:
            raise ValueError('A person cannot be their own contact')
        return v


class ContactResponse(BaseModel):
    """Schema for contact data response"""
    individual_id: str
    contact_id: str
    contact_date: str
    venue_id: Optional[str]
    duration_minutes: Optional[int]
    proximity: Optional[str]
    contact_infected: bool


class InfectionReport(BaseModel):
    """Schema for reporting an infection"""
    unique_id: str
    infection_date: Optional[date] = Field(default_factory=date.today)
    symptoms: Optional[List[str]] = None
    severity: Optional[str] = Field(None, description="mild, moderate, severe")


class InfectionResponse(BaseModel):
    """Schema for infection report response"""
    unique_id: str
    infected: bool
    infection_date: str
    exposed_contacts: int
    message: str


class RiskPrediction(BaseModel):
    """Schema for ML risk prediction"""
    unique_id: str
    risk_score: float = Field(..., ge=0.0, le=1.0)
    risk_level: str
    factors: dict
    explanation: Optional[str]


class NetworkStats(BaseModel):
    """Schema for network statistics"""
    total_individuals: int
    total_contacts: int
    infected_count: int
    average_contacts: float
    max_degree_separation: int
    clusters: int


class ContactTraceResult(BaseModel):
    """Schema for contact tracing results"""
    traced_individual: str
    direct_contacts: List[ContactResponse]
    predicted_contacts: List[RiskPrediction]
    degrees_of_separation: dict
    network_stats: NetworkStats
    ai_insights: Optional[str]


class VenueCreate(BaseModel):
    """Schema for creating a venue/location"""
    venue_id: str = Field(..., min_length=2, max_length=50)
    name: str
    location: Optional[str]
    venue_type: Optional[str] = Field(None, description="restaurant, office, gym, etc")
    capacity: Optional[int] = Field(None, ge=1)


class VenueResponse(BaseModel):
    """Schema for venue data response"""
    venue_id: str
    name: str
    location: Optional[str]
    venue_type: Optional[str]
    visit_count: int = 0
    last_visit: Optional[str]
