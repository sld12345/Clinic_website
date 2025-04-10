import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";


const departmentData = {
  1: { name: "Dentistry", image: "/images/dentistpic.jpg", description: "Dentists focus on oral health, treating dental problems and performing preventive care.", treatments: ["Tooth Extraction", "Dental Fillings", "Braces & Aligners"] },
  2: { name: "Pediatrics", image: "/images/pedidr.jpg", description: "Pediatricians specialize in the health and well-being of children from infancy through adolescence.", treatments: ["Vaccinations", "Growth Monitoring", "Childhood Illness Treatment", "Nutrition Advice"] },
  3: { name: "ENT", image: "/images/entpic.jpg", description: "ENT specialists diagnose and treat conditions related to the head and neck.", treatments: ["Sinus Treatment", "Hearing Tests", "Tonsillectomy"] },
  4: { name: "General Physician", image: "/images/general.png.jpg", description: "General physicians diagnose, treat, and manage a wide range of health conditions.", treatments: ["Health Check-ups", "Chronic Disease Management", "Vaccinations"] },
  5: { name: "Ophthalmology", image: "/images/opthalmo.jpg", description: "Ophthalmologists specialize in eye health, diagnosing and treating vision-related issues.", treatments: ["Cataract Surgery", "LASIK", "Glaucoma Treatment"] }
};

const DepartmentPage = () => {
  const { deptName } = useParams();
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);

  const department = Object.values(departmentData).find(dept => dept.name === deptName);
  if (!department) return <h1>Department Not Found</h1>;

  useEffect(() => {
    // Fetch doctors based on department ID
    fetch(`http://localhost:5000/api/doctors?dept_id=${Object.keys(departmentData).find(key => departmentData[key].name === deptName)}`)
      .then((res) => res.json())
      .then((data) => setDoctors(data))
      .catch((error) => console.error("Error fetching doctors:", error));
  }, [deptName]);

  return (
    <div className="department-page">
      <div className="department-header">
        <h1>{department.name}</h1>
      </div>
      <div className="department-content">
        <div className="department-image">
          <img src={department.image} alt={department.name} onError={(e) => (e.target.src = "/images/default_image.png")} />
        </div>
        <div className="department-description">
          <p>{department.description}</p>
        </div>

        <div className="treatments-section">
          <h2>Treatments Offered</h2>
          <ul className="treatments-list">
            {department.treatments.map((treatment, index) => (
              <li key={index}>{treatment}</li>
            ))}
          </ul>
        </div>

        <div className="doctors-section">
          <h2>Specialized Doctors in {department.name}</h2>
          <div className="doctors-grid">
            {doctors.map((doc) => (
              <div key={doc.doc_id} className="doctor-card" onClick={() => navigate(`/doctor/${doc.doc_id}`)}>
                <div className="doctor-image1">
                  <img src={`/images/${doc.image}`} alt={doc.doc_name} onError={(e) => (e.target.src = "/images/default_image.png")} />
                </div>
                <h3 className="doctor-name">{doc.doc_name}</h3>
                <p>{doc.specialization}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentPage;
