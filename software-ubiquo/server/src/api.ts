import express, { Request, Response } from 'express';
import { analyzeSevereAnemia } from './algorithms/individual-analysis';
import { analyzeParasitosisOutbreak } from './algorithms/collective-analysis';
import { processFhirWebhook } from './services/fhir-service';
import { Bloodwork } from './types/bloodwork';
import { OperationOutcome, Bundle } from './types/fhir';

const app = express();
const port = 3000;

// Middleware for parsing JSON bodies
app.use(express.json());

// TODO: refactor this later
app.put('/fhir-webhook/Bundle/:id', async (req: Request, res: Response) => {
  const bundleId = req.params.id;
  console.log(`Received webhook for Bundle ID: ${bundleId}`);
  try {
    await processFhirWebhook(bundleId);

    // Respond to HAPI to acknowledge receipt
    const successOutcome: OperationOutcome = {
      resourceType: 'OperationOutcome',
      issue: [
        {
          severity: 'information',
          code: 'informational',
          diagnostics: 'Bundle received and fetched successfully',
        },
      ],
    };

    res.status(200).json(successOutcome);
  } catch (err) {
    console.error('Error processing webhook:', err);

    const errorOutcome: OperationOutcome = {
      resourceType: 'OperationOutcome',
      issue: [
        {
          severity: 'error',
          code: 'exception',
          diagnostics: String(err),
        },
      ],
    };

    res.status(500).json(errorOutcome);
  }
});

// Endpoint que o app Android vai chamar
app.get('/alert/:id', (req, res) => {
  const alertId = req.params.id;

  console.log(`Recebida requisição para o alerta com ID: ${alertId}`);

  const alertDetails = {
    id: alertId,
    title: 'Alerta de Exemplo',
    description: 'Esta é uma descrição detalhada do alerta gerado pelo servidor mock.',
    severity: 'Alta',
    timestamp: Date.now(),
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
      municipality_id: '3550308', // São Paulo
    },
    test_date: new Date(),
    hemoglobin: { value: 7.5 }, // Valor baixo para acionar o alerta
    hematocrit: { value: 25 },
    mcv: { value: 82 },
    // Adicionando o campo que faltava para completar o tipo
    eosinophils: { value: 100 },
  };

  // 2. Chamar a função de análise
  const alert = analyzeSevereAnemia(mockBloodwork);

  if (alert) {
    res.send('Análise de anemia acionada. Verifique seu dispositivo para uma notificação.');
  } else {
    res.send('Análise de anemia acionada, mas nenhum alerta foi gerado.');
  }
});

// Endpoint para testar o envio de notificação de surto de parasitose
app.get('/test-parasitosis-outbreak', async (req, res) => {
  console.log('\n--- ACIONANDO TESTE DE ALERTA DE SURTO DE PARASITOSE ---');
  try {
    const alerts = await analyzeParasitosisOutbreak();
    if (alerts.length > 0) {
      res.status(200).json({
        message: `${alerts.length} surto(s) de parasitose confirmado(s). Verifique os logs e seu dispositivo para notificações.`,
        alerts: alerts,
      });
    } else {
      res.status(200).json({
        message: 'Análise de surto de parasitose acionada, mas nenhum surto foi confirmado.',
        alerts: [],
      });
    }
  } catch (error) {
    console.error('Erro ao testar o alerta de surto de parasitose:', error);
    res.status(500).send('Erro ao processar a análise de surto de parasitose.');
  }
});

app.listen(port, () => {
  console.log(`Servidor mock rodando em http://localhost:${port}`);
});
