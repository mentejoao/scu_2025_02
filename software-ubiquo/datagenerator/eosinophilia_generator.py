import json
import random
import os
from faker import Faker

fake = Faker("pt_BR")

OUTPUT_DIR = "out_eosinophilia"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def gerar_paciente_eosinofilia(i):
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

def gerar_eosinofilias(n=10):
    for i in range(1, n + 1):
        gerar_paciente_eosinofilia(i)

if __name__ == "__main__":
    gerar_eosinofilias(10)