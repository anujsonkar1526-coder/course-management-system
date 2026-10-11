# course-management-system
Full-stack Course Management System using MERN

## Demo data (development only)

The course catalog is empty on a new database. To fill it with 10 sample courses for a demo:

```
cd backend
npm run seed:demo
```

- The courses and instructors are made up. They are demo content, not real educational offerings or real people. Each description starts with `[Demo]`.
- The command is never run when the server starts. You have to run it yourself.
- It uses `MONGO_URI` from your `backend/.env`, so check that it points to your development or demo database first. It refuses to run if `NODE_ENV` is `production`.
- It is safe to run again. A course is only added if no course with the same title exists. It never deletes or changes existing courses, so admin-created courses and admin edits are kept. If an admin deletes a demo course, running the command again adds it back.
- Never commit your `.env` file or real passwords.
