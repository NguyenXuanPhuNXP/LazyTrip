import { useState, useEffect } from "react";
import InpLocation from "./inp_location.jsx";
import "./location_box.css";
import { getAddressFromCoords } from "../services/routeService";

function LocationBox({ waypoints = [] }) {
  const [locations, setLocations] = useState([]);

  // Cập nhật locations khi waypoints từ map thay đổi
  useEffect(() => {
    const updateLocations = async () => {
      const newLocations = [];

      for (let point of waypoints) {
        const address = await getAddressFromCoords(point.lat, point.lng);
        newLocations.push(`${address} (${point.lat.toFixed(4)}, ${point.lng.toFixed(4)})`);
      }

      setLocations(newLocations);
    };

    if (waypoints.length > 0) {
      updateLocations();
    }
  }, [waypoints]);

  return (
    <div className="location-box">
      {/* Hiển thị tất cả waypoints từ map */}
      {locations.length > 0 ? (
        locations.map((loc, index) => (
          <div key={index} className="location-item">
            <span className={index === 0 ? "start-icon" : "point-icon"}>
              {index === 0 ? "🟢" : `📍`}
            </span>
            <input
              type="text"
              value={loc}
              disabled
              className={`inp_location ${index === 0 ? "start" : ""}`}
              placeholder={index === 0 ? "Điểm bắt đầu" : `Điểm ${index}`}
            />
          </div>
        ))
      ) : (
        <div className="location-empty">
          <p>Nhấp vào bản đồ để chọn điểm bắt đầu và điểm đến</p>
        </div>
      )}
    </div>
  );
}

export default LocationBox;
