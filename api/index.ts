  import { Hono } from "hono";
  import { cors } from "hono/cors";
  import apiRouter from "./routes/api.js";
  import { handle } from "hono/vercel";

  const app = new Hono().basePath("/api");

  app.use(
    "*",
    cors({
      origin: "*",
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    })
  );

  app.route("/v1", apiRouter);
  app.get('/posts', (c) => {
    return c.text('Many posts')
  })

export const config = {
  runtime: "edge",
};

export default handle(app);
