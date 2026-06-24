import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, ChevronDown, User, Settings, LogOut, CheckCircle2, AlertTriangle, AlertCircle, Menu } from 'lucide-react';

const Header = ({ user, notificationCount = 13, onLogout, setSidebarOpen }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  
  const navigate = useNavigate();
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    // Click outside handler
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch recent alerts to display in list
  useEffect(() => {
    const fetchRecentAlerts = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch('http://localhost:5000/api/alerts?limit=5', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.alerts || []);
        }
      } catch (err) {
        console.error('Failed to load alerts:', err);
      }
    };
    fetchRecentAlerts();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/vehicles?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="h-[76px] bg-white border-b border-slate-100 flex items-center justify-between px-6 md:px-8 fixed top-0 right-0 left-0 md:left-[260px] z-20 select-none">
      {/* Left Search Bar / Menu toggle */}
      <div className="flex items-center flex-1 max-w-[420px] mr-4">
        <button
          type="button"
          onClick={() => setSidebarOpen(prev => !prev)}
          className="mr-3 p-2 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors md:hidden shrink-0"
        >
          <Menu className="w-5.5 h-5.5" />
        </button>

        <form onSubmit={handleSearchSubmit} className="flex-1">
          <div className="relative">
            <Search className="w-4.5 h-4.5 text-slate-400 absolute left-4.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by vehicle number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-2 border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 rounded-xl text-[14px] text-slate-800 placeholder-slate-400 transition-all duration-200"
            />
          </div>
        </form>
      </div>

      {/* Right User Actions */}
      <div className="flex items-center space-x-6">
        {/* Notifications Panel */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all duration-200 relative"
          >
            <Bell className="w-5.5 h-5.5" />
            {notificationCount > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white font-bold text-[9px] w-[17px] h-[17px] rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                {notificationCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotifications && (
            <div className="absolute right-0 mt-2.5 w-[360px] bg-white border border-slate-100 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="px-5 py-3 border-b border-slate-50 flex items-center justify-between">
                <span className="font-bold text-[14px] text-slate-800">Recent Alerts</span>
                <span className="text-[11px] font-semibold text-teal-brand bg-teal-50 px-2 py-0.5 rounded-full">
                  {notificationCount} Active
                </span>
              </div>
              <div className="max-h-[280px] overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      onClick={() => { navigate(notif.vehicle_id ? `/vehicles/${notif.vehicle_id}` : '/alerts'); setShowNotifications(false); }}
                      className="px-5 py-3.5 hover:bg-slate-50/80 border-b border-slate-50 last:border-b-0 cursor-pointer flex items-start space-x-3"
                    >
                      <div className="mt-0.5">
                        {notif.status === 'Expired' ? (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        ) : notif.status === 'Resolved' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                        )}
                      </div>
                      <div className="flex-1 space-y-0.5">
                        <div className="flex justify-between items-baseline">
                          <span className="text-[12px] font-bold text-slate-700">{notif.vehicle_number || notif.Vehicle?.vehicle_number}</span>
                          <span className="text-[9px] text-slate-400">
                            {notif.createdAt ? new Date(notif.createdAt).toLocaleDateString() : 'Just now'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-normal">{notif.message}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-5 py-8 text-center text-slate-400 text-[12px]">
                    No active alerts.
                  </div>
                )}
              </div>
              <div 
                onClick={() => { navigate('/alerts'); setShowNotifications(false); }}
                className="px-5 py-2.5 border-t border-slate-50 text-center text-[12px] font-semibold text-teal-brand hover:text-teal-brandHover cursor-pointer hover:bg-slate-50/50"
              >
                View All Alerts
              </div>
            </div>
          )}
        </div>

        {/* User Profile Info & Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-3.5 p-1 px-2.5 rounded-xl hover:bg-slate-50 transition-all duration-200 text-left"
          >
            {/* Circle Icon Badge */}
            <div className={`w-9 h-9 rounded-full ${localStorage.getItem('user_avatar_color') || 'bg-teal-500'} flex items-center justify-center text-white font-extrabold text-[15px] font-outfit shadow-sm`}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="hidden md:block">
              <p className="text-[13px] font-bold text-slate-800 leading-none">
                {user?.name || 'Admin'}
              </p>
              <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-wider">
                {user?.role || 'Administrator'}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>
 
          {/* Profile Menu Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2.5 w-[200px] bg-white border border-slate-100 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="px-4 py-2.5 border-b border-slate-55">
                <p className="text-[12px] text-slate-400">Signed in as</p>
                <p className="text-[13px] font-bold text-slate-700 truncate">{user?.email || 'admin@manivtha.com'}</p>
              </div>

              <button
                onClick={() => { onLogout(); setShowProfileMenu(false); }}
                className="w-full flex items-center space-x-3 px-4 py-2.5 text-[13px] font-semibold text-red-600 hover:bg-red-50 transition-all duration-200 text-left"
              >
                <LogOut className="w-4 h-4 text-red-400" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
