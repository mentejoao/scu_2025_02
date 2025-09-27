export interface Bloodwork {
  id: string;
  patient: {
    name: string;
    cpf: string;
    age: number;
    sex: 'M' | 'F';
    latitude: number;
    longitude: number;
    municipality_id: string;
  };
  test_date: Date;
  hemoglobin: {
    value: number; // g/dL
  };
  hematocrit: {
    value: number; // %
  };
  mcv: {
    value: number; // fL, Mean Corpuscular Volume
  };
  eosinophils: {
    value: number; // /uL
  };
}
