// ==========================================
// 1. IMPORTS & CONFIGURATION
// ==========================================
// Load environment variables from .env file
require("dotenv").config();

const express = require("express");
const cors = require("cors");

// Initialize express application
const app = express();

// Set server port from environment variables or default to 5000
const PORT = process.env.PORT || 5000;

// ==========================================
// 2. GLOBAL MIDDLEWARE
// ==========================================
// Enable Cross-Origin Resource Sharing so frontend can communicate with backend
app.use(cors());

// Parse incoming requests with JSON payloads (replaces bodyParser.json)
app.use(express.json());

// ==========================================
// 3. HEALTH CHECK & TEST ROUTES
// ==========================================
// Basic health check endpoint to verify backend status
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Course Management API is running"
    });
});

// ==========================================
// 4. START SERVER
// ==========================================
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Export app for testing or modular route imports
module.exports = app;
