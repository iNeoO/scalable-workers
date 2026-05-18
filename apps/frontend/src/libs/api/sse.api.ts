import { client } from "../client";
import { toApiError } from "./toApiError.helper";

export async function connectSse() {
	const { data, error } = await client.sse.get();
	if (error) toApiError(error, "Failed to connect to SSE");
	return data;
}
