import { useState, useEffect, useRef } from "react";
import "./location_box.css";
import { getAddressFromCoords, getCoordsFromAddress } from "../services/routeService";

const LABELS = ["A", "B", "C", "D", "E", "F"];

const TRANSPORT_MODES = [
  { id: "driving", label: "Ô tô", icon: "🚗" },
  { id: "motorcycle", label: "Xe máy", icon: "🏍️" },
  { id: "cycling", label: "Xe đạp", icon: "🚲" },
  { id: "foot", label: "Đi bộ", icon: "🚶" },
];

function markerColor(index, total) {
  if (index === 0) return "#22c55e";
  if (index === total - 1) return "#ef4444";
  return "#6366f1";
}

function LocationBox({ waypoints = [], setWaypoints, isOpen = false, toggle, transportMode = "driving", setTransportMode }) {
  const [locations, setLocations] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [showTransport, setShowTransport] = useState(true);
  const [showRoute, setShowRoute] = useState(true);
  const skipGeocode = useRef(false);

  useEffect(() => {
    if (skipGeocode.current) {
      skipGeocode.current = false;
      return;
    }
    if (waypoints.length > 0) {
      Promise.all(
        waypoints.map(async (point) => {
          const address = await getAddressFromCoords(point.lat, point.lng);
          return `${address} (${point.lat.toFixed(4)}, ${point.lng.toFixed(4)})`;
        })
      ).then(setLocations);
    } else {
      setLocations([]);
    }
  }, [waypoints]);

  const handleDeleteLocation = (index) => {
    setWaypoints(waypoints.filter((_, i) => i !== index));
  };

  const handleAddLocation = async () => {
    if (!inputValue.trim()) return;
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

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleAddLocation();
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Trình duyệt của bạn không hỗ trợ định vị!");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        try {
          const address = await getAddressFromCoords(lat, lng);
          const newWaypoint = { lat, lng, address: "Vị trí của bạn" }; // Pass label to backend

          if (waypoints.length === 0) {
            setWaypoints([newWaypoint]);
          } else {
            // If there's already points, insert it at the beginning
            const newWaypoints = [newWaypoint, ...waypoints];
            setWaypoints(newWaypoints);
          }
        } catch (error) {
          alert("Lỗi khi chuyển đổi tọa độ thành địa chỉ: " + error.message);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        setLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            alert("Bạn đã từ chối cho phép lấy vị trí.");
            break;
          case error.POSITION_UNAVAILABLE:
            alert("Không thể xác định vị trí hiện tại.");
            break;
          case error.TIMEOUT:
            alert("Thời gian lấy vị trí quá lâu.");
            break;
          default:
            alert("Đã xảy ra lỗi không xác định khi lấy vị trí.");
        }
      }
    );
  };


  const handleDragStart = (e, index) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (index !== dragIndex) setDragOverIndex(index);
  };

  const handleDragLeave = () => setDragOverIndex(null);

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }
    const newWaypoints = [...waypoints];
    const newLocations = [...locations];
    const [wp] = newWaypoints.splice(dragIndex, 1);
    const [loc] = newLocations.splice(dragIndex, 1);
    newWaypoints.splice(dropIndex, 0, wp);
    newLocations.splice(dropIndex, 0, loc);
    skipGeocode.current = true;
    setLocations(newLocations);
    setWaypoints(newWaypoints);
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const total = locations.length;

  return (
    <div className="lbox">

      {/* ── Search bar ── */}
      <div className="lbox-search">
        <button
          className={`lbox-toggle${isOpen ? " is-open" : ""}`}
          onClick={toggle}
          title={isOpen ? "Đóng menu" : "Mở menu"}
          aria-label={isOpen ? "Đóng menu" : "Mở menu"}
        >
          {isOpen ? "✖" : "☰"}
        </button>

        <svg className="lbox-search-svg" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>

        <input
          type="text"
          className="lbox-input"
          placeholder="Tìm địa điểm..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading}
          aria-label="Nhập địa điểm"
        />

        {inputValue && !loading && (
          <button
            className="lbox-clear-input"
            onClick={() => setInputValue("")}
            tabIndex={-1}
            aria-label="Xóa ô nhập"
          >
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        )}

        <button
          className="lbox-location-btn"
          onClick={handleGetCurrentLocation}
          disabled={loading}
          title="Vị trí của tôi"
          aria-label="Lấy vị trí hiện tại"
        >
          <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
            <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" fill="currentColor" />
          </svg>
        </button>

        <button
          className="lbox-add-btn"
          onClick={handleAddLocation}
          disabled={loading || !inputValue.trim()}
          title="Thêm điểm"
          aria-label="Thêm địa điểm"
        >
          {loading ? (
            <span className="lbox-spinner" aria-hidden="true" />
          ) : (
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>

      {/* ── Transport mode selector ── */}
      <div className="lbox-section-head" onClick={() => setShowTransport(v => !v)}>
        <span className="lbox-section-title">🚗 Phương tiện</span>
        <span className={`lbox-chevron${showTransport ? " is-open" : ""}`}>&#8250;</span>
      </div>
      <div className={`lbox-section-body${showTransport ? "" : " is-collapsed"}`}>
        <div className="lbox-transport">
          {TRANSPORT_MODES.map(mode => (
            <button
              key={mode.id}
              className={`lbox-transport-btn${transportMode === mode.id ? " is-active" : ""}`}
              onClick={(e) => { e.stopPropagation(); setTransportMode(mode.id); }}
              title={mode.label}
            >
              <span className="lbox-transport-icon">{mode.icon}</span>
              <span className="lbox-transport-label">{mode.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Waypoint list ── */}
      {total > 0 && (
        <div className="lbox-route">

          <div className="lbox-section-head" onClick={() => setShowRoute(v => !v)}>
            <span className="lbox-section-title">Hành trình</span>
            <span className="lbox-route-badge">{total} điểm</span>
            <span className={`lbox-chevron${showRoute ? " is-open" : ""}`}>&#8250;</span>
          </div>

          <div className={`lbox-section-body${showRoute ? "" : " is-collapsed"}`}>

            <ul className="lbox-list" aria-label="Danh sách điểm dừng">
              {locations.map((loc, index) => (
                <li
                  key={index}
                  className={`lbox-wp${dragIndex === index ? " is-dragging" : ""}${dragOverIndex === index && dragIndex !== index ? " is-drag-over" : ""}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                >

                  {/* Left column: marker + line */}
                  <div className="lbox-wp-track">
                    <div
                      className="lbox-wp-dot"
                      style={{ background: markerColor(index, total) }}
                      aria-hidden="true"
                    >
                      {LABELS[index] ?? index + 1}
                    </div>
                    {index < total - 1 && (
                      <div className="lbox-wp-line" aria-hidden="true" />
                    )}
                  </div>

                  {/* Text */}
                  <div className="lbox-wp-info">
                    <span className="lbox-wp-tag">
                      {index === 0
                        ? "Điểm đầu"
                        : index === total - 1
                          ? "Điểm cuối"
                          : `Điểm ${index + 1}`}
                    </span>
                    <span className="lbox-wp-addr">{loc}</span>
                  </div>

                  {/* Drag handle */}
                  <div className="lbox-drag-handle" aria-hidden="true">
                    <svg viewBox="0 0 10 16" width="10" height="16">
                      <circle cx="3" cy="3" r="1.5" fill="currentColor" />
                      <circle cx="7" cy="3" r="1.5" fill="currentColor" />
                      <circle cx="3" cy="8" r="1.5" fill="currentColor" />
                      <circle cx="7" cy="8" r="1.5" fill="currentColor" />
                      <circle cx="3" cy="13" r="1.5" fill="currentColor" />
                      <circle cx="7" cy="13" r="1.5" fill="currentColor" />
                    </svg>
                  </div>

                  {/* Delete */}
                  <button
                    className="lbox-wp-del"
                    onClick={() => handleDeleteLocation(index)}
                    title="Xóa điểm này"
                    aria-label={`Xóa điểm ${LABELS[index] ?? index + 1}`}
                  >
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>

                </li>
              ))}
            </ul>

            <div className="lbox-footer">
              <button
                className="lbox-start-btn"
                disabled={waypoints.length < 2}
                title={waypoints.length < 2 ? "Chọn ít nhất 2 điểm" : "Bắt đầu di chuyển"}
              >
                <svg viewBox="0 0 24 24" fill="none" width="15" height="15">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor" />
                </svg>
                Bắt đầu di chuyển
              </button>
            </div>

          </div>{/* end lbox-section-body */}

        </div>
      )}
    </div>
  );
}

export default LocationBox;
