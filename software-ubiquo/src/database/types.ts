export interface EosinophiliaCase {
  id: string;
  test_date: Date;
  eosinophils_value: number;
  age: number;
  sex: 'M' | 'F';
  latitude: number;
  longitude: number;
  municipality_id: string;
}

export interface GeolocatedTest {
  id: string;
  test_date: Date;
  latitude: number;
  longitude: number;
  municipality_id: string;
}

export interface RegionalBaseline {
  region_id: string; // municipality_id
  month_year: string; // "YYYY-MM"
  expected_rate_per_1000_tests: number;
  rate_standard_deviation: number;
}
