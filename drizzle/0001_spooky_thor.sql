ALTER TABLE "line_friends" ALTER COLUMN "followed_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "line_friends" ALTER COLUMN "blocked_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "line_webhook_events" ALTER COLUMN "received_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "line_webhook_events" ALTER COLUMN "received_at" SET DEFAULT now();