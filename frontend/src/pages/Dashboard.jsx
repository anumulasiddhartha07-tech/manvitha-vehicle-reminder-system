import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Car, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Calendar as CalendarIcon, 
  TrendingUp, 
  ArrowUpRight,
  Mail,
  Clock 
} from 'lucide-react';
import VehicleSVG from '../components/VehicleSVG';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalVehicles: 0,
    activeCount: 0,
    expiringSoonCount: 0,
    expiredCount: 0
  });
  const [expiringDocs, setExpiringDocs] = useState([]);
  const [barData, setBarData] = useState({ Insurance: 0, Permit: 0, Fitness: 0 });
  const [lineData, setLineData] = useState([0, 0, 0, 0, 0, 0]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [emailStats, setEmailStats] = useState({
    today: 0,
    week: 0,
    failed: 0,
    lastSent: null
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Fetch stats
        const statsRes = await fetch('http://localhost:5000/api/alerts/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Fetch vehicles list to get counts and top expiring docs
        const vehiclesRes = await fetch('http://localhost:5000/api/vehicles?limit=100', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (statsRes.ok && vehiclesRes.ok) {
          const statsData = await statsRes.json();
          const vehiclesData = await vehiclesRes.json();

          // Calculate counts based on vehicles
          const total = vehiclesData.total;
          const expired = statsData.expiredCount;
          const expiringSoon = statsData.expiringSoonCount;
          const active = total - expired - expiringSoon;

          setStats({
            totalVehicles: total,
            activeCount: active > 0 ? active : 0,
            expiringSoonCount: expiringSoon,
            expiredCount: expired
          });

          // Extract documents expiring soon or expired for display
          const docList = [];
          let insuranceAlerts = 0;
          let permitAlerts = 0;
          let fitnessAlerts = 0;
          const monthlyCounts = [0, 0, 0, 0, 0, 0];

          vehiclesData.vehicles.forEach(vehicle => {
            vehicle.Documents.forEach(doc => {
              if (doc.status !== 'Active') {
                docList.push({
                  id: doc.id,
                  vehicle_id: vehicle.id,
                  vehicle_number: vehicle.vehicle_number,
                  vehicle_model: vehicle.vehicle_model,
                  vehicle_type: vehicle.vehicle_type,
                  document_type: doc.document_type,
                  expiry_date: doc.expiry_date,
                  status: doc.status
                });

                if (doc.document_type === 'Insurance') insuranceAlerts++;
                if (doc.document_type === 'Permit') permitAlerts++;
                if (doc.document_type === 'Fitness') fitnessAlerts++;
              }

              if (doc.expiry_date) {
                const d = new Date(doc.expiry_date);
                if (d.getFullYear() === 2026) {
                  const m = d.getMonth();
                  if (m >= 5 && m <= 10) {
                    monthlyCounts[m - 5]++;
                  }
                }
              }
            });
          });

          setBarData({
            Insurance: insuranceAlerts,
            Permit: permitAlerts,
            Fitness: fitnessAlerts
          });
          setLineData(monthlyCounts);

          // Sort documents by closest expiry date
          docList.sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));
          setExpiringDocs(docList.slice(0, 5));
        }


      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // SVG Chart Renderers
  const renderPieChart = () => {
    const total = stats.activeCount + stats.expiringSoonCount + stats.expiredCount;
    if (total === 0) return <div className="text-center text-slate-400 text-[12px] py-12">No compliance data available.</div>;

    const pctActive = stats.activeCount / total;
    const pctExpiring = stats.expiringSoonCount / total;
    const pctExpired = stats.expiredCount / total;

    const r = 38;
    const C = 2 * Math.PI * r;

    const dashActive = C * pctActive;
    const dashExpiring = C * pctExpiring;
    const dashExpired = C * pctExpired;

    const offsetActive = 0;
    const offsetExpiring = -dashActive;
    const offsetExpired = -(dashActive + dashExpiring);

    return (
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between h-[300px]">
        <div className="font-bold text-[14px] text-slate-800 pb-2 border-b border-slate-50 flex items-center justify-between">
          <span>Compliance Ratio</span>
          <span className="text-[10px] text-slate-400">Total active status</span>
        </div>
        <div className="flex items-center justify-center space-x-6 py-2 flex-1">
          <div className="relative w-28 h-28 shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r={r} fill="transparent" stroke="#f1f5f9" strokeWidth="8" />
              {pctActive > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r={r}
                  fill="transparent"
                  stroke="#0EA5A8"
                  strokeWidth="8"
                  strokeDasharray={`${dashActive} ${C}`}
                  strokeDashoffset={offsetActive}
                  strokeLinecap="round"
                />
              )}
              {pctExpiring > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r={r}
                  fill="transparent"
                  stroke="#d97706"
                  strokeWidth="8"
                  strokeDasharray={`${dashExpiring} ${C}`}
                  strokeDashoffset={offsetExpiring}
                  strokeLinecap="round"
                />
              )}
              {pctExpired > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r={r}
                  fill="transparent"
                  stroke="#e11d48"
                  strokeWidth="8"
                  strokeDasharray={`${dashExpired} ${C}`}
                  strokeDashoffset={offsetExpired}
                  strokeLinecap="round"
                />
              )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xl font-black text-slate-800 leading-none font-outfit">{total}</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">Fleet</span>
            </div>
          </div>
          <div className="space-y-2 flex-1">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0EA5A8] shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 block leading-none">Active</span>
                <span className="text-[12px] font-extrabold text-slate-700 block mt-0.5">{stats.activeCount} ({Math.round(pctActive * 100)}%)</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-600 shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 block leading-none">Warning</span>
                <span className="text-[12px] font-extrabold text-slate-700 block mt-0.5">{stats.expiringSoonCount} ({Math.round(pctExpiring * 100)}%)</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 block leading-none">Expired</span>
                <span className="text-[12px] font-extrabold text-slate-700 block mt-0.5">{stats.expiredCount} ({Math.round(pctExpired * 100)}%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBarChart = () => {
    const maxVal = Math.max(...Object.values(barData), 5);
    const labels = Object.keys(barData);
    const colors = {
      Insurance: '#0EA5A8',
      Permit: '#6366f1',
      Fitness: '#a855f7'
    };

    return (
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between h-[300px]">
        <div className="font-bold text-[14px] text-slate-800 pb-2 border-b border-slate-50 flex items-center justify-between">
          <span>Non-Compliant Alerts</span>
          <span className="text-[10px] text-slate-400">By document type</span>
        </div>
        <div className="relative flex items-end justify-around h-44 px-3 pt-6 border-b border-slate-50 flex-1">
          {labels.map((lbl, idx) => {
            const val = barData[lbl] || 0;
            const heightPct = Math.min((val / maxVal) * 100, 100);
            return (
              <div key={idx} className="flex flex-col items-center group w-1/5 relative">
                <div className="absolute -top-7 bg-slate-800 text-white text-[9px] font-bold px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-sm whitespace-nowrap z-10">
                  {val} Alert{val !== 1 ? 's' : ''}
                </div>
                <div
                  style={{ height: `${Math.max(heightPct, 6)}%`, backgroundColor: colors[lbl] }}
                  className="w-7 rounded-t-md transition-all duration-300 shadow-sm hover:brightness-105 cursor-pointer"
                />
                <span className="text-[10px] font-bold text-slate-500 mt-2 block select-none truncate max-w-full">
                  {lbl}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderLineChart = () => {
    const maxVal = Math.max(...lineData, 5);
    const labels = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
    
    const points = lineData.map((val, idx) => {
      const x = 30 + idx * 44;
      const y = 120 - (val / maxVal) * 80;
      return { x, y, val };
    });

    const pathD = points.length > 0 
      ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') 
      : '';

    return (
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between h-[300px]">
        <div className="font-bold text-[14px] text-slate-800 pb-2 border-b border-slate-50 flex items-center justify-between">
          <span>6-Month Expiry Trend</span>
          <span className="text-[10px] text-slate-400">Warnings timeline</span>
        </div>
        <div className="relative w-full h-44 mt-3 flex-1 flex items-center justify-center">
          <svg className="w-full h-full max-h-[160px]" viewBox="0 0 280 150">
            <line x1="25" y1="40" x2="265" y2="40" stroke="#f8fafc" strokeWidth="1" />
            <line x1="25" y1="80" x2="265" y2="80" stroke="#f8fafc" strokeWidth="1" />
            <line x1="25" y1="120" x2="265" y2="120" stroke="#e2e8f0" strokeWidth="1.5" />
            {pathD && (
              <path
                d={pathD}
                fill="none"
                stroke="#0EA5A8"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            {points.map((p, idx) => (
              <g key={idx} className="group cursor-pointer">
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="4"
                  fill="#ffffff"
                  stroke="#0EA5A8"
                  strokeWidth="2"
                  className="hover:r-5 transition-all duration-150"
                />
                <text x={p.x} y="142" textAnchor="middle" className="text-[9px] font-bold fill-slate-400">
                  {labels[idx]}
                </text>
                <text x={p.x} y={p.y - 10} textAnchor="middle" className="text-[9px] font-extrabold fill-slate-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {p.val}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    );
  };

  // Simple Mini Calendar for June/July 2026
  const renderCalendar = () => {
    // June 2026 started on a Monday (June 1st, 2026)
    const daysInMonth = 30;
    const monthName = 'June 2026';
    const firstDayIndex = 1; // Monday is index 1

    const blankDays = Array(firstDayIndex).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const allDays = [...blankDays, ...days];

    // Expiry highlight days for active compliance warnings in June 2026:
    const expiredDays = expiringDocs
      .filter(doc => {
        if (!doc.expiry_date) return false;
        const d = new Date(doc.expiry_date);
        return d.getFullYear() === 2026 && d.getMonth() === 5; // June 2026
      })
      .map(doc => new Date(doc.expiry_date).getDate());

    return (
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex justify-between items-center pb-2">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-5 h-5 text-teal-brand" />
            <span className="font-bold text-[14px] text-slate-800">{monthName}</span>
          </div>
          <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2.5 py-0.5 rounded-full flex items-center space-x-1">
            <span className="w-1 h-1 rounded-full bg-red-500 animate-ping"></span>
            <span>Expiries Highlighted</span>
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          <span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span><span>Su</span>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {allDays.map((day, idx) => {
            if (day === null) {
              return <div key={`blank-${idx}`} className="aspect-square"></div>;
            }

            const isCurrentDay = day === 22; // June 22, 2026 is the system anchored day
            const isExpiry = expiredDays.includes(day);

            return (
              <div
                key={`day-${day}`}
                className={`aspect-square rounded-lg flex items-center justify-center text-[12px] font-semibold transition-all duration-150 ${
                  isCurrentDay 
                    ? 'bg-teal-brand text-white font-extrabold shadow-sm'
                    : isExpiry
                    ? 'bg-red-50 text-red-600 border border-red-100 font-bold hover:bg-red-100'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-7 animate-in fade-in duration-300">
      {/* Page Header Title */}
      <div>
        <h1 className="text-[26px] font-bold text-slate-800 font-outfit leading-tight">Dashboard</h1>
        <p className="text-[13px] text-slate-500 mt-1">Manage and track fleet-wide insurance, permit, and fitness status.</p>
      </div>

      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-r from-teal-brand to-[#006666] text-white rounded-2xl p-6 md:p-8 shadow-md relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-white/5 rounded-full blur-2xl -mr-20 -mt-20"></div>
        
        <div className="space-y-2 z-10 max-w-[500px]">
          <h2 className="text-[22px] font-extrabold font-outfit">
            Welcome back, {user?.full_name || 'Administrator'}!
          </h2>
          <p className="text-[13px] text-teal-100/90 leading-relaxed">
            All systems are functioning. We detected <span className="text-white font-extrabold">{stats.expiredCount} expired documents</span> requiring your immediate attention. Check the expiring documents log below.
          </p>
        </div>

        {user?.role === 'MANAGEMENT' ? (
          <button 
            onClick={() => navigate('/reports')}
            className="bg-white text-teal-brand hover:bg-teal-50 px-5 py-2.5 rounded-xl font-bold text-[13px] shadow-sm flex items-center space-x-1.5 active:scale-[0.98] transition-all z-10 duration-200"
          >
            <span>View Reports</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        ) : (
          <button 
            onClick={() => navigate('/vehicles')}
            className="bg-white text-teal-brand hover:bg-teal-50 px-5 py-2.5 rounded-xl font-bold text-[13px] shadow-sm flex items-center space-x-1.5 active:scale-[0.98] transition-all z-10 duration-200"
          >
            <span>Manage Vehicles</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Statistics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Vehicles Card */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 bg-sky-50 rounded-xl flex items-center justify-center border border-sky-100 shrink-0">
            <Car className="w-6 h-6 text-sky-600" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Total Vehicles</p>
            <h3 className="text-[24px] font-bold text-slate-800 mt-1 font-outfit leading-none">{stats.totalVehicles}</h3>
            <p className="text-[10px] text-slate-400 mt-1.5">Registered fleet units</p>
          </div>
        </div>

        {/* Active Documents Card */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100 shrink-0">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Active Fleet</p>
            <h3 className="text-[24px] font-bold text-slate-850 mt-1 font-outfit text-emerald-700 leading-none">{stats.activeCount}</h3>
            <p className="text-[10px] text-slate-400 mt-1.5">All documents verified</p>
          </div>
        </div>

        {/* Expiring Soon Card */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center border border-amber-100 shrink-0">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Expiring Soon</p>
            <h3 className="text-[24px] font-bold text-slate-850 mt-1 font-outfit text-amber-700 leading-none">{stats.expiringSoonCount}</h3>
            <p className="text-[10px] text-slate-400 mt-1.5">Expires within 30 days</p>
          </div>
        </div>

        {/* Expired Documents Card */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center border border-red-100 shrink-0">
            <XCircle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Expired Alerts</p>
            <h3 className="text-[24px] font-bold text-slate-850 mt-1 font-outfit text-red-700 leading-none">{stats.expiredCount}</h3>
            <p className="text-[10px] text-slate-400 mt-1.5">Require immediate renewal</p>
          </div>
        </div>
      </div>



      {/* Visual Analytics Charts Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {renderPieChart()}
        {renderBarChart()}
        {renderLineChart()}
      </div>

      {/* Expiry Calendar & Top Expiries Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Top Expiring Documents list */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-50 pb-3">
            <span className="font-bold text-[14px] text-slate-800">Top Expiring Documents</span>
            <button 
              onClick={() => navigate('/alerts')}
              className="text-[11px] font-bold text-teal-brand hover:text-teal-brandHover hover:underline"
            >
              View All Alerts
            </button>
          </div>

          {loading ? (
            <div className="py-8 text-center text-slate-400 text-[12px]">Loading lists...</div>
          ) : expiringDocs.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {expiringDocs.map((doc) => (
                <div key={doc.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0">
                      <VehicleSVG type={doc.vehicle_type} className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="text-[13px] font-bold text-slate-800 leading-none">{doc.vehicle_number}</h4>
                      <p className="text-[11px] text-slate-400 mt-1">{doc.vehicle_model}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6 text-right">
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Doc Type</span>
                      <span className="text-[12px] font-semibold text-slate-700 mt-0.5 block">{doc.document_type}</span>
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Expiry Date</span>
                      <span className="text-[12px] font-semibold text-slate-700 mt-0.5 block">
                        {!doc.expiry_date || isNaN(new Date(doc.expiry_date).getTime()) 
                          ? 'Not Mentioned' 
                          : new Date(doc.expiry_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-block ${
                        doc.status === 'Expired'
                          ? 'bg-red-50 text-red-600 border border-red-100'
                          : 'bg-amber-50 text-amber-600 border border-amber-100'
                      }`}>
                        {doc.status}
                      </span>
                    </div>
                    <button 
                      onClick={() => navigate(`/vehicles/${doc.vehicle_id}`)}
                      className="p-1 px-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 text-[11px] font-bold rounded-lg transition-colors"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-[12px]">
              No documents expiring soon! All systems are green.
            </div>
          )}
        </div>

        {/* Right Column: Calendar Widget */}
        <div className="space-y-6">
          {renderCalendar()}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
