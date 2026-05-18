import { client } from "../client";
import { toApiError } from "./toApiError.helper";

export const getStats = async () => {
	const { data, error } = await client.stats.get();
	if (error) toApiError(error, "Failed to fetch stats");
	return data;
};
