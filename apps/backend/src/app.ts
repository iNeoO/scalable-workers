import { Elysia } from "elysia";
import { createTasksController } from "./modules/tasks/tasks.controller.js";
import { createWorkersController } from "./modules/workers/workers.controller.js";
import type { AppServices } from "./services.js";

export const createApp = (services: AppServices) => {
	const tasksController = createTasksController(services.tasksService);
	const workersController = createWorkersController(services.workersService);
	return new Elysia().use(tasksController).use(workersController);
};
