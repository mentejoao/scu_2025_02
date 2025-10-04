import { db } from './connection';
import { eosinophiliaCases, geolocatedTests, regionalBaselines } from './schema';
import { between, and, gte, lte, eq } from 'drizzle-orm';

// Query functions to replace mock-db.ts

export const getEosinophiliaCasesInWindow = async (start: Date, end: Date) => {
  console.log(
    `DB: Fetching eosinophilia cases between ${start.toISOString()} and ${end.toISOString()}`
  );

  const cases = await db
    .select()
    .from(eosinophiliaCases)
    .where(and(gte(eosinophiliaCases.test_date, start), lte(eosinophiliaCases.test_date, end)));

  return cases;
};

export const getTotalTestsInArea = async (
  lat: number,
  lon: number,
  radiusKm: number,
  start: Date,
  end: Date
): Promise<number> => {
  const radiusLat = radiusKm / 111; // 1 degree of latitude is approx 111km. This is a simplification.
  const radiusLon = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));

  console.log(`DB: Counting total tests in ${radiusKm}km radius of (${lat}, ${lon})`);

  // Note: For production, consider using PostGIS for better geospatial queries
  const tests = await db
    .select()
    .from(geolocatedTests)
    .where(
      and(
        gte(geolocatedTests.test_date, start),
        lte(geolocatedTests.test_date, end),
        gte(geolocatedTests.latitude, lat - radiusLat),
        lte(geolocatedTests.latitude, lat + radiusLat),
        gte(geolocatedTests.longitude, lon - radiusLon),
        lte(geolocatedTests.longitude, lon + radiusLon)
      )
    );

  return tests.length;
};

export const getBaselineForRegion = async (municipality_id: string, month_year: string) => {
  console.log(`DB: Fetching baseline for region ${municipality_id} and period ${month_year}`);

  const baseline = await db
    .select()
    .from(regionalBaselines)
    .where(
      and(
        eq(regionalBaselines.region_id, municipality_id),
        eq(regionalBaselines.month_year, month_year)
      )
    )
    .limit(1);

  return baseline.length > 0 ? baseline[0] : null;
};

// Additional utility functions

export const insertEosinophiliaCase = async (caseData: typeof eosinophiliaCases.$inferInsert) => {
  return await db.insert(eosinophiliaCases).values(caseData).returning();
};

export const insertGeolocatedTest = async (testData: typeof geolocatedTests.$inferInsert) => {
  return await db.insert(geolocatedTests).values(testData).returning();
};

export const insertRegionalBaseline = async (
  baselineData: typeof regionalBaselines.$inferInsert
) => {
  return await db.insert(regionalBaselines).values(baselineData).returning();
};

export const bulkInsertEosinophiliaCases = async (
  cases: (typeof eosinophiliaCases.$inferInsert)[]
) => {
  if (cases.length === 0) return [];
  return await db.insert(eosinophiliaCases).values(cases).returning();
};

export const bulkInsertGeolocatedTests = async (tests: (typeof geolocatedTests.$inferInsert)[]) => {
  if (tests.length === 0) return [];
  return await db.insert(geolocatedTests).values(tests).returning();
};
