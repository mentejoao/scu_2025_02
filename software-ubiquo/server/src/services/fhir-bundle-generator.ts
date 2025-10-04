import { Bundle } from '../types/fhir';

/**
 * FHIR Bundle Generator for Eosinophilia Cases
 * Generates FHIR Bundle resources that match the criteria for eosinophilia case extraction
 */
export class FhirBundleGenerator {
  
  /**
   * Generates a complete FHIR Bundle with Patient and Eosinophils Observation
   * @param patientData Patient information
   * @param observationData Eosinophils observation data
   * @returns FHIR Bundle ready for parsing
   */
  static generateEosinophiliaBundle(
    patientData: {
      id: string;
      gender: 'male' | 'female';
      birthDate: string;
      address: {
        latitude: number;
        longitude: number;
        municipality_id: string;
        postalCode?: string;
        city?: string;
        state?: string;
      };
    },
    observationData: {
      id: string;
      eosinophilsValue: number;
      effectiveDateTime: string;
      unit?: string;
    }
  ): Bundle {
    const bundleId = `bundle-${Date.now()}`;
    
    return {
      resourceType: 'Bundle',
      id: bundleId,
      type: 'collection',
      entry: [
        {
          fullUrl: `urn:uuid:patient-${patientData.id}`,
          resource: {
            resourceType: 'Patient',
            id: patientData.id,
            gender: patientData.gender,
            birthDate: patientData.birthDate,
            address: [{
              use: 'home',
              line: ['Endereço do paciente'],
              city: patientData.address.city || 'São Paulo',
              state: patientData.address.state || 'SP',
              postalCode: patientData.address.postalCode || '01234-567',
              country: 'BR',
              extension: [{
                url: 'http://hl7.org/fhir/StructureDefinition/geolocation',
                extension: [
                  { url: 'latitude', valueDecimal: patientData.address.latitude },
                  { url: 'longitude', valueDecimal: patientData.address.longitude }
                ]
              }]
            }]
          }
        },
        {
          fullUrl: `urn:uuid:observation-${observationData.id}`,
          resource: {
            resourceType: 'Observation',
            id: observationData.id,
            status: 'final',
            code: {
              coding: [{
                system: 'http://loinc.org',
                code: '770-0',
                display: 'Eosinophils/100 leukocytes in Blood by Automated count'
              }]
            },
            subject: {
              reference: `Patient/${patientData.id}`
            },
            effectiveDateTime: observationData.effectiveDateTime,
            valueQuantity: {
              value: observationData.eosinophilsValue,
              unit: observationData.unit || '%',
              system: 'http://unitsofmeasure.org',
              code: observationData.unit || '%'
            }
          }
        }
      ]
    };
  }

  /**
   * Generates a Bundle with multiple patients and eosinophils observations
   * @param cases Array of patient and observation data
   * @returns FHIR Bundle with multiple cases
   */
  static generateMultipleEosinophiliaBundle(
    cases: Array<{
      patient: {
        id: string;
        gender: 'male' | 'female';
        birthDate: string;
        address: {
          latitude: number;
          longitude: number;
          municipality_id: string;
          postalCode?: string;
          city?: string;
          state?: string;
        };
      };
      observation: {
        id: string;
        eosinophilsValue: number;
        effectiveDateTime: string;
        unit?: string;
      };
    }>
  ): Bundle {
    const bundleId = `multi-bundle-${Date.now()}`;
    const entries: any[] = [];

    cases.forEach((caseData, index) => {
      // Add Patient
      entries.push({
        fullUrl: `urn:uuid:patient-${caseData.patient.id}`,
        resource: {
          resourceType: 'Patient',
          id: caseData.patient.id,
          gender: caseData.patient.gender,
          birthDate: caseData.patient.birthDate,
          address: [{
            use: 'home',
            line: [`Endereço do paciente ${index + 1}`],
            city: caseData.patient.address.city || 'São Paulo',
            state: caseData.patient.address.state || 'SP',
            postalCode: caseData.patient.address.postalCode || '01234-567',
            country: 'BR',
            extension: [{
              url: 'http://hl7.org/fhir/StructureDefinition/geolocation',
              extension: [
                { url: 'latitude', valueDecimal: caseData.patient.address.latitude },
                { url: 'longitude', valueDecimal: caseData.patient.address.longitude }
              ]
            }]
          }]
        }
      });

      // Add Observation
      entries.push({
        fullUrl: `urn:uuid:observation-${caseData.observation.id}`,
        resource: {
          resourceType: 'Observation',
          id: caseData.observation.id,
          status: 'final',
          code: {
            coding: [{
              system: 'http://loinc.org',
              code: '770-0',
              display: 'Eosinophils/100 leukocytes in Blood by Automated count'
            }]
          },
          subject: {
            reference: `Patient/${caseData.patient.id}`
          },
          effectiveDateTime: caseData.observation.effectiveDateTime,
          valueQuantity: {
            value: caseData.observation.eosinophilsValue,
            unit: caseData.observation.unit || '%',
            system: 'http://unitsofmeasure.org',
            code: caseData.observation.unit || '%'
          }
        }
      });
    });

    return {
      resourceType: 'Bundle',
      id: bundleId,
      type: 'collection',
      entry: entries
    };
  }

  /**
   * Generates sample data for testing
   * @returns Sample Bundle with realistic eosinophilia data
   */
  static generateSampleBundle(): Bundle {
    return this.generateEosinophiliaBundle(
      {
        id: 'patient-sample-001',
        gender: 'male',
        birthDate: '1985-03-15',
        address: {
          latitude: -23.5505,
          longitude: -46.6333,
          municipality_id: '3550308',
          postalCode: '01234-567',
          city: 'São Paulo',
          state: 'SP'
        }
      },
      {
        id: 'eosinophils-sample-001',
        eosinophilsValue: 12.5, // Elevated eosinophils
        effectiveDateTime: '2024-01-15T10:30:00Z',
        unit: '%'
      }
    );
  }

  /**
   * Generates a Bundle with normal eosinophils (should not trigger alerts)
   * @returns Bundle with normal eosinophils values
   */
  static generateNormalEosinophilsBundle(): Bundle {
    return this.generateEosinophiliaBundle(
      {
        id: 'patient-normal-001',
        gender: 'female',
        birthDate: '1990-07-22',
        address: {
          latitude: -23.5505,
          longitude: -46.6333,
          municipality_id: '3550308',
          postalCode: '01234-567',
          city: 'São Paulo',
          state: 'SP'
        }
      },
      {
        id: 'eosinophils-normal-001',
        eosinophilsValue: 2.1, // Normal eosinophils
        effectiveDateTime: '2024-01-15T14:20:00Z',
        unit: '%'
      }
    );
  }
}
