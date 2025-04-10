import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { Appointment } from "./server.js";
import { Doctor, Department } from "./server.js";
import moment from "moment"; // For date formatting

const router = express.Router();

// ✅ Image upload setup
const imageDir = path.resolve("public/images");
if (!fs.existsSync(imageDir)) {
  fs.mkdirSync(imageDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, imageDir),
  filename: (req, file, cb) => cb(null, file.originalname),
});
const upload = multer({ storage });

// ✅ Copy image to public/images
const copyImageToPublic = (filePath, filename) => {
  const destPath = path.join(imageDir, filename);
  if (fs.existsSync(filePath) && !fs.existsSync(destPath)) {
    fs.copyFileSync(filePath, destPath);
    console.log(`✅ Copied image to public/images: ${filename}`);
  }
};

// ✅ Update doctor details (including image)
router.put("/doctors/:id", upload.single("doc_image"), async (req, res) => {
  try {
    const doctorId = parseInt(req.params.id, 10);
    let updatedData = { ...req.body };

    const doctor = await Doctor.findOne({ doc_id: doctorId });
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    if (req.file) {
      const uploadedPath = req.file.path;
      const filename = req.file.filename;
      copyImageToPublic(uploadedPath, filename);
      updatedData.image = filename;
    }

    const updatedDoctor = await Doctor.findOneAndUpdate(
      { doc_id: doctorId },
      { $set: updatedData },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: "Doctor updated successfully.",
      filename: req.file ? req.file.filename : null,
    });
  } catch (error) {
    console.error("❌ Error updating doctor:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ✅ Add a new doctor
router.post("/doctors", upload.single("doc_image"), async (req, res) => {
  try {
    const { doc_name, specialization, qualification, dept_id } = req.body;
    if (!dept_id) return res.status(400).json({ message: "Department ID is required." });

    const lastDoctor = await Doctor.findOne().sort({ doc_id: -1 });
    const newDocId = lastDoctor ? lastDoctor.doc_id + 1 : 1;

    let imageFilename = null;

    if (req.file) {
      const uploadedPath = req.file.path;
      imageFilename = req.file.filename;
      copyImageToPublic(uploadedPath, imageFilename);
    }

    const newDoctor = new Doctor({
      doc_id: newDocId,
      doc_name,
      specialization,
      qualification,
      dept_id: parseInt(dept_id, 10),
      image: imageFilename,
    });

    await newDoctor.save();
    res.json({ success: true, message: "Doctor added successfully." });
  } catch (error) {
    console.error("❌ Error adding doctor:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ✅ Fetch all doctors
router.get("/doctors", async (req, res) => {
  try {
    const doctors = await Doctor.find({}, { _id: 0 }).sort({ doc_name: 1 });
    res.json(doctors);
  } catch (error) {
    console.error("❌ Error fetching doctors:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ✅ Fetch all departments
router.get("/departments", async (req, res) => {
  try {
    const departments = await Department.find({}, { _id: 0, dept_id: 1, dept_name: 1 }).sort({ dept_name: 1 });
    res.json(departments);
  } catch (error) {
    console.error("❌ Error fetching departments:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ✅ Fetch all appointments for admin
router.get('/appointments', async (req, res) => {
  try {
    const { date, doctor, patient } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (date) {
      filter.date = date;  // Directly match the string date (YYYY-MM-DD)
    }
    
    
    if (doctor) {
      // Case-insensitive search for doctor name
      filter.doc_name = { $regex: new RegExp(doctor, 'i') };
    }
    
    if (patient) {
      // Case-insensitive search for patient name
      filter.patient_name = { $regex: new RegExp(patient, 'i') };
    }
    
    // Get appointments with filters
    const appointments = await Appointment.find(filter)
      .sort({ date: 1, time: 1 })
      .lean();
    
    res.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ message: 'Server error while fetching appointments' });
  }
});

export default router;