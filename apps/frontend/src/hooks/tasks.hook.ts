import {
	queryOptions,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { createTask, deleteTask, getTasks } from "../libs/api/tasks.api";

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
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: tasksQueryOptions.queryKey });
		},
	});
}

export function useDeleteTask() {
	return useMutation({
		mutationFn: deleteTask,
	});
}
