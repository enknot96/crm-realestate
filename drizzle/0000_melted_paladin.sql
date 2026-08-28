CREATE TABLE "line_friends" (
	"line_user_id" text PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"followed_at" timestamp NOT NULL,
	"blocked_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "line_webhook_events" (
	"event_id" text PRIMARY KEY NOT NULL,
	"received_at" timestamp DEFAULT now() NOT NULL
);
