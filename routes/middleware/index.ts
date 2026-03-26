import { defineHandler } from "nitro";

export default defineHandler((event) => {
	console.log(event);
	console.log("hello");

	return { message: "Hello from API!" };
});
