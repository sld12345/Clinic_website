import React, { useEffect, useState } from "react";
import axios from "axios";
import "./AdminDuties.css";

const AdminDuties = () => {
    const [doctors, setDoctors] = useState([]);
    const [schedules, setSchedules] = useState({});
    const [expandedDoctor, setExpandedDoctor] = useState(null);
    const [editableSchedule, setEditableSchedule] = useState(null);
    const [newSchedule, setNewSchedule] = useState({
        date: "",
        start_time: "",
        end_time: "",
        session: ""
    });
    const [showAddForm, setShowAddForm] = useState(false);

    useEffect(() => {
        fetchDoctors();
    }, []);

    const fetchDoctors = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/doctors');
            setDoctors(response.data);
        } catch (error) {
            console.error('Error fetching doctors:', error);
        }
    };

    const fetchAvailability = async (docId) => {
        try {
            const response = await axios.get(`http://localhost:5000/api/availability/${docId}`);
            setSchedules((prev) => ({ ...prev, [docId]: response.data }));
        } catch (error) {
            console.error('Error fetching availability:', error);
        }
    };

    const toggleSchedule = async (docId) => {
        if (expandedDoctor === docId) {
            setExpandedDoctor(null);
            setShowAddForm(false);
            setEditableSchedule(null);
        } else {
            setExpandedDoctor(docId);
            setShowAddForm(false);
            setEditableSchedule(null);
            if (!schedules[docId]) {
                await fetchAvailability(docId);
            }
        }
    };

    const handleEdit = (schedule) => {
        setEditableSchedule({ ...schedule });
        setShowAddForm(false);
    };

    const handleInputChange = (e, field) => {
        setEditableSchedule((prev) => ({
            ...prev,
            [field]: e.target.value
        }));
    };

    const handleNewScheduleChange = (e, field) => {
        setNewSchedule((prev) => ({
            ...prev,
            [field]: e.target.value
        }));
    };

    const handleAddSchedule = () => {
        setShowAddForm(true);
        setEditableSchedule(null);
        setNewSchedule({
            date: "",
            start_time: "",
            end_time: "",
            session: ""
        });
    };

    const handleCancelAdd = () => {
        setShowAddForm(false);
    };

    const handleSaveNewSchedule = async () => {
        if (!newSchedule.date || !newSchedule.start_time || !newSchedule.end_time || !newSchedule.session) {
            alert("Please fill all fields");
            return;
        }

        try {
            console.log("Expanded Doctor:", newSchedule);
            await axios.post(`http://localhost:5000/api/availability/${expandedDoctor}`, newSchedule);
            await fetchAvailability(expandedDoctor);
            setShowAddForm(false);
            alert("Schedule added successfully");
        } catch (error) {
            console.error('Error adding schedule:', error);
            alert("Failed to add schedule");
        }
    };

    const handleUpdate = async () => {
        try {
            await axios.put(
                `http://localhost:5000/api/availability/${editableSchedule._id}`,
                editableSchedule
            );
            await fetchAvailability(expandedDoctor);
            setEditableSchedule(null);
            alert("Schedule updated successfully");
        } catch (error) {
            console.error('Error updating schedule:', error);
            alert("Failed to update schedule");
        }
    };

    const handleCancel = () => {
        setEditableSchedule(null);
    };

    const handleDelete = async (scheduleId) => {
        if (window.confirm("Are you sure you want to delete this schedule?")) {
            try {
                await axios.delete(`http://localhost:5000/api/availability/${scheduleId}`);
                await fetchAvailability(expandedDoctor);
                alert("Schedule deleted successfully");
            } catch (error) {
                console.error('Error deleting schedule:', error);
                alert("Failed to delete schedule");
            }
        }
    };

    return (
        <div className="admin-duties">
            <h2>Doctor Duty Management</h2>
            <table className="main-table">
                <thead>
                    <tr>
                        <th>Doctor Name</th>
                        <th>Department</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {doctors.map((doctor) => (
                        <React.Fragment key={doctor.doc_id}>
                            <tr>
                                <td>{doctor.doc_name}</td>
                                <td>{doctor.specialization}</td>
                                <td>
                                    <button 
                                        onClick={() => toggleSchedule(doctor.doc_id)}
                                        className="toggle-btn"
                                    >
                                        {expandedDoctor === doctor.doc_id ? "Hide Schedule" : "Show Schedule"}
                                    </button>
                                </td>
                            </tr>
                            {expandedDoctor === doctor.doc_id && (
                                <tr>
                                    <td colSpan="3">
                                        <div className="schedule-container">
                                            <div className="schedule-actions">
                                                <button 
                                                    onClick={handleAddSchedule}
                                                    disabled={showAddForm}
                                                    className="add-btn"
                                                >
                                                    + Add New Schedule
                                                </button>
                                            </div>
                                            
                                            {showAddForm && (
                                                <div className="add-schedule-form">
                                                    <h4>Add New Schedule</h4>
                                                    <div className="form-row">
                                                        <label>Date:</label>
                                                        <input
                                                            type="date"
                                                            value={newSchedule.date}
                                                            onChange={(e) => handleNewScheduleChange(e, 'date')}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="form-row">
                                                        <label>Start Time:</label>
                                                        <input
                                                            type="time"
                                                            value={newSchedule.start_time}
                                                            onChange={(e) => handleNewScheduleChange(e, 'start_time')}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="form-row">
                                                        <label>End Time:</label>
                                                        <input
                                                            type="time"
                                                            value={newSchedule.end_time}
                                                            onChange={(e) => handleNewScheduleChange(e, 'end_time')}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="form-row">
                                                        <label>Session:</label>
                                                        <select
                                                            value={newSchedule.session}
                                                            onChange={(e) => handleNewScheduleChange(e, 'session')}
                                                            required
                                                        >
                                                            <option value="">Select Session</option>
                                                            <option value="Morning">Morning</option>
                                                            <option value="Afternoon">Afternoon</option>
                                                            <option value="Evening">Evening</option>
                                                        </select>
                                                    </div>
                                                    <div className="form-actions">
                                                        <button 
                                                            onClick={handleSaveNewSchedule}
                                                            className="save-btn"
                                                        >
                                                            Save
                                                        </button>
                                                        <button 
                                                            onClick={handleCancelAdd}
                                                            className="cancel-btn"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {schedules[doctor.doc_id]?.length > 0 ? (
                                                <table className="schedule-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Session</th>
                                                            <th>Start Time</th>
                                                            <th>End Time</th>
                                                            <th>Date</th>
                                                            <th>Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {schedules[doctor.doc_id].map((schedule) => (
                                                            <tr key={schedule._id}>
                                                                <td>
                                                                    {editableSchedule?._id === schedule._id ? (
                                                                        <select
                                                                            value={editableSchedule.session}
                                                                            onChange={(e) => handleInputChange(e, 'session')}
                                                                        >
                                                                            <option value="Morning">Morning</option>
                                                                            <option value="Afternoon">Afternoon</option>
                                                                            <option value="Evening">Evening</option>
                                                                        </select>
                                                                    ) : (
                                                                        schedule.session
                                                                    )}
                                                                </td>
                                                                <td>
                                                                    {editableSchedule?._id === schedule._id ? (
                                                                        <input
                                                                            type="time"
                                                                            value={editableSchedule.start_time}
                                                                            onChange={(e) => handleInputChange(e, 'start_time')}
                                                                        />
                                                                    ) : (
                                                                        schedule.start_time
                                                                    )}
                                                                </td>
                                                                <td>
                                                                    {editableSchedule?._id === schedule._id ? (
                                                                        <input
                                                                            type="time"
                                                                            value={editableSchedule.end_time}
                                                                            onChange={(e) => handleInputChange(e, 'end_time')}
                                                                        />
                                                                    ) : (
                                                                        schedule.end_time
                                                                    )}
                                                                </td>
                                                                <td>
                                                                    {editableSchedule?._id === schedule._id ? (
                                                                        <input
                                                                            type="date"
                                                                            value={editableSchedule.date}
                                                                            onChange={(e) => handleInputChange(e, 'date')}
                                                                        />
                                                                    ) : (
                                                                        new Date(schedule.date).toLocaleDateString()
                                                                    )}
                                                                </td>
                                                                <td className="actions-cell">
                                                                    {editableSchedule?._id === schedule._id ? (
                                                                        <>
                                                                            <button 
                                                                                onClick={handleUpdate}
                                                                                className="update-btn"
                                                                            >
                                                                                Update
                                                                            </button>
                                                                            <button 
                                                                                onClick={handleCancel}
                                                                                className="cancel-btn"
                                                                            >
                                                                                Cancel
                                                                            </button>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <button 
                                                                                onClick={() => handleEdit(schedule)}
                                                                                className="edit-btn"
                                                                            >
                                                                                Edit
                                                                            </button>
                                                                            <button 
                                                                                onClick={() => handleDelete(schedule._id)}
                                                                                className="delete-btn"
                                                                            >
                                                                                Delete
                                                                            </button>
                                                                        </>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            ) : (
                                                !showAddForm && <p className="no-schedule">No schedule available for this doctor.</p>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AdminDuties;