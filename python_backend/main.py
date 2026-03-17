from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

OPEN_WEATHER_KEY = "169daf78c62992d047ab8270704e4098"

@app.get("/api/navigate")
async def navigate(lat: float, lon: float):

    weather_url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={OPEN_WEATHER_KEY}&units=metric&lang=vi"
    
    try:
        response = requests.get(weather_url)
        w_data = response.json()
        
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Không lấy được thời tiết")

     
        temp = w_data['main']['temp']
        description = w_data['weather'][0]['description']
        rain_1h = w_data.get('rain', {}).get('1h', 0)

        # 3. LOGIC AI - ĐÁNH GIÁ RỦI RO NGẬP (ĐIỂM ĂN TIỀN)
        flood_risk = "Thấp"
        ai_advice = "Đường xá khô ráo, bạn cứ yên tâm di chuyển nhé!"
        
        if rain_1h > 0.1:
            flood_risk = "Trung bình"
            ai_advice = "Trời đang mưa nhẹ. Hãy cẩn thận các đoạn đường trơn trượt."
        
        if rain_1h > 2.0:
            flood_risk = "Cao"
            ai_advice = "CẢNH BÁO: Mưa lớn, nguy cơ ngập cao tại các điểm trũng. Đang đề xuất lộ trình né ngập!"

        # 4. TRẢ DỮ LIỆU VỀ CHO FRONTEND
        return {
            "status": "success",
            "city": w_data['name'],
            "weather": {
                "temp": f"{temp}°C",
                "condition": description,
                "rain_mm": rain_1h
            },
            "floodRisk": flood_risk,
            "aiAdvice": ai_advice,
            "segments": [
                {"from": "Vị trí hiện tại", "to": "Điểm đến", "distance": "Chờ tính toán..."}
            ],
           
            "route_points": [[lat, lon], [lat + 0.005, lon + 0.005]] 
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}

# Chạy lệnh: python -m uvicorn main:app --reload