import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";

const Home = () => {
  const [showSelection, setShowSelection] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const navigate = useNavigate();

  // Sample FAQs and responses
  const faqs = [
    {
      question: /how to book|book an appointment|make appointment|book|bookings|booking|appointment|appointments/i,
      answer: "Click 'Book Appointment', select your department and doctor, then choose an available time slot. You'll need to provide your name, contact details, and OP number if you have one."
    },
    {
      question: /departments|specialties|specializations/i,
      answer: "We have General Physician, Pediatrician, Dentist, Ophthalmologist, ENT. Select from the dropdown to see all options."
    },
    {
      question: /contact|phone|email|reach/i,
      answer: "You can contact us at help@clinic.com or call +91 9876543210 during working hours (9AM-5PM)."
    },
    {
      question: /hours|timing|open|close/i,
      answer: "Our clinic is open Monday to Friday from 9:00 AM to 8:00 PM, and Saturday from 9:00 AM to 1:00 PM. We're closed on Sundays and public holidays."
    },
    {
      question: /clinic located|location/i,
      answer: "We're located at 123 Medical Drive, Health City. You can find us on the 2nd floor of the Wellness Plaza building."
    },
    {
      question: /get op number|no op number|don't have op number|new op/i,
      answer: "New patients can create an OP number during booking. Existing patients should use their assigned OP number."
    },
    {
      question: /early booking|advance book/i,
      answer: "Appointments can be booked up to 1 hour in advance."
    },
    {
      question: /doctor avilable|availability|available|schedule/i,
      answer: "Doctors have varying schedules. Available days/times will show when you select a department."
    },
    {
      question: /did not receive conformation email|no conformation mail|mail|email|confirmation mail/i,
      answer: "Check your spam folder first. If you still don't see it, call us to verify we have the correct email address."
    }
  ];

  // Default responses
  const defaultResponses = [
    "I'm sorry, I didn't understand that. Could you rephrase your question?",
    "I'm here to help with appointment booking and clinic information. Try asking about departments, doctors, or appointment procedures.",
    "For specific medical questions, please consult with your doctor directly."
  ];

  // Fetch departments from the database
  useEffect(() => {
    fetch("http://localhost:5000/api/departments")
      .then((res) => res.json())
      .then((data) => setDepartments(data))
      .catch((error) => console.error("Error fetching departments:", error));
  }, []);

  // Fetch doctors when a department is selected
  const handleDeptChange = (deptId) => {
    setSelectedDept(deptId);
    setSelectedDoctor(""); // Reset doctor selection

    fetch(`http://localhost:5000/api/doctors?dept_id=${deptId}`)
      .then((res) => res.json())
      .then((data) => setDoctors(data))
      .catch((error) => console.error("Error fetching doctors:", error));
  };

  // Navigate to doctor's profile
  const handleProceed = () => {
    if (selectedDoctor) {
      navigate(`/doctor/${selectedDoctor}`);
    } else {
      alert("Please select a doctor.");
    }
  };

  // Handle chatbot toggle
  const toggleChatbot = () => {
    setChatbotOpen(!chatbotOpen);
    if (!chatbotOpen && messages.length === 0) {
      // Add welcome message when first opening
      setMessages([{ text: "Hello! I'm ClinicBot. How can I help you today?", sender: "bot" }]);
    }
  };

  // Handle sending a message
  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    // Add user message
    const userMessage = { text: inputMessage, sender: "user" };
    setMessages([...messages, userMessage]);
    setInputMessage("");

    // Simulate bot thinking
    setTimeout(() => {
      let response = findResponse(inputMessage);
      const botMessage = { text: response, sender: "bot" };
      setMessages(prev => [...prev, botMessage]);
    }, 500);
  };

  // Find appropriate response
  const findResponse = (question) => {
    const matchedFAQ = faqs.find(faq => faq.question.test(question));
    if (matchedFAQ) {
      return matchedFAQ.answer;
    }
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  // Handle key press (Enter to send)
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  return (
    <div className="home">
      {/* Chatbot button */}
      <button className="chatbot-button" onClick={toggleChatbot}>
        {chatbotOpen ? "✕" : "💬"}
      </button>

      {/* Chatbot interface */}
      {chatbotOpen && (
        <div className="chatbot-container">
          <div className="chatbot-header">
            <h3>ClinicBot</h3>
            <button onClick={toggleChatbot}>✕</button>
          </div>
          <div className="chatbot-messages">
            {messages.map((message, index) => (
              <div key={index} className={`message ${message.sender}`}>
                {message.text}
              </div>
            ))}
          </div>
          <div className="chatbot-input">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your question..."
            />
            <button onClick={handleSendMessage}>Send</button>
          </div>
        </div>
      )}

      {/* Show either the welcome content or selection fields */}
      {!showSelection ? (
        <div className="home-content">
          <h1>Welcome to the Clinic</h1>
          <p>Book your appointments easily.</p>
          <button className="book-btn" onClick={() => setShowSelection(true)}>
            Book Appointment
          </button>
        </div>
      ) : (
        <div className="home-content">
          <h2>Select Department & Doctor</h2>

          {/* Department Selection */}
          <label>Department:</label>
          <select value={selectedDept} onChange={(e) => handleDeptChange(e.target.value)}>
            <option value="">Select Department</option>
            {departments.map((dept) => (
              <option key={dept.dept_id} value={dept.dept_id}>{dept.dept_name}</option>
            ))}
          </select>

          {/* Doctor Selection */}
          <label>Doctor:</label>
          <select value={selectedDoctor} onChange={(e) => setSelectedDoctor(e.target.value)} disabled={!selectedDept}>
            <option value="">Select Doctor</option>
            {doctors.map((doc) => (
              <option key={doc.doc_id} value={doc.doc_id}>{doc.doc_name}</option>
            ))}
          </select>

          {/* Buttons */}
          <div className="modal-buttons">
            <button className="modal-cancel" onClick={() => setShowSelection(false)}>Cancel</button>
            <button className="modal-proceed" onClick={handleProceed}>Proceed</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;