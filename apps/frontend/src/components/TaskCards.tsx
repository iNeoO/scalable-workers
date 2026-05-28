import { Button, Group, NumberInput, Stack, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useState } from "react";
import { useCreateTask, useTasks } from "../hooks/tasks.hook";
import { TaskCard } from "./ui/TaskCard";

export const TaskCards = () => {
	const tasksQuery = useTasks();
	const createTaskMutation = useCreateTask();
	const tasks = tasksQuery.data ?? [];
	const [durationMs, setDurationMs] = useState<number | string>(5000);
	const normalizedDuration =
		typeof durationMs === "number" ? durationMs : Number(durationMs);
	const isDurationValid =
		Number.isFinite(normalizedDuration) && normalizedDuration > 0;

	const handleCreateTask = async () => {
		if (!isDurationValid) return;

		try {
			await createTaskMutation.mutateAsync({ durationMs: normalizedDuration });
			notifications.show({
				color: "green",
				message: `Task queued with ${normalizedDuration} ms duration`,
				title: "Task created",
			});
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Failed to create task";
			notifications.show({
				color: "red",
				message,
				title: "Create failed",
			});
		}
	};

	return (
		<section className="mt-8">
			<Group align="end" className="mb-4" justify="space-between">
				<Title order={2}>Tasks ({tasks.length})</Title>
				<Group align="end" justify="flex-end">
					<NumberInput
						decimalScale={0}
						label="Duration ms"
						min={1}
						onChange={setDurationMs}
						step={100}
						value={durationMs}
					/>
					<Button
						disabled={!isDurationValid}
						loading={createTaskMutation.isPending}
						onClick={handleCreateTask}
					>
						Add task
					</Button>
				</Group>
			</Group>
			<Stack gap="sm">
				{tasks.map((task) => (
					<TaskCard key={task.id} task={task} />
				))}
			</Stack>
		</section>
	);
};
