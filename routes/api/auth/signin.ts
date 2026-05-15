import bcrypt from "bcrypt";
import { createError, defineEventHandler, readBody } from "h3";
import jwt from "jsonwebtoken";
import { db } from "../../../db/db";
import { users } from "../../../db/schema";
import { JWT_EXPIRES_IN, JWT_SECRET } from "../../../config/auth";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
	try {
		const body = await readBody<{ email?: string; password?: string }>(event);
		const { email, password } = body;

		if (!email || !password) {
			throw createError({
				statusCode: 400,
				statusMessage: "Email and password are required",
			});
		}

		const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
		const user = result[0];

		if (!user) {
			throw createError({
				statusCode: 401,
				statusMessage: "Invalid credentials",
			});
		}

		const isValid = await bcrypt.compare(password, user.password);
		if (!isValid) {
			throw createError({
				statusCode: 401,
				statusMessage: "Invalid credentials",
			});
		}

		const token = jwt.sign(
			{ id: user.id, email: user.email },
			JWT_SECRET,
			{ expiresIn: JWT_EXPIRES_IN },
		);

		return {
			message: "Sign in successful",
			user: { id: user.id, email: user.email },
			token,
		};
	} catch (error: any) {
		if (error.statusCode) throw error;
		console.error("Signin error:", error);
		throw createError({
			statusCode: 500,
			statusMessage: `Internal Server Error: ${error.message}`,
		});
	}
});
