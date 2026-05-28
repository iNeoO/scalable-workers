import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { connectSse } from "../libs/api/sse.api";
import { applySseMessage } from "./sse-cache";

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
						applySseMessage(queryClient, chunk);
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
