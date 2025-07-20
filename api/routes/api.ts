import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import { env } from "hono/adapter";
import drizzle from "../db/drizzle.js";
import { students } from "../db/schema.js";
import { eq } from "drizzle-orm";
const apiRouter = new Hono();

apiRouter.get("/", (c) => {
  return c.json({ message: "Student API" });
});

apiRouter.use(
  "/*",
  bearerAuth({
    verifyToken: async (token, c) => {
      const { API_SECRET } = env<{ API_SECRET: string }>(c);
      return token === API_SECRET;
    },
  })
);

apiRouter.get("/student", async (c) => {
  const allStudent = await drizzle.select().from(students);
  return c.json(allStudent);
});

apiRouter.post("/student", async (c) => {
  const body = await c.req.json(); 
  if (typeof body !== 'object' || body === null) {
    return c.json({ success: false, message: "Invalid request body format" }, 400);
  }
  const { firstName, lastName, studentId, birthDate, gender } = body;
  if (typeof firstName !== 'string' || firstName.length === 0) {
    return c.json({ success: false, message: "firstName is required" }, 400);
  }
  if (typeof lastName !== 'string' || lastName.length === 0) {
    return c.json({ success: false, message: "lastName is required" }, 400);
  }
  if (typeof studentId !== 'string' || studentId.length === 0) {
    return c.json({ success: false, message: "studentId is required" }, 400);
  }
  let parsedBirthDate: Date | null = null;
  if (typeof birthDate === 'string') {
    try {
      parsedBirthDate = new Date(birthDate);
      if (isNaN(parsedBirthDate.getTime())) {
        throw new Error("Invalid date format");
      }
    } catch (e) {
      return c.json({ success: false, message: "birthDate must be a valid date string (e.g., YYYY-MM-DD)" }, 400);
    }
  } else {
    return c.json({ success: false, message: "birthDate must be a date string" }, 400);
  }

  if (typeof gender !== 'string' || gender.length === 0) {
    return c.json({ success: false, message: "gender is required" }, 400);
  }
  const birthDateString = parsedBirthDate!.toISOString().split('T')[0];
  const result = await drizzle
    .insert(students)
    .values({
      firstName,
      lastName,
      studentId,
      birthDate: birthDateString,
      gender,
    })
    .returning();
  return c.json({ success: true, students: result[0] }, 201);
});

apiRouter.patch("/student/:studentId", async (c) => {
  const body = await c.req.json();
  const studentId = c.req.param("studentId");

  if (typeof studentId !== "string" || studentId.trim() === "") {
    return c.json({ success: false, message: "Invalid studentId" }, 400);
  }

  const updates: any = {};

  if (typeof body.firstName === "string" && body.firstName.trim() !== "") {
    updates.firstName = body.firstName;
  }

  if (typeof body.lastName === "string" && body.lastName.trim() !== "") {
    updates.lastName = body.lastName;
  }

  if (typeof body.birthDate === "string") {
    const parsedDate = new Date(body.birthDate);
    if (!isNaN(parsedDate.getTime())) {
      updates.birthDate = parsedDate.toISOString().split("T")[0];
    } else {
      return c.json({ success: false, message: "Invalid birthDate format" }, 400);
    }
  }

  if (typeof body.gender === "string" && body.gender.trim() !== "") {
    updates.gender = body.gender;
  }

  if (Object.keys(updates).length === 0) {
    return c.json({ success: false, message: "No valid fields to update" }, 400);
  }

  const updated = await drizzle
    .update(students)
    .set(updates)
    .where(eq(students.studentId, studentId))
    .returning();

  if (updated.length === 0) {
    return c.json({ success: false, message: "Student not found" }, 404);
  }

  return c.json({ success: true, student: updated[0] });
});


export default apiRouter;