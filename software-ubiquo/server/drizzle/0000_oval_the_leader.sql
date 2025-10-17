CREATE TABLE "city" (
	"codigo_ibge" integer PRIMARY KEY NOT NULL,
	"nome" varchar(100) NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"capital" boolean NOT NULL,
	"codigo_uf" integer NOT NULL,
	"siafi_id" varchar(4) NOT NULL,
	"ddd" integer NOT NULL,
	"fuso_horario" varchar(32) NOT NULL,
	CONSTRAINT "city_siafi_id_unique" UNIQUE("siafi_id")
);
--> statement-breakpoint
CREATE TABLE "eosinophilia_cases" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"test_date" timestamp with time zone NOT NULL,
	"eosinophils_value" double precision NOT NULL,
	"age" integer NOT NULL,
	"sex" varchar(1) NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"municipality_id" varchar(10) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "estados" (
	"codigo_uf" integer PRIMARY KEY NOT NULL,
	"uf" varchar(2) NOT NULL,
	"nome" varchar(100) NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"regiao" varchar(12) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "geolocated_tests" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"test_date" timestamp with time zone NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"municipality_id" varchar(10) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "regional_baselines" (
	"id" serial PRIMARY KEY NOT NULL,
	"region_id" varchar(10) NOT NULL,
	"month_year" varchar(7) NOT NULL,
	"expected_rate_per_1000_tests" double precision NOT NULL,
	"rate_standard_deviation" double precision NOT NULL
);
--> statement-breakpoint
ALTER TABLE "city" ADD CONSTRAINT "city_codigo_uf_estados_codigo_uf_fk" FOREIGN KEY ("codigo_uf") REFERENCES "public"."estados"("codigo_uf") ON DELETE no action ON UPDATE no action;