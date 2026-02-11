import "./notificationBox.css";

function NotificationBox({ tripData }) {
  if (!tripData) {
    return (
      <div className="notification_box">
        <h3>Chưa có dữ liệu</h3>
      </div>
    );
  }

   
  const { totalDistance, totalTime, segments } = tripData;

  return (
    <div className="notification_box">
      <h2>Thông tin chuyến đi</h2>

      {/* Tổng quan */}
      <div className="trip_summary">
        <p><strong>Tổng quãng đường:</strong> {totalDistance}</p>
        <p><strong>Tổng thời gian:</strong> {totalTime}</p>
      </div>

      <hr />

      {/* Sinh thông tin theo số chặng */}
      {segments.map((segment, index) => (
        <div key={index} className="segment_box">
          <h3>Chặng {index + 1}</h3>

          <p>
            <strong>{segment.from}</strong> → <strong>{segment.to}</strong>
          </p>

          <p>Quãng đường: {segment.distance}</p>
          <p>Thời gian: {segment.time}</p>

          <div className="weather_info">
            <p>🌤 {segment.weather.condition}</p>
            <p>🌡 {segment.weather.temperature}°C</p>
          </div>

          <p>
            🌊 Nguy cơ ngập: 
            <span className={`risk ${segment.floodRisk.replace(" ", "-").toLowerCase()}`}>
              {segment.floodRisk}
            </span>
          </p>
        </div>
      ))}
    </div>
  );
}

export default NotificationBox;
