import fhirpath from 'fhirpath';
import { Bundle, Patient, Observation } from 'fhir/r4';
import { NewEosinophiliaCase } from '../database/schema';
import { normalizeEosinophilValue, isEosinophilia, getEosinophiliaSeverity } from './unit-converter';
import { ParsingError, EosinophiliaParsingResult, createParsingError, logParsingError } from '../types/parsing-errors';

/**
 * FHIR Parser Service using FHIRPath for extracting eosinophilia case data
 */
export class FhirParser {
  /**
   * Parses a FHIR Bundle to extract eosinophilia case data using FHIRPath
   * @param bundle The FHIR Bundle resource
   * @returns Parsing result with eosinophilia cases and any errors
   */
  static parseBundleForEosinophiliaCases(bundle: Bundle): EosinophiliaParsingResult {
    const errors: ParsingError[] = [];
    
    if (!bundle.entry || bundle.entry.length === 0) {
      errors.push(createParsingError(
        undefined,
        'Bundle.entry',
        'Bundle has no entries to process',
        'warning',
        'Bundle',
        bundle.id
      ));
      return { cases: [], errors };
    }

    try {
      // Extract all patients using FHIRPath
      const patients = fhirpath.evaluate(bundle, "Bundle.entry.resource.where(resourceType='Patient')") as Patient[];
      
      if (patients.length === 0) {
        errors.push(createParsingError(
          undefined,
          'Bundle.entry.resource',
          'No Patient resources found in Bundle',
          'warning',
          'Bundle',
          bundle.id
        ));
        return { cases: [], errors };
      }

      const cases: NewEosinophiliaCase[] = [];

      // Process each patient
      for (const patient of patients) {
        if (!patient.id) {
          errors.push(createParsingError(
            undefined,
            'Patient.id',
            'Patient resource missing ID',
            'error',
            'Patient'
          ));
          continue;
        }

        // Find all eosinophil observations for this patient using FHIRPath
        const eosinophilObservations = this.findAllEosinophilObservations(bundle, patient.id);
        
        if (eosinophilObservations.length === 0) {
          errors.push(createParsingError(
            patient.id,
            'Observation',
            'No eosinophil observations found for patient',
            'warning',
            'Patient',
            patient.id
          ));
          continue;
        }

        // Create cases for each eosinophil observation
        for (const observation of eosinophilObservations) {
          const eosinophiliaCase = this.createEosinophiliaCase(
            patient,
            observation,
            bundle.id || 'unknown',
            errors
          );
          
          if (eosinophiliaCase) {
            cases.push(eosinophiliaCase);
          }
        }
      }

      console.log(`Parsed ${cases.length} eosinophilia cases from Bundle using FHIRPath`);
      return { cases, errors };
    } catch (error) {
      const parsingError = createParsingError(
        undefined,
        'Bundle',
        `Failed to parse Bundle: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error',
        'Bundle',
        bundle.id
      );
      errors.push(parsingError);
      logParsingError(parsingError);
      return { cases: [], errors };
    }
  }

  /**
   * Finds all eosinophil observations for a patient using FHIRPath
   * @param bundle FHIR Bundle containing observations
   * @param patientId Patient ID to search for
   * @returns Array of eosinophil observations
   */
  private static findAllEosinophilObservations(bundle: Bundle, patientId: string): Observation[] {
    try {
      // FHIRPath query to find all eosinophil observations for a specific patient
      const observations = fhirpath.evaluate(bundle, 
        `Bundle.entry.resource.where(resourceType='Observation' and subject.reference='Patient/${patientId}' and code.coding.code='770-0')`
      ) as Observation[];
      
      return observations;
    } catch (error) {
      console.error(`Error finding eosinophil observations for patient ${patientId}:`, error);
      return [];
    }
  }

  /**
   * Creates an eosinophilia case from patient and observation data
   * @param patient Patient resource
   * @param observation Eosinophils observation
   * @param bundleId Bundle ID for generating unique case ID
   * @param errors Array to collect parsing errors
   * @returns Eosinophilia case data or null if invalid
   */
  private static createEosinophiliaCase(
    patient: Patient,
    observation: Observation,
    bundleId: string,
    errors: ParsingError[]
  ): NewEosinophiliaCase | null {
    try {
      // Extract age from birth date using FHIRPath
      const age = this.calculateAge(patient.birthDate);
      if (age === null) {
        const error = createParsingError(
          patient.id,
          'Patient.birthDate',
          'Could not calculate age from birth date',
          'error',
          'Patient',
          patient.id
        );
        errors.push(error);
        logParsingError(error);
        return null;
      }

      // Extract gender using FHIRPath
      const sex = this.mapGenderToSex(patient.gender);
      if (!sex) {
        const error = createParsingError(
          patient.id,
          'Patient.gender',
          'Could not determine sex from gender',
          'error',
          'Patient',
          patient.id
        );
        errors.push(error);
        logParsingError(error);
        return null;
      }

      // Extract location coordinates (optional for eosinophilia detection)
      const location = this.extractLocation(patient, errors);

      // Extract and normalize eosinophils value
      const eosinophilsValue = this.extractEosinophilsValue(observation, errors);
      if (eosinophilsValue === null) {
        const error = createParsingError(
          patient.id,
          'Observation.valueQuantity',
          'Could not extract or normalize eosinophils value',
          'error',
          'Observation',
          observation.id
        );
        errors.push(error);
        logParsingError(error);
        return null;
      }

      // Extract test date using FHIRPath
      const testDate = this.parseDate(observation.effectiveDateTime);
      if (!testDate) {
        const error = createParsingError(
          patient.id,
          'Observation.effectiveDateTime',
          'Could not parse test date',
          'error',
          'Observation',
          observation.id
        );
        errors.push(error);
        logParsingError(error);
        return null;
      }

      // Generate unique case ID
      const caseId = `${bundleId}-${patient.id}-${observation.id}`;

      return {
        id: caseId,
        test_date: testDate,
        eosinophils_value: eosinophilsValue.value,
        age: age,
        sex: sex,
        latitude: location?.latitude || 0,
        longitude: location?.longitude || 0,
        municipality_id: location?.municipality_id || '0000000', // Default municipality ID
      };
    } catch (error) {
      const parsingError = createParsingError(
        patient.id,
        'EosinophiliaCase',
        `Error creating eosinophilia case: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error',
        'Observation',
        observation.id
      );
      errors.push(parsingError);
      logParsingError(parsingError);
      return null;
    }
  }

  /**
   * Calculates age from FHIR birth date
   * @param birthDate FHIR date string
   * @returns Age in years or null
   */
  private static calculateAge(birthDate?: string): number | null {
    if (!birthDate) return null;
    
    try {
      const birth = new Date(birthDate);
      const now = new Date();
      
      if (isNaN(birth.getTime())) {
        return null;
      }
      
      const age = now.getFullYear() - birth.getFullYear();
      const monthDiff = now.getMonth() - birth.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
        return age - 1;
      }
      
      return age;
    } catch (error) {
      return null;
    }
  }

  /**
   * Maps FHIR gender to our sex format
   * @param gender FHIR gender
   * @returns 'M' or 'F' or null
   */
  private static mapGenderToSex(gender?: string): 'M' | 'F' | null {
    switch (gender) {
      case 'male': return 'M';
      case 'female': return 'F';
      default: return null;
    }
  }

  /**
   * Extracts location data from patient address (optional for eosinophilia detection)
   * @param patient Patient resource
   * @param errors Array to collect parsing errors
   * @returns Location data or null
   */
  private static extractLocation(patient: Patient, errors: ParsingError[]): { latitude: number; longitude: number; municipality_id: string } | null {
    if (!patient.address || patient.address.length === 0) {
      return null;
    }

    // Prioritize addresses by use field
    const prioritizedAddresses = this.prioritizeAddresses(patient.address);
    
    for (const address of prioritizedAddresses) {
      // Look for geolocation extension using FHIRPath
      const latitudeResult = fhirpath.evaluate(address, 
        "extension.where(url='http://hl7.org/fhir/StructureDefinition/geolocation').extension.where(url='latitude').valueDecimal"
      ) as any[];
      const latitude = latitudeResult[0] as number | undefined;
      
      const longitudeResult = fhirpath.evaluate(address,
        "extension.where(url='http://hl7.org/fhir/StructureDefinition/geolocation').extension.where(url='longitude').valueDecimal"
      ) as any[];
      const longitude = longitudeResult[0] as number | undefined;

      if (latitude !== undefined && longitude !== undefined) {
        // For now, use a default municipality ID since we don't need precise municipality lookup
        // This can be enhanced later if needed for epidemiological analysis
        return {
          latitude,
          longitude,
          municipality_id: '0000000' // Default municipality ID
        };
      }
    }

    return null;
  }

  /**
   * Prioritizes addresses by use field
   * @param addresses Array of addresses
   * @returns Prioritized array of addresses
   */
  private static prioritizeAddresses(addresses: any[]): any[] {
    const priorityOrder = ['home', 'work', 'temp'];
    
    return addresses.sort((a, b) => {
      const aUse = a.use || '';
      const bUse = b.use || '';
      
      const aIndex = priorityOrder.indexOf(aUse);
      const bIndex = priorityOrder.indexOf(bUse);
      
      // If both have priority, sort by priority
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      
      // If only one has priority, prioritize it
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      
      // If neither has priority, maintain original order
      return 0;
    });
  }

  /**
   * Extracts and normalizes eosinophils value from observation
   * @param observation Observation resource
   * @param errors Array to collect parsing errors
   * @returns Normalized value or null
   */
  private static extractEosinophilsValue(observation: Observation, errors: ParsingError[]): { value: number; unit: string } | null {
    try {
      // Extract value and unit using FHIRPath
      const valueResult = fhirpath.evaluate(observation, 'Observation.valueQuantity.value') as any[];
      const value = valueResult[0] as number | undefined;
      const unitResult = fhirpath.evaluate(observation, 'Observation.valueQuantity.unit') as any[];
      const unit = unitResult[0] as string | undefined;

      if (value === undefined || value === null) {
        return null;
      }

      const normalizedUnit = unit || '%'; // Default to percentage if no unit specified
      
      try {
        const normalized = normalizeEosinophilValue(value, normalizedUnit);
        
        // Check if this indicates eosinophilia
        if (isEosinophilia(normalized)) {
          const severity = getEosinophiliaSeverity(normalized);
          console.log(`Found eosinophilia case: ${value} ${normalizedUnit} (${severity})`);
        }
        
        return normalized;
      } catch (unitError) {
        errors.push(createParsingError(
          undefined,
          'Observation.valueQuantity.unit',
          `Unit conversion error: ${unitError instanceof Error ? unitError.message : 'Unknown error'}`,
          'warning',
          'Observation',
          observation.id
        ));
        
        // Fallback: assume percentage if conversion fails
        return { value, unit: '%' };
      }
    } catch (error) {
      return null;
    }
  }

  /**
   * Parses FHIR date string to Date object
   * @param dateString FHIR date string
   * @returns Date object or null
   */
  private static parseDate(dateString?: string): Date | null {
    if (!dateString) return null;
    
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? null : date;
    } catch (error) {
      return null;
    }
  }
}