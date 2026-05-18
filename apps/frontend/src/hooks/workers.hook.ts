import { queryOptions, useMutation, useQuery } from "@tanstack/react-query";
import {
	createWorker,
	deleteWorker,
	getWorkers,
} from "../libs/api/workers.api";

export const workersQueryOptions = queryOptions({
	queryKey: ["workers"] as const,
	queryFn: getWorkers,
});

export function useWorkers() {
	return useQuery(workersQueryOptions);
}

export function useCreateWorker() {
	return useMutation({
		mutationFn: createWorker,
	});
}

export function useDeleteWorker() {
	return useMutation({
		mutationFn: deleteWorker,
	});
}
