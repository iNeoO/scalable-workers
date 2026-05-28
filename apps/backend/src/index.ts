import { pinoLogger } from "@sw/infra/libs";
import { createApp } from "./app.js";
import { removeRunningWorkerContainers } from "./modules/workers/runWorkerContainer.helper.js";
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
	try {
		const { removedContainers } = await removeRunningWorkerContainers();
		pinoLogger.info({ removedContainers }, "running worker containers removed");
	} catch (error) {
		pinoLogger.error({ error }, "failed to remove running worker containers");
	}
	await services.close();
	process.exit(0);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
