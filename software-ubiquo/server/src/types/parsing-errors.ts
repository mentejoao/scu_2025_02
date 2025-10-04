/**
 * Parsing Error Types and Interfaces
 */

export interface ParsingError {
  patientId?: string;
  field: string;
  reason: string;
  severity: 'error' | 'warning';
  resourceType?: string;
  resourceId?: string;
}

export interface ParsingResult<T> {
  data: T[];
  errors: ParsingError[];
}

export interface EosinophiliaParsingResult {
  cases: import('../database/schema').NewEosinophiliaCase[];
  errors: ParsingError[];
}

/**
 * Creates a parsing error object
 * @param patientId Patient ID (optional)
 * @param field Field that caused the error
 * @param reason Description of the error
 * @param severity Error severity
 * @param resourceType FHIR resource type (optional)
 * @param resourceId FHIR resource ID (optional)
 * @returns ParsingError object
 */
export function createParsingError(
  patientId: string | undefined,
  field: string,
  reason: string,
  severity: 'error' | 'warning' = 'error',
  resourceType?: string,
  resourceId?: string
): ParsingError {
  return {
    patientId,
    field,
    reason,
    severity,
    resourceType,
    resourceId
  };
}

/**
 * Logs a parsing error with structured format
 * @param error ParsingError object
 */
export function logParsingError(error: ParsingError): void {
  const prefix = error.severity === 'error' ? 'ERROR' : 'WARNING';
  const patientInfo = error.patientId ? `Patient ${error.patientId}: ` : '';
  const resourceInfo = error.resourceType ? ` (${error.resourceType}${error.resourceId ? `/${error.resourceId}` : ''})` : '';
  
  const message = `${prefix} - ${patientInfo}${error.field}: ${error.reason}${resourceInfo}`;
  
  if (error.severity === 'error') {
    console.error(message);
  } else {
    console.warn(message);
  }
}
