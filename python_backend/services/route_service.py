import httpx
from fastapi import HTTPException
from models.route import RouteResponse, RouteSegment, WeatherDetails, TravelTimes
from core.config import OPEN_WEATHER_KEY

async def get_route_data(start_lat: float, start_lon: float, end_lat: float, end_lon: float) -> RouteResponse:
    # 1. Gọi API thời tiết thật (Lấy thời tiết tại điểm bắt đầu)
    weather_url = f"https://api.openweathermap.org/data/2.5/weather?lat={start_lat}&lon={start_lon}&appid={OPEN_WEATHER_KEY}&units=metric&lang=vi"
    
    # URL lấy dữ liệu Road Network từ OSRM API (bên thứ 3 miễn phí)
    osrm_url = f"http://router.project-osrm.org/route/v1/driving/{start_lon},{start_lat};{end_lon},{end_lat}?overview=full&geometries=geojson"
    
    route_points = [[start_lat, start_lon], [end_lat, end_lon]]
    distance_text = "Chờ tính toán..."
    distance_km = 0.0 # Lưu trữ khoảng cách để tính toán vận tốc
    
    async with httpx.AsyncClient() as client:
        # Gọi API Thời tiết
        try:
            response = await client.get(weather_url)
            response.raise_for_status() # Raise error for HTTP codes 4xx/5xx
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Lỗi kết nối đến dịch vụ thời tiết: {str(e)}")
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=f"Lỗi từ dịch vụ thời tiết: {e.response.text}")
            
        w_data = response.json()

        # Lấy dữ liệu Route (Road Network) từ OSRM
        try:
            osrm_response = await client.get(osrm_url)
            if osrm_response.status_code == 200:
                osrm_data = osrm_response.json()
                if osrm_data.get("routes"):
                    # OSRM trả về coordinates dạng [lon, lat], frontend Leaflet cần [lat, lon]
                    route_coords = osrm_data["routes"][0]["geometry"]["coordinates"]
                    route_points = [[coord[1], coord[0]] for coord in route_coords]
                    
                    # Tính khoảng cách
                    distance_m = osrm_data["routes"][0]["distance"]
                    distance_km = distance_m / 1000
                    distance_text = f"{distance_km:.1f} km"
        except Exception as e:
            print(f"Lỗi khi gọi OSRM API: {e}")
    
    # 2. Trích xuất dữ liệu quan trọng từ Thời tiết
    temp = w_data['main']['temp']
    description = w_data['weather'][0]['description']
    rain_1h = w_data.get('rain', {}).get('1h', 0)

    # 3. LOGIC AI - ĐÁNH GIÁ RỦI RO NGẬP
    flood_risk = "Thấp"
    ai_advice = "Đường xá khô ráo, bạn cứ yên tâm di chuyển nhé!"
    route_weight = 1.0  # Trọng số bình thường
    
    if rain_1h > 0.1:
        flood_risk = "Trung bình"
        ai_advice = "Trời đang mưa nhẹ. Hãy cẩn thận các đoạn đường trơn trượt."
        route_weight = 1.0 + (rain_1h * 0.5)  # Trọng số tăng lên vì đường trơn
    
    if rain_1h > 2.0:
        flood_risk = "Cao"
        ai_advice = "CẢNH BÁO: Mưa lớn, nguy cơ ngập cao tại các điểm trũng. Đang đề xuất lộ trình né ngập!"
        route_weight = 1.0 + (rain_1h * 1.5)  # Trọng số tăng vọt vì ngập lụt

    # 4. TÍNH TOÁN THỜI GIAN DỰ KIẾN (TRAVEL TIMES)
    # Vận tốc cơ bản (km/h)
    speed_car = 35.0
    speed_motorbike = 40.0
    speed_pedestrian = 5.0

    # Điều chỉnh vận tốc do thời tiết
    if rain_1h > 2.0:
        # Mưa to/Ngập lụt -> giảm tốc độ mạnh
        speed_car *= 0.60
        speed_motorbike *= 0.50
        speed_pedestrian *= 0.70
    elif rain_1h > 0.1:
        # Mưa nhẹ -> giảm tốc độ một chút
        speed_car *= 0.85
        speed_motorbike *= 0.85
        speed_pedestrian *= 0.85
        
    def format_time(hours: float) -> str:
        if hours <= 0:
            return "0 phút"
        total_minutes = int(round(hours * 60))
        if total_minutes == 0 and hours > 0:
            total_minutes = 1 # Ít nhất là 1 phút nếu khoảng cách > 0
            
        h = total_minutes // 60
        m = total_minutes % 60
        
        if h > 0:
            return f"{h} giờ {m} phút"
        return f"{m} phút"

    travel_times = TravelTimes(
        car=format_time(distance_km / speed_car) if speed_car > 0 else "N/A",
        motorbike=format_time(distance_km / speed_motorbike) if speed_motorbike > 0 else "N/A",
        pedestrian=format_time(distance_km / speed_pedestrian) if speed_pedestrian > 0 else "N/A"
    )

    # 5. TRẢ DỮ LIỆU
    return RouteResponse(
        status="success",
        city=w_data['name'],
        weather=WeatherDetails(
            temp=f"{temp}°C",
            condition=description,
            rain_mm=rain_1h
        ),
        floodRisk=flood_risk,
        aiAdvice=ai_advice,
        routeWeight=round(route_weight, 2),
        travelTimes=travel_times,
        segments=[
            RouteSegment(**{"from": "Vị trí hiện tại", "to": "Điểm đến", "distance": distance_text})
        ],
        # Trả về các điểm đã phân giải tuyến đường từ Road Network OSRM API
        route_points=route_points 
    )
