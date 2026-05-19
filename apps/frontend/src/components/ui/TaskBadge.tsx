import { Badge } from "@mantine/core";
import { TASKS_STATUS } from "@sw/common/constants";
import type { TaskStatus } from "@sw/common/types";

type TaskBadgeProps = {
	value: TaskStatus;
};

const taskBadgeByStatus: Record<
	TaskStatus,
	{ color: string; label: string; variant?: "light" | "filled" | "outline" }
> = {
	[TASKS_STATUS.PENDING]: {
		color: "gray",
		label: "Pending",
		variant: "outline",
	},
	[TASKS_STATUS.RUNNING]: {
		color: "blue",
		label: "Running",
		variant: "light",
	},
	[TASKS_STATUS.FINISHED]: {
		color: "green",
		label: "Finished",
		variant: "light",
	},
};

export const TaskBadge = ({ value }: TaskBadgeProps) => {
	const { color, label, variant = "light" } = taskBadgeByStatus[value];

	return (
		<Badge color={color} radius="sm" size="sm" tt="uppercase" variant={variant}>
			{label}
		</Badge>
	);
};
