import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as schema from './schema';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

// Configure SSL based on environment
const getSslConfig = () => {
  // Check if we're connecting to a cloud database (not localhost)
  const isCloudDb = process.env.DB_HOST && 
    process.env.DB_HOST !== 'localhost' && 
    process.env.DB_HOST !== 'postgres' &&
    !process.env.DB_HOST.startsWith('127.0.0.1');

  // For cloud databases, always enable SSL (required by most cloud providers)
  // Only disable if explicitly set to 'false' AND it's not a cloud database
  if (process.env.DB_SSL === 'false' && !isCloudDb) {
    return false;
  }

  // If it's not a cloud DB and DB_SSL is not set, disable SSL
  if (!isCloudDb && !process.env.DB_SSL) {
    return false;
  }

  // If DB_SSL is set to 'true' or 'require', or it's a cloud DB, configure SSL
  const sslConfig: any = {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
  };

  // Try multiple possible paths for ca.pem
  const possiblePaths = [
    process.env.DB_SSL_CA,
    path.join(__dirname, '../../ca.pem'),  // Server root
    '/app/ca.pem',  // Docker container path
    './ca.pem',     // Current directory
  ].filter(Boolean) as string[];

  let caPath: string | null = null;
  for (const testPath of possiblePaths) {
    if (testPath && fs.existsSync(testPath)) {
      caPath = testPath;
      break;
    }
  }
  
  if (caPath) {
    try {
      sslConfig.ca = fs.readFileSync(caPath).toString();
      console.log(`✅ SSL CA certificate loaded from: ${caPath}`);
    } catch (error) {
      console.warn(`⚠️  Warning: Could not read CA certificate from ${caPath}:`, error);
    }
  } else if (isCloudDb || process.env.DB_SSL === 'true') {
    console.warn(`⚠️  Warning: SSL enabled but CA certificate not found. Tried paths: ${possiblePaths.join(', ')}`);
  }

  return sslConfig;
};

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
  ssl: getSslConfig(),
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
