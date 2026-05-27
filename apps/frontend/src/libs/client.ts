import { treaty } from "@elysia/eden";
import type { App } from "@sw/backend";
import { env } from "../config/env";

const backendUrl = (() => {
	if (/^https?:\/\//.test(env.VITE_APP_BACKEND_URL)) {
		return env.VITE_APP_BACKEND_URL;
	}

	const normalizedPath = env.VITE_APP_BACKEND_URL.startsWith("/")
		? env.VITE_APP_BACKEND_URL
		: `/${env.VITE_APP_BACKEND_URL}`;

	return `${window.location.origin}${normalizedPath}`;
})();

export const client = treaty<App>(backendUrl);
