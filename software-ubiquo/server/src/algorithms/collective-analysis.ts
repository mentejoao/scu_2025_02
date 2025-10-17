import { DBSCAN } from 'density-clustering';
import { CollectiveAlert } from '../types/alerts';
import {
  getBaselineForRegion,
  getEosinophiliaCasesInWindow,
  getTotalTestsInArea,
} from '../database/db';
import { EosinophiliaCase } from '../database/schema';
import { sendPushNotification } from '../services/notification-service';

// --- Helper Functions ---

const calculateCentroid = (cluster: EosinophiliaCase[]): { lat: number; lon: number } => {
  const { lat, lon } = cluster.reduce(
    (acc, c) => ({ lat: acc.lat + c.latitude, lon: acc.lon + c.longitude }),
    { lat: 0, lon: 0 }
  );
  return { lat: lat / cluster.length, lon: lon / cluster.length };
};

const getDemographics = (
  cluster: EosinophiliaCase[]
): { avgAge: number; sexDist: { M: number; F: number } } => {
  const totalAge = cluster.reduce((sum, c) => sum + c.age, 0);
  const sexDistribution = cluster.reduce(
    (acc, c) => {
      acc[c.sex as keyof typeof acc]++;
      return acc;
    },
    { M: 0, F: 0 }
  );
  return { avgAge: totalAge / cluster.length, sexDist: sexDistribution };
};

const filterNonInfectiousCauses = (cluster: EosinophiliaCase[]): EosinophiliaCase[] => {
  console.log(
    `ANALYSIS: (Placeholder) Filtering ${cluster.length} cases for non-infectious causes.`
  );
  return cluster;
};

// --- Main Algorithm ---

/**
 * Analyzes for parasitosis outbreaks using DBSCAN clustering.
 * This function is designed to be run on a schedule (e.g., daily).
 *
 * @returns A promise that resolves to a list of CollectiveAlert objects for confirmed outbreaks.
 */
export async function analyzeParasitosisOutbreak(): Promise<CollectiveAlert[]> {
  console.log('\n--- STARTING PARASITOSIS OUTBREAK ANALYSIS ---');

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 30);

  const positiveCases = await getEosinophiliaCasesInWindow(startDate, endDate);
  if (positiveCases.length === 0) {
    console.log('ANALYSIS: No positive cases found in the window. No analysis needed.');
    return [];
  }
  console.log(`ANALYSIS: Found ${positiveCases.length} positive cases in the last 30 days.`);

  const dbscan = new DBSCAN();
  const dataset = positiveCases.map((c) => [c.latitude, c.longitude]);

  const epsilon = 0.02; // Approx 2km in degrees. For production, use a geo-library.
  const minPts = 5;

  console.log(`ANALYSIS: Running DBSCAN with epsilon=${epsilon} and minPts=${minPts}`);
  const clusterIndices: number[][] = dbscan.run(dataset, epsilon, minPts);
  console.log(`ANALYSIS: DBSCAN found ${clusterIndices.length} potential clusters.`);

  const collectiveAlerts: CollectiveAlert[] = [];

  for (const indices of clusterIndices) {
    let clusterCases = indices.map((i: number) => positiveCases[i]);

    clusterCases = filterNonInfectiousCauses(clusterCases);
    if (clusterCases.length < minPts) {
      console.log('ANALYSIS: Cluster discarded after filtering. Size fell below minPts.');
      continue;
    }

    const centroid = calculateCentroid(clusterCases);
    const municipality_id = clusterCases[0].municipality_id;

    const caseCount = clusterCases.length;
    const totalTestsInArea = await getTotalTestsInArea(
      centroid.lat,
      centroid.lon,
      2,
      startDate,
      endDate
    );
    if (totalTestsInArea === 0) continue;

    const observedRate = (caseCount / totalTestsInArea) * 1000;

    const month_year = endDate.toISOString().slice(0, 7);
    const baseline = await getBaselineForRegion(municipality_id, month_year);
    if (!baseline) {
      console.log(
        `WARNING: No baseline found for region ${municipality_id}. Cannot validate cluster.`
      );
      continue;
    }

    const { expected_rate_per_1000_tests, rate_standard_deviation } = baseline;
    const outbreakThreshold = expected_rate_per_1000_tests + 2 * rate_standard_deviation;

    console.log(
      `VALIDATION: Cluster @ (${centroid.lat.toFixed(4)}, ${centroid.lon.toFixed(4)}) -> Observed Rate: ${observedRate.toFixed(2)}/1000, Threshold: ${outbreakThreshold.toFixed(2)}/1000`
    );

    if (observedRate > outbreakThreshold) {
      console.log(`COLLECTIVE ALERT: Outbreak confirmed for region ${municipality_id}!`);
      const demographics = getDemographics(clusterCases);

      const alert: CollectiveAlert = {
        type: 'PARASITOSIS_OUTBREAK',
        alert_date: new Date(),
        location: {
          centroid_lat: centroid.lat,
          centroid_lon: centroid.lon,
          radius_meters: 2000,
          municipality_id: municipality_id,
        },
        statistics: {
          case_count: caseCount,
          observed_rate_per_1000: observedRate,
          expected_rate_per_1000: expected_rate_per_1000_tests,
          outbreak_threshold_per_1000: outbreakThreshold,
        },
        cluster_info: {
          average_age: demographics.avgAge,
          sex_distribution: demographics.sexDist,
        },
        case_ids: clusterCases.map((c: EosinophiliaCase) => c.id),
      };
      collectiveAlerts.push(alert);

      // TODO: Substituir pelo token real do gestor de saúde da região.
      const placeholderManagerToken =
        'dwNNV6rTTr2GIwmdzzjZra:APA91bEoPMgiVOG-UzeR8wgjjyUplSiUoR_ZPTODBi5QUpMSLmsveubJXEeI6BipvtonHBXkAmJFGPHZ9YpQh5yK73SsTDLLfzt2lFItdiWzFV5yHsiqMVs';

      sendPushNotification(
        placeholderManagerToken,
        alert.location.municipality_id, // Usando o ID do município como ID do alerta
        'Alerta de Surto de Parasitose',
        `Surto confirmado na região ${alert.location.municipality_id} com ${alert.statistics.case_count} casos.`
      );
    }
  }

  console.log(`--- ANALYSIS COMPLETE. ${collectiveAlerts.length} OUTBREAKS CONFIRMED. ---`);
  return collectiveAlerts;
}
