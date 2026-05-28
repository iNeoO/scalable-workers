import type { QueryClient } from "@tanstack/react-query";
import type { getStats } from "../libs/api/stats.api";
import type { getTasks } from "../libs/api/tasks.api";
import type { getWorkers } from "../libs/api/workers.api";
import { statsQueryOptions } from "./stats.hook";
import { tasksQueryOptions } from "./tasks.hook";
import { workersQueryOptions } from "./workers.hook";

type CachedTask = Awaited<ReturnType<typeof getTasks>>[number];
type CachedWorker = Awaited<ReturnType<typeof getWorkers>>[number];

type SseTask = Omit<CachedTask, "processedByWorker"> & {
	processedByWorker?: CachedTask["processedByWorker"];
};

type SseMessage =
	| {
			event: "stats.updated";
			data: {
				stats: Awaited<ReturnType<typeof getStats>>;
			};
	  }
	| {
			event: "task.created" | "task.started" | "task.finished";
			data: { task: SseTask };
	  }
	| {
			event: "worker.created" | "worker.updated" | "worker.removed";
			data: { worker: CachedWorker };
	  };

const getProcessedByWorker = (
	task: SseTask,
	workers: CachedWorker[],
): CachedTask["processedByWorker"] => {
	if (task.processedByWorker !== undefined) return task.processedByWorker;
	if (!task.processedBy) return null;

	return workers.find((worker) => worker.id === task.processedBy) ?? null;
};

const hydrateTask = (task: SseTask, workers: CachedWorker[]): CachedTask => ({
	...task,
	processedByWorker: getProcessedByWorker(task, workers),
});

export const applySseMessage = (
	queryClient: QueryClient,
	chunk: SseMessage,
) => {
	switch (chunk.event) {
		case "stats.updated":
			queryClient.setQueryData(statsQueryOptions.queryKey, chunk.data.stats);
			break;

		case "task.created":
			queryClient.setQueryData(tasksQueryOptions.queryKey, (prev = []) => {
				const task = hydrateTask(
					chunk.data.task,
					queryClient.getQueryData(workersQueryOptions.queryKey) ?? [],
				);

				return [
					task,
					...prev.filter((cachedTask) => cachedTask.id !== task.id),
				];
			});
			break;

		case "task.started":
		case "task.finished":
			queryClient.setQueryData(tasksQueryOptions.queryKey, (prev = []) => {
				const workers =
					queryClient.getQueryData(workersQueryOptions.queryKey) ?? [];
				const task = hydrateTask(chunk.data.task, workers);

				return prev.map((cachedTask) =>
					cachedTask.id === task.id ? { ...cachedTask, ...task } : cachedTask,
				);
			});
			break;

		case "worker.created":
			queryClient.setQueryData(workersQueryOptions.queryKey, (prev = []) => [
				...prev,
				chunk.data.worker,
			]);
			break;

		case "worker.updated":
			queryClient.setQueryData(workersQueryOptions.queryKey, (prev = []) =>
				prev.map((worker) =>
					worker.id === chunk.data.worker.id ? chunk.data.worker : worker,
				),
			);
			break;

		case "worker.removed":
			queryClient.setQueryData(workersQueryOptions.queryKey, (prev = []) =>
				prev.filter((worker) => worker.id !== chunk.data.worker.id),
			);
			break;
	}
};
