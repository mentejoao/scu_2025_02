import { analyzeSevereAnemia } from '../individual-analysis';
import { Bloodwork } from '../../types/bloodwork';
import { IndividualAlert } from '../../types/alerts';

describe('analyzeSevereAnemia', () => {
  const baseBloodwork: Bloodwork = {
    id: 'bw-test-1',
    patient: {
      name: 'Test Patient',
      cpf: '123.456.789-00',
      age: 50,
      sex: 'M',
      latitude: 0,
      longitude: 0,
      municipality_id: '0',
    },
    test_date: new Date(),
    hematocrit: { value: 30 },
    mcv: { value: 80 },
    eosinophils: { value: 150 },
    hemoglobin: { value: 15 }, // Default normal value
  };

  it('should return an IndividualAlert for hemoglobin below the 8.0 threshold', async () => {
    const bloodwork: Bloodwork = {
      ...baseBloodwork,
      hemoglobin: { value: 7.9 },
    };

    const result = await analyzeSevereAnemia(bloodwork);

    expect(result).not.toBeNull();
    expect(result?.type).toBe('SEVERE_ANEMIA');
    expect(result?.patient_cpf).toBe(bloodwork.patient.cpf);
    expect(result?.details.hemoglobin).toBe(7.9);
  });

  it('should return null for hemoglobin at the 8.0 threshold', async () => {
    const bloodwork: Bloodwork = {
      ...baseBloodwork,
      hemoglobin: { value: 8.0 },
    };

    const result = await analyzeSevereAnemia(bloodwork);

    expect(result).toBeNull();
  });

  it('should return null for hemoglobin above the 8.0 threshold', async () => {
    const bloodwork: Bloodwork = {
      ...baseBloodwork,
      hemoglobin: { value: 12.0 },
    };

    const result = await analyzeSevereAnemia(bloodwork);

    expect(result).toBeNull();
  });
});
