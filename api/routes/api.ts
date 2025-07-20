import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import { env } from "hono/adapter";
import drizzle from "../db/drizzle.js";
import { students } from "../db/schema.js";
import { zValidator } from "@hono/zod-validator";
import z from "zod";
import dayjs from "dayjs";

const apiRouter = new Hono();

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

apiRouter.post("/student",
  zValidator("json",z.object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      studentId: z.string().min(1),
      birthDate: z.preprocess((arg) => {
        if (typeof arg === "string" || arg instanceof Date) return new Date(arg);
        return arg;
      }, z.date()),
      gender: z.string().min(1),
    })
  ),
  async (c) => {
    const { firstName, lastName, studentId, birthDate, gender } = c.req.valid("json");
    const birthDateString = birthDate.toISOString().split('T')[0]; 
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
    return c.json({ success: true, book: result[0] }, 201);
  }
);

apiRouter.get("/", (c) => {
  return c.json({ message: "Student API" });
});

export default apiRouter;