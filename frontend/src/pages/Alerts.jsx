import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  RotateCcw, 
  ChevronDown, 
  Bell, 
  Clock, 
  CheckCircle, 
  Send, 
  ShieldAlert, 
  ChevronLeft, 
  ChevronRight,
  FileText,
  Shield,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Calendar
} from 'lucide-react';
import VehicleSVG from '../components/VehicleSVG';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Statistics counters state
  const [stats, setStats] = useState({
    expiredCount: 0,
    expiringSoonCount: 0,
    resolvedCount: 0
  });

  // Filters state
  const [search, setSearch] = useState('');
  const [alertType, setAlertType] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Newest First');
  const [dateRange, setDateRange] = useState('');

  const navigate = useNavigate();

  // Load stats and list items from API
  const loadAlertsData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // 1. Fetch Stats
      const statsRes = await fetch('http://localhost:5000/api/alerts/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // 2. Fetch Alerts List
      const alertsUrl = new URL('http://localhost:5000/api/alerts');
      alertsUrl.searchParams.append('page', page);
      alertsUrl.searchParams.append('limit', 6);
      if (search) alertsUrl.searchParams.append('search', search);
      if (alertType !== 'All') alertsUrl.searchParams.append('type', alertType);
      if (statusFilter !== 'All') alertsUrl.searchParams.append('status', statusFilter);
      if (priorityFilter !== 'All') alertsUrl.searchParams.append('priority', priorityFilter);

      const alertsRes = await fetch(alertsUrl.toString(), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        setAlerts(alertsData.alerts);
        setTotal(alertsData.total);
        setTotalPages(alertsData.totalPages);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAlertsData();
  }, [page, alertType, statusFilter, priorityFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadAlertsData();
  };

  const handleMarkAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/alerts/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        loadAlertsData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/alerts/read-all', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        loadAlertsData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReset = () => {
    setSearch('');
    setAlertType('All');
    setStatusFilter('All');
    setPriorityFilter('All');
    setSortBy('Newest First');
    setDateRange('');
    setPage(1);
    setTimeout(() => loadAlertsData(), 50);
  };

  // Helper formatting for dates
  const formatDate = (dateStr) => {
    if (!dateStr || dateStr === 'null' || dateStr === 'undefined') return 'Not Mentioned';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Not Mentioned';
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr || dateStr === 'null' || dateStr === 'undefined') return 'Not Mentioned';
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) return 'Not Mentioned';
    const datePart = dateObj.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const timePart = dateObj.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    return `${datePart} ${timePart}`;
  };

  // Days left styling helper
  const getDaysLeftCell = (alert) => {
    if (alert.status === 'Expired') {
      const days = Math.abs(alert.days_left);
      return (
        <span className="text-red-500 font-bold select-none">
          Expired {days || 5} Days Ago
        </span>
      );
    } else if (alert.status === 'Resolved') {
      return <span className="text-emerald-600 font-bold">Resolved</span>;
    } else {
      return <span className="text-amber-500 font-bold">{alert.days_left} Days</span>;
    }
  };

  // Render left color border strips for alert table row
  const getRowStripColor = (status) => {
    if (status === 'Expired') return 'bg-red-500';
    if (status === 'Expiring Soon') return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 print:bg-white print:p-0 select-none">
      {/* Title & Actions */}
      <div className="flex justify-between items-start print:items-center">
        <div>
          <h1 className="text-[26px] font-bold text-slate-800 font-outfit leading-none">Alerts Management</h1>
          <p className="text-[13px] text-slate-500 mt-1.5">Monitor document expiries and track renewal notifications</p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleMarkAllRead}
            className="h-10.5 px-4.5 bg-teal-50 border border-teal-100 hover:bg-teal-100/55 text-teal-700 font-bold text-[12.5px] rounded-xl flex items-center space-x-2 shadow-sm transition-colors print:hidden cursor-pointer"
          >
            <CheckCircle2 className="w-4.5 h-4.5" />
            <span>Mark All Read</span>
          </button>
        </div>
      </div>

      {/* Metrics Row at Top */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 select-none">
        {/* Metric 1: Expired */}
        <div className="bg-red-50/20 border border-red-100 rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[12px] font-bold text-slate-500">Expired Alerts</span>
            <h3 className="text-[34px] font-bold text-red-500 font-outfit leading-none mt-1">
              {stats.expiredCount}
            </h3>
            <p className="text-[9.5px] text-slate-450 font-medium">Require immediate action</p>
          </div>
          <div className="w-12 h-12 bg-red-100/50 rounded-2xl flex items-center justify-center shrink-0 border border-red-200/50">
            <ShieldAlert className="w-6 h-6 text-red-500" />
          </div>
        </div>

        {/* Metric 2: Expiring Soon */}
        <div className="bg-amber-50/20 border border-amber-100 rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[12px] font-bold text-slate-500">Expiring Soon</span>
            <h3 className="text-[34px] font-bold text-amber-500 font-outfit leading-none mt-1">
              {stats.expiringSoonCount}
            </h3>
            <p className="text-[9.5px] text-slate-450 font-medium">Within next 30 days</p>
          </div>
          <div className="w-12 h-12 bg-amber-100/50 rounded-2xl flex items-center justify-center shrink-0 border border-amber-200/50">
            <Clock className="w-6 h-6 text-amber-500" />
          </div>
        </div>

        {/* Metric 3: Resolved */}
        <div className="bg-emerald-50/20 border border-emerald-100 rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[12px] font-bold text-slate-500">Resolved Alerts</span>
            <h3 className="text-[34px] font-bold text-emerald-600 font-outfit leading-none mt-1">
              {stats.resolvedCount}
            </h3>
            <p className="text-[9.5px] text-slate-450 font-medium">Successfully resolved</p>
          </div>
          <div className="w-12 h-12 bg-emerald-100/50 rounded-2xl flex items-center justify-center shrink-0 border border-emerald-200/50">
            <CheckCircle className="w-6 h-6 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* Filter Options box */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4 print:hidden">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4.5 h-4.5 text-slate-400 absolute left-4.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by vehicle number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200/80 rounded-xl text-[13px] placeholder-slate-400 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 transition-all"
            />
          </div>

          {/* Alert Type select */}
          <div className="relative w-full md:w-[150px]">
            <select
              value={alertType}
              onChange={(e) => { setAlertType(e.target.value); setPage(1); }}
              className="w-full px-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 rounded-xl text-[13px] text-slate-700 focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 appearance-none focus:outline-none pr-10 cursor-pointer font-medium"
            >
              <option value="All">Alert Type</option>
              <option value="Insurance">Insurance</option>
              <option value="Permit">Permit</option>
              <option value="Fitness">Fitness</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Priority select */}
          <div className="relative w-full md:w-[130px]">
            <select
              value={priorityFilter}
              onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
              className="w-full px-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 rounded-xl text-[13px] text-slate-700 focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 appearance-none focus:outline-none pr-10 cursor-pointer font-medium"
            >
              <option value="All">Priority</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Date Range Picker */}
          <div className="relative w-full md:w-[200px]">
            <input
              type="text"
              placeholder="Select date range"
              value={dateRange}
              onClick={() => setDateRange('2026-06-01 to 2026-06-30')}
              readOnly
              className="w-full pl-4 pr-10 py-2.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 rounded-xl text-[13px] text-slate-700 cursor-pointer placeholder-slate-400"
            />
            <Calendar className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Reset filters */}
          <button
            type="button"
            onClick={handleReset}
            className="px-4.5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-650 font-bold text-[13px] rounded-xl flex items-center space-x-1.5 shrink-0 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
        </form>

        {/* Double Pills Filters and Sorting Row */}
        <div className="border-t border-slate-100 pt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2 items-center">
            {['All', 'Insurance', 'Permit', 'Fitness', 'Expired', 'Expiring Soon', 'Resolved'].map((tab) => {
              const isType = ['Insurance', 'Permit', 'Fitness'].includes(tab);
              const isActive = (isType && alertType === tab) || (!isType && statusFilter === tab) || (tab === 'All' && alertType === 'All' && statusFilter === 'All');

              return (
                <button
                  key={tab}
                  onClick={() => {
                    if (tab === 'All') {
                      setAlertType('All');
                      setStatusFilter('All');
                    } else if (isType) {
                      setAlertType(tab);
                    } else {
                      setStatusFilter(tab);
                    }
                    setPage(1);
                  }}
                  className={`px-4 py-1.5 rounded-full text-[12px] font-bold border transition-all duration-200 ${
                    isActive
                      ? 'bg-teal-50 border-teal-500 text-teal-brand'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Sort selection dropdown */}
          <div className="flex items-center space-x-2 text-[12.5px] font-bold text-slate-500">
            <span>Sort by:</span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="pl-2 pr-8 py-1.5 bg-slate-50 border border-slate-200/80 rounded-lg text-[12.5px] text-slate-700 font-bold appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="Newest First">Newest First</option>
                <option value="Oldest First">Oldest First</option>
                <option value="Expiry Date">Expiry Date</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Alerts Card Grid */}
      {alerts.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 select-none">
            {alerts.map((a) => {
              const Icon = a.document_type === 'Insurance' 
                ? Shield 
                : a.document_type === 'Permit' 
                ? FileText 
                : FileCheck;

              // Priority style mapping
              const priorityStyle = a.priority === 'High' 
                ? 'bg-red-50 text-red-700 border-red-100'
                : a.priority === 'Medium'
                ? 'bg-amber-50 text-amber-700 border-amber-100'
                : 'bg-emerald-50 text-emerald-700 border-emerald-100';

              return (
                <div 
                  key={a.id} 
                  className={`bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4 relative overflow-hidden ${
                    a.is_read ? 'opacity-75' : ''
                  }`}
                >
                  {/* Colored status strip indicator */}
                  <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${getRowStripColor(a.status)}`}></div>

                  <div className="space-y-3.5 pl-1.5">
                    {/* Header */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        {/* Expired Type Label */}
                        <div className="flex items-center space-x-1.5 text-[9.5px] font-black text-teal-650 uppercase tracking-widest mb-1.5 select-none">
                          <Icon className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                          <span>{a.document_type}</span>
                        </div>
                        <h3 className="text-[15px] font-extrabold text-slate-800 tracking-tight leading-none uppercase truncate">
                          {a.vehicle_number || a.Vehicle?.vehicle_number}
                        </h3>
                        <p className="text-[11.5px] text-slate-400 mt-1.5 font-medium truncate" title={a.Vehicle?.vehicle_model}>
                          {a.Vehicle?.vehicle_model || 'Unknown Model'}
                        </p>
                      </div>

                      {/* Status Badges: Critical, Warning, Expiring Soon, Active */}
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shrink-0 ${
                        a.status === 'Expired'
                          ? 'bg-red-50 text-red-500 border border-red-100/60'
                          : a.status === 'Expiring Soon'
                          ? 'bg-amber-50/80 text-amber-650 border border-amber-150'
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-100/60'
                      }`}>
                        {a.status === 'Expired' ? 'Critical' : a.status === 'Expiring Soon' ? 'Warning' : 'Active'}
                      </span>
                    </div>
                  </div>

                  {/* Actions & Timestamp */}
                  <div className="border-t border-slate-50 pt-3.5 flex justify-between items-center pl-1.5 select-none text-[11.5px] print:hidden">
                    <span className="text-[10px] text-slate-400 font-medium">
                      {formatDateTime(a.createdAt)}
                    </span>
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => navigate(`/vehicles/${a.vehicle_id || a.Vehicle?.id}`)}
                        className="py-1.5 px-3 border border-slate-100 hover:bg-slate-50 text-slate-650 font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
                      >
                        View
                      </button>
                      {!a.is_read && (
                        <button
                          onClick={() => handleMarkAsRead(a.id)}
                          className="py-1.5 px-2 bg-teal-50 hover:bg-teal-100 text-teal-600 font-bold text-[11px] rounded-lg transition-colors flex items-center space-x-1 cursor-pointer"
                          title="Mark as Read"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Read</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Alerts Pagination footer matches exactly */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center bg-white border border-slate-100 px-6 py-4.5 rounded-2xl shadow-sm text-[13px] text-slate-450 font-medium select-none print:hidden">
              <span>
                Showing {((page - 1) * 6) + 1} to {Math.min(page * 6, total)} of {total} alerts
              </span>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setPage(p => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="p-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg disabled:opacity-40 disabled:hover:bg-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                  if (totalPages > 5 && p > 3 && p < totalPages) {
                    if (p === 4) return <span key="ellipsis" className="px-2">...</span>;
                    return null;
                  }
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg font-bold text-[12.5px] border transition-colors ${
                        page === p
                          ? 'bg-teal-brand text-white border-teal-brand shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}

                <button
                  onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="p-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg disabled:opacity-40 disabled:hover:bg-white"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-400 font-medium select-none shadow-sm">
          No matching alerts found.
        </div>
      )}
    </div>
  );
};

export default Alerts;
