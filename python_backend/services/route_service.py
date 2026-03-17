import httpx
import asyncio
import time
from fastapi import HTTPException
from models.route import RouteResponse, RouteSegment, WeatherDetails, TravelTimes, Waypoint
from core.config import OPEN_WEATHER_KEY

# Tọa độ giới hạn của Việt Nam (Southwest, Northeast)
VIETNAM_BOUNDS = {
    "lat_min": 8.179, "lat_max": 23.393,
    "lon_min": 102.144, "lon_max": 109.464
}

def is_in_vietnam(lat: float, lon: float) -> bool:
    return (VIETNAM_BOUNDS["lat_min"] <= lat <= VIETNAM_BOUNDS["lat_max"] and
            VIETNAM_BOUNDS["lon_min"] <= lon <= VIETNAM_BOUNDS["lon_max"])

async def get_route_data(start_lat: float, start_lon: float, end_lat: float, end_lon: float, vehicle: str = "car") -> RouteResponse:
    if not is_in_vietnam(start_lat, start_lon) or not is_in_vietnam(end_lat, end_lon):
        raise HTTPException(status_code=400, detail="Chúng tôi chỉ hỗ trợ lên lịch trình cho các địa điểm nằm trong lãnh thổ Việt Nam.")

    # 1. Gọi API thời tiết thật (Lấy thời tiết tại điểm bắt đầu)
    weather_url = f"https://api.openweathermap.org/data/2.5/weather?lat={start_lat}&lon={start_lon}&appid={OPEN_WEATHER_KEY}&units=metric&lang=vi"
    
    # Map vehicle type to OSRM profile
    profile = "driving"
    if vehicle in ["motorcycle", "motorbike", "bike", "cycling"]:
        profile = "bike"
    elif vehicle in ["foot", "pedestrian"]:
        profile = "foot"

    # URL lấy dữ liệu Road Network từ OSRM API (bên thứ 3 miễn phí)
    osrm_url = f"http://router.project-osrm.org/route/v1/{profile}/{start_lon},{start_lat};{end_lon},{end_lat}?overview=full&geometries=geojson"
    
    # Chèn chuỗi các điểm trung chuyển dọc Quốc lộ 1A nếu quãng đường từ Nam ra Bắc để tránh đi cắt ngang qua Lào/Campuchia
    if min(start_lat, end_lat) < 14.5 and max(start_lat, end_lat) > 17.5:
        # Chuỗi tọa độ: Nha Trang, Đà Nẵng, Huế, Vinh
        coastal_chain = "109.1967,12.2388;108.2022,16.0544;107.5905,16.4637;105.6813,18.6734"
        if start_lat > end_lat: # Nếu đi từ Bắc vào Nam thì đảo ngược chuỗi
            coastal_chain = "105.6813,18.6734;107.5905,16.4637;108.2022,16.0544;109.1967,12.2388"
            
        osrm_url = f"http://router.project-osrm.org/route/v1/{profile}/{start_lon},{start_lat};{coastal_chain};{end_lon},{end_lat}?overview=full&geometries=geojson"
    
    route_points = [[start_lat, start_lon], [end_lat, end_lon]]
    distance_text = "Chờ tính toán..."
    distance_km = 0.0 # Lưu trữ khoảng cách để tính toán vận tốc
    
    async with httpx.AsyncClient() as client:
        # Gọi API Thời tiết
        try:
            response = await client.get(weather_url)
            response.raise_for_status() # Raise error for HTTP codes 4xx/5xx
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Lỗi HTTP kết nối đến dịch vụ thời tiết: {str(e)}")
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=f"Lỗi từ dịch vụ thời tiết: {e.response.text}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Lỗi tải dữ liệu thời tiết: {str(e)}")
            
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
    rain_obj = w_data.get('rain') or {}
    rain_1h = rain_obj.get('1h', 0)

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

    def get_travel_time_for_vehicle(tt: TravelTimes, v: str) -> str:
        if v in ["motorcycle", "motorbike"]:
            return tt.motorbike
        elif v in ["bike", "cycling"]:
            return getattr(tt, "bike", "N/A")
        elif v in ["foot", "pedestrian"]:
            return tt.pedestrian
        return tt.car

    # 5. TRẢ DỮ LIỆU
    return RouteResponse(
        status="success",
        totalDistance=distance_text,
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
            RouteSegment(
                **{"from": "Vị trí hiện tại", "to": "Điểm đến"},
                distance=distance_text,
                time=get_travel_time_for_vehicle(travel_times, vehicle),
                weather=WeatherDetails(temp=f"{temp}°C", condition=description, rain_mm=rain_1h),
                floodRisk=flood_risk
            )
        ],
        # Trả về các điểm đã phân giải tuyến đường từ Road Network OSRM API
        route_points=route_points 
    )

WEATHER_CACHE = {}
CACHE_TTL = 600 # 10 minutes cache TTL

async def fetch_weather(client: httpx.AsyncClient, lat: float, lon: float):
    cache_key = (round(lat, 2), round(lon, 2))
    now = time.time()
    
    if cache_key in WEATHER_CACHE:
        timestamp, data = WEATHER_CACHE[cache_key]
        if now - timestamp < CACHE_TTL:
            return data

    url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={OPEN_WEATHER_KEY}&units=metric&lang=vi"
    resp = await client.get(url)
    if resp.status_code == 200:
        data = resp.json()
        WEATHER_CACHE[cache_key] = (now, data)
        return data
    return None

def evaluate_weather_risk(weather_data):
    if not weather_data:
        return "Thấp", "Không có dữ liệu thời tiết.", 1.0, 0, "N/A", "N/A"
        
    temp = weather_data.get('main', {}).get('temp', 0)
    desc = weather_data.get('weather', [{}])[0].get('description', '')
    rain_obj = weather_data.get('rain') or {}
    rain_1h = rain_obj.get('1h', 0)
    
    flood_risk = "Thấp"
    ai_advice = "Đường xá khô ráo, bạn cứ yên tâm di chuyển nhé!"
    route_weight = 1.0
    
    if rain_1h > 0.1:
        flood_risk = "Trung bình"
        ai_advice = "Trời đang mưa nhẹ. Hãy cẩn thận các đoạn đường trơn trượt."
        route_weight = 1.0 + (rain_1h * 0.5)
    
    if rain_1h > 2.0:
        flood_risk = "Cao"
        ai_advice = "CẢNH BÁO: Mưa lớn, nguy cơ ngập cao tại các điểm trũng. Đang đề xuất lộ trình né ngập!"
        route_weight = 1.0 + (rain_1h * 1.5)
        
    return flood_risk, ai_advice, route_weight, rain_1h, f"{temp}°C", desc
    
def calculate_times(distance_km, rain_1h):
    # Base speed
    speed_car = 35.0
    speed_motorbike = 40.0
    speed_bike = 15.0
    speed_pedestrian = 5.0

    if rain_1h > 2.0:
        speed_car *= 0.60
        speed_motorbike *= 0.50
        speed_bike *= 0.60
        speed_pedestrian *= 0.70
    elif rain_1h > 0.1:
        speed_car *= 0.85
        speed_motorbike *= 0.85
        speed_bike *= 0.85
        speed_pedestrian *= 0.85
        
    def format_time(hours: float) -> str:
        if hours <= 0: return "0 phút"
        total_minutes = int(round(hours * 60))
        if total_minutes == 0 and hours > 0: total_minutes = 1
        h = total_minutes // 60
        m = total_minutes % 60
        if h > 0: return f"{h} giờ {m} phút"
        return f"{m} phút"

    return TravelTimes(
        car=format_time(distance_km / speed_car) if speed_car > 0 else "N/A",
        motorbike=format_time(distance_km / speed_motorbike) if speed_motorbike > 0 else "N/A",
        bike=format_time(distance_km / speed_bike) if speed_bike > 0 else "N/A",
        pedestrian=format_time(distance_km / speed_pedestrian) if speed_pedestrian > 0 else "N/A"
    )

async def get_multiple_route_data(waypoints: list[Waypoint], vehicle: str = "car") -> RouteResponse:
    if len(waypoints) < 2:
        raise HTTPException(status_code=400, detail="Cần ít nhất 2 điểm.")
    
    for wp in waypoints:
        if not is_in_vietnam(wp.lat, wp.lng):
            raise HTTPException(status_code=400, detail=f"Địa điểm có tọa độ ({wp.lat}, {wp.lng}) ({wp.address}) không nằm trong lãnh thổ Việt Nam. Tính năng chỉ hỗ trợ tuyến đường nội địa.")
        
    # Ép lộ trình đi qua đường nội địa VN (Dọc bờ biển) thay vì cắt ngang biên giới
    min_lat = min(wp.lat for wp in waypoints)
    max_lat = max(wp.lat for wp in waypoints)
    if min_lat < 14.5 and max_lat > 17.5:
        has_mid = any(14.5 <= wp.lat <= 17.5 for wp in waypoints)
        if not has_mid:
            # Chèn chuỗi trạm trung chuyển dọc quốc lộ 1A vào giữa hành trình
            nha_trang = Waypoint(lat=12.2388, lng=109.1967, address="Trạm trung chuyển dọc QL1A (Nha Trang)")
            da_nang = Waypoint(lat=16.0544, lng=108.2022, address="Trạm trung chuyển dọc QL1A (Đà Nẵng)")
            hue = Waypoint(lat=16.4637, lng=107.5905, address="Trạm trung chuyển dọc QL1A (Huế)")
            vinh = Waypoint(lat=18.6734, lng=105.6813, address="Trạm trung chuyển dọc QL1A (Vinh)")
            
            # Cần sắp xếp thứ tự tùy thuộc vào chiều đi (Nam ra Bắc hay Bắc vào Nam)
            is_south_to_north = waypoints[0].lat < waypoints[-1].lat
            chain = [nha_trang, da_nang, hue, vinh] if is_south_to_north else [vinh, hue, da_nang, nha_trang]
            
            for index, item in enumerate(chain):
                waypoints.insert(1 + index, item)

    coords_str = ";".join([f"{wp.lng},{wp.lat}" for wp in waypoints])
    
    profile = "driving"
    if vehicle in ["motorcycle", "motorbike", "bike", "cycling"]:
        profile = "bike"
    elif vehicle in ["foot", "pedestrian"]:
        profile = "foot"
        
    is_trip = False
    if len(waypoints) == 2:
        osrm_url = f"http://router.project-osrm.org/route/v1/{profile}/{coords_str}?overview=full&geometries=geojson"
    else:
        is_trip = True
        osrm_url = f"http://router.project-osrm.org/trip/v1/{profile}/{coords_str}?roundtrip=false&source=first&destination=last&overview=full&geometries=geojson"
    
    route_points = []
    
    async with httpx.AsyncClient() as client:
        # 1. Gọi OSRM Trip API
        try:
            osrm_response = await client.get(osrm_url, timeout=10.0)
            if osrm_response.status_code != 200:
                raise HTTPException(status_code=400, detail="Không thể tính toán lộ trình từ OSRM")
            osrm_data = osrm_response.json()
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Lỗi kết nối OSRM: {str(e)}")
            
        trips = osrm_data.get("trips", []) if is_trip else osrm_data.get("routes", [])
        if not trips:
            raise HTTPException(status_code=400, detail="Không tìm thấy lộ trình phù hợp.")
            
        trip = trips[0]
        # Chuyển đổi geometry
        route_coords = trip["geometry"]["coordinates"]
        route_points = [[c[1], c[0]] for c in route_coords]
        
        # OSRM trả về thông tin các điểm dừng đã được sắp xếp
        # list of waypoints trong trip có chứa thông tin điểm, theo thứ tự hành trình
        ordered_waypoints = osrm_data.get("waypoints", [])
        
        # Gán tên địa chỉ ban đầu vào ordered_waypoints bằng index
        for i, wp in enumerate(ordered_waypoints):
            wp["original_name"] = waypoints[i].address if waypoints[i].address else f"Điểm {i+1}"
            
        ordered_waypoints.sort(key=lambda w: w.get("waypoint_index", 0))
        
        # 2. Lấy thông tin thời tiết cho từng điểm (sử dụng gather để tăng tốc)
        weather_tasks = []
        for wp in ordered_waypoints:
            loc = wp["location"]
            weather_tasks.append(fetch_weather(client, loc[1], loc[0]))
        
        weather_results = await asyncio.gather(*weather_tasks)
        
        # 3. Phân tích từng chặng (legs)
        legs = trip.get("legs", [])
        segments = []
        
        total_dist_km = 0
        max_rain = 0
        worst_weather_data = weather_results[0]
        
        for i, leg in enumerate(legs):
            leg_dist_km = leg["distance"] / 1000.0
            total_dist_km += leg_dist_km
            
            # Thời tiết tại điểm đến của chặng
            w_data = weather_results[i+1] if i+1 < len(weather_results) else None
            f_risk, _, _, rain_1h, temp, desc = evaluate_weather_risk(w_data)
            
            w_details = WeatherDetails(temp=temp, condition=desc, rain_mm=rain_1h) if w_data else None
            
            if rain_1h > max_rain:
                max_rain = rain_1h
                worst_weather_data = w_data
                
            ttimes = calculate_times(leg_dist_km, rain_1h)
            
            from_name = ordered_waypoints[i].get("original_name", f"Điểm {i+1}")
            to_name = ordered_waypoints[i+1].get("original_name", f"Điểm {i+2}")
            
            def get_travel_time_for_vehicle(tt: TravelTimes, v: str) -> str:
                if v in ["motorcycle", "motorbike"]:
                    return tt.motorbike
                elif v in ["bike", "cycling"]:
                    return getattr(tt, "bike", "N/A")
                elif v in ["foot", "pedestrian"]:
                    return tt.pedestrian
                return tt.car
                
            segments.append(RouteSegment(
                **{"from": from_name, "to": to_name},
                distance=f"{leg_dist_km:.1f} km",
                time=get_travel_time_for_vehicle(ttimes, vehicle),
                weather=w_details,
                floodRisk=f_risk
            ))
            
        # Tổng kết hành trình
        f_risk, advice, wgt, _, temp, desc = evaluate_weather_risk(worst_weather_data)
        total_times = calculate_times(total_dist_km, max_rain)
        
        # Trả về kết quả
        city_name = worst_weather_data.get("name", "Nhiều vị trí") if worst_weather_data else "Không rõ"
        
        return RouteResponse(
            status="success",
            totalDistance=f"{total_dist_km:.1f} km",
            city=city_name,
            weather=WeatherDetails(temp=temp, condition=desc, rain_mm=max_rain) if worst_weather_data else None,
            floodRisk=f_risk,
            aiAdvice=advice,
            routeWeight=wgt,
            travelTimes=total_times,
            segments=segments,
            route_points=route_points
        )
