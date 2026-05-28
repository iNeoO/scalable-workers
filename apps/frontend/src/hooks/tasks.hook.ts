import {
	queryOptions,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { createTask, deleteTask, getTasks } from "../libs/api/tasks.api";

type CachedTask = Awaited<ReturnType<typeof getTasks>>[number];

export const tasksQueryOptions = queryOptions({
	queryKey: ["tasks"] as const,
	queryFn: getTasks,
});

export function useTasks() {
	return useQuery(tasksQueryOptions);
}

export function useCreateTask() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: createTask,
		onSuccess: (createdTask) => {
			queryClient.setQueryData(tasksQueryOptions.queryKey, (prev = []) => {
				const task: CachedTask = {
					...createdTask,
					processedByWorker: null,
				};

				return [
					task,
					...prev.filter((cachedTask) => cachedTask.id !== createdTask.id),
				];
			});
		},
	});
}

export function useDeleteTask() {
	return useMutation({
		mutationFn: deleteTask,
	});
}
