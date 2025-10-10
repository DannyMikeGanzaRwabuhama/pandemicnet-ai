"""
Validation utilities for business logic
Additional validation beyond Pydantic models
"""
from datetime import date, timedelta
from typing import Optional


class ValidationError(Exception):
    """Custom validation error"""
    pass


def validate_date_range(start_date: date, end_date: date):
    """Validate that date range is logical"""
    if end_date < start_date:
        raise ValidationError('End date cannot be before start date')
    if (end_date - start_date).days > 365:
        raise ValidationError('Date range cannot exceed 1 year')
    return True


def validate_contact_date(contact_date: date) -> bool:
    """Validate that contact date is reasonable"""
    today = date.today()
    if contact_date > today:
        raise ValidationError('Contact date cannot be in the future')
    if (today - contact_date).days > 365:
        raise ValidationError('Contact date cannot be more than 1 year ago')
    return True


def validation_infection_date(infection_date: date, contact_dates: list) -> bool:
    """Validate infection date against contact history"""
    if infection_date > date.today():
        raise ValidationError('Infection date cannot be in the future')

    # Check if there are any contacts after infection date
    if contact_dates:
        latest_contact = max(contact_dates)
        if latest_contact < infection_date - timedelta(days=14):
            # Warning, not error - might have external exposure
            return True

    return True


def validate_risk_score(score: float) -> bool:
    """Validate risk score is in valid range"""
    if not 0.0 <= score <= 1.0:
        raise ValidationError(f"Risk score {score} must be between 0.0 and 1.0")
    return True


def sanitize_string(text: str, max_length: int = 200) -> str:
    """Sanitize user input strings"""
    if not text:
        return ""

    # Remove potentially dangerous characters
    sanitized = text.strip()
    sanitized = sanitized[:max_length]

    # Remove any control characters
    sanitized = ''.join(char for char in sanitized if ord(char) >= 32)

    return sanitized


def validate_proximity(proximity: Optional[str]) -> bool:
    """Validate proximity value"""
    valid_values = ['close', 'medium', 'far', None]
    if proximity not in valid_values:
        raise ValidationError(f"Proximity must be one of {valid_values}")
    return True


def validate_severity(severity: Optional[str]) -> bool:
    """Validate severity value"""
    valid_values = ['mild', 'moderate', 'severe', None]
    if severity not in valid_values:
        raise ValidationError(f"Severity must be one of {valid_values}")
    return True
