import "./notificationBox.css";

function NotificationBox({ tripData, loading, isOpen}) {
    if (loading) {
        return (
            <div className={`notification_box ${isOpen ? "box-open" : "box-close"}`}>
                <h3>Đang tính toán lịch trình...</h3>
            </div>
        );
    }

    if (!tripData) {
        return (
            <div className={`notification_box ${isOpen ? "box-open" : "box-close"}`}>
                <h3>Chưa có dữ liệu</h3>
            </div>
        );
    }

    return (
        <div className={`notification_box ${isOpen ? "box-open" : "box-close"}`} >
      <h2>Thông tin chuyến đi tới {tripData.city}</h2>

      {/* Tổng quan & Lời khuyên */}
      <div className="trip_summary">
        <p><strong>💡 AI Khuyên:</strong> {tripData.aiAdvice}</p>
        <p><strong>🌤 Thời tiết:</strong> {tripData.weather?.condition}, {tripData.weather?.temp}, Mưa: {tripData.weather?.rain_mm}mm/1h</p>
        <p>
          🌊 Nguy cơ ngập:
          <span className={`risk ${tripData.floodRisk?.replace(" ", "-").toLowerCase()}`}>
            {tripData.floodRisk}
          </span>
        </p>

        {tripData.travelTimes && (
          <div className="travel_times">
            <p><strong>⏱ Thời gian dự kiến:</strong></p>
            <ul>
              <li>🚗 Ô tô: {tripData.travelTimes.car}</li>
              <li>🏍 Xe máy: {tripData.travelTimes.motorbike}</li>
              <li>🚶 Đi bộ: {tripData.travelTimes.pedestrian}</li>
            </ul>
          </div>
        )}
      </div>

      <hr />

      {/* Sinh thông tin theo số chặng */}
      {tripData.segments && tripData.segments.map((segment, index) => (
        <div key={index} className="segment_box">
          <h3>Chặng {index + 1}</h3>

          <p>
            <strong>{segment.from}</strong> → <strong>{segment.to}</strong>
          </p>

          <p>Quãng đường: {segment.distance}</p>
        </div>
      ))}
    </div>
  );
}

export default NotificationBox;
