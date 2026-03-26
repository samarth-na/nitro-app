import { defineHandler } from "nitro/h3";

export default defineHandler((event) => {
	console.log(event);

	const req: Request = event;
	return { message: ` Hello a API! ` };
});
