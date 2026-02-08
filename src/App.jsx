import { useState } from 'react'
import './App.css'
import Header from './components/header.jsx'
import Navbar from './components/navbar.jsx'
import ToggleButton from './components/ToggleButton.jsx'
import Footer from './components/footer.jsx'

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
      <div className="content">
        <h2>Welcome to Lazy Trip</h2>
        <p>Your ultimate travel companion.</p>
      </div>
      <Footer />
    </>
  )
}

export default App
