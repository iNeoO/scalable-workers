import { WORKERS_STATUS } from "@sw/common/constants";
import { wrapWithLogger } from "@sw/infra/libs";
import type { WorkersService } from "@sw/services";
import { createAppWithLog } from "../../factories/appWithLog";

export const createWorkersController = (WorkersService: WorkersService) => {
	return createAppWithLog({ prefix: "workers" })
		.get("/", async ({ logger }) => {
			return wrapWithLogger(logger, () => WorkersService.getWorkers());
		})
		.post("/", async ({ logger }) => {
			return wrapWithLogger(logger, () =>
				WorkersService.createWorker({ status: WORKERS_STATUS.BOOT, tasksDone: 0 }),
			);
		})
		.delete("/:id", async ({ logger, params: { id } }) => {
			return wrapWithLogger(logger, () => WorkersService.deleteWorker(id));
		});
};
