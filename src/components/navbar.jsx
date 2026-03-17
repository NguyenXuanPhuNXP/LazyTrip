import './navbar.css';

function Navbar({ isOpen, toggle }) {
  return (
    <nav className={`navbar ${isOpen ? "nav-open" : "nav-closed"}`}>
        <div className="nav-head">
            <button
              className="nav-close-btn"
              onClick={toggle}
              title="Đóng menu"
              aria-label="Đóng menu"
            >
              ✖
            </button>
        </div>
        <ul>
            <li><a href="#home">Home</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#contact">Contact</a></li>
        </ul>
    </nav>
  );
}

export default Navbar;