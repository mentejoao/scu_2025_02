-- Rename table estados to states
ALTER TABLE "estados" RENAME TO "states";

-- Update the foreign key constraint name to reflect the new table name
ALTER TABLE "city" DROP CONSTRAINT "city_codigo_uf_estados_codigo_uf_fk";
ALTER TABLE "city" ADD CONSTRAINT "city_codigo_uf_states_codigo_uf_fk" FOREIGN KEY ("codigo_uf") REFERENCES "public"."states"("codigo_uf") ON DELETE no action ON UPDATE no action;

