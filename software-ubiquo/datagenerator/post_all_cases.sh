#!/bin/bash

# Script para fazer POST de todos os casos para o servidor FHIR
# Usage: ./post_all_cases.sh

# Diretório com os arquivos JSON
DATA_DIR="out_anemia"

# URL do servidor FHIR
FHIR_URL="http://localhost:8080/fhir/Bundle"

# Contador de sucessos e falhas
SUCCESS_COUNT=0
FAILURE_COUNT=0

echo "============================================"
echo "Enviando casos para o servidor FHIR"
echo "============================================"
echo ""

# Verifica se o diretório existe
if [ ! -d "$DATA_DIR" ]; then
    echo "❌ Erro: Diretório '$DATA_DIR' não encontrado!"
    exit 1
fi

# Itera sobre todos os arquivos .json no diretório
for file in "$DATA_DIR"/*.json; do
    # Verifica se existem arquivos
    if [ ! -f "$file" ]; then
        echo "⚠️  Nenhum arquivo JSON encontrado em '$DATA_DIR'"
        exit 1
    fi
    
    filename=$(basename "$file")
    echo "📤 Enviando: $filename"
    
    # Faz o POST e captura o código de status HTTP
    http_code=$(curl -X POST \
        -H "Content-Type: application/fhir+json" \
        -d @"$file" \
        -w "%{http_code}" \
        -s -o /dev/null \
        "$FHIR_URL")
    
    # Verifica o resultado
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo "✅ Sucesso: $filename (HTTP $http_code)"
        ((SUCCESS_COUNT++))
    else
        echo "❌ Falha: $filename (HTTP $http_code)"
        ((FAILURE_COUNT++))
    fi
    echo ""
done

echo "============================================"
echo "Resumo:"
echo "  ✅ Sucessos: $SUCCESS_COUNT"
echo "  ❌ Falhas: $FAILURE_COUNT"
echo "  📊 Total: $((SUCCESS_COUNT + FAILURE_COUNT))"
echo "============================================"
