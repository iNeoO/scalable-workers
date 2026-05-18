import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { connectSse } from "../libs/api/sse.api";
import { statsQueryOptions } from "./stats.hook";
import { tasksQueryOptions } from "./tasks.hook";
import { workersQueryOptions } from "./workers.hook";

export function useSSE() {
	const queryClient = useQueryClient();

	useEffect(() => {
		let cancelled = false;
		let delay = 1000;

		async function run() {
			while (!cancelled) {
				try {
					const stream = await connectSse();
					if (!stream) return;

					delay = 1000;

					for await (const chunk of stream) {
						if (cancelled) return;

						switch (chunk.event) {
							case "stats.updated":
								queryClient.setQueryData(
									statsQueryOptions.queryKey,
									chunk.data.stats,
								);
								break;

							case "task.created":
								queryClient.setQueryData(
									tasksQueryOptions.queryKey,
									(prev = []) => [
										{ ...chunk.data.task, processedByWorker: null },
										...prev,
									],
								);
								break;

							case "task.started":
							case "task.finished":
								queryClient.setQueryData(
									tasksQueryOptions.queryKey,
									(prev = []) =>
										prev.map((t) =>
											t.id === chunk.data.task.id
												? { ...t, ...chunk.data.task }
												: t,
										),
								);
								break;

							case "worker.created":
								queryClient.setQueryData(
									workersQueryOptions.queryKey,
									(prev = []) => [...prev, chunk.data.worker],
								);
								break;

							case "worker.updated":
								queryClient.setQueryData(
									workersQueryOptions.queryKey,
									(prev = []) =>
										prev.map((w) =>
											w.id === chunk.data.worker.id ? chunk.data.worker : w,
										),
								);
								break;

							case "worker.removed":
								queryClient.setQueryData(
									workersQueryOptions.queryKey,
									(prev = []) =>
										prev.filter((w) => w.id !== chunk.data.worker.id),
								);
								break;
						}
					}
				} catch {
					if (cancelled) return;
					await new Promise((r) => setTimeout(r, delay));
					delay = Math.min(delay * 2, 30_000);
				}
			}
		}

		run();
		return () => {
			cancelled = true;
		};
	}, [queryClient]);
}
