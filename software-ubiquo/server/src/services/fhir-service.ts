import { Bundle } from '../types/fhir';
import { FhirParser } from './fhir-parser';
import { bulkInsertEosinophiliaCases } from '../database/db';
import { analyzeSevereAnemia } from '../algorithms/individual-analysis';

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
    const eosinophiliaResult = await FhirParser.parseBundleForEosinophiliaCases(bundle as any);

    // Log any parsing errors for eosinophilia
    if (eosinophiliaResult.errors.length > 0) {
      console.log(`Found ${eosinophiliaResult.errors.length} eosinophilia parsing issues:`);
      eosinophiliaResult.errors.forEach((error) => {
        const severity = error.severity === 'error' ? 'ERROR' : 'WARNING';
        console.log(`  ${severity}: ${error.field} - ${error.reason}`);
      });
    }

    if (eosinophiliaResult.cases.length > 0) {
      console.log(`Found ${eosinophiliaResult.cases.length} eosinophilia cases to save`);

      // Save cases to database
      const savedCases = await bulkInsertEosinophiliaCases(eosinophiliaResult.cases);
      console.log(`Successfully saved ${savedCases.length} eosinophilia cases to database`);

      // TODO: Trigger analysis algorithms for new cases
      // - analyzeParasitosisOutbreak for collective analysis
    } else {
      console.log('No eosinophilia cases found in Bundle');
    }

    // Parse Bundle for anemia cases
    const anemiaCases = await FhirParser.parseBundleForAnemiaCases(bundle as any);

    if (anemiaCases.length > 0) {
      console.log(`Found ${anemiaCases.length} anemia cases to analyze`);

      // Process each anemia case for individual analysis
      for (const bloodwork of anemiaCases) {
        console.log(`Analyzing anemia case for patient ${bloodwork.patient.cpf}`);
        
        const alert = analyzeSevereAnemia(bloodwork);
        
        if (alert) {
          console.log(`ANEMIA ALERT: Severe anemia detected for patient ${bloodwork.patient.cpf} (Hb: ${bloodwork.hemoglobin.value} g/dL)`);
        } else {
          console.log(`No anemia alert for patient ${bloodwork.patient.cpf} (Hb: ${bloodwork.hemoglobin.value} g/dL)`);
        }
      }
    } else {
      console.log('No anemia cases found in Bundle');
    }

    return bundle;
  } catch (error) {
    console.error('Error processing FHIR webhook:', error);
    throw error;
  }
}
