const express = require("express");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const { body, validationResult } = require("express-validator");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(express.static("public"));

const pool = new Pool({
  user: process.env.DATABASE_USER,
  host: process.env.DATABASE_HOST,
  database: process.env.DATABASE_NAME,
  password: process.env.DATABASE_PASSWORD,
  port: process.env.DATABASE_PORT || 5432,
});

const jwtSecret = "222";

app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Database connection error:", err);
    res.status(500).json({ error: "Database connection error" });
  }
});

app.post(
  "/api/patients/register",
  [
    body("name").notEmpty().withMessage("Name is required."),
    body("email")
      .isEmail()
      .withMessage("Please provide a valid email address."),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long."),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { name, email, password } = req.body;

    try {
      // Check if email already exists
      const emailExists = await pool.query(
        "SELECT * FROM patients WHERE email = $1",
        [email]
      );

      if (emailExists.rows.length > 0) {
        return res.status(400).json({ message: "Email is already registered" });
      }

      // Hash password and insert new patient
      const hashedPassword = await bcrypt.hash(password, 10);
      const newPatient = await pool.query(
        "INSERT INTO patients (name, email, password) VALUES ($1, $2, $3) RETURNING *",
        [name, email, hashedPassword]
      );

      res.status(201).json({
        message: "Patient registered successfully",
        patient: newPatient.rows[0],
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

// Patient Login
app.post(
  "/api/patients/login",
  [body("email").isEmail(), body("password").notEmpty()],
  async (req, res) => {
    const { email, password } = req.body;

    try {
      const patient = await pool.query(
        "SELECT * FROM patients WHERE email = $1",
        [email]
      );
      if (patient.rows.length === 0)
        return res.status(400).json({ message: "Invalid credentials" });

      const isMatch = await bcrypt.compare(password, patient.rows[0].password);
      if (!isMatch)
        return res.status(400).json({ message: "Invalid credentials" });

      // Generate a JWT token
      const token = jwt.sign(
        { patientId: patient.rows[0].id, email: patient.rows[0].email },
        jwtSecret,
        { expiresIn: "1h" }
      );

      res.json({
        message: "Patient logged in",
        patientId: patient.rows[0].id,
        token,
      });
    } catch (err) {
      res.status(500).send("Server error");
    }
  }
);

const verifyPatientToken = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1]; // Assuming the token is passed in the Authorization header

  if (!token) {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.patient = decoded; // Attach patient info to request object
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

const verifyDoctorToken = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1]; // Assuming the token is passed in the Authorization header

  if (!token) {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.doctor = decoded; // Attach patient info to request object
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

// Patient Card Endpoint
app.get("/api/patients/:id/card", verifyPatientToken, async (req, res) => {
  const { id } = req.params;
  if (parseInt(id) !== req.patient.patientId) {
    return res
      .status(403)
      .json({ message: "You are not authorized to view this card" });
  }
  try {
    const patient = await pool.query("SELECT * FROM patients WHERE id = $1", [
      id,
    ]);
    if (patient.rows.length === 0) {
      return res.status(404).json({ message: "Patient not found" });
    }
    res.json({ patient: patient.rows[0] });
  } catch (err) {
    res.status(500).send("Server error");
  }
});

// Get list of doctors
app.get("/api/doctors", async (req, res) => {
  try {
    const doctors = await pool.query("SELECT id, name, specialty FROM doctors");
    res.json({ doctors: doctors.rows });
  } catch (err) {
    res.status(500).send("Server error");
  }
});

// Book an appointment
app.post("/api/appointments/book", async (req, res) => {
  const { patientId, doctorId, appointmentDate } = req.body;

  try {
    const today = new Date();
    const selectedDate = new Date(appointmentDate);
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return res
        .status(400)
        .json({ message: "Cannot book an appointment for a past date." });
    }

    // Check if an appointment already exists for this doctor on this date
    const existingAppointment = await pool.query(
      "SELECT * FROM appointments WHERE doctor_id = $1 AND date = $2",
      [doctorId, appointmentDate]
    );

    if (existingAppointment.rows.length > 0) {
      return res
        .status(400)
        .json({ message: "This doctor is already booked for that date." });
    }

    // Proceed with booking the appointment if no conflict
    await pool.query(
      "INSERT INTO appointments (patient_id, doctor_id, date) VALUES ($1, $2, $3)",
      [patientId, doctorId, appointmentDate]
    );

    res.json({ message: "Appointment successfully booked!" });
  } catch (error) {
    console.error("Error booking appointment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Doctor Registration
app.post(
  "/api/doctors/register",
  [
    body("name").notEmpty().withMessage("Name is required."),
    body("email")
      .isEmail()
      .withMessage("Please provide a valid email address."),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long."),
    body("specialty").notEmpty().withMessage("Specialty is required."),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { name, email, password, specialty } = req.body;

    try {
      // Check if email already exists in doctors table
      const emailExists = await pool.query(
        "SELECT * FROM doctors WHERE email = $1",
        [email]
      );

      if (emailExists.rows.length > 0) {
        return res.status(400).json({ message: "Email is already registered" });
      }

      // Hash password and insert new doctor
      const hashedPassword = await bcrypt.hash(password, 10);
      const newDoctor = await pool.query(
        "INSERT INTO doctors (name, email, password, specialty) VALUES ($1, $2, $3, $4) RETURNING *",
        [name, email, hashedPassword, specialty]
      );

      res.status(201).json({
        message: "Doctor registered successfully",
        doctor: newDoctor.rows[0],
      });
    } catch (err) {
      console.error(err); // Log the error to the console
      res.status(500).send("Server error");
    }
  }
);

// Doctor Login
app.post(
  "/api/doctors/login",
  [body("email").isEmail(), body("password").notEmpty()],
  async (req, res) => {
    const { email, password } = req.body;

    try {
      const doctor = await pool.query(
        "SELECT * FROM doctors WHERE email = $1",
        [email]
      );
      if (doctor.rows.length === 0)
        return res.status(400).json({ message: "Invalid credentials" });

      const isMatch = await bcrypt.compare(password, doctor.rows[0].password);
      if (!isMatch)
        return res.status(400).json({ message: "Invalid credentials" });

      const token = jwt.sign({ doctorId: doctor.rows[0].id }, jwtSecret, {
        expiresIn: "1h", // Token expires in 1 hour
      });
      // Send the token as a response
      res.json({
        message: "Doctor logged in",
        token, // Send the token back to the client
        doctorId: doctor.rows[0].id,
      });
    } catch (err) {
      console.error(err); // Log the error to the console
      res.status(500).send("Server error");
    }
  }
);

// Get Doctor Card Information
app.get("/api/doctors/:doctorId/card", verifyDoctorToken, async (req, res) => {
  const id = req.params.doctorId;
  if (parseInt(id) !== req.doctor.doctorId) {
    return res
      .status(403)
      .json({ message: "You are not authorized to view this card" });
  }
  try {
    const doctorQuery = await pool.query(
      "SELECT id, name, email, specialty FROM doctors WHERE id = $1",
      [id]
    );

    if (doctorQuery.rows.length === 0) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.json({ doctor: doctorQuery.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Get Doctor Appointments
app.get("/api/doctors/:doctorId/appointments", async (req, res) => {
  const doctorId = req.params.doctorId;

  try {
    const appointmentsQuery = await pool.query(
      "SELECT patient_id AS patientId, date FROM appointments WHERE doctor_id = $1 ORDER BY date",
      [doctorId]
    );

    res.json({ appointments: appointmentsQuery.rows });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Endpoint to cancel an appointment
app.delete("/api/appointments/:appointmentId", async (req, res) => {
  const { appointmentId } = req.params;

  try {
    // Delete the appointment from the database
    const result = await pool.query(
      "DELETE FROM appointments WHERE id = $1 RETURNING *",
      [appointmentId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    // Send a success response
    res.json({ message: "Appointment cancelled successfully." });
  } catch (err) {
    console.error("Error deleting appointment:", err);
    res.status(500).send("Server error");
  }
});

app.get("/api/patients/:patientId/appointments", async (req, res) => {
  const patientId = req.params.patientId;

  try {
    // Query to fetch the appointments for the given patient and include doctor details (name and specialty)
    const appointmentsQuery = await pool.query(
      `SELECT 
         a.id,
         a.date, 
         d.id AS doctorId, 
         d.name AS doctorName, 
         d.specialty 
       FROM appointments a
       JOIN doctors d ON a.doctor_id = d.id
       WHERE a.patient_id = $1
       ORDER BY a.date`,
      [patientId]
    );

    // If the patient has appointments, send them in the response
    const appointments = appointmentsQuery.rows;

    // Respond with the appointments (even if empty) and a 200 status
    res.json({ appointments });
  } catch (err) {
    console.error("Error fetching appointments:", err);
    res.status(500).send("Server error");
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`Server running on port ${PORT}`)
);
