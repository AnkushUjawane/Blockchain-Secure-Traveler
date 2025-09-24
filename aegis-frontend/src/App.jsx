import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import UserMap from './components/UserMap';
import AdminDashboard from './components/AdminDashboard';

function Navbar() {
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
              <h1 className="text-3xl font-black text-white tracking-tight">Aegis</h1>
              <p className="text-blue-100 text-base font-bold">Smart Tourist Safety Monitor</p>
            </div>
          </div>
          
          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            <Link 
              to="/" 
              style={{ textDecoration: 'none' }}
              className={`px-6 py-3 rounded-xl font-bold text-base transition-all duration-300 flex items-center space-x-2 shadow-lg ${
                location.pathname === '/' 
                  ? 'bg-blue-600 text-white shadow-xl border border-blue-500' 
                  : 'bg-gray-700 text-gray-200 hover:bg-blue-600 hover:text-white border border-gray-600'
              }`}
            >
              <span className="text-lg">🗺️</span>
              <span>Safety Map</span>
            </Link>
            <Link 
              to="/admin" 
              style={{ textDecoration: 'none' }}
              className={`px-6 py-3 rounded-xl font-bold text-base transition-all duration-300 flex items-center space-x-2 shadow-lg ${
                location.pathname === '/admin' 
                  ? 'bg-red-600 text-white shadow-xl border border-red-500' 
                  : 'bg-gray-700 text-gray-200 hover:bg-red-600 hover:text-white border border-gray-600'
              }`}
            >
              <span className="text-lg">⚡</span>
              <span>Control Center</span>
            </Link>
          </div>
        </div>
        

      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-900">
        <Navbar />
        
        <Routes>
          <Route path="/" element={<UserMap />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;