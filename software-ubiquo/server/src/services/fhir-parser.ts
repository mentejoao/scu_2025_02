import fhirpath from 'fhirpath';
import { Patient, Observation } from 'fhir/r4';
import { Bundle } from '../types/fhir';
import { NewEosinophiliaCase } from '../database/schema';
import { Bloodwork } from '../types/bloodwork';
import {
  normalizeEosinophilValue,
  isEosinophilia,
  getEosinophiliaSeverity,
} from './unit-converter';
import {
  ParsingError,
  EosinophiliaParsingResult,
  createParsingError,
  logParsingError,
} from '../types/parsing-errors';
import { findMunicipalityByCoordinates } from '../database/db';

/**
 * FHIR Parser Service using FHIRPath for extracting eosinophilia case data
 */
export class FhirParser {
  /**
   * Parses a FHIR Bundle to extract anemia case data using FHIRPath
   * @param bundle The FHIR Bundle resource
   * @returns Array of Bloodwork objects for anemia analysis
   */
  static async parseBundleForAnemiaCases(bundle: Bundle): Promise<Bloodwork[]> {
    const bloodworkCases: Bloodwork[] = [];
    const errors: ParsingError[] = [];

    if (!bundle.entry || bundle.entry.length === 0) {
      errors.push(
        createParsingError(
          undefined,
          'Bundle.entry',
          'Bundle has no entries to process',
          'warning',
          'Bundle',
          bundle.id
        )
      );
      return bloodworkCases;
    }

    try {
      // Extract all patients using FHIRPath
      const patients = fhirpath.evaluate(
        bundle,
        "Bundle.entry.resource.where(resourceType='Patient')"
      ) as Patient[];

      if (patients.length === 0) {
        errors.push(
          createParsingError(
            undefined,
            'Bundle.entry.resource',
            'No Patient resources found in Bundle',
            'warning',
            'Bundle',
            bundle.id
          )
        );
        return bloodworkCases;
      }

      // Process each patient
      for (const patient of patients) {
        if (!patient.id) {
          errors.push(
            createParsingError(
              undefined,
              'Patient.id',
              'Patient resource missing ID',
              'error',
              'Patient'
            )
          );
          continue;
        }

        // Find anemia-related observations for this patient
        const anemiaObservations = this.findAllAnemiaObservations(bundle, patient.id);

        if (anemiaObservations.length === 0) {
          errors.push(
            createParsingError(
              patient.id,
              'Observation',
              'No anemia-related observations found for patient',
              'warning',
              'Patient',
              patient.id
            )
          );
          continue;
        }

        // Create bloodwork case for anemia analysis
        const bloodworkCase = await this.createAnemiaCase(
          patient,
          anemiaObservations,
          bundle.id || 'unknown',
          errors
        );

        if (bloodworkCase) {
          bloodworkCases.push(bloodworkCase);
        }
      }

      console.log(`Parsed ${bloodworkCases.length} anemia cases from Bundle using FHIRPath`);
      return bloodworkCases;
    } catch (error) {
      const parsingError = createParsingError(
        undefined,
        'Bundle',
        `Failed to parse Bundle for anemia cases: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error',
        'Bundle',
        bundle.id
      );
      errors.push(parsingError);
      logParsingError(parsingError);
      return bloodworkCases;
    }
  }

  /**
   * Parses a FHIR Bundle to extract eosinophilia case data using FHIRPath
   * @param bundle The FHIR Bundle resource
   * @returns Parsing result with eosinophilia cases and any errors
   */
  static async parseBundleForEosinophiliaCases(bundle: Bundle): Promise<EosinophiliaParsingResult> {
    const errors: ParsingError[] = [];

    if (!bundle.entry || bundle.entry.length === 0) {
      errors.push(
        createParsingError(
          undefined,
          'Bundle.entry',
          'Bundle has no entries to process',
          'warning',
          'Bundle',
          bundle.id
        )
      );
      return { cases: [], errors };
    }

    try {
      // Extract all patients using FHIRPath
      const patients = fhirpath.evaluate(
        bundle,
        "Bundle.entry.resource.where(resourceType='Patient')"
      ) as Patient[];

      if (patients.length === 0) {
        errors.push(
          createParsingError(
            undefined,
            'Bundle.entry.resource',
            'No Patient resources found in Bundle',
            'warning',
            'Bundle',
            bundle.id
          )
        );
        return { cases: [], errors };
      }

      const cases: NewEosinophiliaCase[] = [];

      // Process each patient
      for (const patient of patients) {
        if (!patient.id) {
          errors.push(
            createParsingError(
              undefined,
              'Patient.id',
              'Patient resource missing ID',
              'error',
              'Patient'
            )
          );
          continue;
        }

        // Find all eosinophil observations for this patient using FHIRPath
        const eosinophilObservations = this.findAllEosinophilObservations(bundle, patient.id);

        if (eosinophilObservations.length === 0) {
          errors.push(
            createParsingError(
              patient.id,
              'Observation',
              'No eosinophil observations found for patient',
              'warning',
              'Patient',
              patient.id
            )
          );
          continue;
        }

        // Create cases for each eosinophil observation
        for (const observation of eosinophilObservations) {
          const eosinophiliaCase = await this.createEosinophiliaCase(
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
   * Finds all anemia-related observations for a patient using FHIRPath
   * @param bundle FHIR Bundle containing observations
   * @param patientId Patient ID to search for
   * @returns Array of anemia-related observations (hemoglobin, hematocrit, MCV)
   */
  private static findAllAnemiaObservations(bundle: Bundle, patientId: string): Observation[] {
    try {
      // FHIRPath query to find all anemia-related observations for a specific patient
      // LOINC codes: 718-7 (hemoglobin), 4544-3 (hematocrit), 787-2 (MCV)
      const observations = fhirpath.evaluate(
        bundle,
        `Bundle.entry.resource.where(resourceType='Observation' and subject.reference='Patient/${patientId}' and (code.coding.code='718-7' or code.coding.code='4544-3' or code.coding.code='787-2'))`
      ) as Observation[];

      return observations;
    } catch (error) {
      console.error(`Error finding anemia observations for patient ${patientId}:`, error);
      return [];
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
      const observations = fhirpath.evaluate(
        bundle,
        `Bundle.entry.resource.where(resourceType='Observation' and subject.reference='Patient/${patientId}' and code.coding.code='770-0')`
      ) as Observation[];

      return observations;
    } catch (error) {
      console.error(`Error finding eosinophil observations for patient ${patientId}:`, error);
      return [];
    }
  }

  /**
   * Creates an anemia case from patient and observations data
   * @param patient Patient resource
   * @param observations Array of anemia-related observations (hemoglobin, hematocrit, MCV)
   * @param bundleId Bundle ID for generating unique case ID
   * @param errors Array to collect parsing errors
   * @returns Bloodwork object for anemia analysis or null if invalid
   */
  private static async createAnemiaCase(
    patient: Patient,
    observations: Observation[],
    bundleId: string,
    errors: ParsingError[] = []
  ): Promise<Bloodwork | null> {
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

      // Extract location coordinates
      const location = this.extractLocation(patient, errors);

      // Extract patient name
      const name = this.extractPatientName(patient);
      if (!name) {
        const error = createParsingError(
          patient.id,
          'Patient.name',
          'Could not extract patient name',
          'error',
          'Patient',
          patient.id
        );
        errors.push(error);
        logParsingError(error);
        return null;
      }

      // Extract CPF (assuming it's in an identifier)
      const cpf = this.extractCPF(patient);
      if (!cpf) {
        const error = createParsingError(
          patient.id,
          'Patient.identifier',
          'Could not extract CPF',
          'error',
          'Patient',
          patient.id
        );
        errors.push(error);
        logParsingError(error);
        return null;
      }

      // Extract anemia-related values from observations
      const anemiaValues = this.extractAnemiaValues(observations, errors);
      if (!anemiaValues) {
        return null;
      }

      // Extract test date (use the earliest date from observations)
      const testDate = this.extractEarliestTestDate(observations);
      if (!testDate) {
        const error = createParsingError(
          patient.id,
          'Observation.effectiveDateTime',
          'Could not parse test date from observations',
          'error',
          'Observation'
        );
        errors.push(error);
        logParsingError(error);
        return null;
      }

      // Get coordinates from patient location
      const latitude = location?.latitude || 0;
      const longitude = location?.longitude || 0;

      // Find municipality by coordinates using database lookup
      let municipalityId = '0000000'; // Default fallback
      if (latitude !== 0 && longitude !== 0) {
        try {
          const foundMunicipalityId = await findMunicipalityByCoordinates(latitude, longitude);
          if (foundMunicipalityId) {
            municipalityId = foundMunicipalityId;
          } else {
            errors.push(
              createParsingError(
                patient.id,
                'Patient.address',
                'Could not find municipality for coordinates, using default',
                'warning',
                'Patient',
                patient.id
              )
            );
          }
        } catch (error) {
          errors.push(
            createParsingError(
              patient.id,
              'Patient.address',
              `Error looking up municipality: ${error instanceof Error ? error.message : 'Unknown error'}`,
              'warning',
              'Patient',
              patient.id
            )
          );
        }
      } else {
        errors.push(
          createParsingError(
            patient.id,
            'Patient.address',
            'No coordinates found, using default municipality',
            'warning',
            'Patient',
            patient.id
          )
        );
      }

      // Generate unique case ID
      const caseId = `${bundleId}-${patient.id}-anemia`;

      return {
        id: caseId,
        patient: {
          name: name,
          cpf: cpf,
          age: age,
          sex: sex,
          latitude: latitude,
          longitude: longitude,
          municipality_id: municipalityId,
        },
        test_date: testDate,
        hemoglobin: anemiaValues.hemoglobin,
        hematocrit: anemiaValues.hematocrit,
        mcv: anemiaValues.mcv,
        eosinophils: anemiaValues.eosinophils,
      };
    } catch (error) {
      const parsingError = createParsingError(
        patient.id,
        'AnemiaCase',
        `Error creating anemia case: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error',
        'Patient',
        patient.id
      );
      errors.push(parsingError);
      logParsingError(parsingError);
      return null;
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
  private static async createEosinophiliaCase(
    patient: Patient,
    observation: Observation,
    bundleId: string,
    errors: ParsingError[] = []
  ): Promise<NewEosinophiliaCase | null> {
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

      // Get coordinates from patient location
      const latitude = location?.latitude || 0;
      const longitude = location?.longitude || 0;

      // Find municipality by coordinates using database lookup
      let municipalityId = '0000000'; // Default fallback
      if (latitude !== 0 && longitude !== 0) {
        try {
          const foundMunicipalityId = await findMunicipalityByCoordinates(latitude, longitude);
          if (foundMunicipalityId) {
            municipalityId = foundMunicipalityId;
          } else {
            errors.push(
              createParsingError(
                patient.id,
                'Patient.address',
                'Could not find municipality for coordinates, using default',
                'warning',
                'Patient',
                patient.id
              )
            );
          }
        } catch (error) {
          errors.push(
            createParsingError(
              patient.id,
              'Patient.address',
              `Error looking up municipality: ${error instanceof Error ? error.message : 'Unknown error'}`,
              'warning',
              'Patient',
              patient.id
            )
          );
        }
      } else {
        errors.push(
          createParsingError(
            patient.id,
            'Patient.address',
            'No coordinates found, using default municipality',
            'warning',
            'Patient',
            patient.id
          )
        );
      }

      return {
        id: caseId,
        test_date: testDate,
        eosinophils_value: eosinophilsValue.value,
        age: age,
        sex: sex,
        latitude: latitude,
        longitude: longitude,
        municipality_id: municipalityId,
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
      case 'male':
        return 'M';
      case 'female':
        return 'F';
      default:
        return null;
    }
  }


  /**
   * Extracts location data from patient address (optional for eosinophilia detection)
   * @param patient Patient resource
   * @param errors Array to collect parsing errors
   * @returns Location data or null
   */
  private static extractLocation(
    patient: Patient,
    errors: ParsingError[]
  ): { latitude: number; longitude: number; municipality_id: string } | null {
    if (!patient.address || patient.address.length === 0) {
      return null;
    }

    // Prioritize addresses by use field
    const prioritizedAddresses = this.prioritizeAddresses(patient.address);

    for (const address of prioritizedAddresses) {
      // Look for geolocation extension using FHIRPath
      const latitudeResult = fhirpath.evaluate(
        address,
        "extension.where(url='http://hl7.org/fhir/StructureDefinition/geolocation').extension.where(url='latitude').valueDecimal"
      ) as any[];
      const latitude = latitudeResult[0] as number | undefined;

      const longitudeResult = fhirpath.evaluate(
        address,
        "extension.where(url='http://hl7.org/fhir/StructureDefinition/geolocation').extension.where(url='longitude').valueDecimal"
      ) as any[];
      const longitude = longitudeResult[0] as number | undefined;

      if (latitude !== undefined && longitude !== undefined) {
        // For now, use a default municipality ID since we don't need precise municipality lookup
        // This can be enhanced later if needed for epidemiological analysis
        return {
          latitude,
          longitude,
          municipality_id: '0000000', // Default municipality ID
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
  private static extractEosinophilsValue(
    observation: Observation,
    errors: ParsingError[]
  ): { value: number; unit: string } | null {
    try {
      // Extract value and unit using FHIRPath
      const valueResult = fhirpath.evaluate(
        observation,
        'Observation.valueQuantity.value'
      ) as any[];
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
        errors.push(
          createParsingError(
            undefined,
            'Observation.valueQuantity.unit',
            `Unit conversion error: ${unitError instanceof Error ? unitError.message : 'Unknown error'}`,
            'warning',
            'Observation',
            observation.id
          )
        );

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

  /**
   * Extracts patient name from FHIR Patient resource
   * @param patient Patient resource
   * @returns Patient name or null
   */
  private static extractPatientName(patient: Patient): string | null {
    if (!patient.name || patient.name.length === 0) {
      return null;
    }

    // Use the first name entry
    const name = patient.name[0];
    const given = name.given?.join(' ') || '';
    const family = name.family || '';
    
    return `${given} ${family}`.trim() || null;
  }

  /**
   * Extracts CPF from FHIR Patient resource identifiers
   * @param patient Patient resource
   * @returns CPF string or null
   */
  private static extractCPF(patient: Patient): string | null {
    if (!patient.identifier || patient.identifier.length === 0) {
      return null;
    }

    // Look for CPF in identifiers (assuming it's marked with a specific system)
    for (const identifier of patient.identifier) {
      if (identifier.system === 'http://www.saude.gov.br/fhir/r4/CodeSystem/BR-CPF' || 
          identifier.type?.coding?.[0]?.code === 'CPF') {
        return identifier.value || null;
      }
    }

    // Fallback: use first identifier value if no specific CPF found
    return patient.identifier[0]?.value || null;
  }

  /**
   * Extracts anemia-related values from observations
   * @param observations Array of observations
   * @param errors Array to collect parsing errors
   * @returns Object with hemoglobin, hematocrit, MCV, and eosinophils values
   */
  private static extractAnemiaValues(
    observations: Observation[],
    errors: ParsingError[]
  ): {
    hemoglobin: { value: number };
    hematocrit: { value: number };
    mcv: { value: number };
    eosinophils: { value: number };
  } | null {
    const values: {
      hemoglobin?: { value: number };
      hematocrit?: { value: number };
      mcv?: { value: number };
      eosinophils?: { value: number };
    } = {};

    for (const observation of observations) {
      const code = observation.code?.coding?.[0]?.code;
      const value = observation.valueQuantity?.value;

      if (value === undefined || value === null) {
        continue;
      }

      switch (code) {
        case '718-7': // Hemoglobin
          values.hemoglobin = { value };
          break;
        case '4544-3': // Hematocrit
          values.hematocrit = { value };
          break;
        case '787-2': // MCV
          values.mcv = { value };
          break;
        case '770-0': // Eosinophils
          values.eosinophils = { value };
          break;
      }
    }

    // Check if we have the required values
    if (!values.hemoglobin || !values.hematocrit || !values.mcv) {
      errors.push(
        createParsingError(
          undefined,
          'Observation',
          'Missing required anemia values (hemoglobin, hematocrit, or MCV)',
          'error',
          'Observation'
        )
      );
      return null;
    }

    // Use default eosinophils value if not found
    if (!values.eosinophils) {
      values.eosinophils = { value: 0 };
    }

    return {
      hemoglobin: values.hemoglobin,
      hematocrit: values.hematocrit,
      mcv: values.mcv,
      eosinophils: values.eosinophils,
    };
  }

  /**
   * Extracts the earliest test date from observations
   * @param observations Array of observations
   * @returns Earliest date or null
   */
  private static extractEarliestTestDate(observations: Observation[]): Date | null {
    let earliestDate: Date | null = null;

    for (const observation of observations) {
      const date = this.parseDate(observation.effectiveDateTime);
      if (date && (!earliestDate || date < earliestDate)) {
        earliestDate = date;
      }
    }

    return earliestDate;
  }
}
