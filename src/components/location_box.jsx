import { useState } from "react";
import InpLocation from "./inp_location.jsx";
import "./location_box.css";

function LocationBox() {
  const [startLocation, setStartLocation] = useState("");
  const [locations, setLocations] = useState([""]);

  const handleChange = (index, value) => {
    let newLocations = [...locations];
    newLocations[index] = value;

    // Xóa các ô trống ở giữa
    newLocations = newLocations.filter(
      (loc, i) =>
        loc.trim() !== "" || i === newLocations.length - 1
    );

    // Nếu ô cuối không trống → thêm ô trống
    if (newLocations[newLocations.length - 1].trim() !== "") {
      newLocations.push("");
    }

    setLocations(newLocations);
  };

  return (
    <div className="location-box">
      {/* 📍 Điểm bắt đầu */}
      <InpLocation
        value={startLocation}
        onChange={setStartLocation}
        placeholder="Điểm bắt đầu"
        isStart
      />

      <div className="divider"></div>

      {/* 📌 Các điểm tiếp theo */}
      {locations.map((loc, index) => (
        <InpLocation
          key={index}
          value={loc}
          onChange={(value) => handleChange(index, value)}
          placeholder={`Điểm ${index + 1}`}
        />
      ))}
    </div>
  );
}

export default LocationBox;
