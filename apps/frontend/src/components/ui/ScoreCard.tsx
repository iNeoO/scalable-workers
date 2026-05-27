import { Card, Group, Skeleton, Text, ThemeIcon } from "@mantine/core";
import type { ReactNode } from "react";

type ScoreCardProps = {
	title: string;
	value: string;
	color: string;
	icon: ReactNode;
	loading?: boolean;
};

export const ScoreCard = ({
	color,
	title,
	value,
	icon,
	loading = false,
}: ScoreCardProps) => {
	return (
		<Card
			className="relative w-full overflow-hidden"
			padding="lg"
			radius="lg"
			withBorder
		>
			<div
				aria-hidden="true"
				className="absolute inset-x-0 top-0 h-1 opacity-80"
				style={{ backgroundColor: `var(--mantine-color-${color}-6)` }}
			/>
			<Group align="flex-start" justify="space-between" wrap="nowrap">
				<div className="min-w-0">
					<Text c="dimmed" fw={700} size="xs" tt="uppercase">
						{title}
					</Text>
					{loading ? (
						<Skeleton height={34} mt="sm" radius="sm" width="70%" />
					) : (
						<Text fw={800} mt={6} size="2rem">
							{value}
						</Text>
					)}
				</div>
				<ThemeIcon color={color} radius="md" size="lg" variant="light">
					{icon}
				</ThemeIcon>
			</Group>
		</Card>
	);
};
