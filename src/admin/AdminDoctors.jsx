import { useEffect, useState } from "react";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import "./AdminDoctors.css";

const AdminDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [addingDoctor, setAddingDoctor] = useState(false);

  const [formData, setFormData] = useState({
    doc_name: "",
    specialization: "",
    qualification: "",
    dept_id: "",
    doc_image: null, // Store image file
  });

  // ✅ Fetch doctors from backend
  const fetchDoctors = () => {
    fetch("http://localhost:5000/admin/doctors")
      .then((res) => res.json())
      .then((data) => setDoctors(data))
      .catch((error) => console.error("Error fetching doctors:", error));
  };

  // ✅ Fetch departments from backend
  useEffect(() => {
    fetch("http://localhost:5000/admin/departments")
      .then((res) => res.json())
      .then((data) => setDepartments(data))
      .catch((error) => console.error("Error fetching departments:", error));
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, []);

  // ✅ Handle input changes (including image upload)
  const handleChange = (e) => {
    if (e.target.name === "doc_image") {
      setFormData({ ...formData, doc_image: e.target.files[0] });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  // ✅ Add new doctor with image upload
  const handleAdd = () => {
    if (!formData.doc_name || !formData.specialization || !formData.qualification || !formData.dept_id || !formData.doc_image) {
      alert("Please fill in all fields and upload an image.");
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append("doc_name", formData.doc_name);
    formDataToSend.append("specialization", formData.specialization);
    formDataToSend.append("qualification", formData.qualification);
    formDataToSend.append("dept_id", formData.dept_id);
    // formDataToSend.append("doc_image", formData.doc_image); // Append the image
    if (formData.doc_image) {
      formDataToSend.append("doc_image", formData.doc_image);
    }

    fetch("http://localhost:5000/admin/doctors", {
      method: "POST",
      body: formDataToSend,
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          fetchDoctors();
          setAddingDoctor(false);
          setFormData({ doc_name: "", specialization: "", qualification: "", dept_id: "", doc_image: null });
        } else {
          alert("Error: " + data.message);
        }
      })
      .catch((error) => console.error("Error adding doctor:", error));
  };

  // // ✅ Delete doctor
  // const handleDelete = (doc_id) => {
  //   if (window.confirm("Are you sure you want to delete this doctor?")) {
  //     fetch(`http://localhost:5000/admin/doctors/${doc_id}`, { method: "DELETE" })
  //       .then((res) => res.json())
  //       .then((data) => {
  //         if (data.success) fetchDoctors();
  //         else alert("Error: Unable to delete doctor.");
  //       })
  //       .catch((error) => console.error("Error deleting doctor:", error));
  //   }
  // };

  // ✅ Edit doctor
  const handleEdit = (doctor) => {
    setEditingDoctor(doctor);
    setAddingDoctor(false);
    setFormData({
      doc_name: doctor.doc_name,
      specialization: doctor.specialization,
      qualification: doctor.qualification,
      dept_id: doctor.dept_id || "",
      doc_image: null, // Reset image selection
    });
  };

  // ✅ Update doctor details with image support
  const handleUpdate = () => {
    if (!editingDoctor) return;

    const formDataToSend = new FormData();
    formDataToSend.append("doc_name", formData.doc_name);
    formDataToSend.append("specialization", formData.specialization);
    formDataToSend.append("qualification", formData.qualification);
    formDataToSend.append("dept_id", formData.dept_id);

    if (formData.doc_image) {
      formDataToSend.append("doc_image", formData.doc_image);
    }

    fetch(`http://localhost:5000/admin/doctors/${editingDoctor.doc_id}`, {
      method: "PUT",
      body: formDataToSend,
    })
      .then((res) => res.json())
      .then(() => {
        fetchDoctors();
        setEditingDoctor(null);
      })
      .catch((error) => console.error("Error updating doctor:", error));
  };

  return (
    <div className="admin-doctors">
      <h2 className="text-xl font-semibold mb-4">Manage - Doctor Profile</h2>

      <button className="add-btn" onClick={() => { setEditingDoctor(null); setAddingDoctor(true); }}>
        <FaPlus /> Add Doctor
      </button>

      <table className="w-full border-collapse border border-gray-300 doctors-table">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Image</th>
            <th className="border p-2">Doctor Name</th>
            <th className="border p-2">Specialization</th>
            <th className="border p-2">Qualification</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {doctors.length > 0 ? (
            doctors.map((doctor) => (
              <tr key={doctor.doc_id} className="hover:bg-gray-100 text-center">
                <td className="border p-2">
  <img src={`/images/${doctor.image}`} alt={doctor.doc_name} style={{ width: "60px", height: "60px", borderRadius: "50%", objectFit: "cover" }} />
</td>

                <td className="border p-2">{doctor.doc_name}</td>
                <td className="border p-2">{doctor.specialization}</td>
                <td className="border p-2">{doctor.qualification}</td>
                <td className="border p-2 flex justify-center gap-4">
                  <button className="text-blue-500 hover:text-blue-700 tooltip" onClick={() => handleEdit(doctor)}>
                    <FaEdit size={18} />
                    <span className="tooltip-text">Edit</span>
                  </button>
                  {/* <button className="text-red-500 hover:text-red-700 tooltip" onClick={() => handleDelete(doctor.doc_id)}>
                    <FaTrash size={18} />
                    <span className="tooltip-text">Delete</span>
                  </button> */}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="text-center p-4">No doctors found</td>
            </tr>
          )}
        </tbody>
      </table>

      {(addingDoctor || editingDoctor) && (
        <div className="edit-form-overlay">
          <div className="edit-form">
            <h3>{editingDoctor ? "Edit Doctor" : "Add Doctor"}</h3>
            <label>Name: <input type="text" name="doc_name" value={formData.doc_name} onChange={handleChange} /></label>
            <label>Specialization: <input type="text" name="specialization" value={formData.specialization} onChange={handleChange} /></label>
            <label>Qualification: <input type="text" name="qualification" value={formData.qualification} onChange={handleChange} /></label>
            <label>Department: 
              <select name="dept_id" value={formData.dept_id} onChange={handleChange}>
                <option value="">Select Department</option>
                {departments.map((dept) => <option key={dept.dept_id} value={dept.dept_id}>{dept.dept_name}</option>)}
              </select>
            </label>
            <label>Upload Image: <input type="file" name="doc_image" accept="image/*" onChange={handleChange} /></label>
            <div className="form-buttons">
              <button className="update-btn" onClick={editingDoctor ? handleUpdate : handleAdd}>{editingDoctor ? "Update" : "Add"}</button>
              <button className="cancel-btn" onClick={() => { setAddingDoctor(false); setEditingDoctor(null); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const handleUpdateDoctor = async (doctorId, formData) => {
  try {
    const response = await fetch(`/api/doctors/${doctorId}`, {
      method: "PUT",
      body: formData,
    });

    const data = await response.json();
    if (data.success) {
      alert(`Image updated successfully: ${data.filename}`); // ✅ Show filename in alert
    } else {
      alert("Update failed");
    }
  } catch (error) {
    console.error("Error updating doctor:", error);
    alert("Error updating doctor");
  }
};

export default AdminDoctors;
