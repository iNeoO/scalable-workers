import { treaty } from "@elysia/eden";
import type { App } from "@sw/backend";
import { env } from "../config/env";

export const client = treaty<App>(env.VITE_APP_BACKEND_URL);
