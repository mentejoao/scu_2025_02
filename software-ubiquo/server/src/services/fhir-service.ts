import { Bundle } from '../types/fhir';
import { FhirParser } from './fhir-parser';
import { bulkInsertEosinophiliaCases } from '../database/db';

/**
 * Service for interacting with FHIR server
 */

const FHIR_BASE_URL = process.env.FHIR_BASE_URL || 'http://localhost:8080';

/**
 * Fetches a Bundle resource from the FHIR server
 * @param bundleId The ID of the Bundle resource to fetch
 * @returns The Bundle resource
 * @throws Error if the fetch fails
 */
export async function fetchBundle(bundleId: string): Promise<Bundle> {
  const fhirUrl = `${FHIR_BASE_URL}/fhir/Bundle/${bundleId}`;

  console.log(`Fetching Bundle from FHIR server: ${fhirUrl}`);

  const response = await fetch(fhirUrl, {
    headers: {
      Accept: 'application/fhir+json',
    },
  });

  if (!response.ok) {
    const errorMessage = `Failed to fetch Bundle ${bundleId}: ${response.statusText}`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  const bundle = await response.json();
  console.log('Successfully fetched Bundle:', JSON.stringify(bundle, null, 2));

  return bundle;
}

/**
 * Processes a Bundle received from FHIR webhook
 * @param bundleId The ID of the Bundle to process
 * @returns The fetched Bundle
 */
export async function processFhirWebhook(bundleId: string): Promise<Bundle> {
  console.log('Processing FHIR webhook for Bundle ID:', bundleId);

  try {
    const bundle = await fetchBundle(bundleId);

    // Parse Bundle for eosinophilia cases
    const parsingResult = await FhirParser.parseBundleForEosinophiliaCases(bundle as any);

    // Log any parsing errors
    if (parsingResult.errors.length > 0) {
      console.log(`Found ${parsingResult.errors.length} parsing issues:`);
      parsingResult.errors.forEach((error) => {
        const severity = error.severity === 'error' ? 'ERROR' : 'WARNING';
        console.log(`  ${severity}: ${error.field} - ${error.reason}`);
      });
    }

    if (parsingResult.cases.length > 0) {
      console.log(`Found ${parsingResult.cases.length} eosinophilia cases to save`);

      // Save cases to database
      const savedCases = await bulkInsertEosinophiliaCases(parsingResult.cases);
      console.log(`Successfully saved ${savedCases.length} eosinophilia cases to database`);

      // TODO: Trigger analysis algorithms for new cases
      // - analyzeSevereAnemia for individual cases
      // - analyzeParasitosisOutbreak for collective analysis
    } else {
      console.log('No eosinophilia cases found in Bundle');
    }

    return bundle;
  } catch (error) {
    console.error('Error processing FHIR webhook:', error);
    throw error;
  }
}
