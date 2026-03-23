import bcrypt from "bcrypt";
import { createError, defineEventHandler, readBody } from "h3";
import jwt from "jsonwebtoken";
import { userlist, type User } from "./userlist";

interface AuthRequestBody {
	email: string;
	password: string;
}

interface AuthResponse {
	message: string;
	user: { id: string; email: string };
	token: string;
}

// --- Config ---
const JWT_SECRET =
	process.env.JWT_SECRET ||
	"t2fd712&&%^&#$%^&*&^%$#64gfq3ewvit7deg2v93ct1f86r2vdt1y62i823d812r5sf16r628d875823fd652s";
const SALT_ROUNDS = 10;

export default defineEventHandler(async (event) => {
	try {
		const body: any = await readBody(event);
		const { email, password } = body;

		// Validation
		if (!email || !password) {
			throw createError({
				statusCode: 400,
				statusMessage: "Email and password are required",
			});
		}

		// Check existing user
		const existingUser = userlist.find((u) => u.email === email);
		if (existingUser) {
			throw createError({
				statusCode: 409,
				statusMessage: "User already exists",
			});
		}

		// Hash Password
		const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

		// Create User
		const newUser: User = {
			id: Date.now().toString(),
			email,
			password: hashedPassword,
			createdAt: new Date().toISOString(),
		};

		userlist.push(newUser);

		// Generate Token
		const token = jwt.sign(
			{ id: newUser.id, email: newUser.email },
			JWT_SECRET,
			{ expiresIn: "1h" },
		);

		return {
			message: "User created successfully",
			user: { id: newUser.id, email: newUser.email },
			token,
		};
	} catch (error: any) {
		// Ensure we throw a typed error for H3
		if (error.statusCode) {
			throw error;
		}
		throw createError({
			statusCode: 500,
			statusMessage: "Internal Server Error",
		});
	}
});
