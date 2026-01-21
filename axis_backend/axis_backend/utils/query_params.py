"""Utilities for parsing and validating query parameters."""
from typing import Optional, Tuple
from rest_framework.response import Response
from rest_framework import status


def parse_positive_int(
    value: Optional[str],
    param_name: str,
    default: int,
    min_value: int = 1
) -> Tuple[Optional[int], Optional[Response]]:
    """
    Parse and validate a positive integer query parameter.

    Args:
        value: Query parameter value (may be None)
        param_name: Name of the parameter (for error messages)
        default: Default value if parameter is not provided
        min_value: Minimum allowed value (default: 1)

    Returns:
        Tuple of (parsed_value, error_response):
        - If valid: (int, None)
        - If invalid: (None, Response with 400 status)
    """
    # Use default if value is not provided
    if value is None:
        return default, None

    # Attempt to parse to integer
    try:
        parsed = int(value)
    except (ValueError, TypeError):
        return None, Response(
            {
                'error': f'Invalid {param_name} parameter',
                'message': f'{param_name} must be a valid integer, got: {value}'
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # Validate minimum value
    if parsed < min_value:
        return None, Response(
            {
                'error': f'Invalid {param_name} parameter',
                'message': f'{param_name} must be at least {min_value}, got: {parsed}'
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    return parsed, None

