import { wrapWithLogger } from "@sw/infra/libs";
import type { TasksService } from "@sw/services";
import { status, t } from "elysia";
import { createAppWithLog } from "../../factories/appWithLog";

export const createTasksController = (tasksServices: TasksService) => {
	return createAppWithLog({ prefix: "tasks" })
		.get("/", async ({ logger }) => {
			return wrapWithLogger(logger, () => tasksServices.getTasks());
		})
		.post(
			"/",
			async ({ logger, body }) => {
				return wrapWithLogger(logger, () => tasksServices.createTask(body));
			},
			{
				body: t.Object({
					durationMs: t.Number(),
				}),
			},
		)
		.delete("/:id", async ({ logger, params: { id } }) => {
			return wrapWithLogger(logger, async () => {
				const task = await tasksServices.deleteTask(id);
				if (!task) return status(404, "Task not found");
				return task;
			});
		});
};

export type TaskController = ReturnType<typeof createTasksController>;
