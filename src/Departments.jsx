import { useNavigate } from "react-router-dom";
import "./Departments.css";

const departments = [
  { name: "General Physician", image: "/images/gp.jpg" },
  { name: "Pediatrics", image: "/images/pediatrics.jpg" },
  { name: "Dentistry", image: "/images/dentistry.jpg" },
  { name: "ENT", image: "/images/ent.jpg" },
  { name: "Ophthalmology", image: "/images/ophthalmology.jpg" },
];

const Departments = () => {
  const navigate = useNavigate();

  const handleDepartmentClick = (deptName) => {
    navigate(`/doctors?dept=${encodeURIComponent(deptName)}`);
  };

  return (
    <section id="departments" className="departments">
      <h2>Our Departments</h2>
      <div className="department-container">
        {departments.map((dept, index) => (
          <div key={index} className="department-card" onClick={() => handleDepartmentClick(dept.name)}>
            <img src={dept.image} alt={dept.name} />
            <h3>{dept.name}</h3>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Departments;
