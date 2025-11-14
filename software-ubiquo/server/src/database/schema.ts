import {
  pgTable,
  varchar,
  integer,
  boolean,
  doublePrecision,
  timestamp,
  serial,
} from 'drizzle-orm/pg-core';

// Estados (States) table
export const estados = pgTable('estados', {
  codigo_uf: integer('codigo_uf').primaryKey().notNull(),
  uf: varchar('uf', { length: 2 }).notNull(),
  nome: varchar('nome', { length: 100 }).notNull(),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  regiao: varchar('regiao', { length: 12 }).notNull(),
});

// City table
export const city = pgTable('city', {
  codigo_ibge: integer('codigo_ibge').primaryKey().notNull(),
  nome: varchar('nome', { length: 100 }).notNull(),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  capital: boolean('capital').notNull(),
  codigo_uf: integer('codigo_uf')
    .notNull()
    .references(() => estados.codigo_uf),
  siafi_id: varchar('siafi_id', { length: 4 }).notNull().unique(),
  ddd: integer('ddd').notNull(),
  fuso_horario: varchar('fuso_horario', { length: 32 }).notNull(),
});

// Geolocated Tests table
export const geolocatedTests = pgTable('geolocated_tests', {
  id: varchar('id', { length: 255 }).primaryKey(),
  test_date: timestamp('test_date', { withTimezone: true }).notNull(),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  municipality_id: varchar('municipality_id', { length: 10 }).notNull(),
});

// Eosinophilia Cases table
export const eosinophiliaCases = pgTable('eosinophilia_cases', {
  id: varchar('id', { length: 255 }).primaryKey(),
  test_date: timestamp('test_date', { withTimezone: true }).notNull(),
  eosinophils_value: doublePrecision('eosinophils_value').notNull(),
  age: integer('age').notNull(),
  sex: varchar('sex', { length: 1 }).notNull(), // 'M' or 'F'
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  municipality_id: varchar('municipality_id', { length: 10 }).notNull(),
});

// Regional Baselines table
export const regionalBaselines = pgTable('regional_baselines', {
  id: serial('id').primaryKey(),
  region_id: varchar('region_id', { length: 10 }).notNull(), // municipality_id
  month_year: varchar('month_year', { length: 7 }).notNull(), // "YYYY-MM"
  expected_rate_per_1000_tests: doublePrecision('expected_rate_per_1000_tests').notNull(),
  rate_standard_deviation: doublePrecision('rate_standard_deviation').notNull(),
});

// Alerts table
export const alerts = pgTable('alerts', {
  id: varchar('id', { length: 255 }).primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: varchar('description', { length: 1000 }).notNull(),
  severity: varchar('severity', { length: 20 }).notNull(), // 'Alta', 'Média', 'Baixa'
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
  municipality_id: varchar('municipality_id', { length: 10 }), // Optional: can be null for general alerts
  alert_type: varchar('alert_type', { length: 50 }).notNull(), // 'outbreak', 'individual', 'generic'
});

// Notifications table
export const notifications = pgTable('notifications', {
  id: varchar('id', { length: 255 }).primaryKey(), // This is the alertId used in the API
  title: varchar('title', { length: 255 }).notNull(),
  description: varchar('description', { length: 1000 }).notNull(),
  severity: varchar('severity', { length: 20 }).notNull(), // 'Alta', 'Média', 'Baixa'
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
  alert_type: varchar('alert_type', { length: 50 }).notNull(), // 'SEVERE_ANEMIA', 'PARASITOSIS_OUTBREAK'
  patient_cpf: varchar('patient_cpf', { length: 14 }), // Optional: for individual alerts
  municipality_id: varchar('municipality_id', { length: 10 }), // Optional: for collective alerts
  notification_token: varchar('notification_token', { length: 255 }).notNull(), // FCM token
  created_at: timestamp('created_at', { withTimezone: true }).notNull().$defaultFn(() => new Date()),
});

// Export types for use in the application
export type Estado = typeof estados.$inferSelect;
export type NewEstado = typeof estados.$inferInsert;

export type City = typeof city.$inferSelect;
export type NewCity = typeof city.$inferInsert;

export type GeolocatedTest = typeof geolocatedTests.$inferSelect;
export type NewGeolocatedTest = typeof geolocatedTests.$inferInsert;

export type EosinophiliaCase = typeof eosinophiliaCases.$inferSelect;
export type NewEosinophiliaCase = typeof eosinophiliaCases.$inferInsert;

export type RegionalBaseline = typeof regionalBaselines.$inferSelect;
export type NewRegionalBaseline = typeof regionalBaselines.$inferInsert;

export type Alert = typeof alerts.$inferSelect;
export type NewAlert = typeof alerts.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
