import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Doctors.css";

const Doctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetch("http://localhost:5000/api/doctors")
      .then((res) => res.json())
      .then((data) => {
        setDoctors(data);

        const uniqueDepartments = [...new Set(data.map((doc) => doc.department_name))];
        setDepartments(uniqueDepartments);

        // Scroll to department if provided in query params
        const params = new URLSearchParams(location.search);
        const selectedDept = params.get("dept");

        if (selectedDept) {
          setTimeout(() => scrollToDepartment(selectedDept), 500);
        }
      })
      .catch((error) => console.error("Error fetching doctors:", error));
  }, [location.search]);

  const scrollToDepartment = (department) => {
    const element = document.getElementById(department);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="doctors-page">
      <aside className="sidebar">
        <h3>Departments</h3>
        <ul>
          {departments.map((dept, index) => (
            <li key={index} onClick={() => scrollToDepartment(dept)}>
              {dept}
            </li>
          ))}
        </ul>
      </aside>

      <main className="doctors-content">
        {departments.map((department, index) => (
          <section key={index} id={department} className="department-section">
            <h2>{department}</h2>
            <div className="doctor-cards">
              {doctors
                .filter((doc) => doc.department_name === department)
                .map((doctor) => (
                  <div
                    key={doctor.doc_id}
                    className="doctor-card"
                    onClick={() => navigate(`/doctor/${doctor.doc_id}`)}
                  >
                    <img src={`/images/${doctor.image}`} alt={doctor.doc_name} />
                    <h3>{doctor.doc_name}</h3>
                    <p>{doctor.specialization}</p>
                  </div>
                ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
};

export default Doctors;
