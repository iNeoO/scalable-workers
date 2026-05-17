import { WORKERS_STATUS } from "@sw/common/constants";
import { wrapWithLogger } from "@sw/infra/libs";
import type { WorkersService } from "@sw/services";
import { createAppWithLog } from "../../factories/appWithLog";
import {
	runWorkerContainer,
	stopWorkerContainer,
} from "./runWorkerContainer.helper";

export const createWorkersController = (WorkersService: WorkersService) => {
	return createAppWithLog({ prefix: "workers" })
		.get("/", async ({ logger }) => {
			return wrapWithLogger(logger, () => WorkersService.getWorkers());
		})
		.post("/", async ({ logger }) => {
			return wrapWithLogger(logger, async () => {
				const worker = await WorkersService.createWorker({
					status: WORKERS_STATUS.BOOT,
				});

				try {
					const container = await runWorkerContainer(worker.id);

					return {
						...worker,
						container,
					};
				} catch (error) {
					await WorkersService.hardDeleteWorker(worker.id);
					throw error;
				}
			});
		})
		.delete("/:id", async ({ logger, params: { id } }) => {
			return wrapWithLogger(logger, async () => {
				const worker = await WorkersService.shutdownWorker(id);
				const container = await stopWorkerContainer(id);

				return {
					...worker,
					container,
				};
			});
		});
};
