import { queryOptions, useMutation, useQuery } from "@tanstack/react-query";
import { createTask, deleteTask, getTasks } from "../libs/api/tasks.api";

export const tasksQueryOptions = queryOptions({
	queryKey: ["tasks"] as const,
	queryFn: getTasks,
});

export function useTasks() {
	return useQuery(tasksQueryOptions);
}

export function useCreateTask() {
	return useMutation({
		mutationFn: createTask,
	});
}

export function useDeleteTask() {
	return useMutation({
		mutationFn: deleteTask,
	});
}
