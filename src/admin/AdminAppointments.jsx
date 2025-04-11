import { useState, useEffect } from "react";
import "./AdminAppointments.css";

const AdminAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    date: "",
    doctor: "",
    patient: ""
  });

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        let url = "http://localhost:5000/admin/appointments";
        
        // Add filters if they exist
        const queryParams = new URLSearchParams();
        if (filters.date) queryParams.append("date", filters.date);
        if (filters.doctor) queryParams.append("doctor", filters.doctor);
        if (filters.patient) queryParams.append("patient", filters.patient);
        
        if (queryParams.toString()) {
          url += `?${queryParams.toString()}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setAppointments(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching appointments:", err);
        setError("Failed to load appointments. Please try again later.");
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      date: "",
      doctor: "",
      patient: ""
    });
  };

  return (
    <div className="admin-appointments">
      <h2>Admin - Appointments</h2>
      
      {/* Filter Section */}
      <div className="filters">
        <div className="filter-group">
          <label htmlFor="date">Date:</label>
          <input 
            type="date" 
            id="date" 
            name="date" 
            value={filters.date}
            onChange={handleFilterChange}
          />
        </div>
        
        <div className="filter-group">
          <label htmlFor="doctor">Doctor:</label>
          <input 
            type="text" 
            id="doctor" 
            name="doctor" 
            placeholder="Filter by doctor"
            value={filters.doctor}
            onChange={handleFilterChange}
          />
        </div>
        
        <div className="filter-group">
          <label htmlFor="patient">Patient:</label>
          <input 
            type="text" 
            id="patient" 
            name="patient" 
            placeholder="Filter by patient"
            value={filters.patient}
            onChange={handleFilterChange}
          />
        </div>
        
        <button className="clear-filters" onClick={clearFilters}>
          Clear Filters
        </button>
      </div>

      {/* Status Messages */}
      {loading && <div className="loading">Loading appointments...</div>}
      {error && <div className="error">{error}</div>}

      {/* Appointments Table */}
      <div className="table-container">
        <table className="appointments-table">
          <thead>
            <tr>
              <th>Doctor</th>
              <th>Date</th>
              <th>Time</th>
              <th>Patient</th>
              <th>OP Number</th>
              <th>Mobile</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>
            {!loading && appointments.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-appointments">
                  No appointments found
                </td>
              </tr>
            ) : (
              appointments.map((appt) => (
                <tr key={`${appt.date}-${appt.time}-${appt.patient_name}`}>
                  <td>{appt.doc_name}</td>
                  <td>{new Date(appt.date).toLocaleDateString()}</td>
                  <td>{appt.time}</td>
                  <td>{appt.patient_name}</td>
                  <td>{appt.op_number}</td>
                  <td>{appt.mobile}</td>
                  <td>{appt.email}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminAppointments;
