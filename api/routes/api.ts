import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import { env } from "hono/adapter";
import drizzle from "../db/drizzle.js";
import { students } from "../db/schema.js";

const apiRouter = new Hono();

apiRouter.get("/", (c) => {
  return c.json({ message: "Student API" });
});
apiRouter.get("/student", async (c) => {
  const allStudent = await drizzle.select().from(students);
  return c.json(allStudent);
});
apiRouter.use(
  "*",
  bearerAuth({
    verifyToken: async (token, c) => {
      const { API_SECRET } = env<{ API_SECRET: string }>(c);
      return token === API_SECRET;
    },
  })
);

export default apiRouter;
