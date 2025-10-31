# Software para Computação Ubíqua - Android App

## Visão Geral

Este aplicativo Android integra-se ao backend para monitoramento em tempo real de condições clínicas a partir de hemogramas (FHIR), recebendo e exibindo alertas individuais (anemia severa) e coletivos (surtos de parasitose) para profissionais de saúde.

- Backend: Node.js/TypeScript
- Comunicação: HTTP REST + Push Notifications (Firebase Cloud Messaging)
- Repositório Backend: `software-ubiquo/server`

## Funcionalidades

- Recebe notificações push de alertas clínicos (via FCM)
- Exibe detalhes dos alertas recebidos (tipo, paciente, dados laboratoriais, localização, estatísticas)
- Permite consulta ao histórico de alertas
- Configuração de perfil/dispositivo para recebimento de notificações

## Estrutura do Projeto

```
android-app/
├── app/
│   ├── src/main/java/        # Código-fonte principal
│   ├── src/main/res/         # Recursos (layouts, strings, ícones)
│   ├── build.gradle.kts      # Configuração do módulo app
│   └── google-services.json  # Configuração Firebase
├── build.gradle.kts          # Configuração do projeto
├── gradle.properties         # Propriedades do Gradle
├── settings.gradle.kts       # Módulos do projeto
└── ...
```

## Configuração Inicial

1. **Firebase Cloud Messaging (FCM):**
   - Adicione o arquivo `google-services.json` ao diretório `app/`.
   - Configure o projeto Firebase para obter o token FCM do dispositivo.

2. **Permissões:**
   - Certifique-se de solicitar permissões para internet e notificações no `AndroidManifest.xml`.

3. **Backend URL:**
   - Configure a variável `BASE_URL` para apontar para o backend (ex: `10.0.2.2` para emulador).
   - Ajuste o `network_security_config` para liberar tráfego HTTP local, se necessário.

## Fluxo de Dados

1. Backend processa hemogramas FHIR e dispara alertas via FCM.
2. App recebe push notification e exibe alerta ao usuário.
3. Usuário pode consultar detalhes do alerta e histórico.

## Exemplo de Alerta Recebido

### Alerta Individual
```json
{
  "type": "SEVERE_ANEMIA",
  "patient_cpf": "111.222.333-44",
  "alert_date": "2025-10-17T03:00:00.000Z",
  "details": {
    "hemoglobin": 7.5,
    "hematocrit": 25,
    "mcv": 82
  }
}
```

### Alerta Coletivo
```json
{
  "id": "outbreak-5208707-1730000000000",
  "type": "PARASITOSIS_OUTBREAK",
  "alert_date": "2025-10-17T03:00:00.000Z",
  "location": {
    "centroid_lat": -16.68,
    "centroid_lon": -49.25,
    "radius_meters": 2000,
    "municipality_id": "5208707"
  },
  "statistics": {
    "case_count": 7,
    "observed_rate_per_1000": 35,
    "expected_rate_per_1000": 5,
    "outbreak_threshold_per_1000": 8
  },
  "cluster_info": {
    "average_age": 29.4,
    "sex_distribution": { "M": 3, "F": 4 }
  },
  "case_ids": ["case_1", "case_2", "case_3"]
}
```

## Principais Telas

- **Tela de Alertas:** Lista de alertas recebidos, com filtro por tipo/data.
- **Detalhe do Alerta:** Informações completas do alerta (dados laboratoriais, localização, estatísticas).
- **Configurações:** Gerenciamento de perfil, token FCM, backend URL.

## Testes e Debug

- Utilize o emulador Android para testes locais.
- Backend de desenvolvimento deve estar acessível via `10.0.2.2`.
- Teste envio de alertas usando endpoints de teste do backend:
  - `GET /test-anemia-alert`
  - `GET /test-parasitosis-outbreak`

## Referências

- [Documentação oficial do Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging/android/client)
- [Documentação Android](https://developer.android.com/)

## Equipe

- João Gabriel Cavalcante França
- José Carlos Lee
- Leonardo Moreira Araújo
- Luis Felipe Ferreira Silva
- Matheus Franco Cascão Costa

Projeto acadêmico — UFG Computação Ubíqua 2025.02
