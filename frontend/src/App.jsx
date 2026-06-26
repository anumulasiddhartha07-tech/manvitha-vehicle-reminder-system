import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import AddVehicle from './pages/AddVehicle';
import VehicleDetails from './pages/VehicleDetails';
import Alerts from './pages/Alerts';
import Reports from './pages/Reports';
import Documents from './pages/Documents';

const ProtectedRoute = ({ user, children }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const App = () => {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifCount, setNotifCount] = useState(0); // Set default to 0
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Check local storage for authenticated sessions
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const storedSettings = localStorage.getItem('settings');

    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        setSettings(parsed);
        if (parsed?.theme) {
          applyTheme(parsed.theme);
        }
      }
    }
    setLoading(false);
  }, []);

  // Fetch count of active warnings periodically or on update
  useEffect(() => {
    if (!user) return;

    const fetchCounts = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://https://manvitha-vehicle-reminder-system-1.onrender.com/api/alerts/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Total active count = expired + expiring soon
          setNotifCount(data.expiredCount + data.expiringSoonCount);
          if (data.theme) {
            applyTheme(data.theme);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 30000); // 30 seconds poll
    return () => clearInterval(interval);
  }, [user]);

  const applyTheme = (themeName) => {
    if (themeName === 'Dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLoginSuccess = (userData, settingsData) => {
    setUser(userData);
    setSettings(settingsData);
    if (settingsData?.theme) {
      applyTheme(settingsData.theme);
    }
  };

  const handleSettingsUpdate = (userData, settingsData) => {
    setUser(userData);
    setSettings(settingsData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('settings', JSON.stringify(settingsData));
    if (settingsData?.theme) {
      applyTheme(settingsData.theme);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('settings');
    setUser(null);
    setSettings(null);
    document.documentElement.classList.remove('dark');
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50 text-slate-450 font-bold select-none">
        Initializing renewal system board...
      </div>
    );
  }

  // If not authenticated, render Login Page or Reset Password
  if (!user) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 text-slate-800 flex select-none">
        {/* Navigation Sidebar Panel */}
        <Sidebar user={user} onLogout={handleLogout} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        {/* Right side container page columns */}
        <div className="flex-1 pl-0 md:pl-[260px] flex flex-col min-h-screen transition-all duration-300">
          {/* Header row */}
          <Header user={user} notificationCount={notifCount} onLogout={handleLogout} setSidebarOpen={setSidebarOpen} />

          {/* Subpage content column */}
          <main className="flex-1 p-8 pt-[104px] overflow-y-auto max-w-[1300px] w-full mx-auto">
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/vehicles" element={
                <ProtectedRoute user={user}>
                  <Vehicles />
                </ProtectedRoute>
              } />
              <Route path="/vehicles/add" element={
                <ProtectedRoute user={user}>
                  <AddVehicle />
                </ProtectedRoute>
              } />
              <Route path="/vehicles/edit/:id" element={
                <ProtectedRoute user={user}>
                  <AddVehicle />
                </ProtectedRoute>
              } />
              <Route path="/vehicles/:id" element={
                <ProtectedRoute user={user}>
                  <VehicleDetails />
                </ProtectedRoute>
              } />
              <Route path="/documents" element={
                <ProtectedRoute user={user}>
                  <Documents />
                </ProtectedRoute>
              } />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/reports" element={
                <ProtectedRoute user={user}>
                  <Reports />
                </ProtectedRoute>
              } />
              {/* Default redirect routing */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
};

export default App;
