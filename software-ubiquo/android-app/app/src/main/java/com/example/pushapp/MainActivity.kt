package com.example.pushapp

import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.example.pushapp.ui.AlertScreen
import com.example.pushapp.ui.WelcomeScreen
import com.example.pushapp.ui.theme.PushAppTheme
import com.google.firebase.messaging.FirebaseMessaging

class MainActivity : ComponentActivity() {

    companion object {
        const val ALERT_ID_EXTRA = "ALERT_ID_EXTRA"
        const val ALERT_TYPE_EXTRA = "ALERT_TYPE_EXTRA"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Pega o token do FCM ativamente e imprime no Logcat
        FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
            if (!task.isSuccessful) {
                Log.w("FCM_TOKEN", "Fetching FCM registration token failed", task.exception)
                return@addOnCompleteListener
            }
            val token = task.result
            Log.d("FCM_TOKEN", "Current token is: $token")
        }

        val alertId = intent.getStringExtra(ALERT_ID_EXTRA)
        val alertType = intent.getStringExtra(ALERT_TYPE_EXTRA)

        setContent {
            PushAppTheme {
                Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
                    if (alertId != null && alertType != null) {
                        AlertScreen(alertId = alertId, alertType = alertType)
                    } else {
                        WelcomeScreen()
                    }
                }
            }
        }
    }
}