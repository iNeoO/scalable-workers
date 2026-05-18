import { pinoLogger } from "@sw/infra/libs";
import { createApp } from "./app.js";
import { createServices } from "./services.js";

const services = await createServices();
const app = createApp(services).listen(3000);

pinoLogger.info(
	`Backend listening on http://localhost:${app.server?.port ?? 3000}`,
);

export type App = typeof app;

const gracefulShutdown = async (signal: string) => {
	pinoLogger.info(`${signal} received. Graceful shutdown initiated.`);
	await app.stop();
	await services.close();
	process.exit(0);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
