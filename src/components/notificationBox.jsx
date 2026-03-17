import "./notificationBox.css";

function NotificationBox({ tripData, waypoints = [], transportMode = "driving", isOpen, toggle, isLoading }) {
  const { totalDistance, segments, travelTimes } = tripData || {};

  const modeKeyMap = {
    driving: "car",
    motorcycle: "motorbike",
    cycling: "bike",
    foot: "pedestrian"
  };
  const modeKey = modeKeyMap[transportMode] || "car";
  const totalTime = travelTimes?.[modeKey];

  const getRiskClass = (risk) => {
    if (!risk) return "";
    const r = risk.toLowerCase();
    if (r === "cao") return "risk-cao";
    if (r.includes("trung")) return "risk-trung-binh";
    if (r === "thấp") return "risk-thap";
    return "";
  };

  const calculateDynamicSegmentTime = (distanceStr, mode) => {
    if (!distanceStr) return "N/A";
    const distMatch = distanceStr.match(/([\d.]+)/);
    if (!distMatch) return distanceStr;
    const distanceKm = parseFloat(distMatch[1]);

    let speed = 35.0; // car
    if (["motorcycle", "motorbike"].includes(mode)) speed = 40.0;
    if (["bike", "cycling"].includes(mode)) speed = 15.0; // Xe đạp đi 15km/h
    if (["foot", "pedestrian"].includes(mode)) speed = 5.0; // Đi bộ đi 5km/h

    const hours = distanceKm / speed;
    if (hours <= 0) return "0 phút";
    let totalMinutes = Math.round(hours * 60);
    if (totalMinutes === 0 && hours > 0) totalMinutes = 1;

    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    if (h > 0) return `${h} giờ ${m} phút`;
    return `${m} phút`;
  };

  const getWaypointDotColor = (index, total) => {
    if (index === 0) return "#22c55e";
    if (index === total - 1 && total > 1) return "#ef4444";
    return "#3b82f6";
  };

  const getWaypointLabel = (index, total) => {
    if (index === 0) return "Điểm đầu";
    if (index === total - 1 && total > 1) return "Điểm cuối";
    return `Điểm ${index + 1}`;
  };

  return (
    <div className={`noti-wrapper ${isOpen ? "noti-open" : "noti-closed"}`}>
      <button className="noti-tab-btn" onClick={toggle} title={isOpen ? "Đóng" : "Thông tin chuyến đi"}>
        {isOpen ? "❯" : "❮"}
      </button>

      <div className="noti-panel">
        <div className="noti-header">
          <h2>🗺️ Thông tin chuyến đi</h2>
        </div>

        {/* Tổng quan */}
        <div className="section-label">Tổng quan</div>
        <div className="trip-summary-card">
          <div className="summary-item">
            <span className="summary-icon">📏</span>
            <div>
              <div className="summary-label">Tổng quãng đường</div>
              <div className="summary-value">
                {totalDistance || "N/A"}
                {isLoading && !totalDistance && <span className="noti-spinner"> Đang tính...</span>}
              </div>
            </div>
          </div>
          <div className="summary-item">
            <span className="summary-icon">⏱️</span>
            <div>
              <div className="summary-label">Tổng thời gian</div>
              <div className="summary-value">
                {totalTime || "N/A"}
                {isLoading && !totalTime && <span className="noti-spinner"> Đang tính...</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Các chặng */}
        <div className="section-label">Các chặng</div>

        {(!segments && isLoading) ? (
          <div className="noti-loading-chặng">
            <span className="noti-spinner">Đang tải biểu đồ hành trình...</span>
          </div>
        ) : waypoints.length >= 2 ? (
          Array.from({ length: waypoints.length - 1 }, (_, index) => {
            const seg = segments?.[index];
            return (
              <div key={index} className="segment-card">
                <div className="segment-title">Chặng {index + 1}</div>
                <div className="segment-route">
                  <div
                    className="waypoint-dot segment-dot"
                    style={{ background: getWaypointDotColor(index, waypoints.length) }}
                  >
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span>{getWaypointLabel(index, waypoints.length)}</span>
                  <span className="arrow">→</span>
                  <div
                    className="waypoint-dot segment-dot"
                    style={{ background: getWaypointDotColor(index + 1, waypoints.length) }}
                  >
                    {String.fromCharCode(66 + index)}
                  </div>
                  <span>{getWaypointLabel(index + 1, waypoints.length)}</span>
                </div>
                <div className="segment-detail">
                  <span>📏 {seg?.distance || "Đang cập nhật..."}</span>
                  <span>⏱️ {seg?.distance ? calculateDynamicSegmentTime(seg.distance, transportMode) : (seg?.time || "Đang cập nhật...")}</span>
                </div>
                <div className="segment-weather">
                  <span>🌤️ {seg?.weather?.condition || (isLoading ? "Đang lấy TT..." : "Chưa có TT")}</span>
                  <span>🌡️ {seg?.weather?.temp != null ? `${seg.weather.temp}` : (isLoading ? "Đang lấy TT..." : "N/A")}</span>
                </div>
                <div className="segment-flood">
                  🌊 Nguy cơ ngập:&nbsp;
                  {seg?.floodRisk ? (
                    <span className={`risk-badge ${getRiskClass(seg?.floodRisk)}`}>
                      {seg.floodRisk}
                    </span>
                  ) : (
                    isLoading ? <span className="noti-spinner">Đang phân tích AI...</span> : "N/A"
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="no-data">Chọn ít nhất 2 điểm để xem các chặng</div>
        )}
      </div>
    </div>
  );
}

export default NotificationBox;
