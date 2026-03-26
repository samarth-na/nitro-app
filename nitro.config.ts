import { defineConfig } from "nitro";

export default defineConfig({
	serverDir: "./",
	handlers: [
		{
			route: "/**",
			handler: "./routes/middleware/index.ts",
			middleware: true,
		},
	],
});
