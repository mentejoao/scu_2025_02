import { DBSCAN } from 'density-clustering';
import { CollectiveAlert } from '../types/alerts';
// Change to ../database/db
import {
  getBaselineForRegion,
  getEosinophiliaCasesInWindow,
  getMunicipalityNameById,
  getTotalTestsInArea,
} from '../database/db';
// Change to ../database/schema
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
  console.log(`DEBUG: Analysis window: ${startDate.toISOString()} to ${endDate.toISOString()}`);

  const positiveCases = await getEosinophiliaCasesInWindow(startDate, endDate);
  if (positiveCases.length === 0) {
    console.log('ANALYSIS: No positive cases found in the window. No analysis needed.');
    return [];
  }
  console.log(`ANALYSIS: Found ${positiveCases.length} positive cases in the last 30 days.`);
  console.log('DEBUG: Positive cases sample:', positiveCases.slice(0, 2));

  const dbscan = new DBSCAN();
  const dataset = positiveCases.map((c) => [c.latitude, c.longitude]);
  console.log('DEBUG: DBSCAN dataset size:', dataset.length);

  const epsilon = 0.02; // Approx 2km in degrees.
  const minPts = 5;

  console.log(`ANALYSIS: Running DBSCAN with epsilon=${epsilon} and minPts=${minPts}`);
  const clusterIndices: number[][] = dbscan.run(dataset, epsilon, minPts);
  console.log(`ANALYSIS: DBSCAN found ${clusterIndices.length} potential clusters.`);
  console.log('DEBUG: Raw cluster indices:', clusterIndices);

  const collectiveAlerts: CollectiveAlert[] = [];

  for (const [i, indices] of clusterIndices.entries()) {
    console.log(`\nDEBUG: Processing cluster #${i} with ${indices.length} cases.`);
    let clusterCases = indices.map((i: number) => positiveCases[i]);
    console.log('DEBUG: Cluster cases (before filter):', clusterCases.map(c => c.id));

    clusterCases = filterNonInfectiousCauses(clusterCases);

    if (clusterCases.length < minPts) {
      console.log(`ANALYSIS: Cluster #${i} discarded after filtering. Size fell below minPts (${clusterCases.length} < ${minPts}).`);
      continue;
    }
    console.log(`DEBUG: Cluster #${i} has ${clusterCases.length} cases after filtering.`);

    // 1. Group cases by municipality within the cluster
    const casesByMunicipality = new Map<string, EosinophiliaCase[]>();
    clusterCases.forEach((caseItem) => {
      const municipalityCases = casesByMunicipality.get(caseItem.municipality_id) || [];
      municipalityCases.push(caseItem);
      casesByMunicipality.set(caseItem.municipality_id, municipalityCases);
    });
    console.log(`DEBUG: Cluster #${i} spans ${casesByMunicipality.size} municipalities:`, Array.from(casesByMunicipality.keys()));

    const outbreakMunicipalitiesData = [];

    // 2. Analyze each municipality subgroup in the cluster
    for (const [municipality_id, municipalityCases] of casesByMunicipality.entries()) {
      console.log(`\nDEBUG: Analyzing municipality ${municipality_id} in cluster #${i}...`);
      if (municipalityCases.length === 0) {
        console.log(`DEBUG: Municipality ${municipality_id} has no cases, skipping.`);
        continue;
      }

      const centroid = calculateCentroid(municipalityCases);
      const caseCount = municipalityCases.length;
      console.log(`DEBUG: Municipality ${municipality_id} -> Centroid: ${JSON.stringify(centroid)}, Case Count: ${caseCount}`);

      const totalTestsInArea = await getTotalTestsInArea(
        centroid.lat,
        centroid.lon,
        2,
        startDate,
        endDate
      );
      console.log(`DEBUG: Municipality ${municipality_id} -> Total tests in area: ${totalTestsInArea}`);
      if (totalTestsInArea === 0) {
        console.log(`DEBUG: Municipality ${municipality_id} -> No tests found in area, skipping.`);
        continue;
      }

      const observedRate = (caseCount / totalTestsInArea) * 1000;
      const month_year = new Date(endDate.setFullYear(endDate.getFullYear() - 1)).toISOString().slice(0, 7);
      console.log(`DEBUG: Municipality ${municipality_id} -> Observed Rate: ${observedRate}/1000, for month: ${month_year}`);

      const baseline = await getBaselineForRegion(municipality_id, month_year);

      if (!baseline) {
        console.log(
          `WARNING: No baseline found for region ${municipality_id}. Cannot validate.`
        );
        continue;
      }
      console.log(`DEBUG: Municipality ${municipality_id} -> Fetched baseline:`, baseline);


      const { expected_rate_per_1000_tests, rate_standard_deviation } = baseline;
      const outbreakThreshold = expected_rate_per_1000_tests + 2 * rate_standard_deviation;

      console.log(
        `VALIDATION: Municipality ${municipality_id} -> Observed Rate: ${observedRate.toFixed(2)}/1000, Threshold: ${outbreakThreshold.toFixed(2)}/1000`
      );
      console.log(
        `DETAILS: Mun ${municipality_id} -> Cases: ${caseCount}, Expected Rate: ${expected_rate_per_1000_tests.toFixed(2)}, SD: ${rate_standard_deviation.toFixed(2)}, Threshold: ${outbreakThreshold.toFixed(2)}`
      );

      if (observedRate > outbreakThreshold) {
        console.log(`CONFIRMED: Outbreak conditions met for municipality ${municipality_id}.`);
        const outbreakData = {
          municipality_id,
          caseCount,
          observedRate,
          expected_rate_per_1000_tests,
          outbreakThreshold,
          cases: municipalityCases,
        };
        outbreakMunicipalitiesData.push(outbreakData);
        console.log(`DEBUG: Added outbreak data for municipality ${municipality_id}:`, outbreakData);
      } else {
        console.log(`DEBUG: Outbreak conditions NOT met for municipality ${municipality_id}.`);
      }
    }

    // 3. If outbreaks were found, create a single, combined alert for the cluster
    if (outbreakMunicipalitiesData.length > 0) {
      console.log(`\nDEBUG: Found ${outbreakMunicipalitiesData.length} municipalities with outbreak conditions in cluster #${i}. Creating collective alert...`);

      const involvedMunicipalities = await Promise.all(
        outbreakMunicipalitiesData.map(async (data) => ({
          municipality_id: data.municipality_id,
          municipality_name: await getMunicipalityNameById(data.municipality_id) || '',
          case_count: data.caseCount,
        }))
      );

      const combinedCaseCount = outbreakMunicipalitiesData.reduce(
        (sum, data) => sum + data.caseCount,
        0
      );
      const mainMunicipalityData = outbreakMunicipalitiesData[0];
      const allCases = outbreakMunicipalitiesData.flatMap((data) => data.cases);
      const clusterCentroid = calculateCentroid(allCases);
      const demographics = getDemographics(allCases);

      const alertId = `outbreak-cluster-${involvedMunicipalities
        .map((d) => d.municipality_id)
        .join('-')}`;

      const involvedMunicipalitiesStr = involvedMunicipalities
        .map((d) => `${d.municipality_name} (${d.case_count} casos)`)
        .join(', ');

      const alert: CollectiveAlert = {
        id: alertId,
        type: 'PARASITOSIS_OUTBREAK',
        alert_date: new Date(),
        location: {
          centroid_lat: clusterCentroid.lat,
          centroid_lon: clusterCentroid.lon,
          radius_meters: 2000,
          municipality_id: mainMunicipalityData.municipality_id,
          municipality_name: involvedMunicipalities[0].municipality_name,
        },
        statistics: {
          case_count: combinedCaseCount,
          observed_rate_per_1000: mainMunicipalityData.observedRate,
          expected_rate_per_1000: mainMunicipalityData.expected_rate_per_1000_tests,
          outbreak_threshold_per_1000: mainMunicipalityData.outbreakThreshold,
        },
        cluster_info: {
          average_age: demographics.avgAge,
          sex_distribution: demographics.sexDist,
          involved_municipalities: involvedMunicipalities,
        },
        case_ids: allCases.map((c: EosinophiliaCase) => c.id),
      };
      collectiveAlerts.push(alert);
      console.log('DEBUG: Created collective alert object:', alert);


      console.log(`COLLECTIVE ALERT: Outbreak confirmed for cluster involving municipalities: ${involvedMunicipalitiesStr} at Lat: ${clusterCentroid.lat.toFixed(2)}, Lon: ${clusterCentroid.lon.toFixed(2)}`);

      const placeholderManagerToken =
        'dwNNV6rTTr2GIwmdzzjZra:APA91bEoPMgiVOG-UzeR8wgjjyUplSiUoR_ZPTODBi5QUpMSLmsveubJXEeI6BipvtonHBXkAmJFGPHZ9YpQh5yK73SsTDLLfzt2lFItdiWzFV5yHsiqMVs';
      const notificationData = {
        alertType: 'PARASITOSIS_OUTBREAK',
        alertId: alert.id,
      };

      const notificationTitle = 'Alerta de Surto de Parasitose';
      const notificationBody = `Surto confirmado em ${involvedMunicipalitiesStr} (Lat: ${clusterCentroid.lat.toFixed(2)}, Lon: ${clusterCentroid.lon.toFixed(2)}). Total de ${combinedCaseCount} casos.`;
      const description = `Foi detectado um surto de parasitose na região de ${involvedMunicipalitiesStr}. Total de ${combinedCaseCount} casos confirmados. Por favor, verifique os detalhes e tome as medidas cabíveis.`;

      console.log('DEBUG: Preparing to send push notification...');
      await sendPushNotification(
        placeholderManagerToken,
        notificationData,
        notificationTitle,
        notificationBody,
        {
          id: alert.id,
          title: notificationTitle,
          description: description,
          severity: 'Alta',
          timestamp: new Date(),
          alert_type: 'PARASITOSIS_OUTBREAK',
          patient_cpf: null,
          municipality_id: mainMunicipalityData.municipality_id,
          notification_token: placeholderManagerToken,
        }
      );
      console.log('DEBUG: Push notification sent.');

    } else {
      console.log(`DEBUG: No outbreak conditions met in any municipality for cluster #${i}. No collective alert created.`);
    }
  }

  console.log(`--- ANALYSIS COMPLETE. ${collectiveAlerts.length} OUTBREAKS CONFIRMED. ---`);
  return collectiveAlerts;
}

