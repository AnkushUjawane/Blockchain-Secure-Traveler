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
      <div className="w-96 bg-white shadow-lg overflow-y-auto">
        {/* Header */}
        <div className="bg-red-600 text-white p-4">
          <h2 className="text-xl font-bold">🚨 Emergency Control Center</h2>
          <p className="text-sm">Real-time monitoring dashboard</p>
        </div>

        {/* Risk Statistics */}
        <div className="p-4 border-b">
          <h3 className="font-semibold mb-3">Risk Overview</h3>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-red-100 p-3 rounded text-center">
              <div className="text-2xl font-bold text-red-600">{stats.High}</div>
              <div className="text-sm">High Risk</div>
            </div>
            <div className="bg-yellow-100 p-3 rounded text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.Medium}</div>
              <div className="text-sm">Medium Risk</div>
            </div>
            <div className="bg-green-100 p-3 rounded text-center">
              <div className="text-2xl font-bold text-green-600">{stats.Low}</div>
              <div className="text-sm">Low Risk</div>
            </div>
          </div>
          <div className="mt-3 p-2 bg-gray-100 rounded">
            <p className="text-sm">
              <span className="font-semibold">Active Alerts:</span> {getTotalAlerts()}
            </p>
            <p className="text-sm">
              <span className="font-semibold">Last Update:</span> {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>

        {/* SOS Alerts */}
        <div className="p-4">
          <h3 className="font-semibold mb-3">
            SOS Alerts ({sosAlerts.length})
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {sosAlerts.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No active alerts</p>
            ) : (
              sosAlerts.map((alert, i) => (
                <div 
                  key={alert.id} 
                  className={`border rounded p-3 ${alert.status ? 'bg-gray-50' : 'bg-red-50 border-red-200'}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-semibold text-red-700">
                        Alert #{alert.id}
                        {alert.status && <span className="text-green-600 ml-2">✓ {alert.status}</span>}
                      </div>
                      <div className="text-sm text-gray-600">
                        {new Date(alert.timestamp).toLocaleString()}
                      </div>
                      <div className="text-sm mt-1">{alert.message}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Location: {alert.lat?.toFixed(4)}, {alert.lon?.toFixed(4)}
                      </div>
                    </div>
                    {!alert.status && (
                      <button 
                        onClick={() => respondToSOS(alert.id)}
                        className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 ml-2"
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
        <div className="p-4 border-t">
          <h3 className="font-semibold mb-3">Active Risk Zones</h3>
          <div className="space-y-2">
            {riskData.map((zone, i) => (
              <div key={i} className="border rounded p-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{zone.name}</span>
                  <span 
                    className="px-2 py-1 rounded text-xs font-semibold text-white"
                    style={{ backgroundColor: zone.color }}
                  >
                    {zone.risk}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {zone.disaster}
                </div>
                {zone.riskScore && (
                  <div className="text-xs text-gray-500 mt-1">
                    Risk Score: {zone.riskScore}/100
                  </div>
                )}
                {zone.weather && (
                  <div className="text-xs text-gray-500 mt-1">
                    Rain: {zone.weather.rain?.toFixed(1)}mm | 
                    Wind: {zone.weather.wind?.toFixed(1)}km/h | 
                    Temp: {zone.weather.temperature?.toFixed(1)}°C
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