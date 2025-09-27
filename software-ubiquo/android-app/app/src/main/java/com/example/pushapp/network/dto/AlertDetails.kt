package com.example.pushapp.network.dto

import com.google.gson.annotations.SerializedName

/**
 * ESTA É UMA CLASSE DE EXEMPLO.
 * Você deve ajustar os campos abaixo para que correspondam
 * exatamente à resposta JSON da sua API.
 */
data class AlertDetails(
    @SerializedName("id")
    val id: String,

    @SerializedName("title")
    val title: String,

    @SerializedName("description")
    val description: String,

    @SerializedName("severity")
    val severity: String,

    @SerializedName("timestamp")
    val timestamp: Long
)
