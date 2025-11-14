# Data Generator - Gerador de Dados FHIR

## Propósito

Este diretório contém scripts Python para **geração de dados sintéticos** no formato FHIR (Fast Healthcare Interoperability Resources), simulando casos clínicos de pacientes com condições hematológicas específicas.

## Scripts Disponíveis

### 1. `anemia_generator.py`

Gera casos sintéticos de **anemia ferropriva** com as seguintes características:

- **Perfil dos Pacientes**: Mulheres entre 20-70 anos
- **Dados Gerados**:
  - Informações demográficas (nome, CPF, data de nascimento)
  - Localização geográfica aleatória (coordenadas GPS no Brasil)
  - Hemograma com valores indicativos de anemia:
    - Hemoglobina: 5.5 - 8.0 g/dL (baixa)
    - Hematócrito: 18.0 - 30.0% (baixo)
    - VCM (Volume Corpuscular Médio): 60 - 80 fL (microcítica)

**Uso**:
```bash
python anemia_generator.py
```

**Saída**: Arquivos JSON no formato FHIR Bundle em `out_anemia/`

---

### 2. `eosinophilia_generator.py`

Gera casos sintéticos de **eosinofilia** com suporte para **simulação de surtos geográficos**:

- **Perfil dos Pacientes**: Homens entre 18-65 anos
- **Dados Gerados**:
  - Informações demográficas (nome, data de nascimento)
  - Localização geográfica:
    - Casos **concentrados** em área de surto (círculo de 500m)
    - Casos **aleatórios** distribuídos pelo Brasil
  - Contagem de eosinófilos: 700 - 2000 /uL (elevada)

**Funcionalidades Especiais**:
- **Simulação de Surto**: Permite concentrar um percentual dos casos em uma região específica
- **Coordenadas do Surto**: Centro em (LAT_OUTBREAK, LON_OUTBREAK) com raio de R metros
- **Distribuição Configurável**: Controla quantos casos ficam no surto vs. aleatórios

**Uso**:
```bash
python eosinophilia_generator.py
```


**Saída**: Arquivos JSON no formato FHIR Bundle em `out_eosinophilia/`

---

## Estrutura dos Dados (FHIR Bundle)

Cada arquivo JSON gerado contém um **FHIR Bundle** com:

1. **Recurso Patient**: Dados demográficos e localização geográfica
2. **Recursos Observation**: Resultados laboratoriais (hemograma)

## Dependências

```bash
pip install -r requirements.txt
```

Bibliotecas utilizadas:
- `faker`: Geração de dados fictícios (nomes, CPF, datas)
- `python-faker[pt_BR]`: Localização para Brasil

---

## Casos de Uso

Estes scripts são úteis para:

- ✅ **Testes de sistemas de vigilância epidemiológica**
- ✅ **Simulação de detecção de surtos geográficos**
- ✅ **Validação de algoritmos de análise coletiva**
- ✅ **Desenvolvimento sem uso de dados reais de pacientes**
- ✅ **Treinamento de modelos de Machine Learning**

---

## Notas Importantes

⚠️ **Dados Sintéticos**: Todos os dados gerados são fictícios e não representam pacientes reais.

⚠️ **Conformidade FHIR**: Os bundles seguem o padrão FHIR R4 para interoperabilidade com sistemas de saúde.
