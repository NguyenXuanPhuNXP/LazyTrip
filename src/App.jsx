import { useState, useEffect } from 'react'
import './App.css'
import Header from './components/header.jsx'
import ToggleButton from './components/ToggleButton.jsx'
import Footer from './components/footer.jsx'
import NotificationBox from './components/notificationBox.jsx'
import MapComponent from './components/mapomponent';
import LocationBox from './components/location_box.jsx'
import ToggleNotification from './components/ToggleNotification.jsx';
import { getTripSchedule } from './services/routeService';

function App() {
    const [isOpen, setIsOpen] = useState(false);
    const [isOpenNofi, setIsOpenNofi] = useState(false);
    const [waypoints, setWaypoints] = useState([]);
    const [tripData, setTripData] = useState(null);
    const [loadingRoute, setLoadingRoute] = useState(false);

    useEffect(() => {
        if (waypoints.length >= 2) {
            const fetchSchedule = async () => {
                setLoadingRoute(true);
                try {
                    // Use the first and last waypoint for simplicity
                    const start = waypoints[0];
                    const end = waypoints[waypoints.length - 1];
                    const data = await getTripSchedule(start.lat, start.lng, end.lat, end.lng);
                    if (data && data.status === "success") {
                        setTripData(data);
                    } else {
                        setTripData(null);
                    }
                } catch (error) {
                    console.error("Failed to fetch schedule:", error);
                    setTripData(null);
                } finally {
                    setLoadingRoute(false);
                }
            };

            fetchSchedule();
        } else {
            setTripData(null);
        }
    }, [waypoints]);



    return (
        <>
            <Header />

            <LocationBox waypoints={waypoints} setWaypoints={setWaypoints} isOpen={isOpen} />

            <ToggleButton
                isOpen={isOpen}
                toggle={() => setIsOpen(!isOpen)}
            />

            <MapComponent
                waypoints={waypoints}
                setWaypoints={setWaypoints}
                routePoints={tripData?.route_points}
            />

            <ToggleNotification
                isOpen={isOpenNofi}
                toggle={() => setIsOpenNofi(!isOpenNofi)}
            />

            <NotificationBox
                tripData={tripData}
                loading={loadingRoute}
                isOpen={isOpenNofi}
            />
            <Footer />
        </>
    )
}

export default App
