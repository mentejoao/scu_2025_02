package com.example.pushapp.network

import com.example.pushapp.network.dto.AlertDetails
import retrofit2.http.GET
import retrofit2.http.Path

interface ApiService {

    /**
     * ESTE É UM ENDPOINT DE EXEMPLO.
     * Ajuste o caminho (ex: "alerts/{id}") para corresponder ao seu endpoint real.
     */
    @GET("alert/{id}")
    suspend fun getAlertDetails(@Path("id") alertId: String): AlertDetails

}
