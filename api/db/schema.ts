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

export const books = t.pgTable("books", {
  id: t.bigserial({ mode: "number" }).primaryKey(),
  title: t.varchar({length: 255,}).notNull(),
  author: t.varchar({length: 255,}).notNull(),
  detail: t.varchar({length: 255,}).notNull(),
  synopsis: t.varchar({length: 255,}).notNull(),
  type: t.varchar({length: 255,}).notNull(),
  publishedAt: t.timestamp().notNull(),
});

export const typecoffee = t.pgTable("typecoffee", {
  id: t.bigserial({ mode: "number" }).primaryKey(),
  type: t.varchar({ length: 255 }).notNull(),
});

export const coffee = t.pgTable("coffee", {
  id: t.bigserial({ mode: "number" }).primaryKey(),
  typecoffee_id: t.bigint({ mode: "number" }).notNull().references(() => typecoffee.id),
  count: t.integer().notNull(),
  description: t.varchar({ length: 255 }).notNull(),
  customer_name: t.varchar({ length: 255 }).notNull(),
});
