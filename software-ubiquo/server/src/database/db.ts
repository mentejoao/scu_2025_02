import { db } from './connection';
import { eosinophiliaCases, geolocatedTests, regionalBaselines, city, alerts } from './schema';
import { between, and, gte, lte, eq, sql } from 'drizzle-orm';

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
    .from(eosinophiliaCases)
    .where(
      and(
        gte(eosinophiliaCases.test_date, start),
        lte(eosinophiliaCases.test_date, end),
        gte(eosinophiliaCases.latitude, lat - radiusLat),
        lte(eosinophiliaCases.latitude, lat + radiusLat),
        gte(eosinophiliaCases.longitude, lon - radiusLon),
        lte(eosinophiliaCases.longitude, lon + radiusLon)
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

export const getMunicipalityNameById = async (municipality_id: string) => {
  console.log(`DB: Fetching municipality name for ID ${municipality_id}`);

  const municipality = await db
    .select()
    .from(city)
    .where(eq(city.codigo_ibge, parseInt(municipality_id, 10)))
    .limit(1);

  return municipality.length > 0 ? municipality[0].nome : null;
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

/**
 * Finds the closest municipality to given coordinates
 * @param latitude Latitude coordinate
 * @param longitude Longitude coordinate
 * @returns Municipality ID (codigo_ibge) or null if not found
 */
export const findMunicipalityByCoordinates = async (
  latitude: number,
  longitude: number
): Promise<string | null> => {
  try {
    console.log(`DB: Finding municipality for coordinates (${latitude}, ${longitude})`);

    // Use Haversine formula to find the closest city
    // This is a simplified approach - for production, consider using PostGIS with spatial indexes
    // Using LEAST/GREATEST to clamp the value to [-1, 1] to handle floating-point precision issues
    const distanceFormula = sql<number>`
      (6371 * acos(
        LEAST(1, GREATEST(-1,
          cos(radians(${latitude})) 
          * cos(radians(${city.latitude})) 
          * cos(radians(${city.longitude}) - radians(${longitude})) 
          + sin(radians(${latitude})) 
          * sin(radians(${city.latitude}))
        ))
      ))
    `;

    const result = await db
      .select({
        codigo_ibge: city.codigo_ibge,
        nome: city.nome,
        distance: distanceFormula,
      })
      .from(city)
      .orderBy(distanceFormula)
      .limit(1);

    if (result.length > 0) {
      const closestCity = result[0];
      console.log(
        `DB: Found closest municipality: ${closestCity.nome} (${closestCity.codigo_ibge}) at distance ${closestCity.distance.toFixed(2)}km`
      );

      // Convert to string and pad with zeros if needed (IBGE codes are typically 7 digits)
      return closestCity.codigo_ibge.toString().padStart(7, '0');
    }

    console.log('DB: No municipality found for coordinates');
    return null;
  } catch (error) {
    console.error('DB: Error finding municipality by coordinates:', error);
    return null;
  }
};

// --- ALERT FUNCTIONS --- //

/**
 * Get alert details by ID
 * @param alertId The alert ID to fetch
 * @returns Alert details or null if not found
 */
export const getAlertDetails = async (alertId: string) => {
  try {
    console.log(`DB: Fetching alert details for ID: ${alertId}`);

    const result = await db
      .select()
      .from(alerts)
      .where(eq(alerts.id, alertId))
      .limit(1);

    if (result.length > 0) {
      const alert = result[0];
      console.log(`DB: Found alert: ${alert.title}`);
      return alert;
    }

    console.log(`DB: No alert found with ID: ${alertId}`);
    return null;
  } catch (error) {
    console.error('DB: Error fetching alert details:', error);
    return null;
  }
};

/**
 * Get all alerts, optionally filtered by municipality
 * @param municipalityId Optional municipality ID to filter by
 * @returns Array of alerts
 */
export const getAllAlerts = async (municipalityId?: string) => {
  try {
    console.log(`DB: Fetching all alerts${municipalityId ? ` for municipality: ${municipalityId}` : ''}`);

    const result = municipalityId
      ? await db
        .select()
        .from(alerts)
        .where(eq(alerts.municipality_id, municipalityId))
        .orderBy(sql`${alerts.timestamp} DESC`)
      : await db
        .select()
        .from(alerts)
        .orderBy(sql`${alerts.timestamp} DESC`);

    console.log(`DB: Found ${result.length} alerts`);
    return result;
  } catch (error) {
    console.error('DB: Error fetching alerts:', error);
    return [];
  }
};

/**
 * Insert a new alert
 * @param alertData Alert data to insert
 * @returns Inserted alert or null if failed
 */
export const insertAlert = async (alertData: typeof alerts.$inferInsert) => {
  try {
    console.log(`DB: Inserting new alert: ${alertData.title}`);

    const result = await db.insert(alerts).values(alertData).returning();

    if (result.length > 0) {
      console.log(`DB: Successfully inserted alert with ID: ${result[0].id}`);
      return result[0];
    }

    return null;
  } catch (error) {
    console.error('DB: Error inserting alert:', error);
    return null;
  }
};

/**
 * Update an existing alert
 * @param alertId Alert ID to update
 * @param alertData Updated alert data
 * @returns Updated alert or null if not found
 */
export const updateAlert = async (alertId: string, alertData: Partial<typeof alerts.$inferInsert>) => {
  try {
    console.log(`DB: Updating alert: ${alertId}`);

    const result = await db
      .update(alerts)
      .set(alertData)
      .where(eq(alerts.id, alertId))
      .returning();

    if (result.length > 0) {
      console.log(`DB: Successfully updated alert: ${alertId}`);
      return result[0];
    }

    console.log(`DB: No alert found to update with ID: ${alertId}`);
    return null;
  } catch (error) {
    console.error('DB: Error updating alert:', error);
    return null;
  }
};

/**
 * Delete an alert
 * @param alertId Alert ID to delete
 * @returns True if deleted, false otherwise
 */
export const deleteAlert = async (alertId: string): Promise<boolean> => {
  try {
    console.log(`DB: Deleting alert: ${alertId}`);

    const result = await db
      .delete(alerts)
      .where(eq(alerts.id, alertId))
      .returning();

    if (result.length > 0) {
      console.log(`DB: Successfully deleted alert: ${alertId}`);
      return true;
    }

    console.log(`DB: No alert found to delete with ID: ${alertId}`);
    return false;
  } catch (error) {
    console.error('DB: Error deleting alert:', error);
    return false;
  }
};

/**
 * Bulk insert alerts
 * @param alertsData Array of alert data to insert
 * @returns Array of inserted alerts
 */
export const bulkInsertAlerts = async (alertsData: (typeof alerts.$inferInsert)[]) => {
  try {
    if (alertsData.length === 0) return [];

    console.log(`DB: Bulk inserting ${alertsData.length} alerts`);

    const result = await db.insert(alerts).values(alertsData).returning();

    console.log(`DB: Successfully bulk inserted ${result.length} alerts`);
    return result;
  } catch (error) {
    console.error('DB: Error bulk inserting alerts:', error);
    return [];
  }
};
