import React from 'react';

export const VehicleSVG = ({ type, className = 'w-full h-full' }) => {
  // Return different SVG structures based on type (SUV, Traveller, Bus, Car)
  switch (type) {
    case 'SUV':
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

    case 'Traveller':
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

    case 'Bus':
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

    case 'Van':
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

    case 'Car':
    default:
      return (
        <svg viewBox="0 0 120 70" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Wheel shadows */}
          <ellipse cx="26" cy="56" rx="11" ry="3.5" fill="#E2E8F0" />
          <ellipse cx="86" cy="56" rx="11" ry="3.5" fill="#E2E8F0" />
          
          {/* Body structure with gradient */}
          <path d="M6 46C6 44 9 40 16 40C22 40 32 34 38 24C42 18 52 16 68 16H84C90 16 94 20 98 26L108 40C114 40 116 42 116 46C116 50 112 53 106 53H16C10 53 6 50 6 46Z" fill="url(#carGradient)" />
          
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
            <linearGradient id="carGradient" x1="6" y1="16" x2="116" y2="53" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0EA5E9" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>
          </defs>
        </svg>
      );
  }
};
export default VehicleSVG;
