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
export async function analyzeSevereAnemia(bloodwork: Bloodwork): Promise<IndividualAlert | null> {
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

    // Generate unique alertId
    const alertId = `anemia-${bloodwork.patient.cpf}-${Date.now()}`;

    // TODO: Substituir pelo token real do médico responsável por este paciente.
    const placeholderDoctorToken =
      'dwNNV6rTTr2GIwmdzzjZra:APA91bEoPMgiVOG-UzeR8wgjjyUplSiUoR_ZPTODBi5QUpMSLmsveubJXEeI6BipvtonHBXkAmJFGPHZ9YpQh5yK73SsTDLLfzt2lFItdiWzFV5yHsiqMVs';

    const notificationTitle = 'Alerta de Anemia Severa';
    const notificationBody = `Paciente ${bloodwork.patient.name} apresenta hemoglobina em ${bloodwork.hemoglobin.value} g/dL.`;
    const description = `O paciente ${bloodwork.patient.name} (CPF: ${bloodwork.patient.cpf}) apresenta níveis de hemoglobina muito baixos (${bloodwork.hemoglobin.value} g/dL), indicando anemia severa. Recomenda-se intervenção imediata.`;

    const data = {
      alertType: 'SEVERE_ANEMIA',
      alertId: alertId,
    };

    // Determine severity based on hemoglobin value
    let severity: 'Alta' | 'Média' | 'Baixa' = 'Média';
    if (bloodwork.hemoglobin.value < 7.0) {
      severity = 'Alta';
    } else if (bloodwork.hemoglobin.value < 8.0) {
      severity = 'Média';
    }

    await sendPushNotification(
      placeholderDoctorToken,
      data,
      notificationTitle,
      notificationBody,
      {
        id: alertId,
        title: notificationTitle,
        description: description,
        severity: severity,
        timestamp: new Date(),
        alert_type: 'SEVERE_ANEMIA',
        patient_cpf: bloodwork.patient.cpf,
        municipality_id: bloodwork.patient.municipality_id || null,
        notification_token: placeholderDoctorToken,
      }
    );

    return alert;
  }

  return null;
}
