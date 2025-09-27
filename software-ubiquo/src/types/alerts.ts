export interface IndividualAlert {
  type: 'SEVERE_ANEMIA';
  patient_cpf: string;
  alert_date: Date;
  details: {
    hemoglobin: number;
    hematocrit: number;
    mcv: number;
  };
}

export interface CollectiveAlert {
  type: 'PARASITOSIS_OUTBREAK';
  alert_date: Date;
  location: {
    centroid_lat: number;
    centroid_lon: number;
    radius_meters: number;
    municipality_id: string;
  };
  statistics: {
    case_count: number;
    observed_rate_per_1000: number;
    expected_rate_per_1000: number;
    outbreak_threshold_per_1000: number;
  };
  cluster_info: {
    average_age: number;
    sex_distribution: { M: number; F: number };
  };
  case_ids: string[];
}
