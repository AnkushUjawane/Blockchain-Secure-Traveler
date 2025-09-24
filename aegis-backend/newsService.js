const axios = require('axios');
const cheerio = require('cheerio');

// Major Indian cities with coordinates
const INDIAN_CITIES = {
  'Mumbai': { lat: 19.0760, lon: 72.8777, state: 'Maharashtra' },
  'Delhi': { lat: 28.6139, lon: 77.2090, state: 'Delhi' },
  'Bangalore': { lat: 12.9716, lon: 77.5946, state: 'Karnataka' },
  'Hyderabad': { lat: 17.3850, lon: 78.4867, state: 'Telangana' },
  'Chennai': { lat: 13.0827, lon: 80.2707, state: 'Tamil Nadu' },
  'Kolkata': { lat: 22.5726, lon: 88.3639, state: 'West Bengal' },
  'Pune': { lat: 18.5204, lon: 73.8567, state: 'Maharashtra' },
  'Ahmedabad': { lat: 23.0225, lon: 72.5714, state: 'Gujarat' },
  'Jaipur': { lat: 26.9124, lon: 75.7873, state: 'Rajasthan' },
  'Surat': { lat: 21.1702, lon: 72.8311, state: 'Gujarat' },
  'Lucknow': { lat: 26.8467, lon: 80.9462, state: 'Uttar Pradesh' },
  'Kanpur': { lat: 26.4499, lon: 80.3319, state: 'Uttar Pradesh' },
  'Nagpur': { lat: 21.1458, lon: 79.0882, state: 'Maharashtra' },
  'Indore': { lat: 22.7196, lon: 75.8577, state: 'Madhya Pradesh' },
  'Bhopal': { lat: 23.2599, lon: 77.4126, state: 'Madhya Pradesh' },
  'Visakhapatnam': { lat: 17.6868, lon: 83.2185, state: 'Andhra Pradesh' },
  'Patna': { lat: 25.5941, lon: 85.1376, state: 'Bihar' },
  'Vadodara': { lat: 22.3072, lon: 73.1812, state: 'Gujarat' },
  'Ghaziabad': { lat: 28.6692, lon: 77.4538, state: 'Uttar Pradesh' },
  'Ludhiana': { lat: 30.9010, lon: 75.8573, state: 'Punjab' },
  'Agra': { lat: 27.1767, lon: 78.0081, state: 'Uttar Pradesh' },
  'Nashik': { lat: 19.9975, lon: 73.7898, state: 'Maharashtra' },
  'Faridabad': { lat: 28.4089, lon: 77.3178, state: 'Haryana' },
  'Meerut': { lat: 28.9845, lon: 77.7064, state: 'Uttar Pradesh' },
  'Rajkot': { lat: 22.3039, lon: 70.8022, state: 'Gujarat' },
  'Kalyan': { lat: 19.2403, lon: 73.1305, state: 'Maharashtra' },
  'Vasai': { lat: 19.4912, lon: 72.8054, state: 'Maharashtra' },
  'Varanasi': { lat: 25.3176, lon: 82.9739, state: 'Uttar Pradesh' },
  'Srinagar': { lat: 34.0837, lon: 74.7973, state: 'Jammu and Kashmir' },
  'Aurangabad': { lat: 19.8762, lon: 75.3433, state: 'Maharashtra' },
  'Dhanbad': { lat: 23.7957, lon: 86.4304, state: 'Jharkhand' },
  'Amritsar': { lat: 31.6340, lon: 74.8723, state: 'Punjab' },
  'Navi Mumbai': { lat: 19.0330, lon: 73.0297, state: 'Maharashtra' },
  'Allahabad': { lat: 25.4358, lon: 81.8463, state: 'Uttar Pradesh' },
  'Ranchi': { lat: 23.3441, lon: 85.3096, state: 'Jharkhand' },
  'Howrah': { lat: 22.5958, lon: 88.2636, state: 'West Bengal' },
  'Coimbatore': { lat: 11.0168, lon: 76.9558, state: 'Tamil Nadu' },
  'Jabalpur': { lat: 23.1815, lon: 79.9864, state: 'Madhya Pradesh' },
  'Gwalior': { lat: 26.2183, lon: 78.1828, state: 'Madhya Pradesh' },
  'Vijayawada': { lat: 16.5062, lon: 80.6480, state: 'Andhra Pradesh' },
  'Jodhpur': { lat: 26.2389, lon: 73.0243, state: 'Rajasthan' },
  'Madurai': { lat: 9.9252, lon: 78.1198, state: 'Tamil Nadu' },
  'Raipur': { lat: 21.2514, lon: 81.6296, state: 'Chhattisgarh' },
  'Kota': { lat: 25.2138, lon: 75.8648, state: 'Rajasthan' },
  'Chandigarh': { lat: 30.7333, lon: 76.7794, state: 'Chandigarh' },
  'Guwahati': { lat: 26.1445, lon: 91.7362, state: 'Assam' },
  'Solapur': { lat: 17.6599, lon: 75.9064, state: 'Maharashtra' },
  'Hubli': { lat: 15.3647, lon: 75.1240, state: 'Karnataka' },
  'Bareilly': { lat: 28.3670, lon: 79.4304, state: 'Uttar Pradesh' },
  'Moradabad': { lat: 28.8386, lon: 78.7733, state: 'Uttar Pradesh' },
  'Mysore': { lat: 12.2958, lon: 76.6394, state: 'Karnataka' },
  'Gurgaon': { lat: 28.4595, lon: 77.0266, state: 'Haryana' },
  'Aligarh': { lat: 27.8974, lon: 78.0880, state: 'Uttar Pradesh' },
  'Jalandhar': { lat: 31.3260, lon: 75.5762, state: 'Punjab' },
  'Tiruchirappalli': { lat: 10.7905, lon: 78.7047, state: 'Tamil Nadu' },
  'Bhubaneswar': { lat: 20.2961, lon: 85.8245, state: 'Odisha' },
  'Salem': { lat: 11.6643, lon: 78.1460, state: 'Tamil Nadu' },
  'Warangal': { lat: 17.9689, lon: 79.5941, state: 'Telangana' },
  'Mira': { lat: 19.2952, lon: 72.8694, state: 'Maharashtra' },
  'Thiruvananthapuram': { lat: 8.5241, lon: 76.9366, state: 'Kerala' },
  'Bhiwandi': { lat: 19.3002, lon: 73.0635, state: 'Maharashtra' },
  'Saharanpur': { lat: 29.9680, lon: 77.5552, state: 'Uttar Pradesh' },
  'Guntur': { lat: 16.3067, lon: 80.4365, state: 'Andhra Pradesh' },
  'Amravati': { lat: 20.9374, lon: 77.7796, state: 'Maharashtra' },
  'Bikaner': { lat: 28.0229, lon: 73.3119, state: 'Rajasthan' },
  'Noida': { lat: 28.5355, lon: 77.3910, state: 'Uttar Pradesh' },
  'Jamshedpur': { lat: 22.8046, lon: 86.2029, state: 'Jharkhand' },
  'Bhilai Nagar': { lat: 21.1938, lon: 81.3509, state: 'Chhattisgarh' },
  'Cuttack': { lat: 20.4625, lon: 85.8828, state: 'Odisha' },
  'Firozabad': { lat: 27.1592, lon: 78.3957, state: 'Uttar Pradesh' },
  'Kochi': { lat: 9.9312, lon: 76.2673, state: 'Kerala' },
  'Bhavnagar': { lat: 21.7645, lon: 72.1519, state: 'Gujarat' },
  'Dehradun': { lat: 30.3165, lon: 78.0322, state: 'Uttarakhand' },
  'Durgapur': { lat: 23.4820, lon: 87.3119, state: 'West Bengal' },
  'Asansol': { lat: 23.6739, lon: 86.9524, state: 'West Bengal' },
  'Nanded': { lat: 19.1383, lon: 77.3210, state: 'Maharashtra' },
  'Kolhapur': { lat: 16.7050, lon: 74.2433, state: 'Maharashtra' },
  'Ajmer': { lat: 26.4499, lon: 74.6399, state: 'Rajasthan' },
  'Akola': { lat: 20.7002, lon: 77.0082, state: 'Maharashtra' },
  'Gulbarga': { lat: 17.3297, lon: 76.8343, state: 'Karnataka' },
  'Jamnagar': { lat: 22.4707, lon: 70.0577, state: 'Gujarat' },
  'Ujjain': { lat: 23.1765, lon: 75.7885, state: 'Madhya Pradesh' },
  'Loni': { lat: 28.7333, lon: 77.2833, state: 'Uttar Pradesh' },
  'Siliguri': { lat: 26.7271, lon: 88.3953, state: 'West Bengal' },
  'Jhansi': { lat: 25.4484, lon: 78.5685, state: 'Uttar Pradesh' },
  'Ulhasnagar': { lat: 19.2215, lon: 73.1645, state: 'Maharashtra' },
  'Jammu': { lat: 32.7266, lon: 74.8570, state: 'Jammu and Kashmir' },
  'Sangli': { lat: 16.8524, lon: 74.5815, state: 'Maharashtra' },
  'Mangalore': { lat: 12.9141, lon: 74.8560, state: 'Karnataka' },
  'Erode': { lat: 11.3410, lon: 77.7172, state: 'Tamil Nadu' },
  'Belgaum': { lat: 15.8497, lon: 74.4977, state: 'Karnataka' },
  'Ambattur': { lat: 13.1143, lon: 80.1548, state: 'Tamil Nadu' },
  'Tirunelveli': { lat: 8.7139, lon: 77.7567, state: 'Tamil Nadu' },
  'Malegaon': { lat: 20.5579, lon: 74.5287, state: 'Maharashtra' },
  'Gaya': { lat: 24.7914, lon: 85.0002, state: 'Bihar' },
  'Jalgaon': { lat: 21.0077, lon: 75.5626, state: 'Maharashtra' },
  'Udaipur': { lat: 24.5854, lon: 73.7125, state: 'Rajasthan' },
  'Maheshtala': { lat: 22.4967, lon: 88.2467, state: 'West Bengal' }
};

// Disaster keywords for news analysis
const DISASTER_KEYWORDS = {
  flood: ['flood', 'flooding', 'waterlogged', 'inundated', 'deluge', 'overflow'],
  cyclone: ['cyclone', 'storm', 'hurricane', 'typhoon', 'wind storm'],
  earthquake: ['earthquake', 'tremor', 'seismic', 'quake'],
  landslide: ['landslide', 'mudslide', 'slope failure', 'hill collapse'],
  fire: ['fire', 'wildfire', 'blaze', 'inferno'],
  heatwave: ['heat wave', 'extreme heat', 'temperature soars'],
  drought: ['drought', 'water scarcity', 'dry spell'],
  heavy_rain: ['heavy rain', 'torrential rain', 'downpour', 'monsoon'],
  traffic: ['traffic jam', 'road block', 'congestion', 'accident']
};

class NewsService {
  constructor() {
    this.riskZones = new Map();
    this.lastUpdate = null;
  }

  // Fetch news from multiple sources
  async fetchDisasterNews() {
    try {
      console.log('📰 News sources: Using enhanced simulation mode');
      
      // Generate simulated news data for demo
      const simulatedNews = this.generateSimulatedNews();
      
      return this.processNewsData(simulatedNews);
    } catch (error) {
      console.error('Error processing news data:', error);
      return this.getFallbackData();
    }
  }
  
  // Generate simulated news for demo
  generateSimulatedNews() {
    const newsTemplates = [
      { title: 'Heavy rainfall warning issued for Mumbai region', description: 'IMD issues red alert for Mumbai and surrounding areas due to heavy monsoon rains', disaster: 'flood' },
      { title: 'Cyclone formation detected in Bay of Bengal', description: 'Weather department tracks cyclonic disturbance approaching eastern coast', disaster: 'cyclone' },
      { title: 'Landslide alert for hill stations in Uttarakhand', description: 'Heavy rains trigger landslide warnings in mountainous regions', disaster: 'landslide' },
      { title: 'Heatwave conditions prevail in northern plains', description: 'Temperature soars above 45°C in Delhi and surrounding areas', disaster: 'heatwave' },
      { title: 'Forest fire reported in Himachal Pradesh', description: 'Wildfire spreads across forest areas due to dry conditions', disaster: 'fire' },
      { title: 'Earthquake tremors felt in northeastern states', description: 'Moderate intensity earthquake recorded in Assam region', disaster: 'earthquake' }
    ];
    
    return newsTemplates.map(template => ({
      title: template.title,
      description: template.description,
      publishedAt: new Date().toISOString(),
      source: 'Simulation'
    }));
  }

  // News API integration (disabled for demo)
  async fetchFromNewsAPI() {
    // NewsAPI requires valid API key - using fallback for demo
    console.log('NewsAPI: Using demo mode (requires API key)');
    return [];
  }

  // NDTV scraping (disabled for demo due to CORS)
  async fetchFromNDTV() {
    console.log('NDTV: Scraping disabled (CORS restrictions)');
    return [];
  }

  // Times of India scraping (disabled for demo due to CORS)
  async fetchFromTimesOfIndia() {
    console.log('TOI: Scraping disabled (CORS restrictions)');
    return [];
  }

  // Process news data to extract risk information from any location
  processNewsData(articles) {
    const riskZones = [];
    const processedLocations = new Set();

    articles.forEach(article => {
      const text = `${article.title} ${article.description}`.toLowerCase();
      
      // Extract any location mentions using pattern matching
      const locationMatches = this.extractLocations(text);
      
      locationMatches.forEach(location => {
        const locationKey = `${location.name}_${location.state || 'unknown'}`;
        if (!processedLocations.has(locationKey)) {
          const risks = this.analyzeDisasterRisk(text);
          
          if (risks.length > 0) {
            processedLocations.add(locationKey);
            
            const riskLevel = this.calculateRiskLevel(risks, text);
            
            riskZones.push({
              lat: location.lat,
              lon: location.lon,
              name: location.name,
              state: location.state || 'India',
              risk: riskLevel,
              disaster: risks.join(', '),
              color: this.getRiskColor(riskLevel),
              confidence: this.calculateConfidence(text, risks),
              lastUpdated: new Date().toISOString(),
              newsSource: article.source,
              newsTitle: article.title,
              riskScore: this.calculateRiskScore(riskLevel, text, risks),
              reasons: this.generateRiskReasons(risks, text, riskLevel),
              locationType: location.type
            });
          }
        }
      });
    });

    // Add distributed risk zones across India
    this.addDistributedRiskZones(riskZones, processedLocations);
    
    return riskZones;
  }

  // Extract locations from text using patterns and known cities
  extractLocations(text) {
    const locations = [];
    
    // Check major cities first
    Object.keys(INDIAN_CITIES).forEach(city => {
      if (text.includes(city.toLowerCase())) {
        locations.push({
          ...INDIAN_CITIES[city],
          name: city,
          type: 'city'
        });
      }
    });
    
    // Extract district/village patterns
    const locationPatterns = [
      /([a-z]+(?:\s+[a-z]+)*?)\s+district/g,
      /([a-z]+(?:\s+[a-z]+)*?)\s+village/g,
      /([a-z]+(?:\s+[a-z]+)*?)\s+tehsil/g,
      /([a-z]+(?:\s+[a-z]+)*?)\s+block/g,
      /([a-z]+(?:\s+[a-z]+)*?)\s+taluka/g
    ];
    
    locationPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const locationName = this.capitalizeWords(match[1]);
        if (locationName.length > 2 && !locations.find(l => l.name === locationName)) {
          const coords = this.estimateCoordinates(locationName, text);
          locations.push({
            name: locationName,
            lat: coords.lat,
            lon: coords.lon,
            state: this.extractState(text) || 'India',
            type: 'district/village'
          });
        }
      }
    });
    
    return locations;
  }
  
  // Estimate coordinates for unknown locations
  estimateCoordinates(locationName, text) {
    // Try to find nearby known city for better estimation
    const nearbyCity = this.findNearbyKnownCity(text);
    
    if (nearbyCity) {
      // Add small random offset from known city
      return {
        lat: nearbyCity.lat + (Math.random() - 0.5) * 0.5,
        lon: nearbyCity.lon + (Math.random() - 0.5) * 0.5
      };
    }
    
    // Default to random location in India
    return {
      lat: 20 + Math.random() * 15, // India latitude range
      lon: 68 + Math.random() * 30  // India longitude range
    };
  }
  
  // Find nearby known city from text
  findNearbyKnownCity(text) {
    for (const city of Object.keys(INDIAN_CITIES)) {
      if (text.includes(city.toLowerCase())) {
        return INDIAN_CITIES[city];
      }
    }
    return null;
  }
  
  // Extract state from text
  extractState(text) {
    const states = [
      'maharashtra', 'uttar pradesh', 'bihar', 'west bengal', 'madhya pradesh',
      'tamil nadu', 'rajasthan', 'karnataka', 'gujarat', 'andhra pradesh',
      'odisha', 'telangana', 'kerala', 'jharkhand', 'assam', 'punjab',
      'chhattisgarh', 'haryana', 'delhi', 'jammu and kashmir', 'uttarakhand'
    ];
    
    for (const state of states) {
      if (text.includes(state)) {
        return this.capitalizeWords(state);
      }
    }
    return null;
  }
  
  // Capitalize words
  capitalizeWords(str) {
    return str.replace(/\b\w/g, l => l.toUpperCase());
  }

  // Analyze text for disaster types
  analyzeDisasterRisk(text) {
    const foundRisks = [];
    
    Object.keys(DISASTER_KEYWORDS).forEach(disaster => {
      const keywords = DISASTER_KEYWORDS[disaster];
      if (keywords.some(keyword => text.includes(keyword))) {
        foundRisks.push(disaster);
      }
    });

    return foundRisks;
  }

  // Calculate risk level based on disaster types and text intensity
  calculateRiskLevel(risks, text) {
    const highRiskDisasters = ['cyclone', 'earthquake', 'flood', 'landslide', 'fire'];
    const mediumRiskDisasters = ['heavy_rain', 'heatwave', 'traffic'];
    const urgentWords = ['emergency', 'alert', 'warning', 'evacuate', 'severe', 'red alert', 'orange alert'];
    const criticalWords = ['death', 'casualties', 'rescue', 'stranded', 'trapped'];
    
    const hasHighRisk = risks.some(risk => highRiskDisasters.includes(risk));
    const hasMediumRisk = risks.some(risk => mediumRiskDisasters.includes(risk));
    const hasUrgentWords = urgentWords.some(word => text.includes(word));
    const hasCriticalWords = criticalWords.some(word => text.includes(word));
    
    // High risk conditions
    if ((hasHighRisk && hasUrgentWords) || hasCriticalWords) return 'High';
    if (hasHighRisk || (hasMediumRisk && hasUrgentWords)) return 'Medium';
    if (hasMediumRisk) return 'Low';
    
    return 'Low';
  }

  // Calculate confidence based on text analysis
  calculateConfidence(text, risks) {
    let confidence = 60;
    
    // More specific keywords increase confidence
    if (text.includes('alert') || text.includes('warning')) confidence += 20;
    if (text.includes('imd') || text.includes('meteorological')) confidence += 15;
    if (risks.length > 1) confidence += 10;
    
    return Math.min(95, confidence);
  }

  // Get risk color
  getRiskColor(riskLevel) {
    switch (riskLevel) {
      case 'High': return '#dc2626';
      case 'Medium': return '#f59e0b';
      default: return '#10b981';
    }
  }

  // Add distributed risk zones across India including rural areas
  addDistributedRiskZones(riskZones, processedLocations) {
    const distributedZones = [
      // Major cities
      { name: 'Mumbai', lat: 19.0760, lon: 72.8777, state: 'Maharashtra', type: 'city' },
      { name: 'Delhi', lat: 28.6139, lon: 77.2090, state: 'Delhi', type: 'city' },
      { name: 'Bangalore', lat: 12.9716, lon: 77.5946, state: 'Karnataka', type: 'city' },
      
      // Rural and smaller areas
      { name: 'Sundarbans', lat: 21.9497, lon: 89.1833, state: 'West Bengal', type: 'rural' },
      { name: 'Kutch District', lat: 23.7337, lon: 69.8597, state: 'Gujarat', type: 'district' },
      { name: 'Ladakh Region', lat: 34.1526, lon: 77.5771, state: 'Ladakh', type: 'region' },
      { name: 'Andaman Islands', lat: 11.7401, lon: 92.6586, state: 'Andaman & Nicobar', type: 'island' },
      { name: 'Lakshadweep', lat: 10.5667, lon: 72.6417, state: 'Lakshadweep', type: 'island' },
      { name: 'Chamoli District', lat: 30.4000, lon: 79.3167, state: 'Uttarakhand', type: 'mountain' },
      { name: 'Wayanad', lat: 11.6854, lon: 76.1320, state: 'Kerala', type: 'hill_station' },
      { name: 'Mahabaleshwar', lat: 17.9242, lon: 73.6578, state: 'Maharashtra', type: 'hill_station' },
      { name: 'Rann of Kutch', lat: 24.0000, lon: 70.0000, state: 'Gujarat', type: 'desert' },
      { name: 'Thar Desert', lat: 27.0000, lon: 71.0000, state: 'Rajasthan', type: 'desert' },
      { name: 'Konkan Coast', lat: 16.0000, lon: 73.5000, state: 'Maharashtra', type: 'coastal' },
      { name: 'Malabar Coast', lat: 11.0000, lon: 75.5000, state: 'Kerala', type: 'coastal' },
      { name: 'Eastern Ghats', lat: 14.0000, lon: 79.0000, state: 'Andhra Pradesh', type: 'mountain' },
      { name: 'Western Ghats', lat: 15.0000, lon: 74.0000, state: 'Karnataka', type: 'mountain' },
      { name: 'Brahmaputra Valley', lat: 26.2006, lon: 92.9376, state: 'Assam', type: 'valley' },
      { name: 'Gangetic Plains', lat: 26.0000, lon: 82.0000, state: 'Uttar Pradesh', type: 'plains' },
      { name: 'Deccan Plateau', lat: 17.0000, lon: 77.0000, state: 'Telangana', type: 'plateau' }
    ];
    
    distributedZones.forEach(zone => {
      const locationKey = `${zone.name}_${zone.state}`;
      if (!processedLocations.has(locationKey)) {
        const riskLevel = this.generateRandomRisk(zone.type);
        const disaster = this.getTypeBasedDisaster(zone.type, riskLevel);
        
        riskZones.push({
          lat: zone.lat,
          lon: zone.lon,
          name: zone.name,
          state: zone.state,
          risk: riskLevel,
          disaster: disaster,
          color: this.getRiskColor(riskLevel),
          confidence: 75 + Math.floor(Math.random() * 20),
          lastUpdated: new Date().toISOString(),
          newsSource: 'System',
          newsTitle: `${zone.type} monitoring update`,
          riskScore: this.calculateRiskScore(riskLevel, disaster, [disaster.split(' ')[0]]),
          reasons: this.getTypeBasedReasons(zone.type, riskLevel),
          locationType: zone.type
        });
      }
    });
  }
  
  // Generate risk based on location type
  generateRandomRisk(type) {
    const riskProb = Math.random();
    
    // Different risk probabilities for different location types
    switch (type) {
      case 'coastal':
      case 'island':
        return riskProb > 0.7 ? 'High' : riskProb > 0.4 ? 'Medium' : 'Low';
      case 'mountain':
      case 'hill_station':
        return riskProb > 0.6 ? 'High' : riskProb > 0.3 ? 'Medium' : 'Low';
      case 'desert':
        return riskProb > 0.5 ? 'Medium' : 'Low';
      case 'rural':
      case 'district':
        return riskProb > 0.8 ? 'High' : riskProb > 0.5 ? 'Medium' : 'Low';
      default:
        return riskProb > 0.7 ? 'Medium' : 'Low';
    }
  }
  
  // Get disaster type based on location type
  getTypeBasedDisaster(type, riskLevel) {
    const disasters = {
      coastal: ['Cyclone warning', 'High tide alert', 'Storm surge'],
      island: ['Cyclone watch', 'High waves', 'Weather alert'],
      mountain: ['Landslide risk', 'Heavy snowfall', 'Avalanche warning'],
      hill_station: ['Landslide alert', 'Heavy rain', 'Road blockage'],
      desert: ['Dust storm', 'Extreme heat', 'Sand storm'],
      rural: ['Flood risk', 'Crop damage', 'Heavy rain'],
      district: ['Weather alert', 'Traffic advisory', 'Local emergency'],
      valley: ['Flood warning', 'River overflow', 'Heavy rain'],
      plains: ['Flood alert', 'Weather warning', 'Traffic congestion'],
      plateau: ['Weather advisory', 'Normal conditions', 'Light rain']
    };
    
    const typeDisasters = disasters[type] || ['Weather update', 'Normal conditions'];
    const index = riskLevel === 'High' ? 0 : riskLevel === 'Medium' ? 1 : 2;
    return typeDisasters[Math.min(index, typeDisasters.length - 1)];
  }
  
  // Get reasons based on location type
  getTypeBasedReasons(type, riskLevel) {
    const reasons = {
      coastal: ['Coastal weather monitoring', 'Tidal conditions tracked', 'Marine weather alert'],
      mountain: ['Geological monitoring active', 'Weather station data', 'Slope stability checked'],
      rural: ['Agricultural weather watch', 'Rural area monitoring', 'Local weather conditions'],
      desert: ['Desert weather tracking', 'Temperature monitoring', 'Dust storm watch']
    };
    
    return reasons[type] || ['Area monitoring active', 'Weather conditions tracked', 'Regular safety updates'];
  }

  // Comprehensive fallback data covering diverse locations
  getFallbackData() {
    return [
      // Major cities
      {
        lat: 28.6139, lon: 77.2090, name: 'Delhi', state: 'Delhi',
        risk: 'Medium', disaster: 'Air Quality Alert', color: '#f59e0b',
        confidence: 80, newsSource: 'System', newsTitle: 'Air quality deteriorates',
        riskScore: 55, reasons: ['Poor air quality index', 'Smog conditions'], locationType: 'city'
      },
      {
        lat: 19.0760, lon: 72.8777, name: 'Mumbai', state: 'Maharashtra',
        risk: 'High', disaster: 'Heavy Rain Warning', color: '#dc2626',
        confidence: 90, newsSource: 'System', newsTitle: 'IMD issues heavy rain alert',
        riskScore: 85, reasons: ['Heavy rainfall warning', 'Waterlogging expected'], locationType: 'city'
      },
      // Rural and remote areas
      {
        lat: 21.9497, lon: 89.1833, name: 'Sundarbans', state: 'West Bengal',
        risk: 'High', disaster: 'Cyclone Alert', color: '#dc2626',
        confidence: 88, newsSource: 'System', newsTitle: 'Cyclone approaching coastal areas',
        riskScore: 82, reasons: ['Cyclone formation in Bay of Bengal', 'Coastal flooding risk'], locationType: 'rural'
      },
      {
        lat: 34.1526, lon: 77.5771, name: 'Ladakh Region', state: 'Ladakh',
        risk: 'Medium', disaster: 'Heavy Snowfall', color: '#f59e0b',
        confidence: 75, newsSource: 'System', newsTitle: 'Snow alert for high altitude areas',
        riskScore: 58, reasons: ['Heavy snowfall expected', 'Road connectivity may be affected'], locationType: 'mountain'
      },
      {
        lat: 23.7337, lon: 69.8597, name: 'Kutch District', state: 'Gujarat',
        risk: 'Low', disaster: 'Normal Conditions', color: '#10b981',
        confidence: 85, newsSource: 'System', newsTitle: 'Weather stable in desert region',
        riskScore: 28, reasons: ['Clear weather conditions', 'No active alerts'], locationType: 'desert'
      },
      {
        lat: 11.6854, lon: 76.1320, name: 'Wayanad', state: 'Kerala',
        risk: 'Medium', disaster: 'Landslide Watch', color: '#f59e0b',
        confidence: 78, newsSource: 'System', newsTitle: 'Landslide warning for hilly areas',
        riskScore: 62, reasons: ['Heavy rain in hills', 'Slope instability detected'], locationType: 'hill_station'
      },
      {
        lat: 26.2006, lon: 92.9376, name: 'Brahmaputra Valley', state: 'Assam',
        risk: 'High', disaster: 'Flood Warning', color: '#dc2626',
        confidence: 92, newsSource: 'System', newsTitle: 'River levels rising in Assam',
        riskScore: 87, reasons: ['River water level rising', 'Flood alert issued'], locationType: 'valley'
      },
      {
        lat: 11.7401, lon: 92.6586, name: 'Andaman Islands', state: 'Andaman & Nicobar',
        risk: 'Medium', disaster: 'Storm Watch', color: '#f59e0b',
        confidence: 80, newsSource: 'System', newsTitle: 'Weather monitoring for islands',
        riskScore: 55, reasons: ['Storm formation possible', 'Marine conditions monitored'], locationType: 'island'
      }
    ];
  }

  // Calculate numeric risk score
  calculateRiskScore(riskLevel, text, risks) {
    let score = 20; // Base score
    
    if (riskLevel === 'High') score = 85;
    else if (riskLevel === 'Medium') score = 55;
    
    // Adjust based on text intensity
    if (text.includes('severe') || text.includes('extreme')) score += 10;
    if (text.includes('emergency') || text.includes('evacuate')) score += 15;
    if (text.includes('red alert')) score = Math.max(score, 90);
    
    return Math.min(100, score);
  }
  
  // Generate detailed risk reasons
  generateRiskReasons(risks, text, riskLevel) {
    const reasons = [];
    
    risks.forEach(risk => {
      switch (risk) {
        case 'flood':
          reasons.push('Flooding reported in the area');
          if (text.includes('severe')) reasons.push('Severe water logging expected');
          break;
        case 'cyclone':
          reasons.push('Cyclonic weather conditions');
          if (text.includes('landfall')) reasons.push('Cyclone making landfall');
          break;
        case 'earthquake':
          reasons.push('Seismic activity detected');
          break;
        case 'heavy_rain':
          reasons.push('Heavy rainfall warning issued');
          break;
        case 'traffic':
          reasons.push('Traffic congestion reported');
          break;
        default:
          reasons.push(`${risk.replace('_', ' ')} conditions detected`);
      }
    });
    
    if (text.includes('alert') || text.includes('warning')) {
      reasons.push('Official weather alert issued');
    }
    
    if (reasons.length === 0) {
      reasons.push('Normal conditions prevailing');
    }
    
    return reasons;
  }

  // Get all Indian locations including cities, districts, and rural areas
  getAllIndianCities() {
    const allLocations = Object.keys(INDIAN_CITIES).map(city => ({
      name: city,
      ...INDIAN_CITIES[city],
      type: 'city'
    }));
    
    // Add additional location types
    const additionalLocations = [
      { name: 'Rural Areas', lat: 25.0, lon: 78.0, state: 'Various', type: 'rural' },
      { name: 'Coastal Regions', lat: 15.0, lon: 74.0, state: 'Various', type: 'coastal' },
      { name: 'Mountain Areas', lat: 30.0, lon: 78.0, state: 'Various', type: 'mountain' },
      { name: 'Desert Regions', lat: 26.0, lon: 71.0, state: 'Various', type: 'desert' },
      { name: 'Island Territories', lat: 11.0, lon: 92.0, state: 'Various', type: 'island' }
    ];
    
    return [...allLocations, ...additionalLocations];
  }
}

module.exports = NewsService;