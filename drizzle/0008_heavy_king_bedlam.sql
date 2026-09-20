CREATE TABLE "patrol_report_sends" (
	"report_id" uuid PRIMARY KEY NOT NULL
);
--> statement-breakpoint
ALTER TABLE "patrol_reports" ADD COLUMN "approved_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "patrol_reports" ADD COLUMN "sent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "patrol_reports" ADD COLUMN "failed_reason" text;--> statement-breakpoint
ALTER TABLE "patrol_report_sends" ADD CONSTRAINT "patrol_report_sends_report_id_patrol_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."patrol_reports"("id") ON DELETE no action ON UPDATE no action;