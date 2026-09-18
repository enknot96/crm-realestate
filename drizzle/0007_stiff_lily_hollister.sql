CREATE TABLE "patrol_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"photo_keys" text[] NOT NULL,
	"checklist_results" jsonb NOT NULL,
	"status" text NOT NULL,
	"body" text,
	"generated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "patrol_reports" ADD CONSTRAINT "patrol_reports_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;