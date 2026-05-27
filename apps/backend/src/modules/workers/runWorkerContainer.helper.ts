import { resolve } from "node:path";
import { workerEnv as workerConfigEnv } from "./config/env.js";

const WORKER_DOCKERFILE_PATH = "apps/task-worker/Dockerfile";
// Docker build context must be the monorepo root so workspace files are available.
const REPOSITORY_ROOT = resolve(import.meta.dir, "../../../../../");

const getDockerEnvArgs = (env: Record<string, string>) =>
	Object.entries(env).flatMap(([key, value]) => ["--env", `${key}=${value}`]);

const createWorkerEnv = (workerId: string) => {
	const env: Record<string, string> = {
		WORKER_ID: workerId,
		AMQP_QUEUE: workerConfigEnv.amqpQueue,
		AMQP_URL: workerConfigEnv.amqpUrl,
		PG_URL: workerConfigEnv.pgUrl,
		REDIS_SW_HOST: workerConfigEnv.redisHost,
		REDIS_SW_PORT: workerConfigEnv.redisPort,
	};

	if (workerConfigEnv.redisPassword !== undefined) {
		env.REDIS_SW_PASSWORD = workerConfigEnv.redisPassword;
	}

	if (workerConfigEnv.redisUsername !== undefined) {
		env.REDIS_SW_USERNAME = workerConfigEnv.redisUsername;
	}

	return env;
};

export const getWorkerContainerName = (workerId: string) =>
	`scalable-worker-${workerId}`;

const readStream = async (stream: ReadableStream<Uint8Array> | null) => {
	if (!stream) return "";

	return await new Response(stream).text();
};

const runDockerCommand = async (cmd: string[]) => {
	const proc = Bun.spawn({
		cmd,
		cwd: REPOSITORY_ROOT,
		stdin: "ignore",
		stdout: "pipe",
		stderr: "pipe",
	});

	const [exitCode, stdout, stderr] = await Promise.all([
		proc.exited,
		readStream(proc.stdout),
		readStream(proc.stderr),
	]);

	return {
		exitCode,
		stdout: stdout.trim(),
		stderr: stderr.trim(),
	};
};

const ensureWorkerImage = async (image: string) => {
	const inspectResult = await runDockerCommand([
		"docker",
		"image",
		"inspect",
		image,
	]);
	if (inspectResult.exitCode === 0) return;

	const buildResult = await runDockerCommand([
		"docker",
		"build",
		"-t",
		image,
		"-f",
		WORKER_DOCKERFILE_PATH,
		".",
	]);

	if (buildResult.exitCode !== 0) {
		throw new Error(
			buildResult.stderr ||
				buildResult.stdout ||
				"failed to build worker image",
		);
	}
};

export const runWorkerContainer = async (workerId: string) => {
	const containerName = getWorkerContainerName(workerId);

	const dockerEnv = createWorkerEnv(workerId);
	await ensureWorkerImage(workerConfigEnv.dockerImage);
	const { exitCode, stdout, stderr } = await runDockerCommand([
		"docker",
		"run",
		"-d",
		"--rm",
		"--name",
		containerName,
		"--network",
		workerConfigEnv.dockerNetwork,
		...getDockerEnvArgs(dockerEnv),
		workerConfigEnv.dockerImage,
	]);

	if (exitCode !== 0) {
		throw new Error(
			stderr.trim() || stdout.trim() || "failed to start worker container",
		);
	}

	return {
		containerId: stdout.trim(),
		containerName,
		image: workerConfigEnv.dockerImage,
	};
};

export const stopWorkerContainer = async (workerId: string) => {
	const containerName = getWorkerContainerName(workerId);
	const { exitCode, stdout, stderr } = await runDockerCommand([
		"docker",
		"stop",
		containerName,
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
