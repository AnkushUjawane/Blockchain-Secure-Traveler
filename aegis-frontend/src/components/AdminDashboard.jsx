import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Circle, Popup, Marker } from 'react-leaflet';
import L from 'leaflet';

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom SOS marker
const sosIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="red" width="32" height="32">
      <circle cx="12" cy="12" r="10" fill="#dc2626"/>
      <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">SOS</text>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

function AdminDashboard() {
  const [riskData, setRiskData] = useState([]);
  const [sosAlerts, setSosAlerts] = useState([]);
  const [stats, setStats] = useState({ High: 0, Medium: 0, Low: 0 });

  useEffect(() => {
    // Connect to WebSocket
    const ws = new WebSocket('ws://localhost:3001');
    
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      if (message.type === 'RISK_UPDATE') {
        setRiskData(message.data);
        updateStats(message.data);
      } else if (message.type === 'SOS_ALERT') {
        setSosAlerts(prev => [message.data, ...prev.slice(0, 9)]); // Keep last 10 alerts
      }
    };

    ws.onerror = (error) => {
      console.log('WebSocket connection failed, using demo data');
      // Demo data
      const demoRiskData = [
        { lat: 28.6139, lon: 77.2090, name: "Delhi Central", risk: "Medium", color: "#f59e0b", disaster: "Traffic, Air Quality", riskScore: 45, weather: { rain: 15, wind: 25, temperature: 32 } },
        { lat: 28.7041, lon: 77.1025, name: "Delhi North", risk: "Low", color: "#10b981", disaster: "Clear", riskScore: 20, weather: { rain: 5, wind: 15, temperature: 28 } },
        { lat: 28.5355, lon: 77.3910, name: "Noida", risk: "High", color: "#dc2626", disaster: "Flood Risk", riskScore: 75, weather: { rain: 45, wind: 35, temperature: 30 } },
        { lat: 28.4595, lon: 77.0266, name: "Gurgaon", risk: "High", color: "#dc2626", disaster: "Waterlogging", riskScore: 80, weather: { rain: 50, wind: 40, temperature: 33 } }
      ];
      setRiskData(demoRiskData);
      updateStats(demoRiskData);
      
      // Demo SOS alert
      setSosAlerts([{
        id: Date.now(),
        lat: 28.6139,
        lon: 77.2090,
        message: 'Demo emergency alert',
        timestamp: new Date().toISOString()
      }]);
    };

    return () => ws.close();
  }, []);

  const updateStats = (data) => {
    const newStats = { High: 0, Medium: 0, Low: 0 };
    data.forEach(zone => newStats[zone.risk]++);
    setStats(newStats);
  };

  const respondToSOS = (alertId) => {
    setSosAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, status: 'Responded', respondedAt: new Date().toISOString() }
        : alert
    ));
  };

  const getTotalAlerts = () => sosAlerts.filter(alert => !alert.status).length;

  return (
    <div className="flex h-screen">
      {/* Map */}
      <div className="flex-1">
        <MapContainer 
          center={[28.6139, 77.2090]} 
          zoom={9} 
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
              radius={3000}
              fillColor={zone.color}
              color={zone.color}
              fillOpacity={0.3}
              opacity={1}
              weight={3}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-bold">{zone.name}</h3>
                  <p>Risk: <span className="font-semibold" style={{color: zone.color}}>{zone.risk}</span></p>
                  <p>Alert: {zone.disaster}</p>
                  {zone.riskScore && <p>Score: {zone.riskScore}/100</p>}
                  {zone.weather && (
                    <div className="text-xs mt-1">
                      <p>Rain: {zone.weather.rain?.toFixed(1)}mm</p>
                      <p>Wind: {zone.weather.wind?.toFixed(1)}km/h</p>
                      <p>Temp: {zone.weather.temperature?.toFixed(1)}°C</p>
                    </div>
                  )}
                </div>
              </Popup>
            </Circle>
          ))}
          
          {/* SOS Markers */}
          {sosAlerts.map((alert, i) => (
            <Marker
              key={alert.id}
              position={[alert.lat, alert.lon]}
              icon={sosIcon}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-bold text-red-600">SOS Alert #{alert.id}</h3>
                  <p>Time: {new Date(alert.timestamp).toLocaleString()}</p>
                  <p>Message: {alert.message}</p>
                  <p>Status: {alert.status || 'Active'}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      
      {/* Admin Panel */}
      <div className="w-96 bg-black border-l border-gray-800 shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black p-6 border-b border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-3 rounded-xl shadow-lg">
              <span className="text-2xl">🚨</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Control Center</h2>
              <p className="text-gray-300 text-sm">Emergency Response Dashboard</p>
            </div>
          </div>
          <div className="mt-4 flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-green-900/30 px-3 py-2 rounded-lg border border-green-500/30">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-green-300 text-sm font-medium">System Online</span>
            </div>
            <div className="text-gray-400 text-sm">24/7 Active</div>
          </div>
        </div>

        {/* Risk Statistics */}
        <div className="p-4 border-b border-gray-800">
          <div className="mb-4">
            <h3 className="text-white font-bold text-base mb-3 flex items-center">
              <span className="mr-2">📈</span>
              Risk Overview
            </h3>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-gradient-to-br from-red-900/40 to-red-800/20 border border-red-500/30 p-4 rounded-xl text-center backdrop-blur-sm">
              <div className="text-2xl font-bold text-red-400">{stats.High}</div>
              <div className="text-xs font-medium text-red-300 mt-1">High Risk</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-900/40 to-yellow-800/20 border border-yellow-500/30 p-4 rounded-xl text-center backdrop-blur-sm">
              <div className="text-2xl font-bold text-yellow-400">{stats.Medium}</div>
              <div className="text-xs font-medium text-yellow-300 mt-1">Medium</div>
            </div>
            <div className="bg-gradient-to-br from-green-900/40 to-green-800/20 border border-green-500/30 p-4 rounded-xl text-center backdrop-blur-sm">
              <div className="text-2xl font-bold text-green-400">{stats.Low}</div>
              <div className="text-xs font-medium text-green-300 mt-1">Low Risk</div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-200">
                  Active Alerts: <span className="font-bold text-red-400">{getTotalAlerts()}</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Last Update: {new Date().toLocaleTimeString()}
                </p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-blue-400">{riskData.length}</div>
                <div className="text-xs text-blue-300">Total Zones</div>
              </div>
            </div>
          </div>
        </div>

        {/* SOS Alerts */}
        <div className="p-4">
          <div className="mb-4">
            <h3 className="text-white font-bold text-base mb-2 flex items-center">
              <span className="mr-2">🆘</span>
              SOS Alerts ({sosAlerts.length})
            </h3>
            <p className="text-red-400 text-sm">Emergency response required</p>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {sosAlerts.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No active alerts</p>
            ) : (
              sosAlerts.map((alert, i) => (
                <div 
                  key={alert.id} 
                  className={`border rounded-lg p-3 ${
                    alert.status 
                      ? 'bg-green-900/30 border-green-500/50' 
                      : 'bg-red-900/30 border-red-500/50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-semibold text-red-300">
                        Alert #{alert.id}
                        {alert.status && <span className="text-green-400 ml-2">✓ {alert.status}</span>}
                      </div>
                      <div className="text-sm text-gray-400">
                        {new Date(alert.timestamp).toLocaleString()}
                      </div>
                      <div className="text-sm mt-1 text-gray-300">{alert.message}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Location: {alert.lat?.toFixed(4)}, {alert.lon?.toFixed(4)}
                      </div>
                    </div>
                    {!alert.status && (
                      <button 
                        onClick={() => respondToSOS(alert.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-2 rounded-lg text-sm font-semibold transition-colors duration-200 shadow-md border border-blue-500 hover:border-blue-400"
                      >
                        Respond
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Risk Zones Detail */}
        <div className="p-4 border-t border-gray-800">
          <div className="mb-4">
            <h3 className="text-white font-bold text-base mb-2 flex items-center">
              <span className="mr-2">🗺️</span>
              Active Risk Zones
            </h3>
            <p className="text-gray-400 text-sm">Real-time zone monitoring</p>
          </div>
          <div className="space-y-3">
            {riskData.map((zone, i) => (
              <div key={i} className="bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-3 hover:border-gray-600 transition-colors">
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
                <div className="text-sm text-gray-300 mb-2">
                  {zone.disaster}
                </div>
                {zone.riskScore && (
                  <div className="text-xs text-gray-400 mb-2">
                    Risk Score: {zone.riskScore}/100
                  </div>
                )}
                {zone.weather && (
                  <div className="text-xs text-gray-400 bg-gray-800/50 p-2 rounded-lg border border-gray-700">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="font-medium text-gray-300">{zone.weather.rain?.toFixed(1)}mm</div>
                        <div className="text-gray-500">Rain</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-300">{zone.weather.wind?.toFixed(1)}km/h</div>
                        <div className="text-gray-500">Wind</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-300">{zone.weather.temperature?.toFixed(1)}°C</div>
                        <div className="text-gray-500">Temp</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;