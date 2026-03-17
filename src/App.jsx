import { useState } from 'react'
import './App.css'
import Header from './components/header.jsx'
import Navbar from './components/navbar.jsx'
import Footer from './components/footer.jsx'
import NotificationBox from './components/notificationBox.jsx'
import MapComponent from './components/mapomponent';
import LocationBox from './components/location_box.jsx'

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [isNotiOpen, setIsNotiOpen] = useState(false);
  const [waypoints, setWaypoints] = useState([]);
  const [transportMode, setTransportMode] = useState("driving");
  const [routeData, setRouteData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const DEMO_Data = {
    totalDistance: "25 km",
    totalTime: "50 phút",
    segments: [
      {
        from: "Hà Nội",
        to: "Hà Đông",
        distance: "8 km",
        time: "15 phút",
        weather: {
          temperature: 30,
          condition: "Mưa nhẹ"
        },
        floodRisk: "Trung bình"
      },
      {
        from: "Hà Đông",
        to: "Thanh Xuân",
        distance: "10 km",
        time: "20 phút",
        weather: {
          temperature: 29,
          condition: "Mưa"
        },
        floodRisk: "Cao"
      }
    ]
  }


  return (
    <>
      <Header />
      <Navbar isOpen={isOpen} toggle={() => setIsOpen(!isOpen)} />

      <LocationBox
        waypoints={waypoints}
        setWaypoints={setWaypoints}
        isOpen={isOpen}
        toggle={() => setIsOpen(!isOpen)}
        transportMode={transportMode}
        setTransportMode={setTransportMode}
      />

      <MapComponent waypoints={waypoints} setWaypoints={setWaypoints} transportMode={transportMode} onRouteCalculated={setRouteData} onLoadingChange={setIsLoading} />

      <NotificationBox tripData={routeData || DEMO_Data} waypoints={waypoints} transportMode={transportMode} isOpen={isNotiOpen} toggle={() => setIsNotiOpen(!isNotiOpen)} isLoading={isLoading} />
      <Footer />
    </>
  )
}

export default App
