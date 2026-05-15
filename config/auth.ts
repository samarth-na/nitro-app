export const JWT_SECRET =
	process.env.JWT_SECRET ??
	"t2fd712&&%^&#$%^&*&^%$#64gfq3ewvit7deg2v93ct1f86r2vdt1y62i823d812r5sf16r628d875823fd652s";

export const JWT_EXPIRES_IN = "24h";

export const PUBLIC_ROUTES = ["/api/auth/signin", "/api/auth/signup"];
