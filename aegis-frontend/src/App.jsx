import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import UserMap from './components/UserMap';
import AdminDashboard from './components/AdminDashboard';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-blue-600 text-white p-4">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold">🛡️ Aegis - Smart Safety Navigator</h1>
            <div className="space-x-4">
              <Link to="/" className="hover:underline">User Map</Link>
              <Link to="/admin" className="hover:underline">Admin Dashboard</Link>
            </div>
          </div>
        </nav>
        
        <Routes>
          <Route path="/" element={<UserMap />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;