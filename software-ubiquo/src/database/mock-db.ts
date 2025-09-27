import { EosinophiliaCase, GeolocatedTest, RegionalBaseline } from './types';

// --- MOCK DATA --- //

const GOIANIA_LAT = -16.68;
const GOIANIA_LON = -49.25;
const GOIANIA_MUNICIPALITY_ID = '5208707';

const randomOffset = (radius = 0.05) => (Math.random() - 0.5) * 2 * radius;

const mockPositiveCases: EosinophiliaCase[] = Array.from({ length: 10 }, (_, i) => ({
  id: `case_${i}`,
  test_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // last 30 days
  eosinophils_value: 550 + Math.random() * 200,
  age: 15 + Math.random() * 20,
  sex: Math.random() > 0.5 ? 'M' : 'F',
  latitude: GOIANIA_LAT + randomOffset(0.01), // clustered within ~1km
  longitude: GOIANIA_LON + randomOffset(0.01),
  municipality_id: GOIANIA_MUNICIPALITY_ID,
}));

const mockScatteredCases: EosinophiliaCase[] = Array.from({ length: 50 }, (_, i) => ({
  id: `scattered_${i}`,
  test_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
  eosinophils_value: 510 + Math.random() * 100,
  age: 20 + Math.random() * 30,
  sex: Math.random() > 0.5 ? 'M' : 'F',
  latitude: GOIANIA_LAT + randomOffset(0.1), // scattered within ~10km
  longitude: GOIANIA_LON + randomOffset(0.1),
  municipality_id: GOIANIA_MUNICIPALITY_ID,
}));

const dbEosinophiliaCases: EosinophiliaCase[] = [...mockPositiveCases, ...mockScatteredCases];

const dbGeolocatedTests: GeolocatedTest[] = Array.from({ length: 1000 }, (_, i) => ({
  id: `test_${i}`,
  test_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
  latitude: GOIANIA_LAT + randomOffset(0.1),
  longitude: GOIANIA_LON + randomOffset(0.1),
  municipality_id: GOIANIA_MUNICIPALITY_ID,
}));

const dbRegionalBaselines: RegionalBaseline[] = [
  {
    region_id: GOIANIA_MUNICIPALITY_ID,
    month_year: new Date().toISOString().slice(0, 7), // "YYYY-MM"
    expected_rate_per_1000_tests: 5.0,
    rate_standard_deviation: 1.5,
  },
];

// --- MOCK ASYNC FUNCTIONS --- //

export const getEosinophiliaCasesInWindow = async (
  start: Date,
  end: Date
): Promise<EosinophiliaCase[]> => {
  console.log(
    `DB: Fetching eosinophilia cases between ${start.toISOString()} and ${end.toISOString()}`
  );
  return dbEosinophiliaCases.filter((c) => c.test_date >= start && c.test_date <= end);
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

  const count = dbGeolocatedTests.filter((e) => {
    const isInDate = e.test_date >= start && e.test_date <= end;
    const isLatOk = e.latitude >= lat - radiusLat && e.latitude <= lat + radiusLat;
    const isLonOk = e.longitude >= lon - radiusLon && e.longitude <= lon + radiusLon;
    return isInDate && isLatOk && isLonOk;
  }).length;

  return count;
};

export const getBaselineForRegion = async (
  municipality_id: string,
  month_year: string
): Promise<RegionalBaseline | null> => {
  console.log(`DB: Fetching baseline for region ${municipality_id} and period ${month_year}`);
  const baseline = dbRegionalBaselines.find(
    (b) => b.region_id === municipality_id && b.month_year === month_year
  );
  return baseline || null;
};
