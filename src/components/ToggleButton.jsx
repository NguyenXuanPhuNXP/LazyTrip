import "./navbar.css";

function ToggleButton({ isOpen, toggle }) {
  return (
    <button
      className={`toggle-button ${isOpen ? "open" : "closed"}`}
      onClick={toggle}
    >
      {isOpen ? " ✖ " : " ☰ "}
    </button>
  );
}

export default ToggleButton;
