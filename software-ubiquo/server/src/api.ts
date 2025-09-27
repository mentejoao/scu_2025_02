import express from 'express';
import { analyzeSevereAnemia } from './algorithms/individual-analysis';
import { Bloodwork } from './types/bloodwork';

const app = express();
const port = 3000;

// Endpoint que o app Android vai chamar
app.get('/alert/:id', (req, res) => {
    const alertId = req.params.id;

    console.log(`Recebida requisição para o alerta com ID: ${alertId}`);

    const alertDetails = {
        id: alertId,
        title: "Alerta de Exemplo",
        description: "Esta é uma descrição detalhada do alerta gerado pelo servidor mock.",
        severity: "Alta",
        timestamp: Date.now()
    };

    res.json(alertDetails);
});

// Endpoint para testar o envio de notificação de anemia
app.get('/test-anemia-alert', (req, res) => {
    console.log('\n--- ACIONANDO TESTE DE ALERTA DE ANEMIA ---');

    // 1. Criar um exame de sangue mockado que com certeza vai gerar um alerta
    const mockBloodwork: Bloodwork = {
        id: 'exam-12345',
        patient: {
            name: 'João da Silva',
            cpf: '111.222.333-44',
            age: 43,
            sex: 'M',
            latitude: -23.5505,
            longitude: -46.6333,
            municipality_id: '3550308' // São Paulo
        },
        test_date: new Date(),
        hemoglobin: { value: 7.5 }, // Valor baixo para acionar o alerta
        hematocrit: { value: 25 },
        mcv: { value: 82 },
        // Adicionando o campo que faltava para completar o tipo
        eosinophils: { value: 100 }
    };

    // 2. Chamar a função de análise
    const alert = analyzeSevereAnemia(mockBloodwork);

    if (alert) {
        res.send('Análise de anemia acionada. Verifique seu dispositivo para uma notificação.');
    } else {
        res.send('Análise de anemia acionada, mas nenhum alerta foi gerado.');
    }
});

app.listen(port, () => {
    console.log(`Servidor mock rodando em http://localhost:${port}`);
});
