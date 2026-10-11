const express = require("express");
const router = express.Router();
const {
    getAllCourses,
    getCourseById,
    createCourse,
    updateCourse,
    deleteCourse,
} = require("../controllers/courseController");
const { authenticateUser, requireAdmin } = require("../middleware/auth");

// Public read routes
router.get("/", getAllCourses);
router.get("/:id", getCourseById);

// Admin-only routes: a valid JWT (401 otherwise) with the admin role (403 otherwise)
router.post("/", authenticateUser, requireAdmin, createCourse);
router.put("/:id", authenticateUser, requireAdmin, updateCourse);
router.delete("/:id", authenticateUser, requireAdmin, deleteCourse);

module.exports = router;
