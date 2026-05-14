import { wrapWithLogger } from "@sw/infra/libs";
import { RedisSubscriber } from "@sw/services";
import { sse } from "elysia";
import type Redis from "ioredis";
import { createAppWithLog } from "../../factories/appWithLog.js";
import type { SseMessage } from "./sse.type.js";

export const createSseController = (redis: Redis) => {
	return createAppWithLog({ prefix: "stats" }).get(
		"/",
		async function* ({ logger }) {
			const redisSubscriber = new RedisSubscriber(redis.duplicate());
			const messages: SseMessage[] = [];
			let notify: (() => void) | undefined;

			const push = (message: SseMessage) => {
				messages.push(message);
				notify?.();
			};

			const waitForMessage = () =>
				new Promise<void>((resolve) => {
					notify = resolve;
				});

			try {
				await wrapWithLogger(logger, async () => {
					await Promise.all([
						redisSubscriber.subscribeStats((type, stats) => {
							push({ event: type, data: { stats } });
						}),
						redisSubscriber.subscribeTask((type, task) => {
							push({ event: type, data: { task } });
						}),
						redisSubscriber.subscribeWorker((type, worker) => {
							push({ event: type, data: { worker } });
						}),
					]);
				});

				while (true) {
					if (messages.length === 0) {
						await waitForMessage();
						notify = undefined;
					}

					const message = messages.shift();

					if (message) {
						yield sse(message);
					}
				}
			} finally {
				await redisSubscriber.destroy();
			}
		},
	);
};
