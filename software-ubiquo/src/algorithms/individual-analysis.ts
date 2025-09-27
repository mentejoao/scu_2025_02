import { Bloodwork } from '../types/bloodwork';
import { IndividualAlert } from '../types/alerts';

/**
 * Analyzes a single blood work result for severe anemia.
 * This function should be called in real-time for each processed blood work.
 *
 * @param bloodwork The parsed blood work object.
 * @returns An IndividualAlert object if severe anemia is detected, otherwise null.
 */
export function analyzeSevereAnemia(bloodwork: Bloodwork): IndividualAlert | null {
  const HGB_THRESHOLD = 8.0; // g/dL

  if (bloodwork.hemoglobin.value < HGB_THRESHOLD) {
    console.log(
      `INDIVIDUAL ALERT: Severe Anemia detected for patient CPF ${bloodwork.patient.cpf}`
    );

    const alert: IndividualAlert = {
      type: 'SEVERE_ANEMIA',
      patient_cpf: bloodwork.patient.cpf,
      alert_date: new Date(),
      details: {
        hemoglobin: bloodwork.hemoglobin.value,
        hematocrit: bloodwork.hematocrit.value,
        mcv: bloodwork.mcv.value,
      },
    };

    // Here you would trigger the notification to the doctor
    // notifyDoctor(alert);

    return alert;
  }

  return null;
}
