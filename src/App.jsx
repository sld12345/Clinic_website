import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Navbar from "./Navbar";
import AdminNavbar from "./admin/AdminNavbar"; // Admin-specific navbar
import Departments from "./Departments";
import About from "./About";
import Doctors from "./Doctors"; // Separate page
import DoctorProfile from "./DoctorProfile"; // Profile page
import Home from "./Home"; // Home section
import AdminLogin from "./admin/AdminLogin"; // Admin login page
import AdminDashboard from "./admin/AdminDashboard"; // Admin dashboard
import AdminAppointments from "./admin/AdminAppointments"; // Admin Appointments Page
import AdminDoctors from "./admin/AdminDoctors"; // 🔹 Doctors Page
import AdminDuties from "./admin/AdminDuties";
import "./App.css";

// 🔄 Helper function to switch between User and Admin Navbar
const MainOrAdminNavbar = ({ isAdminAuthenticated, handleLogout }) => {
  const location = useLocation();
  return location.pathname.startsWith("/admin") ? (
    <AdminNavbar isAdminAuthenticated={isAdminAuthenticated} handleLogout={handleLogout} />
  ) : (
    <Navbar />
  );
};

// Scroll to section on route change
const ScrollToSection = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const element = document.querySelector(location.hash);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [location]);

  return null;
};

function App() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(
    localStorage.getItem("isAdminAuthenticated") === "true"
  );

  // Function to log out admin
  const handleLogout = () => {
    setIsAdminAuthenticated(false);
    localStorage.removeItem("isAdminAuthenticated"); // Remove from storage
  };

  return (
    <Router>
      <MainOrAdminNavbar isAdminAuthenticated={isAdminAuthenticated} handleLogout={handleLogout} />
      <ScrollToSection />

      <Routes>
        {/* 🔹 Home Route */}
        <Route
          path="/"
          element={
            <>
              <div id="home">
                <Home />
              </div>
              <div id="about">
                <About />
              </div>
              <div id="departments">
                <Departments />
              </div>
            </>
          }
        />
        <Route path="/doctors" element={<Doctors />} /> {/* Doctors Page */}
        <Route path="/doctor/:id" element={<DoctorProfile />} /> {/* Doctor Profile Page */}

        {/* 🔥 Admin Routes */}
        <Route path="/admin" element={<Navigate to={isAdminAuthenticated ? "/admin/dashboard" : "/admin/login"} />} />
        <Route path="/admin/login" element={<AdminLogin setIsAdminAuthenticated={setIsAdminAuthenticated} />} />
        <Route
          path="/admin/dashboard"
          element={isAdminAuthenticated ? <AdminDashboard handleLogout={handleLogout} /> : <Navigate to="/admin/login" />}
        />
        <Route
          path="/admin/appointments"
          element={isAdminAuthenticated ? <AdminAppointments /> : <Navigate to="/admin/login" />}
        />
        <Route
          path="/admin/doctors"
          element={isAdminAuthenticated ? <AdminDoctors /> : <Navigate to="/admin/login" />}
        />
        <Route
          path="/admin/duties"
          element={isAdminAuthenticated ? <AdminDuties /> : <Navigate to="/admin/login" />}
        />
      </Routes>
    </Router>
  );
}

export default App;
