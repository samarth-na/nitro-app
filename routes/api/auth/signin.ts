import bcrypt from "bcrypt";
import { createError, defineEventHandler, readBody } from "h3";
import jwt from "jsonwebtoken";
import { userlist } from "./userlist";

// --- Types ---

interface AuthRequestBody {
	email: string;
	password: string;
}

interface AuthResponse {
	message: string;
	user: { id: string; email: string };
	token: string;
}

// Re-use the same store (In a real app, import this from a shared db file)

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-key-change-me";

export default defineEventHandler(async (event) => {
	try {
		const body: any = await readBody(event);
		const { email, password } = body;

		if (!email || !password) {
			throw createError({
				statusCode: 400,
				statusMessage: "Email and password are required",
			});
		}

		// Find user
		const user = userlist.find((u) => u.email === email);

		if (!user) {
			throw createError({
				statusCode: 401,
				statusMessage: "Invalid credentials",
			});
		}

		// Verify Password
		const isValid = await bcrypt.compare(password, user.password);

		if (!isValid) {
			throw createError({
				statusCode: 401,
				statusMessage: "Invalid credentials",
			});
		}

		// Generate Token
		const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
			expiresIn: "1h",
		});

		return {
			message: "Sign in successful",
			user: { id: user.id, email: user.email },
			token,
		};
	} catch (error: any) {
		if (error.statusCode) {
			throw error;
		}
		throw createError({
			statusCode: 500,
			statusMessage: "Internal Server Error",
		});
	}
});
