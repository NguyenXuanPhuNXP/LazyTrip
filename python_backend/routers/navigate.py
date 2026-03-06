from fastapi import APIRouter
from models.route import RouteResponse
from services.route_service import get_route_data

router = APIRouter()

@router.get("/api/navigate", response_model=RouteResponse)
async def navigate(start_lat: float, start_lon: float, end_lat: float, end_lon: float):
    return await get_route_data(start_lat, start_lon, end_lat, end_lon)
