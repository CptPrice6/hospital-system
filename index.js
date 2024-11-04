const express = require("express");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const { body, validationResult } = require("express-validator");

require("dotenv").config();

const app = express();
app.use(express.json()); // To parse incoming JSON data
app.use(express.static("public"));

// Database connection configuration
const pool = new Pool({
  user: process.env.DATABASE_USER,
  host: process.env.DATABASE_HOST,
  database: process.env.DATABASE_NAME,
  password: process.env.DATABASE_PASSWORD,
  port: process.env.DATABASE_PORT || 5432,
});

// Register a new patient
app.post(
  "/api/register",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Email is required and must be valid"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      // Check if email already exists
      const checkEmail = await pool.query(
        "SELECT * FROM patients WHERE email = $1",
        [email]
      );
      if (checkEmail.rows.length > 0) {
        return res.status(400).json({ message: "Email already in use" });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert patient into the database
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

// Patient login
app.post(
  "/api/login",
  [
    body("email").isEmail().withMessage("Email is required and must be valid"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // Check if patient exists
      const patient = await pool.query(
        "SELECT * FROM patients WHERE email = $1",
        [email]
      );
      if (patient.rows.length === 0) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      // Compare passwords
      const isMatch = await bcrypt.compare(password, patient.rows[0].password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      res.json({ message: "Logged in successfully", patient: patient.rows[0] });
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});
