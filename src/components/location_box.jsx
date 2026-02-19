import { useState, useEffect } from "react";
import InpLocation from "./inp_location.jsx";
import "./location_box.css";
import { getAddressFromCoords, getCoordsFromAddress } from "../services/routeService";

function LocationBox({ waypoints = [], setWaypoints }) {
  const [locations, setLocations] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);

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
    } else {
      setLocations([]);
    }
  }, [waypoints]);

  // Xóa một địa điểm
  const handleDeleteLocation = (index) => {
    const newWaypoints = waypoints.filter((_, i) => i !== index);
    setWaypoints(newWaypoints);
  };

  // Xóa tất cả địa điểm
  const handleClearAll = () => {
    setWaypoints([]);
    setInputValue("");
  };

  // Thêm địa điểm bằng cách gõ địa chỉ
  const handleAddLocation = async () => {
    if (!inputValue.trim()) {
      alert("Vui lòng nhập địa điểm");
      return;
    }

    setLoading(true);
    try {
      const coords = await getCoordsFromAddress(inputValue);

      if (coords) {
        setWaypoints([...waypoints, { lat: coords.lat, lng: coords.lng }]);
        setInputValue("");
      } else {
        alert("Không tìm thấy địa điểm. Vui lòng thử lại.");
      }
    } catch (error) {
      alert("Lỗi: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Nhấn Enter để thêm
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleAddLocation();
    }
  };

  return (
    <div className="location-box">
      {/* Input nhập địa điểm */}
      <div className="input-section">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Gõ địa điểm (vd: Hà Nội, Hồ Chí Minh)..."
          className="location-input"
          disabled={loading}
        />
        <button 
          onClick={handleAddLocation}
          className="btn-add"
          disabled={loading}
        >
          {loading ? "..." : "+"}
        </button>
      </div>

      {/* Hiển thị tất cả waypoints từ map */}
      {locations.length > 0 ? (
        <>
          <div className="locations-list">
            {locations.map((loc, index) => (
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
                <button
                  onClick={() => handleDeleteLocation(index)}
                  className="btn-delete"
                  title="Xóa điểm này"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button onClick={handleClearAll} className="btn-clear-all">
            Xóa tất cả
          </button>
        </>
      ) : (
        <div className="location-empty">
          <p>Nhập địa điểm hoặc nhấp vào bản đồ để chọn vị trí</p>
        </div>
      )}
    </div>
  );
}

export default LocationBox;
