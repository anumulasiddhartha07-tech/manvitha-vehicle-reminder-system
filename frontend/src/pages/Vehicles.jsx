import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Search, 
  RotateCcw, 
  Plus, 
  Eye, 
  Edit2, 
  Trash2, 
  Calendar, 
  Shield, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  ChevronDown
} from 'lucide-react';

const VehicleIcon = ({ type, className = 'w-full h-full' }) => {
  const t = type?.trim().toLowerCase() || '';

  if (t === 'sedan' || t === 'car') {
    return (
      <svg viewBox="0 0 120 70" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Wheel shadows */}
        <ellipse cx="26" cy="56" rx="11" ry="3.5" fill="#E2E8F0" />
        <ellipse cx="86" cy="56" rx="11" ry="3.5" fill="#E2E8F0" />
        
        {/* Body structure with gradient */}
        <path d="M6 46C6 44 9 40 16 40C22 40 32 34 38 24C42 18 52 16 68 16H84C90 16 94 20 98 26L108 40C114 40 116 42 116 46C116 50 112 53 106 53H16C10 53 6 50 6 46Z" fill="url(#sedanGradient)" />
        
        {/* Windows */}
        <path d="M42 26H56V20H50C46 20 43 23 42 26Z" fill="#F8FAFC" opacity="0.8" />
        <path d="M60 20V26H80V20H60Z" fill="#F8FAFC" opacity="0.8" />
        <path d="M84 20V26H92C90 23 88 20 84 20Z" fill="#F8FAFC" opacity="0.8" />
        
        {/* Details */}
        <path d="M110 42C113 42 115 44 115 46C115 48 113 50 110 50V42Z" fill="#FFE082" />
        <path d="M7 42C6 42 5 44 5 46C5 48 6 50 7 50V42Z" fill="#FF8A80" />
        
        {/* Wheels */}
        <circle cx="26" cy="51" r="8" fill="#1E293B" stroke="#F1F5F9" strokeWidth="2" />
        <circle cx="26" cy="51" r="3.5" fill="#64748B" />
        <circle cx="86" cy="51" r="8" fill="#1E293B" stroke="#F1F5F9" strokeWidth="2" />
        <circle cx="86" cy="51" r="3.5" fill="#64748B" />

        <defs>
          <linearGradient id="sedanGradient" x1="6" y1="16" x2="116" y2="53" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1E3A8A" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  if (t === 'suv') {
    return (
      <svg viewBox="0 0 120 70" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Wheel shadows */}
        <ellipse cx="25" cy="56" rx="12" ry="4" fill="#E2E8F0" />
        <ellipse cx="90" cy="56" rx="12" ry="4" fill="#E2E8F0" />
        
        {/* Body structure with gradient */}
        <path d="M5 42C5 38 10 36 15 36C22 36 28 32 32 26C35 21 44 14 55 14H85C92 14 98 16 102 22C106 28 112 36 114 42C116 48 114 54 108 54H12C7 54 5 48 5 42Z" fill="url(#suvGradient)" />
        
        {/* Windows */}
        <path d="M37 26H52V18H47C42 18 39 22 37 26Z" fill="#F8FAFC" opacity="0.8" />
        <path d="M56 18V26H78V18H56Z" fill="#F8FAFC" opacity="0.8" />
        <path d="M82 18V26H96C93 21 88 18 82 18Z" fill="#F8FAFC" opacity="0.8" />
        
        {/* Front Light */}
        <path d="M109 40C112 40 114 42 114 44C114 46 112 48 109 48V40Z" fill="#FFE082" />
        {/* Back Light */}
        <path d="M6 40C5 40 4 42 4 44C4 46 5 48 6 48V40Z" fill="#FF8A80" />
        
        {/* Wheels */}
        <circle cx="25" cy="52" r="9" fill="#1E293B" stroke="#F1F5F9" strokeWidth="2.5" />
        <circle cx="25" cy="52" r="4" fill="#64748B" />
        <circle cx="90" cy="52" r="9" fill="#1E293B" stroke="#F1F5F9" strokeWidth="2.5" />
        <circle cx="90" cy="52" r="4" fill="#64748B" />

        <defs>
          <linearGradient id="suvGradient" x1="5" y1="14" x2="114" y2="54" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0D9488" />
            <stop offset="100%" stopColor="#0F766E" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  if (t === 'tempo traveller' || t === 'traveller') {
    return (
      <svg viewBox="0 0 120 70" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Wheel shadows */}
        <ellipse cx="28" cy="57" rx="12" ry="4" fill="#E2E8F0" />
        <ellipse cx="88" cy="57" rx="12" ry="4" fill="#E2E8F0" />
        
        {/* Body structure with gradient */}
        <path d="M8 46C8 38 10 22 14 16C16 13 22 12 30 12H94C99 12 103 16 105 20C108 26 112 38 114 46C115 50 112 55 106 55H16C10 55 8 50 8 46Z" fill="url(#travellerGradient)" />
        
        {/* Windows */}
        <path d="M18 24C16 24 15 26 16 28L18 36H32V24H18Z" fill="#F8FAFC" opacity="0.8" />
        <path d="M36 24H54V36H36V24Z" fill="#F8FAFC" opacity="0.8" />
        <path d="M58 24H76V36H58V24Z" fill="#F8FAFC" opacity="0.8" />
        <path d="M80 24H98C100 24 102 26 102 28L100 36H80V24Z" fill="#F8FAFC" opacity="0.8" />
        
        {/* Wheels */}
        <circle cx="28" cy="53" r="8.5" fill="#1E293B" stroke="#F1F5F9" strokeWidth="2" />
        <circle cx="28" cy="53" r="3.5" fill="#64748B" />
        <circle cx="88" cy="53" r="8.5" fill="#1E293B" stroke="#F1F5F9" strokeWidth="2" />
        <circle cx="88" cy="53" r="3.5" fill="#64748B" />

        {/* Details */}
        <rect x="110" y="40" width="3" height="6" rx="1" fill="#FFE082" />
        <rect x="7" y="40" width="2" height="6" rx="1" fill="#FF8A80" />

        <defs>
          <linearGradient id="travellerGradient" x1="8" y1="12" x2="114" y2="55" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#4F46E5" />
            <stop offset="100%" stopColor="#3730A3" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  if (t === 'mini bus' || t === 'minibus') {
    return (
      <svg viewBox="0 0 120 70" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Wheel shadows */}
        <ellipse cx="28" cy="57" rx="12" ry="4" fill="#E2E8F0" />
        <ellipse cx="88" cy="57" rx="12" ry="4" fill="#E2E8F0" />
        
        {/* Body structure with gradient */}
        <path d="M8 44C8 30 10 16 14 14C16 12 20 12 26 12H102C107 12 110 14 112 20C114 26 115 36 115 44C115 49 112 53 106 53H16C10 53 8 49 8 44Z" fill="url(#minibusGradient)" />
        
        {/* Windows */}
        <rect x="16" y="18" width="18" height="15" rx="2" fill="#F8FAFC" opacity="0.85" />
        <rect x="38" y="18" width="18" height="15" rx="2" fill="#F8FAFC" opacity="0.85" />
        <rect x="60" y="18" width="18" height="15" rx="2" fill="#F8FAFC" opacity="0.85" />
        <rect x="82" y="18" width="18" height="15" rx="2" fill="#F8FAFC" opacity="0.85" />
        <path d="M104 18H110V33H104V18Z" fill="#F8FAFC" opacity="0.85" />
        
        {/* Details */}
        <rect x="112" y="38" width="3" height="6" rx="1" fill="#FFE082" />
        <rect x="7" y="38" width="2" height="6" rx="1" fill="#FF8A80" />

        {/* Wheels */}
        <circle cx="28" cy="52" r="8.5" fill="#1E293B" stroke="#F1F5F9" strokeWidth="2" />
        <circle cx="28" cy="52" r="3.5" fill="#94A3B8" />
        <circle cx="88" cy="52" r="8.5" fill="#1E293B" stroke="#F1F5F9" strokeWidth="2" />
        <circle cx="88" cy="52" r="3.5" fill="#94A3B8" />

        <defs>
          <linearGradient id="minibusGradient" x1="8" y1="12" x2="115" y2="53" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  if (t === 'hatchback') {
    return (
      <svg viewBox="0 0 120 70" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Wheel shadows */}
        <ellipse cx="26" cy="56" rx="11" ry="3.5" fill="#E2E8F0" />
        <ellipse cx="86" cy="56" rx="11" ry="3.5" fill="#E2E8F0" />
        
        {/* Body structure with gradient */}
        <path d="M8 48C8 46 11 42 17 42C22 42 27 38 31 32C34 26 40 20 48 20H72C76 20 80 22 83 27L92 40C94 43 96 44 100 44C104 44 106 46 106 50C106 54 102 55 96 55H18C12 55 8 52 8 48Z" fill="url(#hatchbackGradient)" />
        
        {/* Windows */}
        <path d="M44 30H58V24H50C46 24 45 27 44 30Z" fill="#F8FAFC" opacity="0.8" />
        <path d="M62 24V30H78C76 26 74 24 70 24H62Z" fill="#F8FAFC" opacity="0.8" />
        
        {/* Lights */}
        <rect x="103" y="44" width="3" height="5" rx="1" fill="#FFE082" />
        <rect x="7" y="44" width="2" height="5" rx="1" fill="#FF8A80" />
        
        {/* Wheels */}
        <circle cx="26" cy="52" r="8" fill="#1E293B" stroke="#F1F5F9" strokeWidth="2" />
        <circle cx="26" cy="52" r="3.5" fill="#64748B" />
        <circle cx="84" cy="52" r="8" fill="#1E293B" stroke="#F1F5F9" strokeWidth="2" />
        <circle cx="84" cy="52" r="3.5" fill="#64748B" />

        <defs>
          <linearGradient id="hatchbackGradient" x1="8" y1="20" x2="106" y2="55" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#E11D48" />
            <stop offset="100%" stopColor="#9F1239" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  if (t === 'van') {
    return (
      <svg viewBox="0 0 120 70" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Wheel shadows */}
        <ellipse cx="26" cy="56" rx="11" ry="3.5" fill="#E2E8F0" />
        <ellipse cx="86" cy="56" rx="11" ry="3.5" fill="#E2E8F0" />
        
        {/* Body structure with gradient */}
        <path d="M6 44C6 38 10 32 16 32H30C34 26 40 20 48 20H94C100 20 104 24 106 30C108 34 112 40 114 44C115 48 112 52 106 52H16C10 52 6 48 6 44Z" fill="url(#vanGradient)" />
        
        {/* Windows */}
        <path d="M36 28C34 28 33 30 34 32L36 38H48V28H36Z" fill="#F8FAFC" opacity="0.8" />
        <path d="M52 28H72V38H52V28Z" fill="#F8FAFC" opacity="0.8" />
        <path d="M76 28H96C98 28 100 30 100 32L98 38H76V28Z" fill="#F8FAFC" opacity="0.8" />
        
        {/* Details */}
        <rect x="110" y="38" width="3" height="6" rx="1" fill="#FFE082" />
        <rect x="5" y="38" width="2" height="6" rx="1" fill="#FF8A80" />
        
        {/* Wheels */}
        <circle cx="26" cy="51" r="8" fill="#1E293B" stroke="#F1F5F9" strokeWidth="2" />
        <circle cx="26" cy="51" r="3.5" fill="#64748B" />
        <circle cx="86" cy="51" r="8" fill="#1E293B" stroke="#F1F5F9" strokeWidth="2" />
        <circle cx="86" cy="51" r="3.5" fill="#64748B" />

        <defs>
          <linearGradient id="vanGradient" x1="6" y1="20" x2="114" y2="52" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  if (t === 'truck') {
    return (
      <svg viewBox="0 0 120 70" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Wheel shadows */}
        <ellipse cx="26" cy="57" rx="11" ry="3.5" fill="#E2E8F0" />
        <ellipse cx="44" cy="57" rx="11" ry="3.5" fill="#E2E8F0" />
        <ellipse cx="98" cy="57" rx="11" ry="3.5" fill="#E2E8F0" />
        
        {/* Cargo Container */}
        <rect x="10" y="16" width="70" height="32" rx="2" fill="url(#truckCargoGradient)" />
        
        {/* Driver Cab */}
        <path d="M80 24H98C104 24 108 26 112 32L116 40C118 42 118 44 118 48H80V24Z" fill="url(#truckCabGradient)" />
        
        {/* Window */}
        <path d="M86 28H100L105 37H86V28Z" fill="#F8FAFC" opacity="0.8" />
        
        {/* Lights */}
        <rect x="115" y="42" width="3" height="6" rx="1" fill="#FFE082" />
        <rect x="8" y="42" width="2" height="6" rx="1" fill="#FF8A80" />
        
        {/* Wheels */}
        <circle cx="26" cy="52" r="9" fill="#1E293B" stroke="#F1F5F9" strokeWidth="2" />
        <circle cx="26" cy="52" r="4" fill="#64748B" />
        <circle cx="44" cy="52" r="9" fill="#1E293B" stroke="#F1F5F9" strokeWidth="2" />
        <circle cx="44" cy="52" r="4" fill="#64748B" />
        <circle cx="98" cy="52" r="9" fill="#1E293B" stroke="#F1F5F9" strokeWidth="2" />
        <circle cx="98" cy="52" r="4" fill="#64748B" />

        <defs>
          <linearGradient id="truckCabGradient" x1="80" y1="24" x2="118" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>
          <linearGradient id="truckCargoGradient" x1="10" y1="16" x2="80" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#94A3B8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  if (t === 'bus') {
    return (
      <svg viewBox="0 0 130 70" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Wheel shadows */}
        <ellipse cx="32" cy="58" rx="14" ry="4" fill="#E2E8F0" />
        <ellipse cx="98" cy="58" rx="14" ry="4" fill="#E2E8F0" />
        
        {/* Body structure with gradient */}
        <path d="M6 46C6 30 8 16 12 12C14 10 18 10 24 10H118C124 10 126 12 126 18V48C126 52 122 56 116 56H16C10 56 6 52 6 46Z" fill="url(#busGradient)" />
        
        {/* Windows */}
        <rect x="14" y="16" width="16" height="16" rx="2" fill="#F8FAFC" opacity="0.85" />
        <rect x="34" y="16" width="16" height="16" rx="2" fill="#F8FAFC" opacity="0.85" />
        <rect x="54" y="16" width="16" height="16" rx="2" fill="#F8FAFC" opacity="0.85" />
        <rect x="74" y="16" width="16" height="16" rx="2" fill="#F8FAFC" opacity="0.85" />
        <rect x="94" y="16" width="16" height="16" rx="2" fill="#F8FAFC" opacity="0.85" />
        <path d="M114 16H120V32H114V16Z" fill="#F8FAFC" opacity="0.85" />

        {/* Details */}
        <rect x="123" y="42" width="3" height="8" rx="1" fill="#FFE082" />
        <rect x="5" y="42" width="2" height="8" rx="1" fill="#FF8A80" />
        <rect x="14" y="42" width="24" height="2" fill="#F1F5F9" opacity="0.3" />
        <rect x="44" y="42" width="60" height="2" fill="#F1F5F9" opacity="0.3" />
        
        {/* Wheels */}
        <circle cx="32" cy="53" r="9" fill="#1E293B" stroke="#F1F5F9" strokeWidth="2.5" />
        <circle cx="32" cy="53" r="4" fill="#94A3B8" />
        <circle cx="98" cy="53" r="9" fill="#1E293B" stroke="#F1F5F9" strokeWidth="2.5" />
        <circle cx="98" cy="53" r="4" fill="#94A3B8" />

        <defs>
          <linearGradient id="busGradient" x1="6" y1="10" x2="126" y2="56" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0891B2" />
            <stop offset="100%" stopColor="#0369A1" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  // Fallback (unknown / missing)
  return (
    <svg viewBox="0 0 120 70" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Wheel shadows */}
      <ellipse cx="26" cy="56" rx="11" ry="3.5" fill="#E2E8F0" />
      <ellipse cx="86" cy="56" rx="11" ry="3.5" fill="#E2E8F0" />
      
      {/* Body structure with gradient */}
      <path d="M6 46C6 44 9 40 16 40C22 40 32 34 38 24C42 18 52 16 68 16H84C90 16 94 20 98 26L108 40C114 40 116 42 116 46C116 50 112 53 106 53H16C10 53 6 50 6 46Z" fill="url(#fallbackGradient)" />
      
      {/* Windows */}
      <path d="M42 26H56V20H50C46 20 43 23 42 26Z" fill="#F8FAFC" opacity="0.8" />
      <path d="M60 20V26H80V20H60Z" fill="#F8FAFC" opacity="0.8" />
      <path d="M84 20V26H92C90 23 88 20 84 20Z" fill="#F8FAFC" opacity="0.8" />
      
      {/* Details */}
      <path d="M110 42C113 42 115 44 115 46C115 48 113 50 110 50V42Z" fill="#FFE082" />
      <path d="M7 42C6 42 5 44 5 46C5 48 6 50 7 50V42Z" fill="#FF8A80" />
      
      {/* Wheels */}
      <circle cx="26" cy="51" r="8" fill="#1E293B" stroke="#F1F5F9" strokeWidth="2" />
      <circle cx="26" cy="51" r="3.5" fill="#64748B" />
      <circle cx="86" cy="51" r="8" fill="#1E293B" stroke="#F1F5F9" strokeWidth="2" />
      <circle cx="86" cy="51" r="3.5" fill="#64748B" />

      <defs>
        <linearGradient id="fallbackGradient" x1="6" y1="16" x2="116" y2="53" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#64748B" />
        </linearGradient>
      </defs>
    </svg>
  );
};


const Vehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  // Filters state
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'All');
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || 'All Type');
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const u = JSON.parse(userStr);
      setUserEmail(u.email || 'admin@manivtha.com');
    }
  }, []);

  // Load vehicles from backend
  const fetchVehicles = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const url = new URL('http://localhost:5000/api/vehicles');
      url.searchParams.append('page', page);
      url.searchParams.append('limit', 8);
      if (search) url.searchParams.append('search', search);
      if (statusFilter !== 'All') url.searchParams.append('status', statusFilter);
      if (typeFilter !== 'All Type') url.searchParams.append('type', typeFilter);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setVehicles(data.vehicles);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [page, statusFilter, typeFilter]);

  // Handle page query update from global search
  useEffect(() => {
    const querySearch = searchParams.get('search');
    if (querySearch !== null) {
      setSearch(querySearch);
      // Execute filter
      fetchVehicles();
    }
  }, [searchParams]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchVehicles();
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('All');
    setTypeFilter('All Type');
    setPage(1);
    setSearchParams({});
    // We execute fetch directly after state clears in useEffect, or manual triggers
    setTimeout(() => fetchVehicles(), 50);
  };

  const handleDeleteClick = (id) => {
    setSelectedVehicleId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    setShowDeleteModal(false);
    executeDelete();
  };

  const executeDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/vehicles/${selectedVehicleId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setShowOtpModal(false);
        fetchVehicles();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Render Date Expiry Text color based on status
  const getDateTextColor = (status) => {
    if (status === 'Active') return 'text-emerald-600 font-semibold';
    if (status === 'Expiring Soon') return 'text-amber-600 font-semibold';
    return 'text-red-500 font-semibold'; // Expired
  };

  const formatLastUpdated = (date) => {
    if (!date) return 'Not Synced';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Not Synced';
    
    const day = d.getDate();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = monthNames[d.getMonth()];
    const year = d.getFullYear();
    
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const formattedHours = hours.toString().padStart(2, '0');
    
    return `${day} ${month} ${year}, ${formattedHours}:${minutes} ${ampm}`;
  };

  return (
    <div className="space-y-7 animate-in fade-in duration-300">
      {/* Top Title & Quick Dashboard Metrics bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-[26px] font-bold text-slate-800 font-outfit leading-none">Vehicle Management</h1>
          <p className="text-[13px] text-slate-500 mt-1.5">Manage and track all registered vehicles</p>
        </div>

        {/* Right Info Panels */}
        <div className="flex items-center space-x-4 shrink-0">
          <div className="bg-white border border-slate-100 rounded-xl px-4 py-2 flex items-center space-x-3.5 shadow-sm">
            <div className="w-9 h-9 bg-teal-50 rounded-lg flex items-center justify-center border border-teal-100">
              <Sparkles className="w-4.5 h-4.5 text-teal-brand" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Vehicles</p>
              <p className="text-[14px] font-extrabold text-slate-850 mt-0.5">{total}</p>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl px-4 py-2 flex items-center space-x-3.5 shadow-sm">
            <div className="w-9 h-9 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100">
              <Calendar className="w-4.5 h-4.5 text-slate-500" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Last Updated</p>
              <p className="text-[11px] font-bold text-slate-700 mt-0.5">{formatLastUpdated(lastUpdated)}</p>
            </div>
          </div>

          {/* Add Vehicle Button */}
          <button
            onClick={() => navigate('/vehicles/add')}
            className="h-11 px-5 bg-teal-brand hover:bg-teal-brandHover text-white font-bold text-[13px] rounded-xl flex items-center space-x-2 shadow-sm transition-all duration-200 active:scale-[0.98]"
          >
            <Plus className="w-4.5 h-4.5" />
            <span>Add Vehicle</span>
          </button>
        </div>
      </div>

      {/* Search and Dropdowns Filter Section */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4.5 h-4.5 text-slate-400 absolute left-4.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by vehicle number, name or type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200/80 hover:border-slate-350 focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 rounded-xl text-[13px] placeholder-slate-400 text-slate-700 transition-all"
            />
          </div>

          {/* Status select dropdown */}
          <div className="relative w-full md:w-[180px]">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-full px-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 rounded-xl text-[13px] text-slate-700 focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 appearance-none focus:outline-none pr-10 cursor-pointer font-medium"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Expiring Soon">Expiring Soon</option>
              <option value="Expired">Expired</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Type select dropdown */}
          <div className="relative w-full md:w-[180px]">
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="w-full px-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 rounded-xl text-[13px] text-slate-700 focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 appearance-none focus:outline-none pr-10 cursor-pointer font-medium"
            >
              <option value="All Type">All Type</option>
              <option value="SUV">SUV</option>
              <option value="Traveller">Traveller</option>
              <option value="Bus">Bus</option>
              <option value="Car">Car</option>
              <option value="Van">Van</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Reset button */}
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-4.5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-[13px] rounded-xl flex items-center space-x-1.5 shrink-0 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
        </form>

        {/* Double Row Pills Filter Tabs */}
        <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
          {/* Status Pills */}
          <div className="flex flex-wrap gap-2 items-center">
            {['All', 'Active', 'Expiring Soon', 'Expired'].map((st) => (
              <button
                key={st}
                onClick={() => { setStatusFilter(st); setPage(1); }}
                className={`px-4 py-1.5 rounded-full text-[12px] font-bold border transition-all duration-200 ${
                  statusFilter === st
                    ? 'bg-teal-50 border-teal-500 text-teal-brand'
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                {st === 'All' ? 'All' : st}
              </button>
            ))}
          </div>

          {/* Type Pills */}
          <div className="flex flex-wrap gap-2 items-center">
            {['All Type', 'SUV', 'Traveller', 'Bus', 'Car', 'More'].map((ty) => (
              <button
                key={ty}
                onClick={() => { if (ty !== 'More') { setTypeFilter(ty); setPage(1); } }}
                className={`px-4 py-1.5 rounded-full text-[12px] font-bold border transition-all duration-200 flex items-center space-x-1 ${
                  typeFilter === ty || (ty === 'More' && !['All Type', 'SUV', 'Traveller', 'Bus', 'Car'].includes(typeFilter))
                    ? 'bg-teal-50 border-teal-500 text-teal-brand'
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                <span>{ty}</span>
                {ty === 'More' && <ChevronDown className="w-3 h-3 text-slate-400" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Vehicle Cards matching screenshot specifications */}
      {vehicles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {vehicles.map((v) => {
            const insuranceDoc = v.Documents?.find(d => d.document_type === 'Insurance');
            const permitDoc = v.Documents?.find(d => d.document_type === 'Permit');
            const fitnessDoc = v.Documents?.find(d => d.document_type === 'Fitness');

            // Format date helper
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

            return (
              <div 
                key={v.id} 
                className="bg-white border border-slate-100 hover:border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4"
              >
                {/* Card Title Header */}
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <span className="w-7 h-7 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center shrink-0 text-slate-500">
                        <VehicleIcon type={v.vehicle_type} className="w-4.5 h-4.5" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-[15px] font-extrabold text-slate-800 tracking-tight leading-none truncate">
                          {v.vehicle_number}
                        </h3>
                        <p className="text-[11.5px] text-slate-400 mt-1.5 font-medium truncate" title={v.vehicle_model}>
                          {v.vehicle_model}
                        </p>
                      </div>
                    </div>

                    {/* Status Chip */}
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shrink-0 ${
                      v.status === 'Active'
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/60'
                        : v.status === 'Expiring Soon'
                        ? 'bg-amber-50/80 text-amber-600 border border-amber-100/50'
                        : 'bg-red-50 text-red-500 border border-red-100/60'
                    }`}>
                      {v.status}
                    </span>
                  </div>

                  {/* Vehicle Type tag */}
                  <div className="mt-2.5">
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase">
                      {v.vehicle_type}
                    </span>
                  </div>
                </div>

                {/* Documents Expiry Date & Driver fields */}
                <div className="space-y-2 text-[11.5px] border-t border-slate-50 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">👤 Driver</span>
                    <span className="text-slate-700 font-semibold truncate max-w-[140px]" title={v.driver_name}>
                      {v.driver_name || '--'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">🛡️ Insurance</span>
                    <span className={getDateTextColor(v.status)}>
                      {formatDate(insuranceDoc?.expiry_date)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">📄 Permit</span>
                    <span className={getDateTextColor(v.status)}>
                      {formatDate(permitDoc?.expiry_date)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">📋 Fitness</span>
                    <span className={getDateTextColor(v.status)}>
                      {formatDate(fitnessDoc?.expiry_date)}
                    </span>
                  </div>
                </div>

                {/* Card footer action buttons */}
                <div className="grid grid-cols-3 gap-1 border-t border-slate-50 pt-3 text-[11.5px]">
                  <button
                    onClick={() => navigate(`/vehicles/${v.id}`)}
                    className="py-1.5 border border-slate-100 hover:bg-slate-50 text-slate-600 font-bold rounded-lg flex items-center justify-center space-x-1 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View</span>
                  </button>
                  <button
                    onClick={() => navigate(`/vehicles/edit/${v.id}`)}
                    className="py-1.5 border border-slate-100 hover:bg-slate-50 text-slate-600 font-bold rounded-lg flex items-center justify-center space-x-1 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteClick(v.id)}
                    className="py-1.5 border border-red-50 hover:bg-red-50 text-red-650 font-bold rounded-lg flex items-center justify-center space-x-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    <span className="text-red-500">Delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-400 space-y-2.5">
          <p className="text-[14px] font-bold">No vehicles found</p>
          <p className="text-[12px]">Try refining your search terms or adjusting the filters.</p>
        </div>
      )}

      {/* Pagination Footer matches layout specification */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center border-t border-slate-100 pt-6 text-[13px] font-medium text-slate-500 select-none">
          <span>
            Showing {((page - 1) * 8) + 1} to {Math.min(page * 8, total)} of {total} vehicles
          </span>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="p-2 border border-slate-200 hover:bg-slate-50 rounded-lg disabled:opacity-40 disabled:hover:bg-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
              // Standard ellipsis page rendering
              if (totalPages > 5 && p > 3 && p < totalPages) {
                if (p === 4) return <span key="ellipsis" className="px-2">...</span>;
                return null;
              }

              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-lg font-bold text-[13px] border transition-colors ${
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
              className="p-2 border border-slate-200 hover:bg-slate-50 rounded-lg disabled:opacity-40 disabled:hover:bg-white transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-100 rounded-2xl max-w-[380px] w-full p-6 space-y-4 shadow-2xl scale-in duration-200">
            <h4 className="text-[16px] font-bold text-slate-800">Confirm Deletion</h4>
            <p className="text-[13px] text-slate-500 leading-normal">
              Are you sure you want to delete this vehicle? All document information, alerts, and activity logs will be permanently removed.
            </p>
            <div className="flex space-x-2.5 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-[13px] font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-650 text-white text-[13px] font-bold rounded-xl transition-colors shadow-md shadow-red-500/10"
              >
                Delete Vehicle
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default Vehicles;
