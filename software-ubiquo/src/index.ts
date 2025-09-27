import { analyzeSevereAnemia } from './algorithms/individual-analysis';
import { analyzeParasitosisOutbreak } from './algorithms/collective-analysis';
import { Bloodwork } from './types/bloodwork';

// --- EXPORTS --- //
export { analyzeSevereAnemia, analyzeParasitosisOutbreak };

// --- DEMONSTRATION --- //

function demonstrateIndividualAnalysis() {
  console.log('\n--- DEMONSTRATING INDIVIDUAL ANALYSIS ---');
  const normalBloodwork: Bloodwork = {
    id: 'bw-1',
    patient: {
      name: 'John Smith',
      cpf: '111.222.333-44',
      age: 45,
      sex: 'M',
      latitude: -16.7,
      longitude: -49.2,
      municipality_id: '5208707',
    },
    test_date: new Date(),
    hemoglobin: { value: 14.5 },
    hematocrit: { value: 45 },
    mcv: { value: 90 },
    eosinophils: { value: 150 },
  };

  const severeAnemiaBloodwork: Bloodwork = {
    id: 'bw-2',
    patient: {
      name: 'Maria Souza',
      cpf: '555.666.777-88',
      age: 62,
      sex: 'F',
      latitude: -16.7,
      longitude: -49.2,
      municipality_id: '5208707',
    },
    test_date: new Date(),
    hemoglobin: { value: 7.2 },
    hematocrit: { value: 24 },
    mcv: { value: 78 },
    eosinophils: { value: 100 },
  };

  console.log('\nAnalyzing normal bloodwork...');
  const normalResult = analyzeSevereAnemia(normalBloodwork);
  console.log('Result:', normalResult || 'No alert generated.');

  console.log('\nAnalyzing bloodwork with severe anemia...');
  const anemiaResult = analyzeSevereAnemia(severeAnemiaBloodwork);
  console.log('Result:', anemiaResult);
}

async function demonstrateCollectiveAnalysis() {
  try {
    const alerts = await analyzeParasitosisOutbreak();
    if (alerts.length > 0) {
      console.log('\n--- FINAL RESULT OF COLLECTIVE ANALYSIS ---');
      console.log('Generated outbreak alerts:', JSON.stringify(alerts, null, 2));
    }
  } catch (error) {
    console.error('An error occurred during the collective analysis:', error);
  }
}

async function main() {
  demonstrateIndividualAnalysis();
  await demonstrateCollectiveAnalysis();
}

main();
