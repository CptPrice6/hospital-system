// Import necessary modules
const express = require("express");

// Initialize the express application
const app = express();

// Serve static files from the 'public' directory
app.use(express.static("public"));

// Simple API endpoint for testing
app.get("/api/hello", (req, res) => {
  res.send({ message: "Hello from the backend!" });
});

// Start the server on port 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
