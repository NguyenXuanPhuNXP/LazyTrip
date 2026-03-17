import "./notificationBox.css";

function ToggleNotification({ isOpen, toggle }) {
    return (
        <button
            className={`btn-closeopen-box ${isOpen ? "btn-open" : "btn-close"}`}
            onClick={toggle}
        >
            {isOpen ? " ✖ " : " ← "}
        </button>
    );
}

export default ToggleNotification;
