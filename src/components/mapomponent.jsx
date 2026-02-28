import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'; // Quan trọng: Để hiện thị các mảnh bản đồ
import { useState, useEffect } from 'react';
import './mapomponent.css';
import { calculateRoute } from '../services/routeService';

// Thành phần xử lý tương tác click
function LocationMarker({ waypoints, onSelectMarker }) {
    const map = useMapEvents({
        click(e) {
            onSelectMarker(e.latlng); // Gửi tọa độ ra ngoài
            map.flyTo(e.latlng, map.getZoom()); // Hiệu ứng di chuyển mượt mà
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

const MapComponent = ({ waypoints = [], setWaypoints }) => {    
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
                try {
                    const routeData = await calculateRoute(waypoints);
                    setRoute(routeData);
                } catch (error) {
                    console.error("Lỗi tính toán đường đi:", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchRoute();
        }
    }, [waypoints]);

    return (
        <div className="mapomponent">
            <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}
                whenReady={(mapInstance) => {
                    mapInstance.target.invalidateSize();
                }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                />

                <LocationMarker waypoints={waypoints} onSelectMarker={handleSelectMarker} />

                {/* Hiển thị đường route */}
                {route && route.geometry && (
                    <Polyline
                        positions={route.geometry.map(point => [point[1], point[0]])}
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