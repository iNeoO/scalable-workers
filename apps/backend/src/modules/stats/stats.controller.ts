import { wrapWithLogger } from "@sw/infra/libs";
import type { StatsService } from "@sw/services";
import { createAppWithLog } from "../../factories/appWithLog.js";

export const createStatsController = (statsService: StatsService) => {
	return createAppWithLog({ prefix: "stats" }).get("/", async ({ logger }) => {
		return wrapWithLogger(logger, () => statsService.getStats());
	});
};
