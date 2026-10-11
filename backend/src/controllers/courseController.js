const mongoose = require("mongoose");
const Course = require("../models/Course");

// GET /api/courses — returns all courses
const getAllCourses = async (req, res) => {
    try {
        const courses = await Course.find();
        res.status(200).json({ success: true, courses });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// GET /api/courses/:id — returns a single course by ID
const getCourseById = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ success: false, message: "Course not found" });
        }

        res.status(200).json({ success: true, course });
    } catch (error) {
        if (error instanceof mongoose.Error.CastError) {
            return res.status(400).json({ success: false, message: "Invalid course ID" });
        }
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ==========================================
// ADMIN-ONLY HELPERS (used by create and update)
// ==========================================
const COURSE_FIELDS = ["title", "description", "instructor", "duration", "price"];

// Checks the course fields that are present in `data`.
// Returns an error message string, or null when everything is valid.
const validateCourseFields = (data) => {
    for (const field of ["title", "description", "instructor", "duration"]) {
        if (data[field] !== undefined) {
            if (typeof data[field] !== "string" || data[field].trim() === "") {
                return `${field} must be a non-empty string`;
            }
        }
    }

    if (data.price !== undefined) {
        if (typeof data.price !== "number" || !Number.isFinite(data.price) || data.price <= 0) {
            return "price must be a positive number";
        }
    }

    return null;
};

// Turns a database error into the matching HTTP response
const handleCourseError = (error, res) => {
    if (error instanceof mongoose.Error.CastError) {
        return res.status(400).json({ success: false, message: "Invalid course ID" });
    }
    if (error instanceof mongoose.Error.ValidationError) {
        return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: "Server error" });
};

// POST /api/courses — creates a new course (admin only)
const createCourse = async (req, res) => {
    try {
        const body = req.body || {};

        const missing = COURSE_FIELDS.filter(
            (field) => body[field] === undefined || body[field] === null || body[field] === ""
        );
        if (missing.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Please provide all required fields: ${missing.join(", ")}`,
            });
        }

        const validationMessage = validateCourseFields(body);
        if (validationMessage) {
            return res.status(400).json({ success: false, message: validationMessage });
        }

        // Only copy the five known fields, so nothing else can be saved
        const { title, description, instructor, duration, price } = body;
        const course = await Course.create({ title, description, instructor, duration, price });

        res.status(201).json({
            success: true,
            message: "Course created successfully",
            course,
        });
    } catch (error) {
        handleCourseError(error, res);
    }
};

// PUT /api/courses/:id — updates an existing course (admin only)
const updateCourse = async (req, res) => {
    try {
        const body = req.body || {};

        // Only allow the five known fields to be changed
        const updates = {};
        COURSE_FIELDS.forEach((field) => {
            if (body[field] !== undefined) {
                updates[field] = body[field];
            }
        });

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: `Please provide at least one field to update: ${COURSE_FIELDS.join(", ")}`,
            });
        }

        const validationMessage = validateCourseFields(updates);
        if (validationMessage) {
            return res.status(400).json({ success: false, message: validationMessage });
        }

        const course = await Course.findByIdAndUpdate(req.params.id, updates, {
            new: true,
            runValidators: true,
        });

        if (!course) {
            return res.status(404).json({ success: false, message: "Course not found" });
        }

        res.status(200).json({
            success: true,
            message: "Course updated successfully",
            course,
        });
    } catch (error) {
        handleCourseError(error, res);
    }
};

// DELETE /api/courses/:id — deletes a course (admin only)
const deleteCourse = async (req, res) => {
    try {
        const course = await Course.findByIdAndDelete(req.params.id);

        if (!course) {
            return res.status(404).json({ success: false, message: "Course not found" });
        }

        res.status(200).json({ success: true, message: "Course deleted successfully" });
    } catch (error) {
        handleCourseError(error, res);
    }
};

module.exports = {
    getAllCourses,
    getCourseById,
    createCourse,
    updateCourse,
    deleteCourse,
};
