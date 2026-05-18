import { client } from "../client";
import { toApiError } from "./toApiError.helper";

export const getWorkers = async () => {
	const { data, error } = await client.workers.get();
	if (error) toApiError(error, "Failed to fetch workers");
	return data;
};

export const createWorker = async () => {
	const { data, error } = await client.workers.post();
	if (error) toApiError(error, "Failed to create worker");
	return data;
};

export const deleteWorker = async (id: string) => {
	const { data, error } = await client.workers({ id }).delete();
	if (error) toApiError(error, "Failed to delete worker");
	return data;
};
