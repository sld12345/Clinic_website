import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

const AdminDashboard = ({ setIsAdminAuthenticated }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    setIsAdminAuthenticated(false);
    localStorage.removeItem("isAdminAuthenticated");
    navigate("/admin/login");
  };

  return (
    <div className="admin-dashboard">
      {/* Welcome Message Outside the White Box */}
      <h1 className="welcome-text">Welcome, Admin</h1>

      <div className="admin-dashboard-content">
        <div className="dashboard-buttons">
          <button onClick={() => navigate("/admin/doctors")}>Manage Doctors</button>
          <button onClick={() => navigate("/admin/appointments")}>Manage Appointments</button>
          <button onClick={() => navigate("/admin/duties")}>Manage Duties</button>
        </div>

        <a className="logout-btn" onClick={handleLogout}>Logout</a>
      </div>
    </div>
  );
};

export default AdminDashboard;
