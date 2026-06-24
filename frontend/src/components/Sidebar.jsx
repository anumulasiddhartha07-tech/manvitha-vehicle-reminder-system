import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Car, 
  Bell, 
  BarChart3, 
  User,
  Settings, 
  LogOut, 
  ShieldCheck,
  Users,
  FileText,
  Clock,
  Mail
} from 'lucide-react';

const Sidebar = ({ user, onLogout, sidebarOpen, setSidebarOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Vehicles', icon: Car, path: '/vehicles' },
    { name: 'Documents', icon: FileText, path: '/documents' },
    { name: 'Alerts', icon: Bell, path: '/alerts' },
    { name: 'Reports', icon: BarChart3, path: '/reports' },
  ];

  return (
    <>
      {/* Sidebar mobile backdrop */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)} 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 md:hidden transition-all duration-300"
        />
      )}

      <div className={`w-[260px] h-screen bg-white border-r border-slate-100 flex flex-col justify-between p-6 fixed left-0 top-0 z-45 select-none transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div>
          {/* Logo and Branding */}
          <div className="mb-8 pl-2">
            <div className="text-[26px] font-extrabold font-outfit text-teal-brand tracking-wide leading-none">
              Manivtha
            </div>
            <div className="text-[13px] font-medium font-outfit text-teal-brand mt-1 uppercase tracking-wider">
              Tours & Travels
            </div>
            <div className="w-8 h-[2px] bg-teal-brand mt-3 rounded-full"></div>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const isActive = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path));
              const Icon = item.icon;

              return (
                <button
                  key={item.name}
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3.5 px-4 py-3 rounded-xl text-[14px] font-semibold transition-all duration-200 text-left ${
                    isActive
                      ? 'bg-teal-brand text-white shadow-md shadow-teal-700/10'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer / Logout */}
        <div className="space-y-6">
          <button
            onClick={() => {
              onLogout();
              setSidebarOpen(false);
            }}
            className="w-full flex items-center space-x-3.5 px-4 py-3 rounded-xl text-[14px] font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all duration-200 text-left"
          >
            <LogOut className="w-5 h-5 text-slate-400" />
            <span>Logout</span>
          </button>

        {/* Shield Widget matching screenshots */}
        <div className="bg-[#FAFDFD] border border-teal-100 rounded-2xl p-4 flex flex-col items-center text-center space-y-3.5 shadow-sm">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-teal-100 shadow-sm">
            <ShieldCheck className="w-6 h-6 text-teal-brand" />
          </div>
          <div className="space-y-1">
            <h4 className="text-[12px] font-bold text-teal-900 leading-tight">
              Vehicle Insurance &
            </h4>
            <h4 className="text-[12px] font-bold text-teal-900 leading-tight">
              Permit Renewal System
            </h4>
          </div>
          <div className="w-6 h-[1px] bg-slate-200"></div>
          <div className="space-y-0.5">
            <p className="text-[9px] font-medium text-slate-400">Powered by</p>
            <p className="text-[10px] font-bold text-teal-950 font-outfit">
              Manivtha Tours & Travels
            </p>
          </div>
        </div>
      </div>
    </div>
  </>
);
};

export default Sidebar;
