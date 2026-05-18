import {
	createHttpLogger,
	logHttpCompletion,
	pinoLogger,
} from "@sw/infra/libs";
import { Elysia, status } from "elysia";

const UNKNOWN_VALUE = "unknown";

const getStatusCode = (status: string | number | undefined) => {
	if (typeof status === "number") return status;
	if (status === undefined) return 200;

	switch (status) {
		case "OK":
			return 200;
		case "Created":
			return 201;
		case "Bad Request":
			return 400;
		case "Unauthorized":
			return 401;
		case "Forbidden":
			return 403;
		case "Not Found":
			return 404;
		case "Internal Server Error":
			return 500;
		default:
			return 500;
	}
};

export const createAppWithLog = <T extends string>({
	prefix,
}: {
	prefix: T;
}) => {
	return new Elysia({ prefix })
		.derive({ as: "global" }, ({ headers, path, request }) => {
			const logger = createHttpLogger({
				reqId: crypto.randomUUID(),
				req: {
					method: request.method,
					url: path,
				},
				userAgent:
					(headers as Record<string, string | undefined>)["user-agent"] ??
					UNKNOWN_VALUE,
			});

			return {
				logger,
				startTime: performance.now(),
			};
		})
		.onAfterHandle(({ logger, startTime, set }) => {
			logHttpCompletion(
				logger,
				getStatusCode(set.status) ?? 200,
				performance.now() - startTime,
			);
		})
		.onError(({ logger, code, error, set, startTime }) => {
			if (logger && startTime) {
				logger.error(
					{
						code,
						err: error,
						responseTime: performance.now() - startTime,
						status: set.status,
					},
					"Request failed",
				);
			} else {
				pinoLogger.error({
					code,
					err: error,
					status: set.status,
				});
			}
			return status(500, "error in the application");
		});
};
