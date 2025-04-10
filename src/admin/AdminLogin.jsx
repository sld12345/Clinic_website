import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminLogin.css";

const AdminLogin = ({ setIsAdminAuthenticated }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = () => {
    // Dummy authentication (Replace with actual API call)
    if (email === "admin@example.com" && password === "admin123") {
      setIsAdminAuthenticated(true); // Update auth state
      localStorage.setItem("isAdminAuthenticated", "true"); // Store in localStorage
      navigate("/admin/dashboard");
    } else {
      setError("Invalid email or password.");
    }
  };

  return (
    <div className="admin-login">
      <div className="admin-login-content">
        <h2>Admin Login</h2>

        {error && <p className="error-message">{error}</p>}

        {/* Email Input */}
        <label>Email:</label>
        <input
          type="email"
          placeholder="Enter email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* Password Input */}
        <label>Password:</label>
        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* Buttons */}
        <div className="login-buttons">
          <button className="login-btn" onClick={handleLogin}>
            Login
          </button>
          <button className="cancel-btn" onClick={() => navigate("/")}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
