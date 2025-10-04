import { Bloodwork } from '../types/bloodwork';
import { IndividualAlert } from '../types/alerts';
import { sendPushNotification } from '../services/notification-service';

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

    // TODO: Substituir pelo token real do médico responsável por este paciente.
    const placeholderDoctorToken =
      'd_x-qptvTN6wbUy146HUjc:APA91bGbQqYn72DIV7DDnTYCFB1ZjgyGYhFlypj1SaTdl76dY_y97dxSik7wQTfRVg5Wv7MIISWLwWaE9q3bfrcKt3ZP1jGenpIhg2KSDhrc76nt0cqrCaI';

    if (
      placeholderDoctorToken !==
      'd_x-qptvTN6wbUy146HUjc:APA91bGbQqYn72DIV7DDnTYCFB1ZjgyGYhFlypj1SaTdl76dY_y97dxSik7wQTfRVg5Wv7MIISWLwWaE9q3bfrcKt3ZP1jGenpIhg2KSDhrc76nt0cqrCaI'
    ) {
      sendPushNotification(
        placeholderDoctorToken,
        alert.patient_cpf, // Usando o CPF como um ID de alerta único
        'Alerta de Anemia Severa',
        `Paciente ${bloodwork.patient.name} apresenta hemoglobina em ${bloodwork.hemoglobin.value} g/dL.`
      );
    }

    return alert;
  }

  return null;
}
