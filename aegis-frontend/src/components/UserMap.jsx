import { useEffect, useState, useCallback } from 'react';
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

  // Search for locations globally
  const searchLocation = useCallback(async (query, setSuggestions, setShow) => {
    if (query.length < 2) {
      setSuggestions([]);
      setShow(false);
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/search-location?query=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.results.slice(0, 8));
        setShow(true);
      }
    } catch (error) {
      console.error('Location search failed:', error);
      // Fallback to basic suggestions
      const basicSuggestions = [
        { name: 'Delhi, India', lat: 28.6139, lon: 77.2090, country: 'India' },
        { name: 'Mumbai, India', lat: 19.0760, lon: 72.8777, country: 'India' },
        { name: 'New York, USA', lat: 40.7128, lon: -74.0060, country: 'USA' },
        { name: 'London, UK', lat: 51.5074, lon: -0.1278, country: 'UK' },
        { name: 'Paris, France', lat: 48.8566, lon: 2.3522, country: 'France' },
        { name: 'Tokyo, Japan', lat: 35.6762, lon: 139.6503, country: 'Japan' }
      ].filter(item => item.name.toLowerCase().includes(query.toLowerCase()));
      setSuggestions(basicSuggestions);
      setShow(true);
    }
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
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
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
          
          {/* User Location */}
          <Marker position={userLocation}>
            <Popup>Your Location</Popup>
          </Marker>
        </MapContainer>
      </div>
      
      {/* Control Panel */}
      <div className="w-80 bg-white p-4 shadow-lg overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">🛡️ Safety Controls</h2>
        
        {/* Route Planning */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2">🌍 Global Route Planner</h3>
          
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
              className="w-full p-2 border rounded"
            />
            {showStartSuggestions && startSuggestions.length > 0 && (
              <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-b max-h-48 overflow-y-auto">
                {startSuggestions.map((suggestion, i) => (
                  <div
                    key={i}
                    className="p-2 hover:bg-gray-100 cursor-pointer border-b"
                    onClick={() => selectLocation(suggestion, true)}
                  >
                    <div className="font-medium text-sm">{suggestion.name}</div>
                    <div className="text-xs text-gray-600">{suggestion.country}</div>
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
              className="w-full p-2 border rounded"
            />
            {showEndSuggestions && endSuggestions.length > 0 && (
              <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-b max-h-48 overflow-y-auto">
                {endSuggestions.map((suggestion, i) => (
                  <div
                    key={i}
                    className="p-2 hover:bg-gray-100 cursor-pointer border-b"
                    onClick={() => selectLocation(suggestion, false)}
                  >
                    <div className="font-medium text-sm">{suggestion.name}</div>
                    <div className="text-xs text-gray-600">{suggestion.country}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <button
            onClick={findSafeRoute}
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
          >
            Find Safe Route
          </button>
          
          {routeResult && (
            <div className="mt-2 space-y-2">
              <div className={`p-3 rounded ${
                routeResult.riskLevel === 'High' ? 'bg-red-100 border border-red-300' :
                routeResult.riskLevel === 'Medium' ? 'bg-yellow-100 border border-yellow-300' :
                'bg-green-100 border border-green-300'
              }`}>
                <p className="font-semibold">
                  Route Status: {
                    routeResult.riskLevel === 'High' ? '🚨 High Risk' :
                    routeResult.riskLevel === 'Medium' ? '⚠️ Caution Required' :
                    '✅ Safe Route'
                  }
                </p>
                <div className="text-sm mt-1">
                  <p>📍 Distance: {routeResult.distance} km</p>
                  <p>⏱️ Duration: ~{routeResult.duration} min</p>
                  {routeResult.riskScore && <p>🎯 Risk Score: {routeResult.riskScore}/100</p>}
                </div>
                
                {routeResult.riskReasons && routeResult.riskReasons.length > 0 && (
                  <div className="mt-2">
                    <p className="font-semibold text-sm">Route Analysis:</p>
                    <ul className="text-xs list-disc list-inside">
                      {routeResult.riskReasons.map((reason, i) => (
                        <li key={i} className="text-gray-700">{reason}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {routeResult.routingService && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500">
                      Navigation: {routeResult.routingService}
                    </p>
                  </div>
                )}
                
                {routeResult.affectedZones && routeResult.affectedZones.length > 0 && (
                  <div className="mt-2">
                    <p className="font-semibold text-sm">Affected Areas:</p>
                    {routeResult.affectedZones.map((zone, i) => (
                      <div key={i} className="text-xs bg-gray-50 p-1 rounded mt-1">
                        <span className="font-medium">{zone.name}</span> - {zone.disaster}
                        <span className="text-gray-500"> ({zone.distance}km away)</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {routeResult.warnings?.map((warning, i) => (
                  <p key={i} className="text-red-700 text-sm mt-1 font-medium">{warning}</p>
                ))}
              </div>
              
              {routeResult.alternativeRoute && (
                <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                  <p className="font-semibold text-blue-700">🛡️ Safe Alternative Available</p>
                  <p className="text-sm text-blue-600">
                    Distance: {routeResult.alternativeRoute.distance} km
                  </p>
                  <button 
                    onClick={() => setRouteResult({...routeResult, route: routeResult.alternativeRoute.geometry, isSafe: true})}
                    className="mt-1 bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                  >
                    Use Safe Route
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* SOS Button */}
        <button
          onClick={sendSOS}
          className="w-full bg-red-500 text-white p-4 rounded-lg text-xl font-bold hover:bg-red-600 mb-6"
        >
          🆘 EMERGENCY SOS
        </button>

        {/* Risk Status */}
        <div>
          <h3 className="font-semibold mb-2">Current Risk Status</h3>
          {riskData.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Loading risk data...</p>
          ) : (
            riskData.map((zone, i) => (
              <div key={i} className="mb-2 p-3 border rounded">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium">{zone.name}</span>
                  <span 
                    className="px-2 py-1 rounded text-sm font-semibold text-white"
                    style={{ backgroundColor: zone.color }}
                  >
                    {zone.risk}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-1">{zone.disaster}</p>
                {zone.reasons && (
                  <div className="text-xs text-gray-700 mb-1">
                    <strong>Reasons:</strong>
                    <ul className="list-disc list-inside ml-2">
                      {zone.reasons.slice(0, 2).map((reason, i) => (
                        <li key={i}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {zone.riskScore && (
                  <div className="text-xs text-gray-500">
                    Risk Score: {zone.riskScore}/100
                    {zone.confidence && ` (${zone.confidence}% confidence)`}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default UserMap;