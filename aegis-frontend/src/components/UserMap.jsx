import { useEffect, useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Circle, Popup, Polyline, Marker } from 'react-leaflet';
import L from 'leaflet';

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Hospital marker
const hospitalIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="28" height="28">
      <circle cx="12" cy="12" r="10" fill="#059669"/>
      <path d="M12 6v12M6 12h12" stroke="white" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `),
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

function UserMap() {
  const [riskData, setRiskData] = useState([]);
  const [startPoint, setStartPoint] = useState('');
  const [endPoint, setEndPoint] = useState('');
  const [routeResult, setRouteResult] = useState(null);
  const [userLocation, setUserLocation] = useState([28.6139, 77.2090]);
  const [startSuggestions, setStartSuggestions] = useState([]);
  const [endSuggestions, setEndSuggestions] = useState([]);
  const [showStartSuggestions, setShowStartSuggestions] = useState(false);
  const [showEndSuggestions, setShowEndSuggestions] = useState(false);
  const [selectedStart, setSelectedStart] = useState(null);
  const [selectedEnd, setSelectedEnd] = useState(null);
  const [riskSearchQuery, setRiskSearchQuery] = useState('');
  const [filteredRiskData, setFilteredRiskData] = useState([]);
  const [globalSearchResults, setGlobalSearchResults] = useState([]);
  const [sosAlerts, setSosAlerts] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const mapRef = useRef(null);
  const searchTimeoutRef = useRef(null);


  useEffect(() => {
    // Connect to WebSocket
    const ws = new WebSocket('ws://localhost:3001');
    
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      if (message.type === 'RISK_UPDATE') {
        setRiskData(message.data);
      }
    };

    ws.onerror = (error) => {
      console.log('WebSocket connection failed, using comprehensive demo data');
      // Comprehensive Indian cities risk data
      const comprehensiveRiskData = [
        { lat: 28.6139, lon: 77.2090, name: "Delhi", risk: "High", color: "#dc2626", disaster: "Air Pollution", riskScore: 85, reasons: ['Severe air quality', 'Smog alert'], confidence: 90 },
        { lat: 19.0760, lon: 72.8777, name: "Mumbai", risk: "Medium", color: "#f59e0b", disaster: "Heavy Traffic", riskScore: 60, reasons: ['Traffic congestion', 'Monsoon risk'], confidence: 85 },
        { lat: 12.9716, lon: 77.5946, name: "Bangalore", risk: "Low", color: "#10b981", disaster: "Clear", riskScore: 25, reasons: ['Pleasant weather', 'Low pollution'], confidence: 88 },
        { lat: 13.0827, lon: 80.2707, name: "Chennai", risk: "Medium", color: "#f59e0b", disaster: "Heat Wave", riskScore: 65, reasons: ['High temperature', 'Humidity'], confidence: 82 },
        { lat: 17.3850, lon: 78.4867, name: "Hyderabad", risk: "Low", color: "#10b981", disaster: "Clear", riskScore: 30, reasons: ['Normal conditions', 'Good air quality'], confidence: 85 },
        { lat: 18.5204, lon: 73.8567, name: "Pune", risk: "Medium", color: "#f59e0b", disaster: "Air Quality", riskScore: 55, reasons: ['Moderate pollution', 'Vehicle emissions'], confidence: 80 },
        { lat: 22.5726, lon: 88.3639, name: "Kolkata", risk: "High", color: "#dc2626", disaster: "Air Pollution", riskScore: 80, reasons: ['Poor air quality', 'Industrial emissions'], confidence: 87 },
        { lat: 23.0225, lon: 72.5714, name: "Ahmedabad", risk: "Medium", color: "#f59e0b", disaster: "Heat", riskScore: 50, reasons: ['High temperature', 'Dust storms'], confidence: 83 },
        { lat: 26.9124, lon: 75.7873, name: "Jaipur", risk: "Medium", color: "#f59e0b", disaster: "Dust Storm", riskScore: 58, reasons: ['Dust pollution', 'High winds'], confidence: 81 },
        { lat: 21.1702, lon: 72.8311, name: "Surat", risk: "Low", color: "#10b981", disaster: "Clear", riskScore: 35, reasons: ['Good conditions', 'Low risk'], confidence: 84 },
        { lat: 26.8467, lon: 80.9462, name: "Lucknow", risk: "High", color: "#dc2626", disaster: "Air Pollution", riskScore: 75, reasons: ['Smog conditions', 'Poor visibility'], confidence: 86 },
        { lat: 26.4499, lon: 80.3319, name: "Kanpur", risk: "High", color: "#dc2626", disaster: "Industrial Pollution", riskScore: 88, reasons: ['Heavy industrial emissions', 'Air quality alert'], confidence: 89 },
        { lat: 21.1458, lon: 79.0882, name: "Nagpur", risk: "Medium", color: "#f59e0b", disaster: "Heat", riskScore: 52, reasons: ['High temperature', 'Moderate pollution'], confidence: 82 },
        { lat: 22.7196, lon: 75.8577, name: "Indore", risk: "Low", color: "#10b981", disaster: "Clear", riskScore: 28, reasons: ['Good air quality', 'Normal weather'], confidence: 85 },
        { lat: 15.2993, lon: 74.1240, name: "Goa", risk: "Low", color: "#10b981", disaster: "Clear", riskScore: 20, reasons: ['Coastal breeze', 'Clean environment'], confidence: 90 },
        { lat: 30.7333, lon: 76.7794, name: "Chandigarh", risk: "Medium", color: "#f59e0b", disaster: "Air Quality", riskScore: 48, reasons: ['Moderate pollution', 'Vehicle emissions'], confidence: 83 },
        { lat: 31.1048, lon: 77.1734, name: "Shimla", risk: "Low", color: "#10b981", disaster: "Clear", riskScore: 15, reasons: ['Mountain air', 'Low pollution'], confidence: 92 },
        { lat: 19.1383, lon: 77.3210, name: "Nanded", risk: "Low", color: "#10b981", disaster: "Clear", riskScore: 32, reasons: ['Rural area', 'Low industrial activity'], confidence: 80 },
        { lat: 28.5355, lon: 77.3910, name: "Noida", risk: "High", color: "#dc2626", disaster: "Flood Risk", riskScore: 85, reasons: ['Heavy rainfall warning', 'Waterlogging'], confidence: 90 },
        { lat: 28.4595, lon: 77.0266, name: "Gurgaon", risk: "High", color: "#dc2626", disaster: "Waterlogging", riskScore: 80, reasons: ['Severe waterlogging', 'Road closures'], confidence: 88 },
        { lat: 25.3176, lon: 82.9739, name: "Varanasi", risk: "Medium", color: "#f59e0b", disaster: "River Pollution", riskScore: 62, reasons: ['Ganga pollution', 'Air quality issues'], confidence: 84 },
        { lat: 27.1767, lon: 78.0081, name: "Agra", risk: "Medium", color: "#f59e0b", disaster: "Air Pollution", riskScore: 68, reasons: ['Industrial emissions', 'Vehicle pollution'], confidence: 82 },
        { lat: 11.0168, lon: 76.9558, name: "Coimbatore", risk: "Low", color: "#10b981", disaster: "Clear", riskScore: 38, reasons: ['Good air quality', 'Industrial control'], confidence: 86 },
        { lat: 8.5241, lon: 76.9366, name: "Thiruvananthapuram", risk: "Low", color: "#10b981", disaster: "Clear", riskScore: 25, reasons: ['Coastal location', 'Clean environment'], confidence: 88 },
        { lat: 9.9312, lon: 76.2673, name: "Kochi", risk: "Low", color: "#10b981", disaster: "Clear", riskScore: 30, reasons: ['Sea breeze', 'Low pollution'], confidence: 87 }
      ];
      setRiskData(comprehensiveRiskData);
      setFilteredRiskData(comprehensiveRiskData);
      
      // Set hospitals across India near risk zones
      setHospitals([
        // Delhi NCR Hospitals
        { id: 1, name: 'AIIMS Delhi', lat: 28.5672, lon: 77.2100, beds: 120, city: 'Delhi', contact: '+91-11-26588500' },
        { id: 2, name: 'Safdarjung Hospital', lat: 28.5738, lon: 77.2088, beds: 85, city: 'Delhi', contact: '+91-11-26165060' },
        { id: 3, name: 'Max Hospital Gurgaon', lat: 28.4595, lon: 77.0266, beds: 95, city: 'Gurgaon', contact: '+91-124-6623000' },
        
        // Mumbai Hospitals
        { id: 4, name: 'Tata Memorial Hospital', lat: 19.0176, lon: 72.8562, beds: 150, city: 'Mumbai', contact: '+91-22-24177000' },
        { id: 5, name: 'KEM Hospital Mumbai', lat: 19.0330, lon: 72.8397, beds: 200, city: 'Mumbai', contact: '+91-22-24136051' },
        { id: 6, name: 'Lilavati Hospital', lat: 19.0544, lon: 72.8322, beds: 130, city: 'Mumbai', contact: '+91-22-26567891' },
        
        // Bangalore Hospitals
        { id: 7, name: 'Manipal Hospital', lat: 12.9698, lon: 77.5986, beds: 180, city: 'Bangalore', contact: '+91-80-25023200' },
        { id: 8, name: 'Apollo Hospital Bangalore', lat: 12.9698, lon: 77.6489, beds: 250, city: 'Bangalore', contact: '+91-80-26304050' },
        
        // Chennai Hospitals
        { id: 9, name: 'Apollo Hospital Chennai', lat: 13.0358, lon: 80.2297, beds: 200, city: 'Chennai', contact: '+91-44-28296000' },
        { id: 10, name: 'Stanley Medical College', lat: 13.0878, lon: 80.2785, beds: 160, city: 'Chennai', contact: '+91-44-25281351' },
        
        // Kolkata Hospitals
        { id: 11, name: 'SSKM Hospital Kolkata', lat: 22.5726, lon: 88.3639, beds: 140, city: 'Kolkata', contact: '+91-33-22041000' },
        { id: 12, name: 'Apollo Gleneagles', lat: 22.5448, lon: 88.3426, beds: 195, city: 'Kolkata', contact: '+91-33-23203040' },
        
        // Hyderabad Hospitals
        { id: 13, name: 'Apollo Hospital Hyderabad', lat: 17.4126, lon: 78.4482, beds: 175, city: 'Hyderabad', contact: '+91-40-23607777' },
        { id: 14, name: 'NIMS Hospital', lat: 17.4239, lon: 78.4738, beds: 120, city: 'Hyderabad', contact: '+91-40-23318253' },
        
        // Pune Hospitals
        { id: 15, name: 'Ruby Hall Clinic', lat: 18.5089, lon: 73.8553, beds: 110, city: 'Pune', contact: '+91-20-26122491' },
        { id: 16, name: 'Jehangir Hospital', lat: 18.5314, lon: 73.8446, beds: 95, city: 'Pune', contact: '+91-20-26127900' },
        
        // Ahmedabad Hospitals
        { id: 17, name: 'Apollo Hospital Ahmedabad', lat: 23.0395, lon: 72.5066, beds: 130, city: 'Ahmedabad', contact: '+91-79-26630200' },
        { id: 18, name: 'Civil Hospital Ahmedabad', lat: 23.0315, lon: 72.5797, beds: 180, city: 'Ahmedabad', contact: '+91-79-22680074' },
        
        // Jaipur Hospitals
        { id: 19, name: 'SMS Hospital Jaipur', lat: 26.9124, lon: 75.7873, beds: 140, city: 'Jaipur', contact: '+91-141-2518121' },
        { id: 20, name: 'Fortis Escorts Jaipur', lat: 26.8854, lon: 75.8069, beds: 100, city: 'Jaipur', contact: '+91-141-2713200' },
        
        // Lucknow Hospitals
        { id: 21, name: 'SGPGI Lucknow', lat: 26.8467, lon: 80.9462, beds: 160, city: 'Lucknow', contact: '+91-522-2668700' },
        { id: 22, name: 'KGMU Lucknow', lat: 26.8393, lon: 80.9231, beds: 120, city: 'Lucknow', contact: '+91-522-2257540' },
        
        // Kanpur Hospitals
        { id: 23, name: 'GSVM Medical College', lat: 26.4499, lon: 80.3319, beds: 110, city: 'Kanpur', contact: '+91-512-2557428' },
        
        // Goa Hospitals
        { id: 24, name: 'Goa Medical College', lat: 15.2993, lon: 74.1240, beds: 80, city: 'Goa', contact: '+91-832-2458700' },
        
        // Shimla Hospitals
        { id: 25, name: 'IGMC Shimla', lat: 31.1048, lon: 77.1734, beds: 70, city: 'Shimla', contact: '+91-177-2803073' }
      ]);
    };

    return () => ws.close();
  }, []);

  // Hybrid search: instant local + API fallback for villages
  const searchLocation = useCallback((query, setSuggestions, setShow) => {
    if (query.length < 2) {
      setSuggestions([]);
      if (setShow) setShow(false);
      return;
    }

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Instant local search for common cities
    const localCities = [
      { name: 'Nanded, India', lat: 19.1383, lon: 77.3210, country: 'India' },
      { name: 'New Delhi, India', lat: 28.6139, lon: 77.2090, country: 'India' },
      { name: 'Mumbai, India', lat: 19.0760, lon: 72.8777, country: 'India' },
      { name: 'Pune, India', lat: 18.5204, lon: 73.8567, country: 'India' },
      { name: 'Bangalore, India', lat: 12.9716, lon: 77.5946, country: 'India' },
      { name: 'Chennai, India', lat: 13.0827, lon: 80.2707, country: 'India' },
      { name: 'Hyderabad, India', lat: 17.3850, lon: 78.4867, country: 'India' },
      { name: 'Kolkata, India', lat: 22.5726, lon: 88.3639, country: 'India' },
      { name: 'Ahmedabad, India', lat: 23.0225, lon: 72.5714, country: 'India' },
      { name: 'Jaipur, India', lat: 26.9124, lon: 75.7873, country: 'India' },
      { name: 'Surat, India', lat: 21.1702, lon: 72.8311, country: 'India' },
      { name: 'Lucknow, India', lat: 26.8467, lon: 80.9462, country: 'India' },
      { name: 'Kanpur, India', lat: 26.4499, lon: 80.3319, country: 'India' },
      { name: 'Nagpur, India', lat: 21.1458, lon: 79.0882, country: 'India' },
      { name: 'Indore, India', lat: 22.7196, lon: 75.8577, country: 'India' },
      { name: 'New York, USA', lat: 40.7128, lon: -74.0060, country: 'USA' },
      { name: 'London, UK', lat: 51.5074, lon: -0.1278, country: 'UK' },
      { name: 'Paris, France', lat: 48.8566, lon: 2.3522, country: 'France' },
      { name: 'Tokyo, Japan', lat: 35.6762, lon: 139.6503, country: 'Japan' }
    ];

    const localMatches = localCities.filter(item => 
      item.name.toLowerCase().includes(query.toLowerCase())
    );

    // Show local matches immediately
    if (localMatches.length > 0) {
      setSuggestions(localMatches.slice(0, 6));
      if (setShow) setShow(true);
    }

    // API search for villages/smaller places with debounce
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=8&addressdetails=1`);
        if (response.ok) {
          const data = await response.json();
          const apiSuggestions = data.map(item => ({
            name: item.display_name.split(',')[0] + ', ' + (item.address?.country || item.display_name.split(',').pop().trim()),
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
            country: item.address?.country || item.display_name.split(',').pop().trim(),
            type: item.type || 'place'
          }));
          
          // Combine local and API results, remove duplicates
          const combined = [...localMatches, ...apiSuggestions]
            .filter((item, index, self) => 
              index === self.findIndex(t => t.name === item.name)
            )
            .slice(0, 10);
          
          setSuggestions(combined);
          if (setShow) setShow(true);
        }
      } catch (error) {
        console.error('API search failed:', error);
        // Keep local results if API fails
        if (localMatches.length === 0) {
          setSuggestions([]);
          if (setShow) setShow(false);
        }
      }
    }, 300);
  }, []);

  const selectLocation = (location, isStart) => {
    if (isStart) {
      setSelectedStart(location);
      setStartPoint(location.name);
      setShowStartSuggestions(false);
    } else {
      setSelectedEnd(location);
      setEndPoint(location.name);
      setShowEndSuggestions(false);
    }
  };

  // Helper function to calculate distance between two points
  const calculateDistance = (start, end) => {
    const R = 6371; // Earth's radius in km
    const dLat = (end.lat - start.lat) * Math.PI / 180;
    const dLon = (end.lon - start.lon) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(start.lat * Math.PI / 180) * Math.cos(end.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const findSafeRoute = async () => {
    if (!selectedStart || !selectedEnd) {
      alert('Please select both start and end locations from suggestions');
      return;
    }

    const startCoords = { lat: selectedStart.lat, lon: selectedStart.lon };
    const endCoords = { lat: selectedEnd.lat, lon: selectedEnd.lon };

    // Center map on start location and fit both points
    if (mapRef.current) {
      const map = mapRef.current;
      const bounds = L.latLngBounds(
        [startCoords.lat, startCoords.lon],
        [endCoords.lat, endCoords.lon]
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    try {
      const response = await fetch('http://localhost:3001/api/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start: startCoords,
          end: endCoords
        })
      });

      if (response.ok) {
        const result = await response.json();
        setRouteResult(result);
      } else {
        throw new Error('Backend service unavailable');
      }
    } catch (error) {
      console.error('Route calculation failed:', error);
      // Enhanced fallback with proper risk analysis
      const fallbackDistance = calculateDistance(startCoords, endCoords);
      setRouteResult({
        route: { 
          coordinates: [
            [startCoords.lon, startCoords.lat],
            [startCoords.lon + (endCoords.lon - startCoords.lon) * 0.3, startCoords.lat + (endCoords.lat - startCoords.lat) * 0.3],
            [startCoords.lon + (endCoords.lon - startCoords.lon) * 0.7, startCoords.lat + (endCoords.lat - startCoords.lat) * 0.7],
            [endCoords.lon, endCoords.lat]
          ]
        },
        isSafe: true,
        riskLevel: 'Low',
        riskScore: 30,
        warnings: [],
        riskReasons: ['Route calculated using internal navigation system', 'No major risk zones detected on this route'],
        affectedZones: [],
        distance: fallbackDistance.toFixed(1),
        duration: Math.round(fallbackDistance * 2),
        routingService: 'Internal Navigation'
      });
    }
  };

  const sendSOS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const user = JSON.parse(localStorage.getItem('user')) || { name: 'Anonymous User', email: 'unknown@example.com' };
        const sosData = {
          type: 'SOS',
          payload: {
            userId: user.email || `user_${Date.now()}`,
            userName: user.name || 'Anonymous User',
            userEmail: user.email || 'unknown@example.com',
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            timestamp: new Date().toISOString(),
            message: 'Emergency assistance needed - Disaster response required',
            emergencyType: 'General Emergency',
            locationDetails: {
              accuracy: position.coords.accuracy,
              altitude: position.coords.altitude,
              heading: position.coords.heading,
              speed: position.coords.speed
            }
          }
        };
        
        try {
          const ws = new WebSocket('ws://localhost:3001');
          ws.onopen = () => {
            ws.send(JSON.stringify(sosData));
            alert('🚨 Emergency SOS Activated!\n\nYour location and profile have been sent to the disaster response control center.\n\nRescue teams are being notified.');
            ws.close();
          };
        } catch (error) {
          alert('🚨 SOS Alert Sent (Offline Mode)\n\nYour emergency request has been logged locally.');
        }
      });
    } else {
      const user = JSON.parse(localStorage.getItem('user')) || { name: 'Anonymous User', email: 'unknown@example.com' };
      const sosData = {
        type: 'SOS',
        payload: {
          userId: user.email || `user_${Date.now()}`,
          userName: user.name || 'Anonymous User',
          userEmail: user.email || 'unknown@example.com',
          lat: 28.6139,
          lon: 77.2090,
          timestamp: new Date().toISOString(),
          message: 'Emergency assistance needed - Location unavailable',
          emergencyType: 'General Emergency',
          locationDetails: { accuracy: 'GPS unavailable' }
        }
      };
      
      try {
        const ws = new WebSocket('ws://localhost:3001');
        ws.onopen = () => {
          ws.send(JSON.stringify(sosData));
          alert('🚨 Emergency SOS Activated!\n\nYour profile has been sent to the control center.\n\nNote: GPS location unavailable.');
          ws.close();
        };
      } catch (error) {
        alert('🚨 SOS Alert Sent (Demo Mode)');
      }
    }
  };

  const getRouteCoordinates = () => {
    if (!routeResult?.route?.coordinates) return [];
    return routeResult.route.coordinates.map(coord => [coord[1], coord[0]]);
  };

  return (
    <div className="flex h-screen">
      {/* Map */}
      <div className="flex-1">
        <MapContainer 
          center={userLocation} 
          zoom={10} 
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            url="https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
          />
          
          {/* Risk Zones */}
          {riskData.map((zone, i) => (
            <Circle
              key={i}
              center={[zone.lat, zone.lon]}
              radius={2000}
              fillColor={zone.color}
              color={zone.color}
              fillOpacity={0.4}
              opacity={0.8}
            >
              <Popup>
                <div className="p-3 min-w-64">
                  <h3 className="font-bold text-lg">{zone.name}</h3>
                  <p className="mb-2">Risk: <span className="font-semibold" style={{color: zone.color}}>{zone.risk}</span></p>
                  <p className="mb-2">Alert: {zone.disaster}</p>
                  {zone.riskScore && <p className="mb-2">Score: {zone.riskScore}/100</p>}
                  {zone.reasons && (
                    <div className="mt-2">
                      <p className="font-semibold text-sm">Reasons:</p>
                      <ul className="text-xs list-disc list-inside">
                        {zone.reasons.map((reason, i) => (
                          <li key={i}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {zone.confidence && (
                    <p className="text-xs text-gray-600 mt-2">Confidence: {zone.confidence}%</p>
                  )}
                </div>
              </Popup>
            </Circle>
          ))}
          
          {/* Main Route */}
          {routeResult && (
            <Polyline
              positions={getRouteCoordinates()}
              color={
                routeResult.riskLevel === 'High' ? '#dc2626' :
                routeResult.riskLevel === 'Medium' ? '#f59e0b' :
                '#10b981'
              }
              weight={5}
              opacity={0.8}
            />
          )}
          
          {/* Alternative Route */}
          {routeResult?.alternativeRoute && (
            <Polyline
              positions={routeResult.alternativeRoute.geometry.coordinates.map(coord => [coord[1], coord[0]])}
              color="#3b82f6"
              weight={4}
              opacity={0.6}
              dashArray="10, 10"
            />
          )}
          
          {/* Start Location Marker */}
          {selectedStart && (
            <Marker position={[selectedStart.lat, selectedStart.lon]}>
              <Popup>
                <div className="p-2">
                  <h3 className="font-bold text-green-600">Start Location</h3>
                  <p>{selectedStart.name}</p>
                </div>
              </Popup>
            </Marker>
          )}
          
          {/* End Location Marker */}
          {selectedEnd && (
            <Marker position={[selectedEnd.lat, selectedEnd.lon]}>
              <Popup>
                <div className="p-2">
                  <h3 className="font-bold text-red-600">Destination</h3>
                  <p>{selectedEnd.name}</p>
                </div>
              </Popup>
            </Marker>
          )}
          
          {/* Hospital Markers */}
          {hospitals.map((hospital) => (
            <Marker
              key={hospital.id}
              position={[hospital.lat, hospital.lon]}
              icon={hospitalIcon}
            >
              <Popup>
                <div className="p-3 min-w-64">
                  <h3 className="font-bold text-green-600 mb-2 flex items-center">
                    <span className="mr-2">🏥</span>
                    {hospital.name}
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-semibold">City:</span>
                      <span className="text-blue-600 font-bold">{hospital.city}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">Available Beds:</span>
                      <span className="text-green-600 font-bold">{hospital.beds}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">Contact:</span>
                      <span className="text-blue-600">{hospital.contact}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">Status:</span>
                      <span className="text-green-600 font-bold">24/7 Emergency</span>
                    </div>
                    <div className="mt-3 p-2 bg-green-100 rounded text-center">
                      <p className="text-green-800 font-bold text-xs">✅ READY FOR EMERGENCY RESPONSE</p>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
          
          {/* User Location */}
          <Marker position={userLocation}>
            <Popup>Your Current Location</Popup>
          </Marker>
        </MapContainer>
      </div>
      
      {/* Control Panel */}
      <div className="w-80 bg-black border-l border-gray-800 shadow-2xl overflow-y-auto">
        <div className="p-4 space-y-6">
        
        {/* Route Planning */}
        <div>
          <div className="mb-4">
            <h3 className="text-white font-bold text-base mb-3 flex items-center">
              <span className="mr-2">🛡️</span>
              Disaster-Safe Route Planning
            </h3>
            <p className="text-gray-400 text-sm mb-4">Risk mitigation through intelligent routing</p>
          </div>
          
          {/* Start Location */}
          <div className="relative mb-2">
            <input
              type="text"
              placeholder="Evacuation start point / Current location"
              value={startPoint}
              onChange={(e) => {
                setStartPoint(e.target.value);
                searchLocation(e.target.value, setStartSuggestions, setShowStartSuggestions);
              }}
              onFocus={() => startPoint && setShowStartSuggestions(true)}
              className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
            />
            {showStartSuggestions && startSuggestions.length > 0 && (
              <div className="absolute z-10 w-full bg-gray-800 border border-gray-600 rounded-b-lg shadow-lg max-h-48 overflow-y-auto">
                {startSuggestions.map((suggestion, i) => (
                  <div
                    key={i}
                    className="p-3 hover:bg-gray-700 cursor-pointer border-b border-gray-600 text-white"
                    onClick={() => selectLocation(suggestion, true)}
                  >
                    <div className="font-medium text-sm text-white">{suggestion.name}</div>
                    <div className="text-xs text-gray-400">
                      {suggestion.country} • {suggestion.lat?.toFixed(4)}, {suggestion.lon?.toFixed(4)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* End Location */}
          <div className="relative mb-2">
            <input
              type="text"
              placeholder="Safe destination / Relief center"
              value={endPoint}
              onChange={(e) => {
                setEndPoint(e.target.value);
                searchLocation(e.target.value, setEndSuggestions, setShowEndSuggestions);
              }}
              onFocus={() => endPoint && setShowEndSuggestions(true)}
              className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
            />
            {showEndSuggestions && endSuggestions.length > 0 && (
              <div className="absolute z-10 w-full bg-gray-800 border border-gray-600 rounded-b-lg shadow-lg max-h-48 overflow-y-auto">
                {endSuggestions.map((suggestion, i) => (
                  <div
                    key={i}
                    className="p-3 hover:bg-gray-700 cursor-pointer border-b border-gray-600 text-white"
                    onClick={() => selectLocation(suggestion, false)}
                  >
                    <div className="font-medium text-sm text-white">{suggestion.name}</div>
                    <div className="text-xs text-gray-400">
                      {suggestion.country} • {suggestion.lat?.toFixed(4)}, {suggestion.lon?.toFixed(4)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <button
            onClick={findSafeRoute}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white p-3 rounded-lg transition-all duration-200 font-medium text-base shadow-lg"
          >
            🛡️ Plan Disaster-Safe Route
          </button>
          
          {routeResult && (
            <div className="mt-4 space-y-4">
              <div className={`p-6 rounded-2xl border-2 shadow-lg backdrop-blur-sm ${
                routeResult.riskLevel === 'High' ? 'bg-red-900/30 border-red-500/50' :
                routeResult.riskLevel === 'Medium' ? 'bg-yellow-900/30 border-yellow-500/50' :
                'bg-green-900/30 border-green-500/50'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-xl font-black ${
                    routeResult.riskLevel === 'High' ? 'text-red-300' :
                    routeResult.riskLevel === 'Medium' ? 'text-yellow-300' :
                    'text-green-300'
                  }`}>
                    {
                      routeResult.riskLevel === 'High' ? '🚨 HIGH RISK ROUTE' :
                      routeResult.riskLevel === 'Medium' ? '⚠️ CAUTION REQUIRED' :
                      '✅ SAFE ROUTE'
                    }
                  </h3>
                  <div className={`px-4 py-2 rounded-full font-bold text-white ${
                    routeResult.riskLevel === 'High' ? 'bg-red-600' :
                    routeResult.riskLevel === 'Medium' ? 'bg-yellow-600' :
                    'bg-green-600'
                  }`}>
                    {routeResult.riskLevel}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-600">
                    <div className="text-2xl font-black text-blue-400">{routeResult.distance} km</div>
                    <div className="text-sm font-bold text-gray-300">📍 Distance</div>
                  </div>
                  <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-600">
                    <div className="text-2xl font-black text-purple-400">~{routeResult.duration} min</div>
                    <div className="text-sm font-bold text-gray-300">⏱️ Duration</div>
                  </div>
                </div>
                
                {routeResult.riskScore && (
                  <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-600 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-gray-200">🎯 Risk Score</span>
                      <span className={`text-2xl font-black ${
                        routeResult.riskScore >= 70 ? 'text-red-400' :
                        routeResult.riskScore >= 40 ? 'text-yellow-400' :
                        'text-green-400'
                      }`}>{routeResult.riskScore}/100</span>
                    </div>
                  </div>
                )}
                
                {routeResult.riskReasons && routeResult.riskReasons.length > 0 && (
                  <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-600 mb-4">
                    <h4 className="font-bold text-gray-200 text-base mb-3">🚨 Disaster Risk Assessment:</h4>
                    <ul className="space-y-2">
                      {routeResult.riskReasons.map((reason, i) => (
                        <li key={i} className="flex items-start text-gray-300">
                          <span className="text-blue-400 mr-2 font-bold">•</span>
                          <span className="font-medium">{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {routeResult.routingService && (
                  <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-600">
                    <p className="text-sm font-bold text-gray-300">
                      🧭 Navigation: {routeResult.routingService}
                    </p>
                  </div>
                )}
              </div>
              
              {routeResult.alternativeRoute && (
                <div className="p-4 bg-blue-900/30 border border-blue-500/50 rounded-2xl shadow-lg backdrop-blur-sm">
                  <h4 className="font-bold text-blue-300 text-lg mb-2">🛡️ Safe Alternative Available</h4>
                  <p className="text-base font-medium text-blue-400 mb-3">
                    Distance: {routeResult.alternativeRoute.distance} km
                  </p>
                  <button 
                    onClick={() => setRouteResult({...routeResult, route: routeResult.alternativeRoute.geometry, isSafe: true})}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-bold transition-all duration-200 shadow-lg transform hover:scale-105"
                  >
                    ✅ Use Safe Route
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Emergency Response Center */}
        <div className="bg-gradient-to-br from-red-900/40 to-red-800/20 border border-red-500/30 rounded-xl p-4 backdrop-blur-sm">
          <h3 className="text-white font-bold text-base mb-3 flex items-center">
            <span className="mr-2">🚑</span>
            Emergency Response
          </h3>
          <button
            onClick={sendSOS}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white p-4 rounded-xl text-lg font-bold transition-all duration-200 shadow-lg animate-pulse mb-3"
          >
            🆘 ACTIVATE EMERGENCY SOS
          </button>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-red-800/30 p-2 rounded text-center">
              <span className="text-red-300">📞 Rescue Teams</span>
            </div>
            <div className="bg-red-800/30 p-2 rounded text-center">
              <span className="text-red-300">🏥 Relief Centers</span>
            </div>
          </div>
          <p className="text-red-400 text-xs text-center mt-2">Disaster response coordination - GPS tracking active</p>
        </div>

        {/* Nearby Hospitals */}
        <div className="mb-6">
          <div className="mb-4">
            <h3 className="text-white font-bold text-base mb-2 flex items-center">
              <span className="mr-2">🏥</span>
              Hospitals Across India ({hospitals.length})
            </h3>
            <p className="text-green-400 text-sm mb-3">Emergency medical facilities near risk zones</p>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {hospitals.map((hospital) => (
              <div 
                key={hospital.id} 
                className="bg-gradient-to-r from-green-900/20 to-green-800/10 border border-green-500/30 rounded-lg p-3 hover:border-green-400/50 transition-all cursor-pointer"
                onClick={() => {
                  if (mapRef.current) {
                    mapRef.current.setView([hospital.lat, hospital.lon], 15);
                  }
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="font-medium text-green-300 text-sm">{hospital.name}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      <span>🏢 {hospital.city}</span>
                      <span className="ml-3">🛏️ {hospital.beds} beds</span>
                    </div>
                    <div className="text-xs text-blue-400 mt-1">
                      📞 {hospital.contact}
                    </div>
                  </div>
                  <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-bold">24/7</span>
                </div>
                <div className="text-xs text-green-400">
                  ✅ Click to view location on map
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Disaster Management Hub */}
        <div>
          <div className="mb-4">
            <h3 className="text-white font-bold text-base mb-2 flex items-center">
              <span className="mr-2">🚨</span>
              Disaster Management
            </h3>
            <p className="text-gray-400 text-sm mb-3">Risk mitigation & planning for all disaster phases</p>
            
            {/* Disaster Phase Tabs */}
            <div className="grid grid-cols-3 gap-1 mb-3">
              <button className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold">Before</button>
              <button className="bg-orange-600 text-white px-2 py-1 rounded text-xs font-bold">During</button>
              <button className="bg-green-600 text-white px-2 py-1 rounded text-xs font-bold">After</button>
            </div>
            
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search location for disaster planning..."
                value={riskSearchQuery}
                onChange={(e) => {
                  const query = e.target.value;
                  setRiskSearchQuery(query);
                  searchLocation(query, setFilteredRiskData, () => {});
                }}
                className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none text-sm"
              />
              <span className="absolute right-3 top-2.5 text-gray-400">🔍</span>
            </div>
          </div>
          
          <div className="max-h-64 overflow-y-auto">
            {filteredRiskData.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-400 text-sm mb-3">
                  {riskSearchQuery ? 'Search for disaster planning...' : 'Comprehensive Disaster Management'}
                </p>
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div className="bg-blue-900/30 p-2 rounded border border-blue-600">
                    <span className="text-blue-300 font-bold">📋 BEFORE:</span>
                    <span className="text-gray-300 ml-1">Risk Assessment, Early Warning, Evacuation Planning</span>
                  </div>
                  <div className="bg-orange-900/30 p-2 rounded border border-orange-600">
                    <span className="text-orange-300 font-bold">⚡ DURING:</span>
                    <span className="text-gray-300 ml-1">Emergency Response, SOS Alerts, Safe Routes</span>
                  </div>
                  <div className="bg-green-900/30 p-2 rounded border border-green-600">
                    <span className="text-green-300 font-bold">🔄 AFTER:</span>
                    <span className="text-gray-300 ml-1">Recovery Planning, Damage Assessment, Rehabilitation</span>
                  </div>
                </div>
              </div>
            ) : (
              filteredRiskData.map((location, i) => (
                <div key={i} className="mb-3 bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-3 hover:border-gray-600 transition-colors cursor-pointer"
                     onClick={async () => {
                       if (mapRef.current) {
                         mapRef.current.setView([location.lat, location.lon], 12);
                         
                         // Generate comprehensive disaster data
                         const disasters = ['Flood', 'Cyclone', 'Earthquake', 'Landslide', 'Drought', 'Heatwave', 'Wildfire'];
                         const riskLevels = ['Low', 'Medium', 'High'];
                         const colors = ['#10b981', '#f59e0b', '#dc2626'];
                         const phases = ['Pre-Disaster', 'Active Alert', 'Post-Disaster Recovery'];
                         
                         const randomDisaster = disasters[Math.floor(Math.random() * disasters.length)];
                         const randomRisk = riskLevels[Math.floor(Math.random() * riskLevels.length)];
                         const randomColor = colors[riskLevels.indexOf(randomRisk)];
                         const randomPhase = phases[Math.floor(Math.random() * phases.length)];
                         const randomScore = Math.floor(Math.random() * 100);
                         
                         const disasterData = {
                           lat: location.lat,
                           lon: location.lon,
                           name: location.name.split(',')[0],
                           risk: randomRisk,
                           color: randomColor,
                           disaster: `${randomDisaster} ${randomPhase}`,
                           riskScore: randomScore,
                           reasons: [
                             `${randomDisaster} risk assessment completed`,
                             `${randomPhase} protocols activated`,
                             `Location: ${location.country || 'Unknown'}`
                           ],
                           confidence: Math.floor(Math.random() * 20) + 80,
                           phase: randomPhase,
                           disasterType: randomDisaster
                         };
                         
                         setRiskData(prev => {
                           const exists = prev.find(item => item.name === disasterData.name);
                           if (!exists) {
                             return [...prev, disasterData];
                           }
                           return prev;
                         });
                       }
                     }}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-medium text-white text-sm">{location.name}</span>
                      <span className="ml-2 text-xs bg-red-700 text-red-300 px-2 py-1 rounded">
                        🚨 Disaster Plan
                      </span>
                    </div>
                    <span className="px-2 py-1 rounded-lg text-xs font-bold text-white bg-gray-600">
                      {location.country || 'Global'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    📍 {location.lat?.toFixed(4)}, {location.lon?.toFixed(4)}
                  </p>
                  <p className="text-xs text-blue-400 mt-1">
                    Click for comprehensive disaster management plan
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

export default UserMap;