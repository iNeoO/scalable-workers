import { Badge } from "@mantine/core";
import { WORKERS_STATUS } from "@sw/common/constants";
import type { WorkerStatus } from "@sw/common/types";

type WorkerBadgeProps = {
	value: WorkerStatus;
};

const workerBadgeByStatus: Record<
	WorkerStatus,
	{ color: string; label: string; variant?: "light" | "filled" | "outline" }
> = {
	[WORKERS_STATUS.BOOT]: {
		color: "indigo",
		label: "Boot",
		variant: "light",
	},
	[WORKERS_STATUS.IDLE]: {
		color: "gray",
		label: "Idle",
		variant: "light",
	},
	[WORKERS_STATUS.BUSY]: {
		color: "blue",
		label: "Busy",
		variant: "filled",
	},
	[WORKERS_STATUS.SHUTDOWN]: {
		color: "red",
		label: "Shutdown",
		variant: "outline",
	},
};

export const WorkerBadge = ({ value }: WorkerBadgeProps) => {
	const { color, label, variant = "light" } = workerBadgeByStatus[value];

	return (
		<Badge color={color} radius="sm" size="sm" tt="uppercase" variant={variant}>
			{label}
		</Badge>
	);
};
