# Docker Setup for Ubiqua Backend

This document provides instructions for running the Ubiqua backend using Docker.

## Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ (for local development)

## Quick Start

### 1. Environment Setup

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` file with your configuration (defaults should work for local development).

### 2. Production Setup

Start the application with PostgreSQL database:

```bash
# Start all services
pnpm run docker:up

# Or manually
docker compose up -d
```

### 3. Development Setup

For development with hot reload:

```bash
# Start development environment
docker compose -f docker-compose.dev.yml up -d
```

## Available Scripts

### Docker Commands

- `pnpm run docker:build` - Build the Docker image
- `pnpm run docker:run` - Run the container manually
- `pnpm run docker:up` - Start all services (production)
- `pnpm run docker:down` - Stop all services
- `pnpm run docker:logs` - View logs
- `pnpm run docker:restart` - Restart services

### Database Commands

- `pnpm run docker:db:migrate` - Run database migrations
- `pnpm run docker:db:seed` - Seed the database

## Services

### Production (`docker-compose.yml`)

- **postgres**: PostgreSQL 15 database
  - Port: 5432
  - Database: ubiqua_db
  - User: postgres
  - Password: changeme

- **backend**: Node.js application
  - Port: 3000
  - Health check enabled
- **hapi-fhir-server**: HAPI FHIR Server
  - Port: 8080 (FHIR API)

### Development (`docker-compose.dev.yml`)

- **postgres**: Same as production
- **backend-dev**: Development server with hot reload
  - Port: 3000 (API)
  - Port: 9229 (Debug)
- **hapi-fhir-server**: HAPI FHIR Server
  - Port: 8080 (FHIR API)

## Database Management

### Initial Setup

1. Start the services:
   ```bash
   pnpm run docker:up
   ```

2. Run migrations:
   ```bash
   pnpm run docker:db:migrate
   ```

3. Seed the database:
   ```bash
   pnpm run docker:db:seed
   ```

### Accessing the Database

Connect to PostgreSQL from your local machine:

```bash
# Using psql
psql -h localhost -p 5432 -U postgres -d ubiqua_db

# Using Docker
docker compose exec postgres psql -U postgres -d ubiqua_db
```

## API Endpoints

Once running, the APIs will be available at:

### Ubiqua Backend API:
- `http://localhost:3000` - Main API
- `http://localhost:3000/alert/:id` - Get alert by ID
- `http://localhost:3000/test-anemia-alert` - Test anemia alert
- `http://localhost:3000/fhir-webhook/Bundle/:id` - FHIR webhook endpoint

### HAPI FHIR Server:
- `http://localhost:8080/fhir` - FHIR API base URL
- `http://localhost:8080/fhir/metadata` - FHIR server metadata
- `http://localhost:8080/fhir/Patient` - Patient resources

## Troubleshooting

### Common Issues

1. **Port conflicts**: Make sure ports 3000 and 5432 are not in use
2. **Database connection**: Wait for PostgreSQL to be healthy before starting the backend
3. **Permission issues**: Ensure Docker has proper permissions

### Viewing Logs

```bash
# All services
pnpm run docker:logs

# Specific service
docker compose logs -f backend
docker compose logs -f postgres
```

### Resetting Everything

```bash
# Stop and remove containers, networks, and volumes
docker compose down -v

# Remove images
docker compose down --rmi all

# Start fresh
pnpm run docker:up
```

## File Structure

```
server/
├── Dockerfile              # Production image
├── Dockerfile.dev          # Development image
├── docker-compose.yml      # Production services
├── docker-compose.dev.yml  # Development services
├── .dockerignore           # Docker ignore file
├── .env.example            # Environment template
└── .env                    # Your environment config
```

## Security Notes

- Change default database passwords in production
- Use environment variables for sensitive data
- Consider using Docker secrets for production deployments
- The `serviceAccountKey.json` file is mounted as read-only
