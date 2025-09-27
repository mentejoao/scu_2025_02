package com.example.pushapp.ui

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.pushapp.network.RetrofitClient
import com.example.pushapp.network.dto.AlertDetails
import kotlinx.coroutines.launch
import java.io.IOException

// Define os possíveis estados da nossa UI
sealed interface AlertUiState {
    data class Success(val alert: AlertDetails) : AlertUiState
    data class Error(val message: String) : AlertUiState
    object Loading : AlertUiState
}

class AlertViewModel : ViewModel() {

    // O estado da UI, observável pela nossa tela
    var uiState: AlertUiState by mutableStateOf(AlertUiState.Loading)
        private set

    // Função para buscar os detalhes do alerta
    fun fetchAlertDetails(alertId: String) {
        viewModelScope.launch {
            uiState = AlertUiState.Loading
            try {
                val alert = RetrofitClient.instance.getAlertDetails(alertId)
                uiState = AlertUiState.Success(alert)
            } catch (e: IOException) {
                uiState = AlertUiState.Error("Erro de conexão: ${e.message}")
            } catch (e: Exception) {
                uiState = AlertUiState.Error("Erro inesperado: ${e.message}")
            }
        }
    }
}
