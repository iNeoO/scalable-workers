CREATE TYPE "public"."tasksStatus" AS ENUM('pending', 'running', 'finished');--> statement-breakpoint
CREATE TYPE "public"."workerStatus" AS ENUM('idle', 'busy');--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"duration" integer NOT NULL,
	"status" "tasksStatus" NOT NULL,
	"processedBy" uuid,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status" "workerStatus" NOT NULL,
	"tasksDone" integer NOT NULL,
	"currentTaskId" uuid,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_processed_by_fk" FOREIGN KEY ("processedBy") REFERENCES "public"."workers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workers" ADD CONSTRAINT "workers_current_task_fk" FOREIGN KEY ("currentTaskId") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;