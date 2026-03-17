import './map.css'

function Map() {
  return (
    <div className="map">
        <iframe
          src="https://maps.google.com/maps?q=Hà Nội&t=&z=13&output=embed"
          width="100%"
          height="100%"
        />

      </div>
  );
}

export default Map;