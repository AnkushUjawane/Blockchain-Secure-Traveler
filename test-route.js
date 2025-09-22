// Quick test script for route functionality
const fetch = require('node-fetch');

async function testRoute() {
  try {
    const response = await fetch('http://localhost:3001/api/route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        start: { lat: 28.6139, lon: 77.2090 }, // Delhi Central
        end: { lat: 28.5355, lon: 77.3910 }    // Noida
      })
    });

    const result = await response.json();
    console.log('Route Result:', JSON.stringify(result, null, 2));
    
    console.log('\n=== Route Analysis ===');
    console.log(`Distance: ${result.distance} km`);
    console.log(`Duration: ${result.duration} minutes`);
    console.log(`Safety: ${result.isSafe ? 'SAFE' : 'UNSAFE'}`);
    console.log(`Risk Level: ${result.riskLevel}`);
    
    if (result.warnings?.length > 0) {
      console.log('\nWarnings:');
      result.warnings.forEach(warning => console.log(`- ${warning}`));
    }
    
    if (result.alternativeRoute) {
      console.log(`\nAlternative route available: ${result.alternativeRoute.distance} km`);
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testRoute();