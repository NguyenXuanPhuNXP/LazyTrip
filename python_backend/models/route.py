from pydantic import BaseModel, Field
from typing import List, Optional

class WeatherDetails(BaseModel):
    temp: str
    condition: str
    rain_mm: float

class RouteSegment(BaseModel):
    start_location: str = Field(..., alias="from")
    to: str
    distance: str

class TravelTimes(BaseModel):
    car: str
    motorbike: str
    pedestrian: str

class RouteResponse(BaseModel):
    status: str
    city: Optional[str] = None
    weather: Optional[WeatherDetails] = None
    floodRisk: Optional[str] = None
    aiAdvice: Optional[str] = None
    routeWeight: Optional[float] = None
    travelTimes: Optional[TravelTimes] = None
    segments: Optional[List[RouteSegment]] = None
    route_points: Optional[List[List[float]]] = None
    message: Optional[str] = None
