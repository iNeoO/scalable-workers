import {
	queryOptions,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
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
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: createWorker,
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: workersQueryOptions.queryKey });
		},
	});
}

export function useDeleteWorker() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: deleteWorker,
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: workersQueryOptions.queryKey });
		},
	});
}
