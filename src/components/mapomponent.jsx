import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'; // Quan trọng: Để hiện thị các mảnh bản đồ

import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Fix Leaflet's default icon path resolving issue in Webpack/Vite/Docker
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow
});

import { useState, useEffect } from 'react';
import './mapomponent.css';
import { calculateRoute, calculateOptimisticRoute } from '../services/routeService';

// Thành phần xử lý tương tác click
function LocationMarker({ waypoints, onSelectMarker }) {
    // Tọa độ giới hạn của Việt Nam (Southwest, Northeast)
    const VIETNAM_BOUNDS = [
        [8.179, 102.144], // Southwest
        [23.393, 109.464] // Northeast
    ];

    const isPointInVietnam = (lat, lng) => {
        return (lat >= VIETNAM_BOUNDS[0][0] && lat <= VIETNAM_BOUNDS[1][0] &&
            lng >= VIETNAM_BOUNDS[0][1] && lng <= VIETNAM_BOUNDS[1][1]);
    };

    const map = useMapEvents({
        dblclick(e) {
            if (isPointInVietnam(e.latlng.lat, e.latlng.lng)) {
                onSelectMarker(e.latlng); // Gửi tọa độ ra ngoài
                map.flyTo(e.latlng, map.getZoom()); // Hiệu ứng di chuyển mượt mà
            } else {
                alert("Vui lòng chọn địa điểm nằm trong lãnh thổ Việt Nam!");
            }
        },
    });

    return (
        <>
            {waypoints.map((point, index) => (
                <Marker key={index} position={[point.lat, point.lng]}>
                    <Popup>
                        {index === 0 ? "🟢 Điểm bắt đầu" : `📍 Điểm ${index}`}
                        <br />
                        ({point.lat.toFixed(4)}, {point.lng.toFixed(4)})
                    </Popup>
                </Marker>
            ))}
        </>
    );
}

const MapComponent = ({ waypoints = [], setWaypoints, transportMode = "driving", onRouteCalculated, onLoadingChange }) => {
    const center = [21.0285, 105.8542]; // Tọa độ mặc định Hà Nội
    const [route, setRoute] = useState(null);
    const [loading, setLoading] = useState(false);

    // Xử lý thêm marker khi click trên bản đồ
    const handleSelectMarker = (latlng) => {
        const newWaypoint = { lat: latlng.lat, lng: latlng.lng };
        setWaypoints([...waypoints, newWaypoint]);
    };

    // Gọi API tính toán đường đi khi có ≥ 2 waypoints
    useEffect(() => {
        if (waypoints.length >= 2) {
            const fetchRoute = async () => {
                setLoading(true);
                if (onLoadingChange) onLoadingChange(true);

                // 1. Cập nhật UI nhanh (Optimistic) trong lúc chờ Backend API
                try {
                    const optimisticData = await calculateOptimisticRoute(waypoints, transportMode);
                    if (optimisticData) {
                        setRoute(optimisticData);
                        if (onRouteCalculated) {
                            onRouteCalculated(optimisticData);
                        }
                    }
                } catch (e) {
                    console.error("Optimistic route error:", e);
                }

                // 2. Gọi Backend thật lấy thêm TT Thời tiết + cảnh báo
                try {
                    const routeData = await calculateRoute(waypoints, transportMode);
                    if (routeData) {
                        setRoute(routeData);
                        if (onRouteCalculated) {
                            onRouteCalculated(routeData);
                        }
                    } else {
                        console.warn("Backend failed to calculate detailed route. Keep optimistic UI.");
                    }
                } catch (error) {
                    console.error("Lỗi tính toán đường đi:", error);
                } finally {
                    setLoading(false);
                    if (onLoadingChange) onLoadingChange(false);
                }
            };
            fetchRoute();
        } else {
            setRoute(null);
            if (onRouteCalculated) onRouteCalculated(null);
            if (onLoadingChange) onLoadingChange(false);
        }
    }, [waypoints, transportMode]);

    // Tọa độ giới hạn của Việt Nam (Southwest, Northeast)
    const VIETNAM_BOUNDS = [
        [8.179, 102.144], // Southwest
        [23.393, 109.464] // Northeast
    ];

    return (
        <div className="mapomponent">
            <MapContainer center={center} zoom={7} style={{ height: '100%', width: '100%' }}
                doubleClickZoom={false}
                minZoom={5}
                maxBounds={VIETNAM_BOUNDS}
                maxBoundsViscosity={1.0}
                whenReady={(mapInstance) => {
                    mapInstance.target.invalidateSize();
                }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                />

                <LocationMarker waypoints={waypoints} onSelectMarker={handleSelectMarker} />

                {/* Hiển thị đường route */}
                {route && route.route_points && (
                    <Polyline
                        positions={route.route_points}
                        color="blue"
                        weight={4}
                        opacity={0.7}
                    />
                )}
            </MapContainer>

            {/* Loading indicator */}
            {loading && <div className="loading">Tính toán đường đi...</div>}
        </div>
    );
};

export default MapComponent;