const DEFAULT_WORKER_DOCKER_IMAGE = "sw-worker:latest";

const requiredEnvKeys = [
	"AMQP_QUEUE",
	"AMQP_URL",
	"PG_URL",
	"REDIS_SW_HOST",
	"REDIS_SW_PORT",
] as const;

const optionalEnvKeys = ["REDIS_SW_PASSWORD", "REDIS_SW_USERNAME"] as const;

const getDockerEnvArgs = (keys: readonly string[]) =>
	keys.flatMap((key) => ["--env", key]);

export const getWorkerContainerName = (workerId: string) =>
	`scalable-worker-${workerId}`;

const readStream = async (stream: ReadableStream<Uint8Array> | null) => {
	if (!stream) return "";

	return await new Response(stream).text();
};

export const runWorkerContainer = async (workerId: string) => {
	const missingEnv = requiredEnvKeys.filter((key) => !process.env[key]);
	const containerName = getWorkerContainerName(workerId);
	if (missingEnv.length > 0) {
		throw new Error(`missing docker worker env: ${missingEnv.join(", ")}`);
	}

	const image = process.env.WORKER_DOCKER_IMAGE ?? DEFAULT_WORKER_DOCKER_IMAGE;
	const proc = Bun.spawn({
		cmd: [
			"docker",
			"run",
			"-d",
			"--rm",
			"--name",
			containerName,
			"--env",
			`WORKER_ID=${workerId}`,
			...getDockerEnvArgs(requiredEnvKeys),
			...getDockerEnvArgs(
				optionalEnvKeys.filter((key) => process.env[key] !== undefined),
			),
			image,
		],
		stdin: "ignore",
		stdout: "pipe",
		stderr: "pipe",
	});

	const [exitCode, stdout, stderr] = await Promise.all([
		proc.exited,
		readStream(proc.stdout),
		readStream(proc.stderr),
	]);

	if (exitCode !== 0) {
		throw new Error(
			stderr.trim() || stdout.trim() || "failed to start worker container",
		);
	}

	return {
		containerId: stdout.trim(),
		containerName,
		image,
	};
};

export const stopWorkerContainer = async (workerId: string) => {
	const containerName = getWorkerContainerName(workerId);
	const proc = Bun.spawn({
		cmd: ["docker", "stop", containerName],
		stdin: "ignore",
		stdout: "pipe",
		stderr: "pipe",
	});

	const [exitCode, stdout, stderr] = await Promise.all([
		proc.exited,
		readStream(proc.stdout),
		readStream(proc.stderr),
	]);

	if (exitCode !== 0) {
		throw new Error(
			stderr.trim() || stdout.trim() || "failed to stop worker container",
		);
	}

	return {
		containerName,
	};
};
