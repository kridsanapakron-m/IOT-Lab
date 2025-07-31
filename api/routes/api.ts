import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import { env } from "hono/adapter";
import drizzle from "../db/drizzle.js";
import { students, books, coffee, typecoffee } from "../db/schema.js";
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
  return c.json({ message: "Student API2" });
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

apiRouter.get("/books", async (c) => {
  const allBooks = await drizzle.select().from(books);
  return c.json(allBooks);
});

apiRouter.get("/books/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (isNaN(id)) return c.json({ error: "Invalid book id" }, 400);
  const result = await drizzle.query.books.findFirst({ where: eq(books.id, id) });
  if (!result) return c.json({ error: "Book not found" }, 404);
  return c.json(result);
});

apiRouter.post("/books", async (c) => {
  const body = await c.req.json();
  if (typeof body !== 'object' || body === null) {
    return c.json({ success: false, message: "Invalid request body format" }, 400);
  }
  const { title, author, detail, synopsis, type, publishedAt } = body;
  if (!isValidString(title)) return c.json({ success: false, message: "title is required" }, 400);
  if (!isValidString(author)) return c.json({ success: false, message: "author is required" }, 400);
  if (!isValidString(detail)) return c.json({ success: false, message: "detail is required" }, 400);
  if (!isValidString(synopsis)) return c.json({ success: false, message: "synopsis is required" }, 400);
  if (!isValidString(type)) return c.json({ success: false, message: "type is required" }, 400);
  const publishedAtDate = new Date(publishedAt);
  if (isNaN(publishedAtDate.getTime())) return c.json({ success: false, message: "publishedAt must be a valid date string" }, 400);
  const result = await drizzle.insert(books).values({
    title,
    author,
    detail,
    synopsis,
    type,
    publishedAt: publishedAtDate,
  }).returning();
  return c.json({ success: true, book: result[0] }, 201);
});

apiRouter.patch("/books/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (isNaN(id)) return c.json({ success: false, message: "Invalid book id" }, 400);
  const body = await c.req.json();
  const updates: any = {};
  if (isValidString(body.title)) updates.title = body.title;
  if (isValidString(body.author)) updates.author = body.author;
  if (isValidString(body.detail)) updates.detail = body.detail;
  if (isValidString(body.synopsis)) updates.synopsis = body.synopsis;
  if (isValidString(body.type)) updates.type = body.type;
  if (body.publishedAt) {
    const publishedAtDate = new Date(body.publishedAt);
    if (isNaN(publishedAtDate.getTime())) {
      return c.json({ success: false, message: "Invalid publishedAt format" }, 400);
    }
    updates.publishedAt = publishedAtDate;
  }
  if (Object.keys(updates).length === 0) {
    return c.json({ success: false, message: "No valid fields to update" }, 400);
  }
  const updated = await drizzle.update(books).set(updates).where(eq(books.id, id)).returning();
  if (updated.length === 0) {
    return c.json({ success: false, message: "Book not found" }, 404);
  }
  return c.json({ success: true, book: updated[0] });
});

apiRouter.delete("/books/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (isNaN(id)) return c.json({ error: "Invalid book id" }, 400);
  const deleted = await drizzle.delete(books).where(eq(books.id, id)).returning();
  if (deleted.length === 0) {
    return c.json({ error: "Book not found" }, 404);
  }
  return c.json({ success: true, book: deleted[0] });
});

// CRUD for typecoffee (coffee types)
apiRouter.get("/typecoffee", async (c) => {
  const allTypes = await drizzle.select().from(typecoffee);
  return c.json(allTypes);
});

apiRouter.get("/typecoffee/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (isNaN(id)) return c.json({ error: "Invalid typecoffee id" }, 400);
  const result = await drizzle.query.typecoffee.findFirst({ where: eq(typecoffee.id, id) });
  if (!result) return c.json({ error: "Type not found" }, 404);
  return c.json(result);
});

apiRouter.post("/typecoffee", async (c) => {
  const body = await c.req.json();
  if (typeof body !== 'object' || body === null) {
    return c.json({ success: false, message: "Invalid request body format" }, 400);
  }
  const { type } = body;
  if (!isValidString(type)) return c.json({ success: false, message: "type is required" }, 400);
  const result = await drizzle.insert(typecoffee).values({ type }).returning();
  return c.json({ success: true, typecoffee: result[0] }, 201);
});

apiRouter.patch("/typecoffee/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (isNaN(id)) return c.json({ success: false, message: "Invalid typecoffee id" }, 400);
  const body = await c.req.json();
  const updates: any = {};
  if (isValidString(body.type)) updates.type = body.type;
  if (Object.keys(updates).length === 0) {
    return c.json({ success: false, message: "No valid fields to update" }, 400);
  }
  const updated = await drizzle.update(typecoffee).set(updates).where(eq(typecoffee.id, id)).returning();
  if (updated.length === 0) {
    return c.json({ success: false, message: "Type not found" }, 404);
  }
  return c.json({ success: true, typecoffee: updated[0] });
});

apiRouter.delete("/typecoffee/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (isNaN(id)) return c.json({ error: "Invalid typecoffee id" }, 400);
  const deleted = await drizzle.delete(typecoffee).where(eq(typecoffee.id, id)).returning();
  if (deleted.length === 0) {
    return c.json({ error: "Type not found" }, 404);
  }
  return c.json({ success: true, typecoffee: deleted[0] });
});

// CRUD for coffee (orders)
apiRouter.get("/coffee", async (c) => {
  const allCoffee = await drizzle.select().from(coffee);
  return c.json(allCoffee);
});

apiRouter.get("/coffee/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (isNaN(id)) return c.json({ error: "Invalid coffee id" }, 400);
  const result = await drizzle.query.coffee.findFirst({ where: eq(coffee.id, id) });
  if (!result) return c.json({ error: "Coffee not found" }, 404);
  return c.json(result);
});

apiRouter.post("/coffee", async (c) => {
  const body = await c.req.json();
  if (typeof body !== 'object' || body === null) {
    return c.json({ success: false, message: "Invalid request body format" }, 400);
  }
  const { typecoffee_id, count, description, customer_name } = body;
  if (typeof typecoffee_id !== 'number' || isNaN(typecoffee_id)) return c.json({ success: false, message: "typecoffee_id is required and must be a number" }, 400);
  if (typeof count !== 'number' || isNaN(count)) return c.json({ success: false, message: "count is required and must be a number" }, 400);
  if (!isValidString(description)) return c.json({ success: false, message: "description is required" }, 400);
  if (!isValidString(customer_name)) return c.json({ success: false, message: "customer_name is required" }, 400);
  const result = await drizzle.insert(coffee).values({ typecoffee_id, count, description, customer_name }).returning();
  return c.json({ success: true, coffee: result[0] }, 201);
});

apiRouter.patch("/coffee/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (isNaN(id)) return c.json({ success: false, message: "Invalid coffee id" }, 400);
  const body = await c.req.json();
  const updates: any = {};
  if (typeof body.typecoffee_id === 'number' && !isNaN(body.typecoffee_id)) updates.typecoffee_id = body.typecoffee_id;
  if (typeof body.count === 'number' && !isNaN(body.count)) updates.count = body.count;
  if (isValidString(body.description)) updates.description = body.description;
  if (isValidString(body.customer_name)) updates.customer_name = body.customer_name;
  if (Object.keys(updates).length === 0) {
    return c.json({ success: false, message: "No valid fields to update" }, 400);
  }
  const updated = await drizzle.update(coffee).set(updates).where(eq(coffee.id, id)).returning();
  if (updated.length === 0) {
    return c.json({ success: false, message: "Coffee not found" }, 404);
  }
  return c.json({ success: true, coffee: updated[0] });
});

apiRouter.delete("/coffee/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (isNaN(id)) return c.json({ error: "Invalid coffee id" }, 400);
  const deleted = await drizzle.delete(coffee).where(eq(coffee.id, id)).returning();
  if (deleted.length === 0) {
    return c.json({ error: "Coffee not found" }, 404);
  }
  return c.json({ success: true, coffee: deleted[0] });
});

// GET all coffee types
apiRouter.get("/getcoffeetype", async (c) => {
  const types = await drizzle.select({ type: typecoffee.type }).from(typecoffee);
  return c.json(types.map(row => row.type));
});

export default apiRouter;