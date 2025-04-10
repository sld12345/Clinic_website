import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./DoctorProfile.css";

const DoctorProfile = () => {
    const { id } = useParams();
    const [doctor, setDoctor] = useState(null);
    const [schedules, setSchedules] = useState([]);
    const [bookedSlots, setBookedSlots] = useState({});
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTime, setSelectedTime] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isOPModalOpen, setIsOPModalOpen] = useState(false);
    const [newPatientName, setNewPatientName] = useState("");
    const [newOPNumber, setNewOPNumber] = useState(null);

    // State for patient details
    const [patientName, setPatientName] = useState("");
    const [opNumber, setOpNumber] = useState("");
    const [mobile, setMobile] = useState("");
    const [email, setEmail] = useState("");

    // State for validation errors
    const [mobileError, setMobileError] = useState("");
    const [emailError, setEmailError] = useState("");

    useEffect(() => {
        // Fetch doctor details
        fetch(`http://localhost:5000/api/doctors/${id}`)
            .then((res) => res.json())
            .then((data) => setDoctor(data))
            .catch((error) => console.error("Error fetching doctor details:", error));
    }, [id]);

    useEffect(() => {
        // Fetch doctor's availability
        fetch(`http://localhost:5000/api/availability/${id}`)
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data) && data.length > 0) {
                    setSchedules(data);
                    setSelectedDate(data[0].date);
                } else {
                    setSchedules([]);
                }
            })
            .catch((error) => console.error("Error fetching doctor schedules:", error));
    }, [id]);

    useEffect(() => {
        if (selectedDate) {
            // Fetch booked slots for the selected doctor and date
            fetch(`http://localhost:5000/api/appointments/booked-slots?doctor_id=${id}&date=${selectedDate}`)
                .then((res) => res.json())
                .then((data) => setBookedSlots(data))
                .catch((error) => console.error("Error fetching booked slots:", error));
        }
    }, [id, selectedDate]);

    if (!doctor) return <div>Loading...</div>;

    const uniqueDates = schedules.length > 0 ? [...new Set(schedules.map(schedule => schedule.date))] : [];
    const filteredSlots = schedules.filter(schedule => schedule.date === selectedDate);

    // Generate time slots dynamically (30-minute intervals)
    const generateTimeSlots = (startTime, endTime) => {
        const slots = [];
        let start = new Date(`1970-01-01T${startTime}`);
        const end = new Date(`1970-01-01T${endTime}`);

        while (start < end) {
            slots.push(
                start.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })
            );
            start.setMinutes(start.getMinutes() + 30);
        }
        return slots;
    };

    // Open the modal when clicking a slot
    const openModal = (time) => {
        if ((bookedSlots[time] || 0) >= 2) return; // Prevent opening modal for full slots
        setSelectedTime(time);
        setIsModalOpen(true);
    };

    // Close the modal
    const closeModal = () => {
        setIsModalOpen(false);
        setPatientName("");
        setOpNumber("");
        setMobile("");
        setEmail("");
        setMobileError("");
        setEmailError("");
    };

    // Validate mobile number
    const validateMobile = (mobile) => {
        const mobileRegex = /^[6-9]\d{9}$/; // 10 digits only
        if (!mobileRegex.test(mobile)) {
            setMobileError("Please enter a valid 10-digit mobile number.");
            return false;
        }
        setMobileError("");
        return true;
    };

    // Validate email
    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{3,}$/; // At least 3 letters after the dot
        if (!emailRegex.test(email)) {
            setEmailError("Please enter a valid email address.");
            return false;
        }
        setEmailError("");
        return true;
    };

    // Handle Appointment Booking
    const handleBooking = async () => {
        // Validate inputs
        if (!patientName || !opNumber || !mobile || !email) {
            alert("Please fill in all details.");
            return;
        }

        // Validate mobile and email
        const isMobileValid = validateMobile(mobile);
        const isEmailValid = validateEmail(email);
        if (!isMobileValid || !isEmailValid) return;

        try {
            // Re-fetch the latest booked slots count for the selected time
            const res = await fetch(`http://localhost:5000/api/appointments/booked-slots?doctor_id=${id}&date=${selectedDate}`);
            const updatedBookedSlots = await res.json();

            if ((updatedBookedSlots[selectedTime] || 0) >= 2) {
                alert("Sorry, this slot has just been fully booked. Please select another time.");
                closeModal();
                setBookedSlots(updatedBookedSlots); // Update state with the latest slot count
                return;
            }

            // Proceed with booking if slot is still available
            const appointmentData = {
                doc_id: doctor.doc_id,
                doc_name: doctor.doc_name,
                date: selectedDate,
                time: selectedTime,
                patient_name: patientName,
                op_number: opNumber,
                mobile: mobile,
                email: email,
            };

            const response = await fetch("http://localhost:5000/api/appointments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(appointmentData),
            });

            const result = await response.json();
            if (response.ok) {
                alert("Appointment booked successfully!");
                closeModal();
                // Refresh booked slots after booking
                fetch(`http://localhost:5000/api/appointments/booked-slots?doctor_id=${id}&date=${selectedDate}`)
                    .then((res) => res.json())
                    .then((data) => setBookedSlots(data))
                    .catch((error) => console.error("Error fetching updated booked slots:", error));
            } else {
                alert(result.error || "Failed to book appointment");
            }
        } catch (error) {
            console.error("Error booking appointment:", error);
            alert("An error occurred while booking the appointment.");
        }
    };

    const handleCreateOP = () => {
        // Generate a new OP number starting from 1000
        const newOP = 1000 + Math.floor(Math.random() * 1000); // Example logic, replace with your own
        setNewOPNumber(newOP);
        setIsOPModalOpen(false);
        setPatientName(newPatientName);
        setOpNumber(newOP.toString());
    };

    return (
        <div className="profile-container">
            <div className="profile-header">
                <img src={`/images/${doctor.image}`} alt={doctor.doc_name} className="doctor-image" />
                <div className="doctor-info">
                    <h2>{doctor.doc_name}</h2>
                    <p><strong>Specialization:</strong> {doctor.specialization}</p>
                    <p><strong>Qualification:</strong> {doctor.qualification}</p>
                </div>
            </div>

            {/* Booking Slots Section */}
            {schedules.length > 0 ? (
                <div className="booking-section">
                    <h3>Booking Slots</h3>

                    {/* Date Selection */}
                    <div className="date-selection">
                        {uniqueDates.map(date => (
                            <button
                                key={date}
                                className={selectedDate === date ? "selected" : ""}
                                onClick={() => setSelectedDate(date)}
                            >
                                {new Date(date).toLocaleDateString("en-US", { weekday: 'short', day: '2-digit' })}
                            </button>
                        ))}
                    </div>

                    {/* Display Available Slots */}
                    {filteredSlots.length > 0 && (
                        <div className="slots-container">
                            {["Morning", "Evening"].map(session => {
                                const sessionSlots = filteredSlots.filter(slot => slot.session === session);
                                return sessionSlots.length > 0 ? (
                                    <div key={session}>
                                        <h4>{session}</h4>
                                        <div className="slot-buttons">
                                            {sessionSlots.map(slot =>
                                                generateTimeSlots(slot.start_time, slot.end_time).map(time => {
                                                    const isFull = (bookedSlots[time] || 0) >= 2;
                                                    return (
                                                        <button
                                                            key={time}
                                                            className={`slot ${isFull ? "disabled" : ""}`}
                                                            onClick={() => openModal(time)}
                                                            title={isFull ? "Slot Full" : ""}
                                                            disabled={isFull}
                                                        >
                                                            {time}
                                                        </button>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                ) : null;
                            })}
                        </div>
                    )}
                </div>
            ) : (
                <p className="no-availability">No available slots for this doctor.</p>
            )}

            {/* Modal for Appointment Booking */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal">
                        <button className="close-button" onClick={closeModal}>×</button>
                        <h2>Book Appointment</h2>
                        <h4>Doctor: {doctor.doc_name}</h4>
                        <p><strong>Date:</strong> {selectedDate}</p>
                        <p><strong>Time:</strong> {selectedTime}</p>

                        {/* Create New OP Link */}
                        <div className="create-op-link">
                            <a href="#" onClick={(e) => { e.preventDefault(); setIsOPModalOpen(true); }}>
                                Create New OP
                            </a>
                        </div>

                        <input type="text" placeholder="Enter your name" value={patientName} onChange={(e) => setPatientName(e.target.value)} />
                        <input type="text" placeholder="Enter your OP Number" value={opNumber} onChange={(e) => setOpNumber(e.target.value)} />
                        <input
                            type="text"
                            placeholder="Enter your mobile number"
                            value={mobile}
                            onChange={(e) => {
                                setMobile(e.target.value);
                                validateMobile(e.target.value); // Validate on change
                            }}
                        />
                        {mobileError && <p className="error-message">{mobileError}</p>}
                        <input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                validateEmail(e.target.value); // Validate on change
                            }}
                        />
                        {emailError && <p className="error-message">{emailError}</p>}

                        <div className="modal-buttons">
                            <button className="modal-cancel" onClick={closeModal}>Cancel</button>
                            <button className="modal-proceed" onClick={handleBooking}>Book</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal for OP Creation */}
            {isOPModalOpen && (
                <div className="modal-overlay">
                    <div className="modal">
                        <button className="close-button" onClick={() => setIsOPModalOpen(false)}>×</button>
                        <h2>Create New OP</h2>
                        <input
                            type="text"
                            placeholder="Enter patient's name"
                            value={newPatientName}
                            onChange={(e) => setNewPatientName(e.target.value)}
                        />
                        <div className="modal-buttons">
                            <button className="modal-cancel" onClick={() => setIsOPModalOpen(false)}>Cancel</button>
                            <button className="modal-proceed" onClick={handleCreateOP}>Create OP</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorProfile;