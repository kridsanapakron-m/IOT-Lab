import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import { env } from "hono/adapter";
import drizzle from "../db/drizzle.js";
import { students } from "../db/schema.js";
import { eq } from "drizzle-orm";
const apiRouter = new Hono();

function isValidString(str: any): str is string {
  return typeof str === "string" && str.trim().length > 0;
}

function parseDate(dateStr: any): string | null {
  if (typeof dateStr !== "string") return null;
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed.toISOString().split("T")[0];
}

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

apiRouter.get("/student/:studentId", async (c) => {
  const studentId = c.req.param("studentId");
  const result = await drizzle.query.students.findFirst({
    where: eq(students.studentId, studentId),
  });
  if (!result) {
    return c.json({ error: "Student not found" }, 404);
  }
  return c.json(result);
});

apiRouter.post("/student", async (c) => {
  const body = await c.req.json(); 
  if (typeof body !== 'object' || body === null) {
    return c.json({ success: false, message: "Invalid request body format" }, 400);
  }
  const { firstName, lastName, studentId, birthDate, gender } = body;
   
  if (!isValidString(firstName)) return c.json({ success: false, message: "firstName is required" }, 400);
  if(!isValidString(lastName)) return c.json({ success: false, message: "lastName is required" }, 400);
  if(!isValidString(studentId)) return c.json({ success: false, message: "studentId is required" }, 400);
  const birthDateString = parseDate(birthDate);
  if (!birthDateString) return c.json({ success: false, message: "birthDate must be a valid date string" }, 400);
  if(!isValidString(gender)) return c.json({ success: false, message: "gender is required" }, 400);
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
  if (isValidString(body.firstName)) updates.firstName = body.firstName;
  if(!isValidString(body.lastName)) updates.lastName = body.lastName;
  if(!isValidString(body.gender)) updates.gender = body.gender;
  const birthDateStr = parseDate(body.birthDate);
  if (birthDateStr) {
    updates.birthDate = birthDateStr;
  } 
  else if (body.birthDate !== undefined) {
    return c.json({ success: false, message: "Invalid birthDate format" }, 400);
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

apiRouter.delete("/student/:studentId", async (c) => {
  const studentId = c.req.param("studentId");
  const deleted = await drizzle.delete(students).where(eq(students.studentId, studentId)).returning();
  if (deleted.length === 0) {
    return c.json({ error: "Student not found" }, 404);
  }
  return c.json({ success: true, students: deleted[0] });
});

export default apiRouter;