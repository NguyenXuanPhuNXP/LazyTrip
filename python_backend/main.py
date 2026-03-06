from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import navigate

app = FastAPI()

# --- CẤU HÌNH CORS (BẮT BUỘC ĐỂ REACT GỌI ĐƯỢC) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Cho phép tất cả các nguồn truy cập (thuận tiện khi làm đồ án)
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(navigate.router)

# Chạy lệnh: python -m uvicorn main:app --reload