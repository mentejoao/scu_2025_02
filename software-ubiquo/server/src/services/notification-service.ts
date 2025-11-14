import * as admin from 'firebase-admin';
import { db } from '../database/connection';
import { notifications, NewNotification } from '../database/schema';
import { eq } from 'drizzle-orm';

// Carrega as credenciais da conta de serviço
// O caminho é relativo à raiz do projeto onde o node é executado
const serviceAccount = require('../../serviceAccountKey.json');

// Inicializa o Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

/**
 * Saves a notification to the database.
 */
export async function saveNotification(notificationData: NewNotification): Promise<void> {
  try {
    await db.insert(notifications).values(notificationData);
    console.log(`Notification saved to database with ID: ${notificationData.id}`);
  } catch (error) {
    console.error('Erro ao salvar notificação no banco de dados:', error);
    throw error;
  }
}

/**
 * Retrieves a notification by alertId.
 */
export async function getNotificationByAlertId(alertId: string) {
  try {
    const result = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, alertId))
      .limit(1);
    
    return result[0] || null;
  } catch (error) {
    console.error('Erro ao buscar notificação no banco de dados:', error);
    throw error;
  }
}

/**
 * Envia uma notificação push para um dispositivo específico e salva no banco de dados.
 * @param token O token de registro FCM do dispositivo de destino.
 * @param alertId O ID do alerta para ser enviado nos dados da mensagem.
 * @param title O título da notificação.
 * @param body O corpo do texto da notificação.
 * @param notificationData Dados adicionais para salvar no banco de dados.
 */
export async function sendPushNotification(
  token: string,
  data: { [key: string]: string },
  title: string,
  body: string,
  notificationData?: Omit<NewNotification, 'created_at'>
) {
  const message = {
    token: token,
    notification: {
      title: title,
      body: body,
    },
    data: data,
  };

  try {
    console.log(`Enviando notificação para o token: ${token}`);
    const response = await admin.messaging().send(message);
    console.log('Notificação enviada com sucesso:', response);

    // Save notification to database if notificationData is provided
    if (notificationData) {
      await saveNotification(notificationData);
    }
  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
    throw error;
  }
}
