import { Link } from "react-router-dom";
import { useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa";
import "./AdminNavbar.css";

const AdminNavbar = ({ isAdminAuthenticated, handleLogout }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="navbar">
      {/* Clinic Admin Logo */}
      <Link to="/admin" className="logo" onClick={() => setIsOpen(false)}>
        Clinic Admin
      </Link>

      {/* Navigation Links */}
      <ul className={`nav-links ${isOpen ? "open" : ""}`}>
        {isAdminAuthenticated ? (
          <>
            <li>
              <Link to="/admin/appointments" onClick={() => setIsOpen(false)}>
                Appointments
              </Link>
            </li>
            <li>
              <Link to="/admin/doctors" onClick={() => setIsOpen(false)}>
                Manage Doctors
              </Link>
            </li>
            <li>
              <Link to="/admin/duties" onClick={() => setIsOpen(false)}>
                Manage Duties
              </Link>
            </li>
            <li>
              <Link to="/admin/login" onClick={() => { 
                handleLogout(); 
                setIsOpen(false); 
              }}>
                Logout
              </Link>
            </li>
          </>
        ) : (
          <li>
            <Link to="/admin/login" onClick={() => setIsOpen(false)}>
              Login
            </Link>
          </li>
        )}
      </ul>

      {/* Mobile Menu Button */}
      <button className="menu-btn" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <FaTimes /> : <FaBars />}
      </button>
    </nav>
  );
};

export default AdminNavbar;
