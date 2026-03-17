from fastapi import APIRouter
from models.route import RouteResponse, MultipleRouteRequest
from services.route_service import get_route_data, get_multiple_route_data

router = APIRouter()

@router.get("/api/navigate", response_model=RouteResponse)
async def navigate(start_lat: float, start_lon: float, end_lat: float, end_lon: float):
    return await get_route_data(start_lat, start_lon, end_lat, end_lon)

@router.post("/api/navigate/multiple", response_model=RouteResponse)
async def navigate_multiple(request: MultipleRouteRequest):
    return await get_multiple_route_data(request.waypoints, request.vehicle)
