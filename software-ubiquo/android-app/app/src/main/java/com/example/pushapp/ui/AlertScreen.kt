package com.example.pushapp.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.pushapp.network.dto.AlertDetails
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AlertScreen(alertId: String, alertType: String, alertViewModel: AlertViewModel = viewModel()) {
    
    LaunchedEffect(alertId, alertType) {
            alertViewModel.fetchAlertDetails(alertId, alertType)
    }

    Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("Detalhes do Alerta") }
            )
        }
    ) { paddingValues ->
        Column(
                modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
                when (val state = alertViewModel.uiState) {
                    is AlertUiState.Loading -> {
                        LoadingScreen()
                }
                is AlertUiState.Success -> {
                        AlertDetailsCard(alert = state.alert)
                }
                is AlertUiState.Error -> {
                        ErrorScreen(message = state.message)
                }
            }
        }
    }
}

@Composable
fun LoadingScreen() {
        Column(
            modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
            CircularProgressIndicator(modifier = Modifier.size(48.dp))
        Spacer(modifier = Modifier.height(16.dp))
        Text("Carregando detalhes do alerta...", style = MaterialTheme.typography.bodyMedium)
    }
}

@Composable
fun ErrorScreen(message: String) {
        Column(
            modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
            Icon(Icons.Default.Warning, contentDescription = "Error", tint = MaterialTheme.colorScheme.error, modifier = Modifier.size(48.dp))
        Spacer(modifier = Modifier.height(16.dp))
        Text(text = "Erro: $message", style = MaterialTheme.typography.bodyLarge, color = MaterialTheme.colorScheme.error)
        Text("Por favor, tente novamente mais tarde.", style = MaterialTheme.typography.bodyMedium)
    }
}

@Composable
fun AlertDetailsCard(alert: AlertDetails) {
        Card(
            modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
            Column(
                modifier = Modifier.padding(20.dp)
        ) {
                Text(
                    text = alert.title,
                style = MaterialTheme.typography.headlineSmall,
                color = MaterialTheme.colorScheme.primary,
                modifier = Modifier.padding(bottom = 8.dp)
            )

            Divider(modifier = Modifier.padding(vertical = 8.dp))

            AlertInfoRow(label = "ID do Alerta:", value = alert.id)

            val severityColor = when (alert.severity.lowercase(Locale.ROOT)) {
                    "alta" -> Color(0xFFB00020) // Red
                "média" -> Color(0xFFFFC107) // Amber
                "baixa" -> Color(0xFF4CAF50) // Green
                else -> MaterialTheme.colorScheme.onSurface
            }
            AlertInfoRow(label = "Gravidade:", value = alert.severity, valueColor = severityColor)

            val formattedDate = SimpleDateFormat("dd/MM/yyyy HH:mm", Locale.getDefault()).format(Date(alert.timestamp))
            AlertInfoRow(label = "Data/Hora:", value = formattedDate)

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                    text = "Descrição:",
                style = MaterialTheme.typography.titleMedium,
                modifier = Modifier.padding(bottom = 4.dp)
            )
            Text(
                    text = alert.description,
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
fun AlertInfoRow(label: String, value: String, valueColor: Color = MaterialTheme.colorScheme.onSurface) {
        Row(
            modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
            Text(text = label, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(text = value, style = MaterialTheme.typography.bodyLarge, color = valueColor)
    }
    Spacer(modifier = Modifier.height(4.dp))
}
