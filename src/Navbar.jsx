import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaBars, FaTimes } from "react-icons/fa";
import "./Navbar.css";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavClick = (id) => {
    setIsOpen(false);

    if (location.pathname === "/") {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      navigate(`/#${id}`);
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 300);
    }
  };

  return (
    <nav className="navbar">
      <Link to="/" className="logo" onClick={() => setIsOpen(false)}>
        <img src="/images/logo1.png" alt="Clinic Logo" className="h-10 w-auto" />
      </Link>
      <ul className={`nav-links ${isOpen ? "open" : ""}`}>
        <li><a onClick={() => handleNavClick("home")}>Home</a></li>
        <li><a onClick={() => handleNavClick("about")}>About</a></li>
        <li><a onClick={() => handleNavClick("departments")}>Departments</a></li>
        <li><Link to="/doctors" onClick={() => setIsOpen(false)}>Doctors</Link></li>
      </ul>
      <button className="menu-btn" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <FaTimes /> : <FaBars />}
      </button>
    </nav>
  );
};

export default Navbar;
