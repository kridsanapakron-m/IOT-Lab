import { relations } from "drizzle-orm";
import * as t from "drizzle-orm/pg-core";

export const students = t.pgTable("students", {
  id: t.bigserial({ mode: "number" }).primaryKey(),
  firstName: t.varchar({length: 255,}).notNull(),
  lastName: t.varchar({length: 255,}).notNull(),
  studentId: t.varchar({length: 50,}).notNull().unique(),
  birthDate: t.date().notNull(),
  gender: t.varchar({length: 10,}).notNull(),
});
