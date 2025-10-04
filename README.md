# Software para Computação Ubíqua - 2025.02

#### Alunos:
* João Gabriel Cavalcante França
* José Carlos Lee
* Leonardo Moreira Araújo
* Luis Felipe Ferreira Silva
* Matheus Franco Cascão Costa

##### Repositório para o projeto da matéria Software para Computação Ubíqua, ministrada pelo prof. Fabio Nogueira de Lucena


#TODO: melhorar a doc.
Passos para executar:
1. iniciar hapi server
2. cadastrar uma observation

curl -X POST \
  -H "Content-Type: application/fhir+json" \
  -d @teste-json.json \
  http://localhost:8080/fhir/Bundle