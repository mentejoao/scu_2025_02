import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as schema from './schema';

dotenv.config();

// Create PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'changeme',
  database: process.env.DB_NAME || 'ubiqua_db',
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: false, // Disable SSL for local development
});

// Create Drizzle instance
export const db = drizzle(pool, { schema });

// Test connection function
export const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};

// Graceful shutdown
export const closeConnection = async () => {
  await pool.end();
  console.log('Database connection pool closed');
};

