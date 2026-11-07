import math
from typing import Tuple


def haversine_distance_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """
    Calculates the great-circle distance between two GPS coordinates
    on Earth using the exact Haversine formula.
    Returns distance in Kilometers rounded to 2 decimal places.
    """
    earth_radius_km = 6371.0088

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lng2 - lng1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2)
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    distance = earth_radius_km * c

    return round(distance, 2)


def is_within_shop_radius(
    user_lat: float,
    user_lng: float,
    shop_lat: float,
    shop_lng: float,
    radius_km: float = 3.0,
) -> Tuple[bool, float]:
    """
    Strict Area Isolation:
    Returns (True, distance_km) if customer GPS is within shop's delivery radius.
    Otherwise returns (False, distance_km).
    Guarantees Kukas users strictly see local shops within their radius and
    never see Kunda local shops.
    """
    distance = haversine_distance_km(user_lat, user_lng, shop_lat, shop_lng)
    is_serving = distance <= radius_km
    return is_serving, distance


def estimate_eta_mins(distance_km: float) -> str:
    """
    Estimates delivery time window based on local transit speed:
    - Under 1.5 km: 10-15 mins (hyperlocal instant)
    - Under 3.0 km: 15-20 mins
    - 3.0+ km: 25-30 mins
    """
    if distance_km < 1.5:
        return "10-15 mins"
    elif distance_km < 3.0:
        return "15-20 mins"
    else:
        return "25-30 mins"
