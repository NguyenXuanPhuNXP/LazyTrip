from pydantic import BaseModel, Field
from typing import List, Optional

class WeatherDetails(BaseModel):
    temp: str
    condition: str
    rain_mm: float

class Waypoint(BaseModel):
    lat: float
    lng: float
    address: Optional[str] = None

class RouteSegment(BaseModel):
    start_location: str = Field(..., alias="from")
    to: str
    distance: str
    time: str
    weather: Optional[WeatherDetails] = None
    floodRisk: Optional[str] = None

class TravelTimes(BaseModel):
    car: str
    motorbike: str
    bike: str
    pedestrian: str

class RouteResponse(BaseModel):
    status: str
    totalDistance: Optional[str] = None
    city: Optional[str] = None
    weather: Optional[WeatherDetails] = None
    floodRisk: Optional[str] = None
    aiAdvice: Optional[str] = None
    routeWeight: Optional[float] = None
    travelTimes: Optional[TravelTimes] = None
    segments: Optional[List[RouteSegment]] = None
    route_points: Optional[List[List[float]]] = None
    message: Optional[str] = None

class MultipleRouteRequest(BaseModel):
    waypoints: List[Waypoint]
    vehicle: Optional[str] = "car"
