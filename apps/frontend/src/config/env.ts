import { z } from "zod";

const EnvSchema = z.object({
	VITE_APP_BACKEND_URL: z.string().default("/api"),
});

export const env = EnvSchema.parse(import.meta.env);
