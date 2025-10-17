# Quick Setup Guide

## Prerequisites
- Docker and Docker Compose installed
- HAPI FHIR server running in another repository

## Setup Steps

### 1. Start the Ubiqua Backend Services
```bash
docker compose up -d
```

### 2. Run Database Migrations
```bash
docker compose exec backend pnpm run db:migrate
```

### 3. Seed the Database
```bash
docker compose exec backend pnpm run db:seed
```

### 4. Connect HAPI FHIR Server to Network
**Run this after your HAPI FHIR server is running in the other repository:**
```bash
docker network connect server_ubiqua-network hapi-fhir-jpaserver-start
```

## Verify Setup
- Backend API: http://localhost:3000
- FHIR Server: http://localhost:8080/fhir
- Database: localhost:5432

## Development Commands
```bash
# View logs
docker compose logs -f

# Stop services
docker compose down

# Restart services
docker compose restart
```

## Troubleshooting
- If containers can't communicate, ensure the network connection step was completed
- Check logs: `docker compose logs -f backend`
- Verify database: `docker compose exec postgres psql -U postgres -d ubiqua_db`