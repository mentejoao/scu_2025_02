import { db } from './connection';
import { eosinophiliaCases, geolocatedTests, regionalBaselines, city, estados } from './schema';
import * as dotenv from 'dotenv';

dotenv.config();

// Seed data for testing
const GOIANIA_LAT = -16.68;
const GOIANIA_LON = -49.25;
const GOIANIA_MUNICIPALITY_ID = '5208707';

const randomOffset = (radius = 0.05) => (Math.random() - 0.5) * 2 * radius;

async function seed() {
  try {
    console.log('🌱 Starting database seed...');

    // Seed Estados (States)
    console.log('Seeding state...');
    await db.insert(estados).values([
      {
        codigo_uf: 52,
        uf: 'GO',
        nome: 'Goiás',
        latitude: -15.827,
        longitude: -49.8362,
        regiao: 'Centro-Oeste',
      },
    ]).onConflictDoNothing();

    // Seed City (Goiânia)
    console.log('Seeding cities...');
    await db.insert(city).values([
      {
        codigo_ibge: 5208707,
        nome: 'Goiânia',
        latitude: GOIANIA_LAT,
        longitude: GOIANIA_LON,
        capital: true,
        codigo_uf: 52,
        siafi_id: '9373',
        ddd: 62,
        fuso_horario: 'America/Sao_Paulo',
      },
    ]).onConflictDoNothing();

    // Seed Eosinophilia Cases
    console.log('Seeding eosinophilia cases...');
    
    // Clustered cases
    const mockPositiveCases = Array.from({ length: 10 }, (_, i) => ({
      id: `case_${i}`,
      test_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // last 30 days
      eosinophils_value: 550 + Math.random() * 200,
      age: Math.floor(15 + Math.random() * 20),
      sex: Math.random() > 0.5 ? 'M' : 'F',
      latitude: GOIANIA_LAT + randomOffset(0.01), // clustered within ~1km
      longitude: GOIANIA_LON + randomOffset(0.01),
      municipality_id: GOIANIA_MUNICIPALITY_ID,
    }));

    // Scattered cases
    const mockScatteredCases = Array.from({ length: 50 }, (_, i) => ({
      id: `scattered_${i}`,
      test_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      eosinophils_value: 510 + Math.random() * 100,
      age: Math.floor(20 + Math.random() * 30),
      sex: Math.random() > 0.5 ? 'M' : 'F',
      latitude: GOIANIA_LAT + randomOffset(0.1), // scattered within ~10km
      longitude: GOIANIA_LON + randomOffset(0.1),
      municipality_id: GOIANIA_MUNICIPALITY_ID,
    }));

    await db.insert(eosinophiliaCases).values([...mockPositiveCases, ...mockScatteredCases]).onConflictDoNothing();

    // Seed Geolocated Tests
    console.log('Seeding geolocated tests...');
    const mockGeolocatedTests = Array.from({ length: 1000 }, (_, i) => ({
      id: `test_${i}`,
      test_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      latitude: GOIANIA_LAT + randomOffset(0.1),
      longitude: GOIANIA_LON + randomOffset(0.1),
      municipality_id: GOIANIA_MUNICIPALITY_ID,
    }));

    // Insert in batches of 100
    for (let i = 0; i < mockGeolocatedTests.length; i += 100) {
      const batch = mockGeolocatedTests.slice(i, i + 100);
      await db.insert(geolocatedTests).values(batch).onConflictDoNothing();
    }

    // Seed Regional Baselines
    console.log('Seeding regional baselines...');
    await db.insert(regionalBaselines).values([
      {
        region_id: GOIANIA_MUNICIPALITY_ID,
        month_year: new Date().toISOString().slice(0, 7), // "YYYY-MM"
        expected_rate_per_1000_tests: 5.0,
        rate_standard_deviation: 1.5,
      },
    ]);

    console.log('✅ Database seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

seed();

