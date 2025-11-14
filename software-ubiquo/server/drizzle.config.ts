import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

// Configure SSL for Drizzle migrations
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
    path.join(__dirname, './ca.pem'),  // Server root
    path.join(__dirname, '../ca.pem'),  // One level up
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

export default {
  schema: './src/database/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'changeme',
    database: process.env.DB_NAME || 'ubiqua_db',
    ssl: getSslConfig(),
  },
} satisfies Config;
