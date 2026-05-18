import { client } from "../client";
import { toApiError } from "./toApiError.helper";

export const getTasks = async () => {
	const { data, error } = await client.tasks.get();
	if (error) toApiError(error, "Failed to fetch tasks");
	return data;
};

export const createTask = async (body: { durationMs: number }) => {
	const { data, error } = await client.tasks.post(body);
	if (error) toApiError(error, "Failed to create task");
	return data;
};

export const deleteTask = async (id: string) => {
	const { data, error } = await client.tasks({ id }).delete();
	if (error) toApiError(error, "Failed to delete task");
	return data;
};
