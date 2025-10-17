import * as admin from 'firebase-admin';

// Carrega as credenciais da conta de serviço
// O caminho é relativo à raiz do projeto onde o node é executado
const serviceAccount = require('../../serviceAccountKey.json');

// Inicializa o Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

/**
 * Envia uma notificação push para um dispositivo específico.
 * @param token O token de registro FCM do dispositivo de destino.
 * @param alertId O ID do alerta para ser enviado nos dados da mensagem.
 * @param title O título da notificação.
 * @param body O corpo do texto da notificação.
 */
export async function sendPushNotification(
  token: string,
  alertId: string,
  title: string,
  body: string
) {
  const message = {
    token: token,
    notification: {
      title: title,
      body: body,
    },
    data: {
      alertId: alertId,
    },
  };

  try {
    console.log(`Enviando notificação para o token: ${token}`);
    const response = await admin.messaging().send(message);
    console.log('Notificação enviada com sucesso:', response);
  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
  }
}
