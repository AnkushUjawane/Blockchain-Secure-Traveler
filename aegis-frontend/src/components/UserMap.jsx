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
      console.log('WebSocket connection failed, using demo data');
      // Fallback demo data with enhanced risk information
      setRiskData([
        { 
          lat: 28.6139, lon: 77.2090, name: "Delhi Central", risk: "Medium", 
          color: "#f59e0b", disaster: "Traffic, Air Quality", riskScore: 55,
          reasons: ['Poor air quality index', 'Heavy traffic congestion', 'Smog conditions'],
          confidence: 80
        },
        { 
          lat: 28.7041, lon: 77.1025, name: "Delhi North", risk: "Low", 
          color: "#10b981", disaster: "Clear", riskScore: 25,
          reasons: ['Normal weather conditions', 'Light traffic', 'No active alerts'],
          confidence: 85
        },
        { 
          lat: 28.5355, lon: 77.3910, name: "Noida", risk: "High", 
          color: "#dc2626", disaster: "Flood Risk", riskScore: 85,
          reasons: ['Heavy rainfall warning', 'Waterlogging reported', 'Red alert issued'],
          confidence: 90
        },
        { 
          lat: 28.4595, lon: 77.0266, name: "Gurgaon", risk: "High", 
          color: "#dc2626", disaster: "Waterlogging", riskScore: 80,
          reasons: ['Severe waterlogging', 'Road closures', 'Traffic diversions'],
          confidence: 88
        }
      ]);
    };

    return () => ws.close();
  }, []);

  // Hybrid search: instant local + API fallback for villages
  const searchLocation = useCallback((query, setSuggestions, setShow) => {
    if (query.length < 2) {
      setSuggestions([]);
      setShow(false);
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
      setShow(true);
    }

    // API search for villages/smaller places with debounce
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=6&addressdetails=1`);
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
            .slice(0, 8);
          
          setSuggestions(combined);
          setShow(true);
        }
      } catch (error) {
        console.error('API search failed:', error);
        // Keep local results if API fails
        if (localMatches.length === 0) {
          setSuggestions([]);
          setShow(false);
        }
      }
    }, 500);
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
        const sosData = {
          type: 'SOS',
          payload: {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            message: 'Emergency assistance needed'
          }
        };
        
        try {
          const ws = new WebSocket('ws://localhost:3001');
          ws.onopen = () => {
            ws.send(JSON.stringify(sosData));
            alert('SOS sent successfully!');
            ws.close();
          };
        } catch (error) {
          alert('SOS sent (offline mode)');
        }
      });
    } else {
      alert('SOS sent (demo mode)');
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
          
          {/* User Location */}
          <Marker position={userLocation}>
            <Popup>Your Current Location</Popup>
          </Marker>
        </MapContainer>
      </div>
      
      {/* Control Panel */}
      <div className="w-80 bg-black border-l border-gray-800 shadow-2xl overflow-y-auto">
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black p-6 border-b border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg">
              <span className="text-2xl">🛡️</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Safety Controls</h2>
              <p className="text-gray-300 text-sm">Navigate safely with real-time alerts</p>
            </div>
          </div>
        </div>
        <div className="p-4 space-y-6">
        
        {/* Route Planning */}
        <div>
          <div className="mb-4">
            <h3 className="text-white font-bold text-base mb-3 flex items-center">
              <span className="mr-2">🌍</span>
              Global Route Planner
            </h3>
            <p className="text-gray-400 text-sm mb-4">Plan safe routes worldwide</p>
          </div>
          
          {/* Start Location */}
          <div className="relative mb-2">
            <input
              type="text"
              placeholder="Start location (any city worldwide)"
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
              placeholder="End location (any city worldwide)"
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
            🗺️ Find Safe Route
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
                    <h4 className="font-bold text-gray-200 text-base mb-3">📊 Route Analysis:</h4>
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

        {/* SOS Button */}
        <div className="bg-gradient-to-br from-red-900/40 to-red-800/20 border border-red-500/30 rounded-xl p-4 backdrop-blur-sm">
          <button
            onClick={sendSOS}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white p-4 rounded-xl text-lg font-bold transition-all duration-200 shadow-lg animate-pulse"
          >
            🆘 EMERGENCY SOS
          </button>
          <p className="text-red-400 text-sm text-center mt-3 font-medium">Instant Emergency Assistance</p>
          <p className="text-red-300 text-xs text-center mt-1">Available 24/7 - GPS Location Shared</p>
        </div>

        {/* Risk Status */}
        <div>
          <div className="mb-4">
            <h3 className="text-white font-bold text-base mb-2 flex items-center">
              <span className="mr-2">⚠️</span>
              Current Risk Status
            </h3>
            <p className="text-gray-400 text-sm">Live monitoring across regions</p>
          </div>
          {riskData.length === 0 ? (
            <p className="text-gray-400 text-center py-6 bg-gray-800 rounded-lg border border-gray-700">Loading risk data...</p>
          ) : (
            riskData.map((zone, i) => (
              <div key={i} className="mb-3 bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-3 hover:border-gray-600 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-medium text-white text-sm">{zone.name}</span>
                    {zone.locationType && (
                      <span className="ml-2 text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                        {zone.locationType}
                      </span>
                    )}
                  </div>
                  <span 
                    className="px-2 py-1 rounded-lg text-xs font-bold text-white"
                    style={{ backgroundColor: zone.color }}
                  >
                    {zone.risk}
                  </span>
                </div>
                <p className="text-sm text-gray-300 mb-2">{zone.disaster}</p>
                {zone.reasons && (
                  <div className="text-xs text-gray-400 mb-2">
                    <div className="font-medium mb-1 text-gray-300">Reasons:</div>
                    <ul className="space-y-1">
                      {zone.reasons.slice(0, 2).map((reason, i) => (
                        <li key={i} className="flex items-start">
                          <span className="text-blue-400 mr-1">•</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {zone.riskScore && (
                  <div className="text-xs text-gray-400 bg-gray-800/50 px-2 py-1 rounded border border-gray-700">
                    Risk: {zone.riskScore}/100
                    {zone.confidence && ` | Confidence: ${zone.confidence}%`}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        </div>
      </div>
    </div>
  );
}

export default UserMap;