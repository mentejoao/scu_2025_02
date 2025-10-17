-- Create alerts table
CREATE TABLE IF NOT EXISTS "alerts" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" varchar(1000) NOT NULL,
	"severity" varchar(20) NOT NULL,
	"timestamp" timestamp with time zone NOT NULL,
	"municipality_id" varchar(10),
	"alert_type" varchar(50) NOT NULL
);