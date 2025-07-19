import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./api/db/schema.ts",
  dbCredentials: {
    url: process.env.POSTGRES_URL as string,
  },
  casing: "snake_case",
});
