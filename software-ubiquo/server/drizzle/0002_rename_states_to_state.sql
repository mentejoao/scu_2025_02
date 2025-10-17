-- Rename table states to state
ALTER TABLE "states" RENAME TO "state";

-- Update the foreign key constraint name to reflect the new table name
ALTER TABLE "city" DROP CONSTRAINT "city_codigo_uf_states_codigo_uf_fk";
ALTER TABLE "city" ADD CONSTRAINT "city_codigo_uf_state_codigo_uf_fk" FOREIGN KEY ("codigo_uf") REFERENCES "public"."state"("codigo_uf") ON DELETE no action ON UPDATE no action;

