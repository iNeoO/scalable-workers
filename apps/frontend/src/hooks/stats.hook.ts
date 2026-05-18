import { queryOptions, useQuery } from "@tanstack/react-query";
import { getStats } from "../libs/api/stats.api";

export const statsQueryOptions = queryOptions({
	queryKey: ["stats"] as const,
	queryFn: getStats,
});

export function useStats() {
	return useQuery(statsQueryOptions);
}
