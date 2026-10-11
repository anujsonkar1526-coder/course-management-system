// Admin course API tests (create, update, delete).
// Run with: npm test (uses Node's built-in test runner, no extra dependencies).
// The Course model is stubbed, so no MongoDB connection is needed.
const { test, before, after, beforeEach, mock } = require("node:test");
const assert = require("node:assert");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const JWT_SECRET = process.env.JWT_SECRET || "test_jwt_secret_key_12345";
process.env.JWT_SECRET = JWT_SECRET;

const Course = require("../src/models/Course");
const app = require("../src/server");

const COURSE_ID = "64b7f0c2a1b2c3d4e5f60718";
const validBody = {
    title: "Intro to Node.js",
    description: "Learn the basics of Node.js",
    instructor: "Test Instructor",
    duration: "4 weeks",
    price: 49.99,
};
const savedCourse = { _id: COURSE_ID, ...validBody };

const adminToken = jwt.sign({ id: "1", email: "admin@test.com", role: "admin" }, JWT_SECRET, { expiresIn: "1h" });
const userToken = jwt.sign({ id: "2", email: "user@test.com", role: "user" }, JWT_SECRET, { expiresIn: "1h" });

let server;
let baseUrl;

before(async () => {
    await new Promise((resolve) => {
        server = app.listen(0, "127.0.0.1", resolve);
    });
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
    await new Promise((resolve) => server.close(resolve));
});

beforeEach(() => {
    mock.restoreAll();
});

// Sends a request with an optional token and JSON body
const send = async (method, path, { token, body } = {}) => {
    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${baseUrl}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: res.status, body: await res.json() };
};

// ==========================================================
// Route protection: 401 for no/invalid token, 403 for non-admin
// ==========================================================
const protectedRoutes = [
    ["POST", "/api/courses", validBody],
    ["PUT", `/api/courses/${COURSE_ID}`, validBody],
    ["DELETE", `/api/courses/${COURSE_ID}`, undefined],
];

for (const [method, path, body] of protectedRoutes) {
    test(`${method} ${path.replace(COURSE_ID, ":id")} returns 401 without a token`, async () => {
        const create = mock.method(Course, "create", async () => savedCourse);
        const update = mock.method(Course, "findByIdAndUpdate", async () => savedCourse);
        const remove = mock.method(Course, "findByIdAndDelete", async () => savedCourse);

        const { status, body: res } = await send(method, path, { body });
        assert.strictEqual(status, 401);
        assert.strictEqual(res.success, false);
        assert.strictEqual(create.mock.callCount() + update.mock.callCount() + remove.mock.callCount(), 0);
    });

    test(`${method} ${path.replace(COURSE_ID, ":id")} returns 401 with an invalid token`, async () => {
        const { status } = await send(method, path, { token: "not-a-real-token", body });
        assert.strictEqual(status, 401);
    });

    test(`${method} ${path.replace(COURSE_ID, ":id")} returns 403 for a regular user`, async () => {
        const create = mock.method(Course, "create", async () => savedCourse);
        const update = mock.method(Course, "findByIdAndUpdate", async () => savedCourse);
        const remove = mock.method(Course, "findByIdAndDelete", async () => savedCourse);

        const { status, body: res } = await send(method, path, { token: userToken, body });
        assert.strictEqual(status, 403);
        assert.strictEqual(res.success, false);
        assert.strictEqual(create.mock.callCount() + update.mock.callCount() + remove.mock.callCount(), 0);
    });
}

// ==========================================================
// POST /api/courses
// ==========================================================
test("POST /api/courses returns 201 for an admin with valid data", async () => {
    mock.method(Course, "create", async () => savedCourse);
    const { status, body } = await send("POST", "/api/courses", { token: adminToken, body: validBody });
    assert.strictEqual(status, 201);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.message, "Course created successfully");
    assert.deepStrictEqual(body.course, savedCourse);
});

test("POST /api/courses only saves the five course fields", async () => {
    const create = mock.method(Course, "create", async () => savedCourse);
    await send("POST", "/api/courses", {
        token: adminToken,
        body: { ...validBody, _id: "000000000000000000000000", role: "admin", extra: "ignored" },
    });
    assert.deepStrictEqual(create.mock.calls[0].arguments[0], validBody);
});

test("POST /api/courses returns 400 and names the missing fields", async () => {
    const create = mock.method(Course, "create", async () => savedCourse);
    const { status, body } = await send("POST", "/api/courses", {
        token: adminToken,
        body: { title: "Only a title" },
    });
    assert.strictEqual(status, 400);
    assert.strictEqual(body.success, false);
    for (const field of ["description", "instructor", "duration", "price"]) {
        assert.ok(body.message.includes(field), `message should mention ${field}`);
    }
    assert.strictEqual(create.mock.callCount(), 0);
});

test("POST /api/courses returns 400 when the body is empty", async () => {
    const { status, body } = await send("POST", "/api/courses", { token: adminToken, body: {} });
    assert.strictEqual(status, 400);
    assert.strictEqual(body.success, false);
});

for (const [label, price] of [["zero", 0], ["negative", -5], ["a string", "49.99"], ["not finite", null]]) {
    test(`POST /api/courses returns 400 when price is ${label}`, async () => {
        const create = mock.method(Course, "create", async () => savedCourse);
        const { status, body } = await send("POST", "/api/courses", {
            token: adminToken,
            body: { ...validBody, price },
        });
        assert.strictEqual(status, 400);
        assert.strictEqual(body.success, false);
        assert.strictEqual(create.mock.callCount(), 0);
    });
}

test("POST /api/courses returns 400 when a text field is blank", async () => {
    const { status, body } = await send("POST", "/api/courses", {
        token: adminToken,
        body: { ...validBody, title: "   " },
    });
    assert.strictEqual(status, 400);
    assert.ok(body.message.includes("title"));
});

test("POST /api/courses returns 400 on a Mongoose validation error", async () => {
    mock.method(Course, "create", async () => {
        throw new mongoose.Error.ValidationError();
    });
    const { status, body } = await send("POST", "/api/courses", { token: adminToken, body: validBody });
    assert.strictEqual(status, 400);
    assert.strictEqual(body.success, false);
});

test("POST /api/courses returns 500 on an unexpected error", async () => {
    mock.method(Course, "create", async () => {
        throw new Error("db down");
    });
    const { status, body } = await send("POST", "/api/courses", { token: adminToken, body: validBody });
    assert.strictEqual(status, 500);
    assert.strictEqual(body.success, false);
});

// ==========================================================
// PUT /api/courses/:id
// ==========================================================
test("PUT /api/courses/:id returns 200 with the updated course", async () => {
    const updated = { ...savedCourse, price: 59.99 };
    const update = mock.method(Course, "findByIdAndUpdate", async () => updated);
    const { status, body } = await send("PUT", `/api/courses/${COURSE_ID}`, {
        token: adminToken,
        body: { ...validBody, price: 59.99 },
    });
    assert.strictEqual(status, 200);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.message, "Course updated successfully");
    assert.deepStrictEqual(body.course, updated);

    // Uses the options from the issue: return the new document and run validators
    const [id, data, options] = update.mock.calls[0].arguments;
    assert.strictEqual(id, COURSE_ID);
    assert.strictEqual(data.price, 59.99);
    assert.deepStrictEqual(options, { new: true, runValidators: true });
});

test("PUT /api/courses/:id allows updating a single field", async () => {
    const update = mock.method(Course, "findByIdAndUpdate", async () => savedCourse);
    const { status } = await send("PUT", `/api/courses/${COURSE_ID}`, {
        token: adminToken,
        body: { title: "New title" },
    });
    assert.strictEqual(status, 200);
    assert.deepStrictEqual(update.mock.calls[0].arguments[1], { title: "New title" });
});

test("PUT /api/courses/:id only passes the five course fields", async () => {
    const update = mock.method(Course, "findByIdAndUpdate", async () => savedCourse);
    await send("PUT", `/api/courses/${COURSE_ID}`, {
        token: adminToken,
        body: { ...validBody, _id: "000000000000000000000000", createdAt: "2000-01-01", role: "admin" },
    });
    assert.deepStrictEqual(update.mock.calls[0].arguments[1], validBody);
});

test("PUT /api/courses/:id returns 404 when the course does not exist", async () => {
    mock.method(Course, "findByIdAndUpdate", async () => null);
    const { status, body } = await send("PUT", `/api/courses/${COURSE_ID}`, {
        token: adminToken,
        body: validBody,
    });
    assert.strictEqual(status, 404);
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.message, "Course not found");
});

test("PUT /api/courses/invalid-id returns 400", async () => {
    mock.method(Course, "findByIdAndUpdate", async () => {
        throw new mongoose.Error.CastError("ObjectId", "invalid-id", "_id");
    });
    const { status, body } = await send("PUT", "/api/courses/invalid-id", {
        token: adminToken,
        body: validBody,
    });
    assert.strictEqual(status, 400);
    assert.strictEqual(body.message, "Invalid course ID");
});

test("PUT /api/courses/:id returns 400 when no course fields are sent", async () => {
    const update = mock.method(Course, "findByIdAndUpdate", async () => savedCourse);
    const { status, body } = await send("PUT", `/api/courses/${COURSE_ID}`, { token: adminToken, body: {} });
    assert.strictEqual(status, 400);
    assert.strictEqual(body.success, false);
    assert.strictEqual(update.mock.callCount(), 0);
});

test("PUT /api/courses/:id returns 400 for an invalid price", async () => {
    const update = mock.method(Course, "findByIdAndUpdate", async () => savedCourse);
    const { status, body } = await send("PUT", `/api/courses/${COURSE_ID}`, {
        token: adminToken,
        body: { price: -1 },
    });
    assert.strictEqual(status, 400);
    assert.ok(body.message.includes("price"));
    assert.strictEqual(update.mock.callCount(), 0);
});

test("PUT /api/courses/:id returns 500 on an unexpected error", async () => {
    mock.method(Course, "findByIdAndUpdate", async () => {
        throw new Error("db down");
    });
    const { status } = await send("PUT", `/api/courses/${COURSE_ID}`, { token: adminToken, body: validBody });
    assert.strictEqual(status, 500);
});

// ==========================================================
// DELETE /api/courses/:id
// ==========================================================
test("DELETE /api/courses/:id returns 200 with a message and no course", async () => {
    const remove = mock.method(Course, "findByIdAndDelete", async () => savedCourse);
    const { status, body } = await send("DELETE", `/api/courses/${COURSE_ID}`, { token: adminToken });
    assert.strictEqual(status, 200);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.message, "Course deleted successfully");
    assert.strictEqual(body.course, undefined);
    assert.strictEqual(remove.mock.calls[0].arguments[0], COURSE_ID);
});

test("DELETE /api/courses/:id returns 404 when the course does not exist", async () => {
    mock.method(Course, "findByIdAndDelete", async () => null);
    const { status, body } = await send("DELETE", `/api/courses/${COURSE_ID}`, { token: adminToken });
    assert.strictEqual(status, 404);
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.message, "Course not found");
});

test("DELETE /api/courses/invalid-id returns 400", async () => {
    mock.method(Course, "findByIdAndDelete", async () => {
        throw new mongoose.Error.CastError("ObjectId", "invalid-id", "_id");
    });
    const { status, body } = await send("DELETE", "/api/courses/invalid-id", { token: adminToken });
    assert.strictEqual(status, 400);
    assert.strictEqual(body.message, "Invalid course ID");
});

test("DELETE /api/courses/:id returns 500 on an unexpected error", async () => {
    mock.method(Course, "findByIdAndDelete", async () => {
        throw new Error("db down");
    });
    const { status } = await send("DELETE", `/api/courses/${COURSE_ID}`, { token: adminToken });
    assert.strictEqual(status, 500);
});

// ==========================================================
// Public read routes are unaffected
// ==========================================================
test("GET /api/courses is still public (no token needed)", async () => {
    mock.method(Course, "find", async () => [savedCourse]);
    const { status, body } = await send("GET", "/api/courses");
    assert.strictEqual(status, 200);
    assert.deepStrictEqual(body.courses, [savedCourse]);
});
