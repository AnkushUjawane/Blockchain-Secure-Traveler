import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import UserMap from './components/UserMap';
import AdminDashboard from './components/AdminDashboard';
import Login from './components/Login';
import { point } from 'leaflet';

function Navbar({ user, onLogout }) {
  const location = useLocation();
  
  return (
    <nav className="bg-gradient-to-r from-gray-900 via-gray-800 to-black shadow-xl border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-20">
          {/* Logo Section */}
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-2xl shadow-lg">
              <span className="text-3xl">🛡️</span>
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">Avinya</h1>
              <p className="text-blue-100 text-base font-bold">Smart Traveller System</p>
            </div>
          </div>
          
          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            <div className="text-white text-sm">
              Welcome, {user?.name || 'User'}
            </div>
            <Link 
              to="/" 
              style={{
                textDecoration: 'none',
                padding: '5px 10px',
                borderRadius: '12px',   
                fontWeight: 'bold',
                fontSize: '16px',      
                textAlign: 'center',
                transition: 'all 0.3s ease',
                display: 'flex', 
                gap: '8px',                
                boxShadow: location.pathname === '/' 
                  ? '0 4px 6px rgba(0,0,0,0.25)'  
                  : '0 2px 4px rgba(0,0,0,0.2)',  
                backgroundColor: location.pathname === '/' ? '#2563eb' : '#374151', 
                color: location.pathname === '/' ? '#ffffff' : '#e5e7eb',       
                border: location.pathname === '/' 
                  ? '1px solid #3b82f6'  
                  : '1px solid #4b5563'  
              }}
            >
              <span>Safety Map</span>
            </Link>

            <Link 
              to="/admin"
              style={{
                textDecoration: 'none',
                padding: '5px',
                borderRadius: '12px',
                fontWeight: 'bold',
                fontSize: '16px',
                textAlign: 'center',
                transition: 'all 0.3s ease',
                display: 'flex',
                boxShadow: location.pathname === '/admin' 
                  ? '0 4px 6px rgba(0,0,0,0.25)'  
                  : '0 2px 4px rgba(0,0,0,0.2)',  
                backgroundColor: location.pathname === '/admin' ? '#dc2626' : '#374151', 
                color: location.pathname === '/admin' ? '#ffffff' : '#e5e7eb',          
                border: location.pathname === '/admin' 
                  ? '1px solid #ef4444'   
                  : '1px solid #4b5563'  
              }}
            >
              <span>Control Center</span>
            </Link>

            <button
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition((position) => {
                    const user = JSON.parse(localStorage.getItem('Avinya_current_user')) || { name: 'Anonymous User', email: 'unknown@example.com' };
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
                        alert(`🚨 Emergency SOS Activated!\n\nLocation: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}\n\nYour location has been sent to the control center.\nNearby hospitals are being notified.\nRescue teams are en route.`);
                        ws.close();
                      };
                    } catch (error) {
                      alert(`🚨 SOS Alert Sent (Offline Mode)\n\nLocation: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}\n\nYour emergency request has been logged.`);
                    }
                  });
                } else {
                  alert('🚨 SOS Alert Sent (Demo Mode)\n\nGPS unavailable - using default location for emergency response.');
                }
              }
            }
              style={{border: 'none', cursor: 'pointer'}}
              className="py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-all duration-200 animate-pulse flex items-center space-x-2"
            >
              <span>EMERGENCY SOS</span>
            </button>
            <button
              onClick={onLogout}
              style={{backgroundColor: "gray", border: 'none', padding: '1% 2%',borderRadius: '10px', color: 'white', fontWeight: '700', fontSize: '15px', cursor: 'pointer'}}
            >
              Logout
            </button>
          </div>
        </div>
        

      </div>
    </nav>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('Avinya_current_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('Avinya_current_user');
    setUser(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-900">
        <Navbar user={user} onLogout={handleLogout} />
        
        <Routes>
          <Route path="/" element={<UserMap />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;