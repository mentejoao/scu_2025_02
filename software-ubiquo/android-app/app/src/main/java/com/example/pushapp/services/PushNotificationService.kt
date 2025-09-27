package com.example.pushapp.services

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import com.example.pushapp.MainActivity
import com.example.pushapp.R
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class PushNotificationService : FirebaseMessagingService() {

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d(TAG, "Refreshed token: $token")
        // TODO: Enviar este token para o seu backend
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)

        val title = remoteMessage.notification?.title
        val body = remoteMessage.notification?.body
        // Assumindo que o backend envia o ID do alerta no campo 'data' da notificação
        val alertId = remoteMessage.data["alertId"]

        if (alertId != null && title != null && body != null) {
            sendNotification(title, body, alertId)
        }
    }

    private fun sendNotification(title: String, body: String, alertId: String) {
        // 1. Criar um Intent para abrir a MainActivity
        val intent = Intent(this, MainActivity::class.java).apply {
            // Adiciona o ID do alerta como um "extra" para a MainActivity poder ler
            putExtra(MainActivity.ALERT_ID_EXTRA, alertId)
            // Flags para gerenciar a pilha de atividades
            addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
        }

        // 2. Criar um PendingIntent, que é a "intenção pendente" que será disparada ao clicar na notificação
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent, PendingIntent.FLAG_ONE_SHOT or PendingIntent.FLAG_IMMUTABLE
        )

        val channelId = "default_channel_id"
        val notificationBuilder = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(android.R.drawable.ic_dialog_alert) // Ícone padrão do sistema
            .setContentTitle(title)
            .setContentText(body)
            .setAutoCancel(true) // A notificação some ao ser clicada
            .setContentIntent(pendingIntent)

        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        // 3. (Para Android 8.0+) É obrigatório criar um Canal de Notificação
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "Default Channel",
                NotificationManager.IMPORTANCE_DEFAULT
            )
            notificationManager.createNotificationChannel(channel)
        }

        // 4. Exibir a notificação
        notificationManager.notify(0, notificationBuilder.build())
    }

    companion object {
        private const val TAG = "PushNotificationService"
    }
}
