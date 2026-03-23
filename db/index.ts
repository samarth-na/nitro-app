import { db } from "./db";
import { users } from "./schema";

await db.insert(users).values({
	name: "Samarth",
});

const result = await db.select().from(users);

console.log(result);
