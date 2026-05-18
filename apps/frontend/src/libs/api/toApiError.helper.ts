export function toApiError(
	error: { status: unknown; value: unknown },
	fallback = "Something went wrong",
): never {
	const message =
		typeof error.value === "string" && error.value ? error.value : fallback;
	throw new Error(message);
}
