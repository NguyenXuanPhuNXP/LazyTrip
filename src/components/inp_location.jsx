import "./inp_location.css";

function InpLocation({
  value,
  onChange,
  placeholder = "Nhập địa điểm...",
  isStart = false
}) {
  return (
    <input
      className={`inp_location ${isStart ? "start" : ""}`}
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export default InpLocation;
