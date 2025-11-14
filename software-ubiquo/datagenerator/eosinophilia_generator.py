import json
import random
import os
import math
from faker import Faker

fake = Faker("pt_BR")

OUTPUT_DIR = "out_eosinophilia"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Coordenadas do surto (outbreak)
LAT_OUTBREAK = -4.94714
LON_OUTBREAK = -47.5004
RAIO_OUTBREAK_METROS = 500  # raio em metros

def gerar_coordenadas_aleatorias_em_circulo(lat_centro, lon_centro, raio_metros):
    """
    Gera coordenadas aleatórias dentro de um círculo.
    
    Args:
        lat_centro: Latitude do centro
        lon_centro: Longitude do centro
        raio_metros: Raio do círculo em metros
    
    Returns:
        tuple: (latitude, longitude) do ponto aleatório
    """
    # Converter raio de metros para graus (aproximadamente)
    # 1 grau de latitude ≈ 111.320 km
    # 1 grau de longitude varia com a latitude, mas usamos uma aproximação
    raio_lat = raio_metros / 111320.0
    raio_lon = raio_metros / (111320.0 * abs(math.cos(math.radians(lat_centro))))
    
    # Gerar ângulo e distância aleatórios
    angulo = random.uniform(0, 2 * math.pi)
    # Usar raiz quadrada para distribuição uniforme no círculo
    distancia = math.sqrt(random.uniform(0, 1))
    
    # Calcular deslocamento
    delta_lat = distancia * raio_lat * math.cos(angulo)
    delta_lon = distancia * raio_lon * math.sin(angulo)
    
    # Retornar novas coordenadas
    return round(lat_centro + delta_lat, 6), round(lon_centro + delta_lon, 6)

def gerar_paciente_eosinofilia(i, usar_outbreak=False):
    # Determinar se este paciente está no surto ou espalhado aleatoriamente
    if usar_outbreak:
        lat, lon = gerar_coordenadas_aleatorias_em_circulo(
            LAT_OUTBREAK, LON_OUTBREAK, RAIO_OUTBREAK_METROS
        )
    else:
        # Coordenadas aleatórias em todo o Brasil
        lat = round(random.uniform(-33.0, -2.0), 6)
        lon = round(random.uniform(-60.0, -35.0), 6)
    
    nome = fake.first_name_male()
    sobrenome = fake.last_name()

    bundle = {
        "resourceType": "Bundle",
        "id": f"eos-bundle-{i:03d}",
        "type": "collection",
        "entry": [
            {
                "resource": {
                    "resourceType": "Patient",
                    "id": f"patient-eos-{i:03d}",
                    "name": [{"given": [nome], "family": sobrenome}],
                    "gender": "male",
                    "birthDate": str(fake.date_of_birth(minimum_age=18, maximum_age=65)),
                    "address": [
                        {
                            "extension": [
                                {
                                    "url": "http://hl7.org/fhir/StructureDefinition/geolocation",
                                    "extension": [
                                        {"url": "latitude", "valueDecimal": lat},
                                        {"url": "longitude", "valueDecimal": lon},
                                    ],
                                }
                            ]
                        }
                    ],
                }
            },
            {
                "resource": {
                    "resourceType": "Observation",
                    "id": f"eosinophils-{i:03d}",
                    "code": {
                        "coding": [
                            {
                                "code": "770-0",
                                "display": "Eosinophils",
                                "system": "http://loinc.org",
                            }
                        ]
                    },
                    "subject": {"reference": f"Patient/patient-eos-{i:03d}"},
                    "effectiveDateTime": "2024-01-15T10:30:00Z",
                    "valueQuantity": {
                        "value": round(random.uniform(700, 2000), 1),
                        "unit": "/uL",
                    },
                }
            },
        ],
    }

    file_path = os.path.join(OUTPUT_DIR, f"eosinofilia_case_{i:03d}.json")
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(bundle, f, indent=2, ensure_ascii=False)
    print(f"Arquivo gerado: {file_path}")

def gerar_eosinofilias(n=10, outbreak_percentage=0.0):
    """
    Gera casos de eosinofilia com distribuição controlada.
    
    Args:
        n: Número total de casos a gerar
        outbreak_percentage: Percentual de casos concentrados no surto (0.0 a 1.0)
                           Ex: 0.2 = 20% dos casos estarão próximos ao ponto de surto
    """
    num_outbreak = int(n * outbreak_percentage)
    num_aleatorios = n - num_outbreak
    
    print(f"\n{'='*60}")
    print(f"Gerando {n} casos de eosinofilia:")
    print(f"  - {num_outbreak} casos no surto (lat={LAT_OUTBREAK}, lon={LON_OUTBREAK}, raio={RAIO_OUTBREAK_METROS}m)")
    print(f"  - {num_aleatorios} casos aleatórios pelo Brasil")
    print(f"{'='*60}\n")
    
    # Gerar casos do surto (primeiros casos)
    for i in range(1, num_outbreak + 1):
        gerar_paciente_eosinofilia(i, usar_outbreak=True)
    
    # Gerar casos aleatórios
    for i in range(num_outbreak + 1, n + 1):
        gerar_paciente_eosinofilia(i, usar_outbreak=False)
    
    print(f"\n{'='*60}")
    print(f"Total de {n} arquivos gerados em '{OUTPUT_DIR}/'")
    print(f"{'='*60}\n")

if __name__ == "__main__":
    # Exemplo: gerar 100 casos, sendo 20% (20 casos) no surto
    gerar_eosinofilias(100, 0.2)