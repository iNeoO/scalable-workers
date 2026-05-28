import { Card, Group, Text, Tooltip } from "@mantine/core";
import { TASKS_STATUS } from "@sw/common/constants";
import type { getTasks } from "../../libs/api/tasks.api";
import { TaskBadge } from "./TaskBadge";

type Task = Awaited<ReturnType<typeof getTasks>>[number];

type TaskCardProps = {
	task: Task;
};

const shortId = (value: string) => value.slice(0, 6);

const formatTime = (value: Date | string | null) => {
	if (!value) return "---";

	return new Intl.DateTimeFormat("en-GB", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	}).format(new Date(value));
};

const formatDuration = (task: Task) => {
	return `${task.durationMs}ms`;
};

const workerLabel = (task: Task) => {
	if (!task.processedByWorker) return "Waiting...";
	return `By worker ${shortId(task.processedByWorker.id)}`;
};

export const TaskCard = ({ task }: TaskCardProps) => {
	return (
		<Card padding="md" radius="md" withBorder>
			<Group align="center" gap="md" justify="space-between" wrap="nowrap">
				<Group align="center" className="min-w-0 flex-1" gap="md" wrap="nowrap">
					<Tooltip label={task.id}>
						<Text className="shrink-0" fw={700} size="sm">
							{shortId(task.id)}
						</Text>
					</Tooltip>
					<TaskBadge value={task.status} />
					<Text c="dimmed" className="shrink-0" size="sm">
						<span className="mr-1 uppercase">Duration:</span>
						<span className="font-semibold text-slate-900">
							{formatDuration(task)}
						</span>
					</Text>
					<Text c="dimmed" className="shrink-0" size="sm">
						<span className="mr-1 uppercase">Created:</span>
						<span className="text-slate-900">{formatTime(task.createdAt)}</span>
					</Text>
					<Text c="dimmed" className="shrink-0" size="sm">
						<span className="mr-1 uppercase">Started:</span>
						<span className="text-slate-900">{formatTime(task.startedAt)}</span>
					</Text>
					{task.status === TASKS_STATUS.FINISHED ? (
						<Text c="dimmed" className="shrink-0" size="sm">
							<span className="mr-1 uppercase">Finished:</span>
							<span className="text-slate-900">
								{formatTime(task.finishedAt)}
							</span>
						</Text>
					) : null}
				</Group>
				<Tooltip
					label={
						task.processedByWorker
							? `Worker ${task.processedByWorker.id}`
							: "No worker assigned"
					}
				>
					<Text c="dimmed" className="shrink-0 text-right" size="sm">
						{workerLabel(task)}
					</Text>
				</Tooltip>
			</Group>
		</Card>
	);
};
