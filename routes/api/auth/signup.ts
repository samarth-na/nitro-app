import bcrypt from "bcrypt";
import { createError, defineEventHandler, readBody } from "h3";
import jwt from "jsonwebtoken";
import { db } from "../../../db/db";
import { users } from "../../../db/schema";
import { JWT_EXPIRES_IN, JWT_SECRET } from "../../../config/auth";
import { eq } from "drizzle-orm";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const SALT_ROUNDS = 10;

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

		if (!EMAIL_REGEX.test(email)) {
			throw createError({
				statusCode: 400,
				statusMessage: "Invalid email format",
			});
		}

		if (password.length < MIN_PASSWORD_LENGTH) {
			throw createError({
				statusCode: 400,
				statusMessage: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
			});
		}

		const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
		if (existing.length > 0) {
			throw createError({
				statusCode: 409,
				statusMessage: "User already exists",
			});
		}

		const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

		const inserted = await db
			.insert(users)
			.values({ email, password: hashedPassword })
			.returning();

		const user = inserted[0];

		const token = jwt.sign(
			{ id: user.id, email: user.email },
			JWT_SECRET,
			{ expiresIn: JWT_EXPIRES_IN },
		);

		return {
			message: "User created successfully",
			user: { id: user.id, email: user.email },
			token,
		};
	} catch (error: any) {
		if (error.statusCode) throw error;
		console.error("Signup error:", error);
		throw createError({
			statusCode: 500,
			statusMessage: `Internal Server Error: ${error.message}`,
		});
	}
});
