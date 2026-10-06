CREATE TABLE "appointments" (
	"id" serial PRIMARY KEY,
	"customer_name" text NOT NULL,
	"service_id" integer NOT NULL,
	"service_name" text NOT NULL,
	"appointment_date" text NOT NULL,
	"appointment_time" text NOT NULL,
	"status" text DEFAULT 'confirmed' NOT NULL,
	"email_status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "appointments_slot_unique" ON "appointments" ("appointment_date","appointment_time");