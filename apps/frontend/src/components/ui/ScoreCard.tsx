import { Card, Text } from "@mantine/core";

type ScoreCardProps = {
	title: string;
	value: string | number;
	color: string;
};

export const ScoreCard = ({ color, title, value }: ScoreCardProps) => {
	return (
		<Card className="w-full" padding="lg" withBorder>
			<Text c="dimmed" tt="uppercase" fw="bold" size="xs">
				{title}
			</Text>
			<Text c={color} fw="bold" size="xl">
				{value}
			</Text>
		</Card>
	);
};
