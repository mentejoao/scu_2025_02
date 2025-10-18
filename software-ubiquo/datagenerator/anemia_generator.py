import json
import random
import os
from faker import Faker

fake = Faker("pt_BR")

OUTPUT_DIR = "out_anemia"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def gerar_paciente_anemia(i):
    lat = round(random.uniform(-33.0, -2.0), 6)
    lon = round(random.uniform(-60.0, -35.0), 6)
    nome = fake.first_name_female()
    sobrenome = fake.last_name()
    cpf = fake.cpf()

    bundle = {
        "resourceType": "Bundle",
        "id": f"anemia-bundle-{i:03d}",
        "type": "collection",
        "entry": [
            {
                "resource": {
                    "resourceType": "Patient",
                    "id": f"patient-anemia-{i:03d}",
                    "name": [{"given": [nome], "family": sobrenome}],
                    "gender": "female",
                    "birthDate": str(fake.date_of_birth(minimum_age=20, maximum_age=70)),
                    "identifier": [
                        {
                            "system": "http://www.saude.gov.br/fhir/r4/CodeSystem/BR-CPF",
                            "value": cpf,
                        }
                    ],
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
                    "id": f"hemoglobin-{i:03d}",
                    "code": {
                        "coding": [
                            {
                                "code": "718-7",
                                "display": "Hemoglobin",
                                "system": "http://loinc.org",
                            }
                        ]
                    },
                    "subject": {"reference": f"Patient/patient-anemia-{i:03d}"},
                    "effectiveDateTime": "2024-01-15T10:30:00Z",
                    "valueQuantity": {
                        "value": round(random.uniform(5.5, 8.0), 1),
                        "unit": "g/dL",
                    },
                }
            },
            {
                "resource": {
                    "resourceType": "Observation",
                    "id": f"hematocrit-{i:03d}",
                    "code": {
                        "coding": [
                            {
                                "code": "4544-3",
                                "display": "Hematocrit",
                                "system": "http://loinc.org",
                            }
                        ]
                    },
                    "subject": {"reference": f"Patient/patient-anemia-{i:03d}"},
                    "effectiveDateTime": "2024-01-15T10:30:00Z",
                    "valueQuantity": {
                        "value": round(random.uniform(18.0, 30.0), 1),
                        "unit": "%",
                    },
                }
            },
            {
                "resource": {
                    "resourceType": "Observation",
                    "id": f"mcv-{i:03d}",
                    "code": {
                        "coding": [
                            {
                                "code": "787-2",
                                "display": "Mean Corpuscular Volume",
                                "system": "http://loinc.org",
                            }
                        ]
                    },
                    "subject": {"reference": f"Patient/patient-anemia-{i:03d}"},
                    "effectiveDateTime": "2024-01-15T10:30:00Z",
                    "valueQuantity": {
                        "value": round(random.uniform(60, 80), 1),
                        "unit": "fL",
                    },
                }
            },
        ],
    }

    file_path = os.path.join(OUTPUT_DIR, f"anemia_case_{i:03d}.json")
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(bundle, f, indent=2, ensure_ascii=False)
    print(f"✅ Arquivo gerado: {file_path}")

def gerar_anemias(n=10):
    for i in range(1, n + 1):
        gerar_paciente_anemia(i)

if __name__ == "__main__":
    gerar_anemias(10)
