// Test script to verify the fixes
const axios = require('axios');

async function testLocationSearch() {
  try {
    console.log('🔍 Testing global location search...');
    const response = await axios.get('http://localhost:3001/api/search-location?query=london');
    console.log('✅ Location search results:', response.data.results.slice(0, 3));
  } catch (error) {
    console.log('❌ Location search failed:', error.message);
  }
}

async function testRouteWithRiskAnalysis() {
  try {
    console.log('🛣️ Testing enhanced route analysis...');
    const response = await axios.post('http://localhost:3001/api/route', {
      start: { lat: 28.6139, lon: 77.2090 }, // Delhi
      end: { lat: 19.0760, lon: 72.8777 }    // Mumbai
    });
    
    console.log('✅ Route analysis results:');
    console.log('- Risk Level:', response.data.riskLevel);
    console.log('- Risk Score:', response.data.riskScore);
    console.log('- Risk Reasons:', response.data.riskReasons);
    console.log('- Affected Zones:', response.data.affectedZones?.length || 0);
  } catch (error) {
    console.log('❌ Route analysis failed:', error.message);
  }
}

async function testRiskDataWithReasons() {
  try {
    console.log('📊 Testing risk data with detailed reasons...');
    const response = await axios.get('http://localhost:3001/api/stats');
    console.log('✅ Risk statistics:', response.data);
  } catch (error) {
    console.log('❌ Risk data test failed:', error.message);
  }
}

async function runTests() {
  console.log('🧪 Running Aegis Enhancement Tests\n');
  
  await testLocationSearch();
  console.log('');
  
  await testRouteWithRiskAnalysis();
  console.log('');
  
  await testRiskDataWithReasons();
  console.log('');
  
  console.log('🎉 Tests completed!');
}

runTests();