/**
 * FHIR Resource Types and Interfaces
 */

export interface OperationOutcome {
  resourceType: 'OperationOutcome';
  issue: OperationOutcomeIssue[];
}

export interface OperationOutcomeIssue {
  severity: 'fatal' | 'error' | 'warning' | 'information';
  code: string;
  diagnostics: string;
}

export interface Bundle {
  resourceType: 'Bundle';
  id?: string;
  type?: string;
  entry?: BundleEntry[];
  // Add more fields as needed
  [key: string]: any;
}

export interface BundleEntry {
  fullUrl?: string;
  resource?: any;
  request?: {
    method: string;
    url: string;
  };
  response?: {
    status: string;
  };
}
