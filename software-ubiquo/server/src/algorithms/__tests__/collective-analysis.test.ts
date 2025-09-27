import { analyzeParasitosisOutbreak } from '../collective-analysis';
import { EosinophiliaCase, RegionalBaseline } from '../../database/types';
import * as mockDb from '../../database/mock-db';

// Mock the entire database module
jest.mock('../../database/mock-db');

// Type-safe mock functions
const mockedGetEosinophiliaCasesInWindow = jest.mocked(mockDb.getEosinophiliaCasesInWindow);
const mockedGetTotalTestsInArea = jest.mocked(mockDb.getTotalTestsInArea);
const mockedGetBaselineForRegion = jest.mocked(mockDb.getBaselineForRegion);

describe('analyzeParasitosisOutbreak', () => {
  beforeEach(() => {
    // Clear mock history before each test
    jest.clearAllMocks();
  });

  const mockBaseline: RegionalBaseline = {
    region_id: '5208707',
    month_year: new Date().toISOString().slice(0, 7),
    expected_rate_per_1000_tests: 10.0,
    rate_standard_deviation: 2.0, // Outbreak threshold will be 10 + 2*2 = 14
  };

  const createMockCase = (id: number, lat: number, lon: number): EosinophiliaCase => ({
    id: `case_${id}`,
    test_date: new Date(),
    eosinophils_value: 600,
    age: 30,
    sex: 'F',
    latitude: lat,
    longitude: lon,
    municipality_id: '5208707',
  });

  it('should return a CollectiveAlert when a statistically significant cluster is found', async () => {
    // Arrange: 5 cases clustered together
    const clusterCases = Array.from({ length: 5 }, (_, i) =>
      createMockCase(i, -16.68, -49.25 + i * 0.001)
    );
    mockedGetEosinophiliaCasesInWindow.mockResolvedValue(clusterCases);
    mockedGetTotalTestsInArea.mockResolvedValue(100); // (5 cases / 100 tests) * 1000 = 50, which is > 14
    mockedGetBaselineForRegion.mockResolvedValue(mockBaseline);

    // Act
    const alerts = await analyzeParasitosisOutbreak();

    // Assert
    expect(alerts).toHaveLength(1);
    expect(alerts[0].type).toBe('PARASITOSIS_OUTBREAK');
    expect(alerts[0].statistics.case_count).toBe(5);
    expect(alerts[0].statistics.observed_rate_per_1000).toBe(50);
  });

  it('should return no alerts if clusters are not statistically significant', async () => {
    // Arrange: 5 cases, but a high number of total tests, so the rate is low
    const clusterCases = Array.from({ length: 5 }, (_, i) =>
      createMockCase(i, -16.68, -49.25 + i * 0.001)
    );
    mockedGetEosinophiliaCasesInWindow.mockResolvedValue(clusterCases);
    mockedGetTotalTestsInArea.mockResolvedValue(500); // (5 cases / 500 tests) * 1000 = 10, which is < 14
    mockedGetBaselineForRegion.mockResolvedValue(mockBaseline);

    // Act
    const alerts = await analyzeParasitosisOutbreak();

    // Assert
    expect(alerts).toHaveLength(0);
  });

  it('should return no alerts if no clusters meet the minimum points requirement', async () => {
    // Arrange: Only 4 cases, which is less than the minPts of 5
    const clusterCases = Array.from({ length: 4 }, (_, i) =>
      createMockCase(i, -16.68, -49.25 + i * 0.001)
    );
    mockedGetEosinophiliaCasesInWindow.mockResolvedValue(clusterCases);

    // Act
    const alerts = await analyzeParasitosisOutbreak();

    // Assert
    expect(alerts).toHaveLength(0);
    // Verify we didn't even need to query the other DB functions
    expect(mockedGetTotalTestsInArea).not.toHaveBeenCalled();
    expect(mockedGetBaselineForRegion).not.toHaveBeenCalled();
  });

  it('should return no alerts if no positive cases are found', async () => {
    // Arrange: Zero cases returned from the DB
    mockedGetEosinophiliaCasesInWindow.mockResolvedValue([]);

    // Act
    const alerts = await analyzeParasitosisOutbreak();

    // Assert
    expect(alerts).toHaveLength(0);
  });
});
