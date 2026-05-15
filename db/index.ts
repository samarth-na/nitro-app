import { db } from "./db";
import { users } from "./schema";
import { eq } from "drizzle-orm";

const existing = await db.select().from(users).where(eq(users.email, "dev@linux.com")).limit(1);

if (existing.length === 0) {
	await db.insert(users).values({
		email: "dev@linux.com",
		password: "$2b$10$placeholder",
	});
}

const result = await db.select().from(users);

console.log(result);
