package com.example.pushapp.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.pushapp.network.dto.AlertDetails

@Composable
fun AlertScreen(alertId: String, alertViewModel: AlertViewModel = viewModel()) {

    // Dispara a busca dos dados quando a tela é exibida pela primeira vez
    LaunchedEffect(alertId) {
        alertViewModel.fetchAlertDetails(alertId)
    }

    // Desenha a UI com base no estado do ViewModel
    when (val state = alertViewModel.uiState) {
        is AlertUiState.Loading -> {
            LoadingScreen()
        }
        is AlertUiState.Success -> {
            AlertDetailsScreen(alert = state.alert)
        }
        is AlertUiState.Error -> {
            ErrorScreen(message = state.message)
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
        CircularProgressIndicator()
    }
}

@Composable
fun ErrorScreen(message: String) {
    Column(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(text = message, style = MaterialTheme.typography.bodyLarge, color = MaterialTheme.colorScheme.error)
    }
}

@Composable
fun AlertDetailsScreen(alert: AlertDetails) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Text(text = alert.title, style = MaterialTheme.typography.headlineMedium)
        Text(text = "ID: ${alert.id}", style = MaterialTheme.typography.bodySmall)
        Text(text = "Gravidade: ${alert.severity}", style = MaterialTheme.typography.bodyMedium)
        Text(text = alert.description, style = MaterialTheme.typography.bodyLarge)
    }
}
