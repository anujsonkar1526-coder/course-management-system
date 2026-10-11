// Seeds the demo courses into MongoDB.
// Run it yourself with: npm run seed:demo (from the backend folder)
// It is never run when the server starts.
//
// Safe to run again: a course is only added if no course with the same title
// exists. Nothing is deleted and existing courses are never changed.
require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../src/config/db");
const Course = require("../src/models/Course");
const demoCourses = require("../data/demoCourses");

// Adds each course if its title is not already in the database.
// Returns how many were added and how many were skipped.
const seedCourses = async (courses) => {
    let added = 0;
    let skipped = 0;

    for (const course of courses) {
        const result = await Course.updateOne(
            { title: course.title },
            { $setOnInsert: course },
            { upsert: true }
        );

        if (result.upsertedCount > 0) {
            added++;
        } else {
            skipped++;
        }
    }

    return { added, skipped };
};

const run = async () => {
    // Do not seed a production database by accident
    if (process.env.NODE_ENV === "production") {
        console.error("Refusing to seed demo data because NODE_ENV is 'production'.");
        process.exit(1);
    }

    try {
        await connectDB();

        const { added, skipped } = await seedCourses(demoCourses);
        console.log(`Demo courses added: ${added}`);
        console.log(`Demo courses already present (skipped): ${skipped}`);
    } catch (error) {
        console.error("Seeding failed:", error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.connection.close();
    }
};

// Only run when started from the command line (so tests can import seedCourses)
if (require.main === module) {
    run();
}

module.exports = { seedCourses };
