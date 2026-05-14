import { Elysia } from "elysia";
import { createSseController } from "./modules/sse/sse.controller.js";
import { createStatsController } from "./modules/stats/stats.controller.js";
import { createTasksController } from "./modules/tasks/tasks.controller.js";
import { createWorkersController } from "./modules/workers/workers.controller.js";
import type { AppServices } from "./services.js";

export const createApp = (services: AppServices) => {
	const tasksController = createTasksController(services.tasksService);
	const workersController = createWorkersController(services.workersService);
	const sseController = createSseController(services.redis);
	const statsController = createStatsController(services.statsService);
	return new Elysia()
		.use(tasksController)
		.use(workersController)
		.use(sseController)
		.use(statsController);
};
