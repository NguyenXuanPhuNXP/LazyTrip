# 🚗 LazyTrip

**LazyTrip** is an open-source domestic routing and trip-planning web application built specifically for Vietnam. By combining OpenStreetMap routing algorithms (OSRM) with real-time weather constraints (OpenWeatherMap) and responsive mapping (Leaflet), LazyTrip provides users with a seamless and interactive way to plan multi-stop journeys across the country.

---

## ✨ Key Features

- **📍 Intelligent Geolocation:** Instantly locate your current standing point with the "Vị trí của tôi" button, restricting search boundaries purely to Vietnamese territories for high-accuracy domestic results.
- **🛣️ Multi-Stop Domestic Routing (TSP Engine):** Automatically calculate the shortest path through multiple waypoints. Utilizing OSRM Trip API under the hood, it optimally reorders intermediate stops to ensure the shortest journey.
- **🌧️ Real-time Weather Integration:** Displays live weather conditions (temperature, rain) at each leg of your journey.
- **🚨 AI-Assisted Danger Warnings:** Proactively reduces estimated travel speeds (ETA) and raises Flood Risk alerts (`Thấp`, `Trung bình`, `Cao`) if heavy rainfall is detected at destination cities.
- **🗺️ Interactive Map Experience:** Built with React-Leaflet, allowing users to drop custom pins, drag-and-drop to reorder waypoints, and view the precise drawn routing line on the map.
- **🇻🇳 Strictly Domestic Routing Logic:** Actively prevents routes from cutting through neighboring countries (Laos/Cambodia) by automatically injecting coastal transit waypoints (National Route 1A) for long North-South journeys.

---

## 🛠️ Tech Stack

### Frontend (React + Vite)
- **Framework:** React.js (Vite compiler for HMR and fast builds)
- **Map Engine:** React-Leaflet & OpenStreetMap Tiles
- **Geocoding:** Nominatim API (Restricted to `&countrycodes=vn`)
- **Styling:** Vanilla CSS (Responsive cards, custom drag-and-drop lists)

### Backend (Python + FastAPI)
- **Framework:** FastAPI (High performance, async ASGI)
- **Routing Engine:** OSRM (Open Source Routing Machine) Cloud API
- **Weather API:** OpenWeatherMap API
- **Client/Requests:** `httpx` and `asyncio` for concurrent API fetches.

---

## 🚀 Getting Started (Local Development)

You can run this project locally on your machine either manually or by using Docker.

### Method 1: Running with Docker (Recommended)
You only need [Docker](https://docs.docker.com/get-docker/) installed.
1. Clone the repository: `git clone https://github.com/your-username/LazyTrip.git`
2. Navigate into the folder: `cd LazyTrip`
3. Start the containers:
   ```bash
   docker-compose up --build
   ```
4. Access the App: Open your browser at `http://localhost:5173`. The backend swagger UI is available at `http://localhost:8000/docs`.

### Method 2: Manual Installation without Docker

#### 1. Setup Python Backend
1. Open a terminal and navigate to the `python_backend` folder:
   ```bash
   cd python_backend
   ```
2. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   source venv/bin/activate 
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. (Optional) Set your OpenWeather API Key in `core/config.py` if needed.
5. Run the FastAPI server:
   ```bash
   python -m uvicorn main:app --reload
   ```

#### 2. Setup React Frontend
1. Open a new terminal and navigate to the project root:
   ```bash
   cd LazyTrip
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open your browser and go to the local link provided (usually `http://localhost:5173`).

---

## 🤝 Contributing

We welcome contributions from the community! Whether you find a bug, want to add a new feature, or improve the documentation, please read our [CONTRIBUTING.md](CONTRIBUTING.md) guide before opening a Pull Request.

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
