import { useState } from 'react'
import './App.css'
import Header from './components/header.jsx'
import Navbar from './components/navbar.jsx'
import ToggleButton from './components/ToggleButton.jsx'
import Footer from './components/footer.jsx'
import NotificationBox from './components/notificationBox.jsx'
import MapComponent from './components/mapomponent';
import LocationBox from './components/location_box.jsx'
import Map from './components/map.jsx'

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [location, setLocation] = useState('');
  const [waypoints, setWaypoints] = useState([]);

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
      <Navbar isOpen={isOpen}/>
      <ToggleButton 
        isOpen={isOpen}
        toggle={() => setIsOpen(!isOpen)}
      />

      <LocationBox waypoints={waypoints} />

      <MapComponent waypoints={waypoints} setWaypoints={setWaypoints} />
      
      <NotificationBox tripData={DEMO_Data} />
      <Footer />
    </>
  )
}

export default App
