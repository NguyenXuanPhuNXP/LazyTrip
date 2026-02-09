import { useState } from 'react'
import './App.css'
import Header from './components/header.jsx'
import Navbar from './components/navbar.jsx'
import ToggleButton from './components/ToggleButton.jsx'
import Footer from './components/footer.jsx'
import NofiticationBox from './components/nofiticationBox.jsx'
import Map from './components/map.jsx'

function App() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Header />
      <Navbar isOpen={isOpen}/>
      <ToggleButton 
        isOpen={isOpen}
        toggle={() => setIsOpen(!isOpen)}
      />

      <Map />
      
      <NofiticationBox />
      <Footer />
    </>
  )
}

export default App
