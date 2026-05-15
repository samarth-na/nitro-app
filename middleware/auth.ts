import { createError, defineEventHandler, getRequestURL } from "h3";
import jwt from "jsonwebtoken";
import { JWT_SECRET, PUBLIC_ROUTES } from "../config/auth";

export default defineEventHandler(async (event) => {
	const url = getRequestURL(event);
	const path = url.pathname;

	if (PUBLIC_ROUTES.includes(path)) return;

	const authHeader = event.headers.get("authorization");
	if (!authHeader?.startsWith("Bearer ")) {
		throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
	}

	const token = authHeader.slice(7);
	try {
		const payload = jwt.verify(token, JWT_SECRET) as { id: number; email: string };
		event.context.auth = { user: payload };
	} catch {
		throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
	}
});
