# Scalable Workers

## Purpose

Build a dashboard to manage and monitor workers that process timed tasks.

## Applications

- `db`: stores runtime data
- `queue`: manages task distribution
- `backend`: exposes monitoring and worker management APIs
- `frontend`: displays the dashboard
- `scheduler`: automatically creates tasks
- `worker`: processes tasks

## Tech Stack

- `queue`: RabbitMQ
- `db`: PostgreSQL
- `stats`: Redis
- `backend`: Elysia
- `frontend`: React
- `scheduler`: node-cron
- `worker`: TypeScript

## Database

The project stores `tasks` and `workers` in PostgreSQL.

### Task

Represents a unit of work to process.

```typescript
{
  id: string;
  status: "pending" | "running" | "finished";
  durationMs: number;
  processedBy: string | null;
  createdAt: Date;
  startedAt: Date | null;
  finishedAt: Date | null;
}
```

### Worker

Represents a worker that can process one task at a time.

```typescript
{
  id: string;
  status: "idle" | "busy";
  tasksDone: number;
  currentTaskId: string | null;
  createdAt: Date;
}
```

### Relationship

- A worker can process one task at a time
- A task is processed by zero or one worker
- A finished task keeps the `processedBy` value for history

## Stats

The project stores live stats in Redis.

```typescript
{
  tasksProcessed: number;
  tasksWaiting: number;
  workersCount: number;
  averageTimeByTask: number;
}
```

- `tasksProcessed`: incremented when a task reaches the `finished` status
- `tasksWaiting`: incremented when a task is created, decremented when a worker starts processing it
- `workersCount`: incremented when a worker is created, decremented when a worker is deleted
- `averageTimeByTask`: updated when a task is finished

## Backend

### Endpoints

#### `GET /tasks`

Returns the global list of tasks.

**Content-Type**

```text
application/json
```

**Response**

```typescript
Array<{
  id: string;
  status: "pending" | "running" | "finished";
  processedBy: string | null;
  durationMs: number;
  createdAt: Date;
  startedAt: Date | null;
  finishedAt: Date | null;
}>
```

#### `GET /stats`

Returns the current global statistics snapshot.

**Content-Type**

```text
application/json
```

**Response**

```typescript
{
  tasksProcessed: number;
  tasksWaiting: number;
  workersCount: number;
  averageTimeByTask: number;
}
```

#### `GET /workers`

Returns the global list of workers.

**Content-Type**

```text
application/json
```

**Response**

```typescript
Array<{
  id: string;
  status: "idle" | "busy";
  createdAt: Date;
  tasksDone: number;
  currentTaskId: string | null;
}>
```

#### `GET /sse`

Global SSE endpoint that streams task, worker, and stats updates in real time.

**Content-Type**

```text
text/event-stream
```

**SSE events**

- `task.created`
- `task.started`
- `task.finished`
- `worker.created`
- `worker.updated`
- `worker.removed`
- `stats.updated`

**Payload examples**

```typescript
type TaskEvent =
  | {
      type: "task.created" | "task.started" | "task.finished";
      data: {
        id: string;
        status: "pending" | "running" | "finished";
        processedBy: string | null;
        durationMs: number;
        createdAt: Date;
        startedAt: Date | null;
        finishedAt: Date | null;
      };
    }
  | {
      type: "worker.created" | "worker.updated" | "worker.removed";
      data: {
        id: string;
        status: "idle" | "busy";
        createdAt: Date;
        tasksDone: number;
        currentTaskId: string | null;
      };
    }
  | {
      type: "stats.updated";
      data: {
        tasksProcessed: number;
        tasksWaiting: number;
        workersCount: number;
        averageTimeByTask: number;
      };
    };
```

#### `POST /tasks`

Creates a new task.

**Body**

```typescript
{
  durationMs: number;
}
```

**Response**

```typescript
{
  id: string;
  status: "pending" | "running" | "finished";
  processedBy: string | null;
  durationMs: number;
  createdAt: Date;
  startedAt: Date | null;
  finishedAt: Date | null;
}
```

#### `POST /workers`

Creates a new worker.

**Response**

```typescript
{
  id: string;
  status: "idle" | "busy";
  createdAt: Date;
  tasksDone: number;
  currentTaskId: string | null;
}
```

#### `DELETE /workers/:id`

Deletes a worker by `id`.

**Response**

```typescript
{
  id: string;
}
```

#### `PATCH /task-settings`

Updates task duration settings.

**Body**

```typescript
{
  durationMs: number;
}
```

**Response**

```typescript
{
  durationMs: number;
}
```

## Frontend

- Display stats in cards at the top of the page
- Display a list of workers, the task each worker is processing, and controls to add or remove a worker
- Display a table of completed tasks sorted by completion time

## Worker

Process received tasks based on the configured task duration (`durationMs`).

Update:

- number of tasks completed by each worker
- average processing time
- task status

## Scheduler

- Create `x` tasks every `intervalMs`
