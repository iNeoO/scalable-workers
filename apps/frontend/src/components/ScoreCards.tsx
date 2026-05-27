import { Alert, Text } from "@mantine/core";
import { useStats } from "../hooks/stats.hook";
import { ScoreCard } from "./ui/ScoreCard";

const formatNumber = (value: number) => new Intl.NumberFormat("en-GB").format(value);

const QueueIcon = () => {
	return (
		<svg
			aria-hidden="true"
			fill="none"
			height="18"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="1.8"
			viewBox="0 0 24 24"
			width="18"
		>
			<path d="M4 7h16" />
			<path d="M4 12h12" />
			<path d="M4 17h8" />
		</svg>
	);
};

const WarningIcon = () => {
	return (
		<svg
			aria-hidden="true"
			fill="none"
			height="18"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="1.8"
			viewBox="0 0 24 24"
			width="18"
		>
			<path d="M12 9v4" />
			<path d="M12 17h.01" />
			<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
		</svg>
	);
};

const WorkersIcon = () => {
	return (
		<svg
			aria-hidden="true"
			fill="none"
			height="18"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="1.8"
			viewBox="0 0 24 24"
			width="18"
		>
			<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
			<path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
			<path d="M22 21v-2a4 4 0 0 0-3-3.87" />
			<path d="M16 3.13a4 4 0 0 1 0 7.75" />
		</svg>
	);
};

const ClockIcon = () => {
	return (
		<svg
			aria-hidden="true"
			fill="none"
			height="18"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="1.8"
			viewBox="0 0 24 24"
			width="18"
		>
			<circle cx="12" cy="12" r="9" />
			<path d="M12 7v5l3 3" />
		</svg>
	);
};

export const ScoreCards = () => {
	const statsQuery = useStats();
	const stats = statsQuery.data;

	const cards = [
		{
			title: "Queue count",
			value: stats ? formatNumber(stats.queueCount) : "0",
			color: "blue",
			icon: <QueueIcon />,
		},
		{
			title: "Dead letter",
			value: stats ? formatNumber(stats.deadLetterQueueCount) : "0",
			color: "red",
			icon: <WarningIcon />,
		},
		{
			title: "Workers count",
			value: stats ? formatNumber(stats.workersCount) : "0",
			color: "grape",
			icon: <WorkersIcon />,
		},
		{
			title: "Tasks waiting",
			value: stats ? formatNumber(stats.tasksWaiting) : "0",
			color: "orange",
			icon: <QueueIcon />,
		},
		{
			title: "Tasks processed",
			value: stats ? formatNumber(stats.tasksProcessed) : "0",
			color: "teal",
			icon: <WorkersIcon />,
		},
		{
			title: "Avg task time",
			value: stats ? `${formatNumber(stats.averageTimeByTask)} ms` : "0 ms",
			color: "gray",
			icon: <ClockIcon />,
		},
	];

	return (
		<section className="mt-4">
			<div className="mb-4">
				<Text fw={700} size="lg">
					System stats
				</Text>
				<Text c="dimmed" size="sm">
					Live metrics fed by the `stats` endpoint and SSE updates
				</Text>
			</div>
			{statsQuery.isError ? (
				<Alert color="red" radius="lg" title="Stats unavailable" variant="light">
					{statsQuery.error instanceof Error
						? statsQuery.error.message
						: "Failed to load stats"}
				</Alert>
			) : (
				<div className="grid w-full gap-4 grid-cols-[repeat(auto-fit,minmax(210px,1fr))]">
					{cards.map((card) => (
						<ScoreCard
							key={card.title}
							color={card.color}
							icon={card.icon}
							loading={statsQuery.isPending}
							title={card.title}
							value={card.value}
						/>
					))}
				</div>
			)}
		</section>
	);
};
