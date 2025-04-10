import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import nodemailer from "nodemailer";
import cron from "node-cron";
import adminserver from "./adminserver.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/admin", adminserver);

// Connect to MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/clinic")
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Doctor Schema
const doctorSchema = new mongoose.Schema({
  doc_id: { type: Number, required: true, unique: true },
  doc_name: String,
  specialization: String,
  qualification: String,
  dept_id: { type: Number, required: true },
  image: String,
}, { collection: "doctors" });

export const Doctor = mongoose.model("Doctor", doctorSchema);

// Department Schema
const departmentSchema = new mongoose.Schema({
  dept_id: { type: Number, required: true, unique: true },
  dept_name: String,
}, { collection: "departments" });

export const Department = mongoose.model("Department", departmentSchema);

// Availability Schema
const availabilitySchema = new mongoose.Schema({
    doc_id: Number,
    day_of_week: String,
    date: String,
    session: String,
    start_time: String,
    end_time: String
}, { collection: "availability" });

export const Availability = mongoose.model("Availability", availabilitySchema);

// Appointment Schema
const appointmentSchema = new mongoose.Schema({
  doc_id: { type: Number, required: true },
  doc_name: String,
  date: String,  // YYYY-MM-DD
  time: String,  // HH:MM AM/PM
  patient_name: String,
  op_number: String,
  mobile: String,
  email: String,
}, { collection: "appointments", versionKey: false });

export const Appointment = mongoose.model("Appointment", appointmentSchema);

// Function to get the next occurrence of a day
const getNextDateForDay = (dayOfWeek) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const currentDay = today.getDay();
  const targetDay = days.indexOf(dayOfWeek);

  let daysToAdd = targetDay - currentDay;
  if (daysToAdd <= 0) { 
      daysToAdd += 7; // Move to next week's occurrence if it's today or past
  }

  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + daysToAdd);
  return nextDate.toISOString().split('T')[0];
};

// Function to update availability dates if they are past dates
const updateDatesInDatabase = async () => {
  try {
      const allAvailability = await Availability.find();
      const today = new Date().toISOString().split('T')[0];

      await Promise.all(allAvailability.map(async (avail) => {
          if (avail.date < today) { // Only update if the date is in the past
              const nextDate = getNextDateForDay(avail.day_of_week);
              await Availability.findByIdAndUpdate(avail._id, { date: nextDate });
          }
      }));

      console.log("✅ Availability dates updated for past dates.");
  } catch (error) {
      console.error("❌ Error updating availability dates:", error);
  }
};

// Schedule daily update at midnight
cron.schedule("0 0 * * *", () => {
    console.log("⏳ Running scheduled update for availability dates...");
    updateDatesInDatabase();
});

// Run availability update on server start
updateDatesInDatabase();

// ✅ API to fetch doctor availability
app.get("/api/availability/:id", async (req, res) => {
    try {
        const doctorId = parseInt(req.params.id);
        const slots = await Availability.find({ doc_id: doctorId }).sort({ date: 1, start_time: 1 });

        if (slots.length === 0) {
            return res.status(404).json({ error: "No availability found for this doctor" });
        }

        res.json(slots);
    } catch (error) {
        console.error("❌ Error fetching availability:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ✅ API to update availability slot
app.put("/api/availability/:id", async (req, res) => {
    const { id } = req.params;
    const updatedData = req.body;

    try {
        const updatedAvailability = await Availability.findByIdAndUpdate(
            id, updatedData, { new: true }
        );

        if (!updatedAvailability) {
            return res.status(404).json({ error: "Availability record not found" });
        }

        res.json(updatedAvailability);
    } catch (error) {
        console.error("❌ Error updating availability:", error);
        res.status(500).json({ error: "Failed to update availability" });
    }
});

// ✅ API to fetch all departments
app.get("/api/departments", async (req, res) => {
  try {
    const departments = await Department.find({}, { _id: 0 });
    res.json(departments);
  } catch (error) {
    console.error("Error fetching departments:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ API to fetch doctors (with department names and optional filtering)
app.get("/api/doctors", async (req, res) => {
  try {
    const { dept_id } = req.query;
    let matchQuery = {};

    if (dept_id) {
      matchQuery.dept_id = parseInt(dept_id);
    }

    const doctors = await Doctor.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: "departments",
          localField: "dept_id",
          foreignField: "dept_id",
          as: "department",
        },
      },
      { $unwind: "$department" },
      {
        $project: {
          _id: 0,
          doc_id: 1,
          doc_name: 1,
          specialization: 1,
          qualification: 1,
          department_name: "$department.dept_name",
          image: 1,
        },
      },
      { $sort: { department_name: 1, doc_name: 1 } } // Sort doctors by department and then by name
    ]);

    res.json(doctors);
  } catch (error) {
    console.error("Error fetching doctors:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const getDayOfWeek = (dateString) => {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[new Date(dateString).getDay()];
};

// ✅ API to add new availability slot for a doctor
app.post("/api/availability/:doctorId", async (req, res) => {
  try {
      const doctorId = parseInt(req.params.doctorId);
      const { date, session, start_time, end_time } = req.body;
      
      // Validate input
      if (!date || !session || !start_time || !end_time) {
          return res.status(400).json({ error: "Missing required fields" });
      }
      
      // Calculate the day of the week
      const day_of_week = getDayOfWeek(date);

      // Validate time format
      if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(start_time) || 
          !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(end_time)) {
          return res.status(400).json({ error: "Invalid time format. Use HH:MM" });
      }

      // Check if end time is after start time
      if (start_time >= end_time) {
          return res.status(400).json({ error: "End time must be after start time" });
      }

      // Check for overlapping schedules
      const existingSlots = await Availability.find({ 
          doc_id: doctorId,
          date,
          $or: [
              { 
                  start_time: { $lt: end_time },
                  end_time: { $gt: start_time }
              }
          ]
      });

      if (existingSlots.length > 0) {
          return res.status(400).json({ error: "Schedule overlaps with existing time slot" });
      }

      const newAvailability = new Availability({
          doc_id: doctorId,
          day_of_week,
          date,
          session,
          start_time,
          end_time
      });

      await newAvailability.save();
      
      // Get the doctor's name for response
      const doctor = await Doctor.findOne({ doc_id: doctorId });
      const doctorName = doctor ? doctor.doc_name : "Doctor";
      
      res.status(201).json({
          message: `New schedule added successfully for ${doctorName}`,
          schedule: newAvailability
      });
  } catch (error) {
      console.error("❌ Error adding availability:", error);
      res.status(500).json({ error: "Failed to add availability slot" });
  }
});

// ✅ API to delete a doctor's availability slot
app.delete("/api/availability/:scheduleId", async (req, res) => {
  try {
      const { scheduleId } = req.params;

      // Check if the schedule exists
      const existingSchedule = await Availability.findById(scheduleId);
      if (!existingSchedule) {
          return res.status(404).json({ error: "Schedule not found" });
      }

      // Check if there are any appointments booked for this slot
      const hasAppointments = await Appointment.exists({
          doc_id: existingSchedule.doc_id,
          date: existingSchedule.date,
          time: { 
              $gte: existingSchedule.start_time, 
              $lte: existingSchedule.end_time 
          }
      });

      if (hasAppointments) {
          return res.status(400).json({ 
              error: "Cannot delete schedule with existing appointments" 
          });
      }

      // Delete the schedule
      await Availability.findByIdAndDelete(scheduleId);
      
      res.json({ 
          message: "Schedule deleted successfully",
          deletedSchedule: existingSchedule
      });
  } catch (error) {
      console.error("❌ Error deleting availability:", error);
      res.status(500).json({ error: "Failed to delete availability slot" });
  }
});

// ✅ Get weekly appointment statistics
app.get("/reports/weekly", async (req, res) => {
  try {
    const startOfWeek = moment().startOf('week').toDate();
    const endOfWeek = moment().endOf('week').toDate();

    // By Doctor
    const byDoctor = await Appointment.aggregate([
      {
        $match: {
          date: { $gte: startOfWeek, $lte: endOfWeek }
        }
      },
      {
        $group: {
          _id: "$doc_id",
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "doctors",
          localField: "_id",
          foreignField: "doc_id",
          as: "doctor"
        }
      },
      {
        $unwind: "$doctor"
      },
      {
        $project: {
          doctorName: "$doctor.doc_name",
          department: "$doctor.dept_id",
          count: 1,
          _id: 0
        }
      },
      { $sort: { count: -1 } }
    ]);

    // By Department
    const byDepartment = await Appointment.aggregate([
      {
        $match: {
          date: { $gte: startOfWeek, $lte: endOfWeek }
        }
      },
      {
        $lookup: {
          from: "doctors",
          localField: "doc_id",
          foreignField: "doc_id",
          as: "doctor"
        }
      },
      {
        $unwind: "$doctor"
      },
      {
        $group: {
          _id: "$doctor.dept_id",
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "departments",
          localField: "_id",
          foreignField: "dept_id",
          as: "department"
        }
      },
      {
        $unwind: "$department"
      },
      {
        $project: {
          departmentName: "$department.dept_name",
          count: 1,
          _id: 0
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      byDoctor,
      byDepartment,
      period: "weekly",
      startDate: startOfWeek,
      endDate: endOfWeek
    });
  } catch (error) {
    console.error("❌ Error fetching weekly reports:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ✅ Get monthly appointment statistics
app.get("/reports/monthly", async (req, res) => {
  try {
    const startOfMonth = moment().startOf('month').toDate();
    const endOfMonth = moment().endOf('month').toDate();

    // By Doctor
    const byDoctor = await Appointment.aggregate([
      {
        $match: {
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: "$doc_id",
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "doctors",
          localField: "_id",
          foreignField: "doc_id",
          as: "doctor"
        }
      },
      {
        $unwind: "$doctor"
      },
      {
        $project: {
          doctorName: "$doctor.doc_name",
          department: "$doctor.dept_id",
          count: 1,
          _id: 0
        }
      },
      { $sort: { count: -1 } }
    ]);

    // By Department
    const byDepartment = await Appointment.aggregate([
      {
        $match: {
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $lookup: {
          from: "doctors",
          localField: "doc_id",
          foreignField: "doc_id",
          as: "doctor"
        }
      },
      {
        $unwind: "$doctor"
      },
      {
        $group: {
          _id: "$doctor.dept_id",
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "departments",
          localField: "_id",
          foreignField: "dept_id",
          as: "department"
        }
      },
      {
        $unwind: "$department"
      },
      {
        $project: {
          departmentName: "$department.dept_name",
          count: 1,
          _id: 0
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      byDoctor,
      byDepartment,
      period: "monthly",
      startDate: startOfMonth,
      endDate: endOfMonth
    });
  } catch (error) {
    console.error("❌ Error fetching monthly reports:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ✅ API to fetch a single doctor by doc_id
app.get("/api/doctors/:id", async (req, res) => {
  try {
    const doctorId = parseInt(req.params.id);
    const doctor = await Doctor.aggregate([
      { $match: { doc_id: doctorId } },
      {
        $lookup: {
          from: "departments",
          localField: "dept_id",
          foreignField: "dept_id",
          as: "department",
        },
      },
      { $unwind: "$department" },
      {
        $project: {
          _id: 0,
          doc_id: 1,
          doc_name: 1,
          specialization: 1,
          qualification: 1,
          department_name: "$department.dept_name",
          image: 1,
        },
      },
    ]);

    if (doctor.length === 0) {
      return res.status(404).json({ error: "Doctor not found" });
    }
    res.json(doctor[0]);
  } catch (error) {
    console.error("Error fetching doctor details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ API to fetch doctor availability slots
app.get("/api/availability/:id", async (req, res) => {
  try {
    const doctorId = parseInt(req.params.id);
    const slots = await Availability.find({ doc_id: doctorId }).sort({ date: 1, start_time: 1 });

    if (slots.length === 0) {
      return res.status(404).json({ error: "No availability found for this doctor" });
    }

    res.json(slots);
  } catch (error) {
    console.error("Error fetching doctor availability:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ API to fetch booked slots for a specific doctor and date
app.get("/api/appointments/booked-slots", async (req, res) => {
    try {
        const { doctor_id, date } = req.query;

        if (!doctor_id || !date) {
            return res.status(400).json({ error: "Missing doctor_id or date parameter" });
        }

        const bookedSlots = await Appointment.aggregate([
            {
                $match: {
                    doc_id: parseInt(doctor_id),
                    date: date,
                },
            },
            {
                $group: {
                    _id: "$time",
                    count: { $sum: 1 }, // Count number of appointments for each time slot
                },
            },
            {
                $project: {
                    _id: 0,
                    time: "$_id",
                    count: 1,
                },
            },
        ]);

        res.json(bookedSlots.reduce((acc, slot) => {
            acc[slot.time] = slot.count;
            return acc;
        }, {}));
    } catch (error) {
        console.error("Error fetching booked slots:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ✅ Set up Nodemailer Transporter (Gmail)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "",
    pass: "", // Use your Gmail App Password
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// ✅ API to book an appointment and send an email
app.post("/api/appointments", async (req, res) => {
  try {
    const { doc_id, doc_name, date, time, patient_name, op_number, mobile, email } = req.body;

    // Insert into the database
    const newAppointment = new Appointment({ doc_id, doc_name, date, time, patient_name, op_number, mobile, email });
    await newAppointment.save();

    // Email content
    const mailOptions = {
      from: "",
      to: email,  // Send email to the patient's email
      subject: "Appointment Confirmation",
      text: `Dear ${patient_name},\n\nYour appointment with ${doc_name} is confirmed.\n\nDate: ${date}\nTime: ${time}\n\nThank you for choosing our clinic!\n\nBest regards,\nClinic Team`,
    };

    // Send email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("🚨 Email Error:", error);
      } else {
        console.log("📧 Email sent successfully:", info.response);
      }
    });

    // Send success response
    res.json({ message: "Appointment booked successfully" });
  } catch (error) {
    console.error("Error booking appointment:", error);
    res.status(500).json({ error: "Failed to book appointment" });
  }
});

// Start the server
const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));