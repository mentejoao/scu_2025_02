# FHIR Processing Logic Summary

## Overview

This system processes FHIR (Fast Healthcare Interoperability Resources) bundles containing hemogram data to detect and store eosinophilia cases in a database. The main goal is to parse medical laboratory results and identify patients with elevated eosinophil counts.

## Architecture

### Core Components

1. **FhirService** (`src/services/fhir-service.ts`)
   - Fetches FHIR bundles from a FHIR server
   - Processes webhook notifications
   - Orchestrates the parsing and database storage workflow

2. **FhirParser** (`src/services/fhir-parser.ts`)
   - Main parsing engine using FHIRPath queries
   - Extracts eosinophilia cases from FHIR bundles
   - Handles multiple observations per patient

3. **UnitConverter** (`src/services/unit-converter.ts`)
   - Normalizes eosinophil values from different units
   - Detects eosinophilia and determines severity levels
   - Supports unit conversion between %, cells/uL, and 10\*9/L

4. **Error Handling** (`src/types/parsing-errors.ts`)
   - Structured error collection and logging
   - Severity levels (error/warning)
   - Detailed error reporting for debugging

## Data Flow

```
FHIR Server → Bundle Fetch → FHIRPath Parsing → Unit Normalization → Database Storage
```

### Step-by-Step Process

1. **Bundle Reception**
   - Receives FHIR bundle ID via webhook or direct call
   - Fetches complete bundle from FHIR server endpoint
   - Validates bundle structure

2. **Resource Extraction**
   - Uses FHIRPath queries to extract Patient and Observation resources
   - Filters for eosinophil observations (LOINC code: 770-0)
   - Groups observations by patient

3. **Data Parsing**
   - Extracts patient demographics (age, sex)
   - Parses eosinophil values and units
   - Extracts test dates and location data
   - Handles missing or invalid data gracefully

4. **Unit Normalization**
   - Converts eosinophil values to standard percentage (%)
   - Detects eosinophilia (>5% or equivalent in other units)
   - Classifies severity (mild: 5-10%, moderate: 10-20%, severe: >20%)

5. **Database Storage**
   - Creates structured eosinophilia case records
   - Uses bulk insert for efficiency
   - Generates unique case IDs

## Key Features

### FHIRPath Queries Used

```javascript
// Extract all patients
Bundle.entry.resource.where(resourceType='Patient')

// Find eosinophil observations for specific patient
Bundle.entry.resource.where(resourceType='Observation' and subject.reference='Patient/{id}' and code.coding.code='770-0')

// Extract observation values
Observation.valueQuantity.value
Observation.valueQuantity.unit

// Extract geolocation data
extension.where(url='http://hl7.org/fhir/StructureDefinition/geolocation').extension.where(url='latitude').valueDecimal
```

### Supported Units and Conversions

| Unit     | Conversion Factor to % | Example             |
| -------- | ---------------------- | ------------------- |
| %        | 1.0                    | 7.5% → 7.5%         |
| cells/uL | 0.014                  | 500 cells/uL → 7.0% |
| /uL      | 0.014                  | 500 /uL → 7.0%      |
| 10\*9/L  | 14.0                   | 0.6 10\*9/L → 8.4%  |
| 10^9/L   | 14.0                   | 0.6 10^9/L → 8.4%   |

### Eosinophilia Detection

- **Normal Range**: 0-5%
- **Eosinophilia Threshold**: >5%
- **Severity Levels**:
  - Mild: 5-10%
  - Moderate: 10-20%
  - Severe: >20%

### Address Prioritization

When multiple addresses exist, the system prioritizes by `use` field:

1. `home` (preferred)
2. `work`
3. `temp`
4. Any other address

## Data Schema

### EosinophiliaCase Record

```typescript
interface NewEosinophiliaCase {
  id: string; // Unique case ID: "{bundleId}-{patientId}-{observationId}"
  test_date: Date; // Date of the laboratory test
  eosinophils_value: number; // Normalized eosinophil value in %
  age: number; // Patient age in years
  sex: 'M' | 'F'; // Patient sex
  latitude: number; // Patient location latitude (or 0 if unknown)
  longitude: number; // Patient location longitude (or 0 if unknown)
  municipality_id: string; // Municipality ID (default: '0000000')
}
```

### Error Record

```typescript
interface ParsingError {
  patientId?: string; // Patient ID if available
  field: string; // Field that caused the error
  reason: string; // Error description
  severity: 'error' | 'warning'; // Error severity
  resourceType?: string; // FHIR resource type
  resourceId?: string; // FHIR resource ID
}
```

## Configuration

### Environment Variables

- `FHIR_BASE_URL`: FHIR server endpoint (default: http://localhost:8080/fhir)

### Dependencies

- `fhirpath`: FHIRPath query engine
- `@types/fhir`: TypeScript definitions for FHIR R4
- `fhir/r4`: FHIR R4 type definitions

## Error Handling Strategy

### Graceful Degradation

1. **Missing Patient Data**: Logs error, skips patient
2. **Invalid Eosinophil Values**: Logs warning, uses fallback value
3. **Unit Conversion Errors**: Logs warning, assumes percentage
4. **Missing Location**: Uses default coordinates (0,0)
5. **Missing Municipality**: Uses default ID ('0000000')

### Error Collection

- All errors are collected during parsing
- Errors don't stop the parsing process
- Detailed error reports are logged
- Error summary is returned with results

## API Endpoints

### Process FHIR Webhook

```typescript
POST /fhir/webhook
Body: { bundleId: string }
Response: {
  cases: NewEosinophiliaCase[],
  errors: ParsingError[]
}
```

### Fetch Bundle

```typescript
GET /fhir/bundle/{bundleId}
Response: Bundle (FHIR resource)
```

## Usage Examples

### Processing a Bundle

```typescript
import { processFhirWebhook } from './services/fhir-service';

const result = await processFhirWebhook('bundle-123');
console.log(`Found ${result.cases.length} eosinophilia cases`);
console.log(`Encountered ${result.errors.length} parsing issues`);
```

### Direct Parsing

```typescript
import { FhirParser } from './services/fhir-parser';

const bundle = await fetchBundle('bundle-123');
const result = FhirParser.parseBundleForEosinophiliaCases(bundle);
```

## Performance Considerations

- Uses bulk database inserts for efficiency
- Processes multiple observations per patient
- Handles large bundles with many resources
- Memory-efficient FHIRPath queries
- Structured error handling prevents crashes

## Future Enhancements

1. **Municipality Lookup**: Could be added back for epidemiological analysis
2. **Advanced Filtering**: Filter by date ranges, severity levels
3. **Batch Processing**: Process multiple bundles simultaneously
4. **Real-time Analysis**: Trigger analysis algorithms after storage
5. **Data Validation**: Enhanced FHIR resource validation

## Troubleshooting

### Common Issues

1. **No Eosinophil Observations**: Check LOINC code (770-0) in observations
2. **Unit Conversion Errors**: Verify unit strings match supported formats
3. **Missing Patient Data**: Check FHIR bundle structure and required fields
4. **Database Errors**: Verify database connection and schema

### Debug Information

- All parsing steps are logged with detailed information
- Error severity helps prioritize issues
- Patient and resource IDs help locate problematic data
- FHIRPath queries can be tested independently

This system provides a robust, production-ready solution for processing FHIR hemogram data and detecting eosinophilia cases with comprehensive error handling and detailed logging.
