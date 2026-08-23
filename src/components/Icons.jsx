import React from 'react';

// Official Crisp Bancolombia SVG Logo (High Contrast & Authentic Colors)
export function BancolombiaLogo({ className = "w-32 h-8", ...props }) {
  return (
    <svg viewBox="0 0 280 60" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
      {/* Bancolombia Authentic Ribbon Geometry */}
      <path d="M26 12C20 18 14 28 14 34C14 40 18 45 26 45C34 45 40 39 43 31L32 31C30 35 28 37 25 37C22 37 19 35 19 31C19 27 23 19 27 15L26 12Z" fill="#FDDA24"/>
      <path d="M29 10C35 16 41 27 41 33C41 39 37 43 29 43C21 43 15 37 12 30L23 30C25 34 27 36 30 36C33 36 36 34 36 30C36 25 32 17 28 13L29 10Z" fill="#00C389"/>
      <path d="M22 17C25 12 31 12 34 17L37 14C32 7 24 7 19 14L22 17Z" fill="#E01E26"/>
      {/* Crisp White Typography */}
      <text x="56" y="38" fill="#FFFFFF" fontFamily="system-ui, -apple-system, sans-serif" fontSize="22" fontWeight="800" letterSpacing="-0.5">
        Bancolombia
      </text>
    </svg>
  );
}

// Official Davivienda SVG Logo (Iconic Red House)
export function DaviviendaLogo({ className = "w-32 h-8", ...props }) {
  return (
    <svg viewBox="0 0 280 60" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
      <g transform="translate(10, 8)">
        <rect width="44" height="44" rx="8" fill="#ED1C24"/>
        <path d="M22 10L10 20H14V34H30V20H34L22 10Z" fill="#FFFFFF"/>
        <rect x="20" y="23" width="5" height="6" rx="1" fill="#ED1C24"/>
      </g>
      <text x="64" y="38" fill="#FFFFFF" fontFamily="system-ui, -apple-system, sans-serif" fontSize="22" fontWeight="800" letterSpacing="-0.5">
        DAVIVIENDA
      </text>
    </svg>
  );
}

// Official Google Maps Vector SVG Logo
export function GoogleMapsLogo({ className = "w-5 h-5", ...props }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
      <path d="M24 4C15.163 4 8 11.163 8 20c0 10.5 14.5 23.5 15.12 24.05a1.2 1.2 0 0 0 1.76 0C25.5 43.5 40 30.5 40 20c0-8.837-7.163-16-16-16z" fill="#4285F4"/>
      <path d="M24 4c-8.837 0-16 7.163-16 16 0 6.64 4.14 14.28 10.68 20.35L24 40.35l5.32-4c6.54-6.07 10.68-13.71 10.68-20.35 0-8.837-7.163-16-16-16z" fill="#34A853"/>
      <path d="M24 4c-4.42 0-8.42 1.79-11.31 4.69L24 20l11.31-11.31C32.42 5.79 28.42 4 24 4z" fill="#EA4335"/>
      <path d="M24 4v16l11.31-11.31C32.42 5.79 28.42 4 24 4z" fill="#FBBC05"/>
      <circle cx="24" cy="20" r="6" fill="#FFFFFF"/>
    </svg>
  );
}

// Official Waze Vector SVG Logo
export function WazeLogo({ className = "w-5 h-5", ...props }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
      <path d="M37.5 19.5c0-8.008-6.492-14.5-14.5-14.5S8.5 11.492 8.5 19.5c0 3.738 1.416 7.146 3.75 9.718V38.5c0 1.657 1.343 3 3 3h15.5c1.657 0 3-1.343 3-3v-9.282c2.334-2.572 3.75-5.98 3.75-9.718z" fill="#33CCFF"/>
      <ellipse cx="17.5" cy="20" rx="2.5" ry="3.5" fill="#000000"/>
      <ellipse cx="28.5" cy="20" rx="2.5" ry="3.5" fill="#000000"/>
      <path d="M20 28c1.5 1.5 4.5 1.5 6 0" stroke="#000000" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="14" cy="40.5" r="3.5" fill="#000000"/>
      <circle cx="29" cy="40.5" r="3.5" fill="#000000"/>
      <circle cx="14" cy="40.5" r="1.5" fill="#FFFFFF"/>
      <circle cx="29" cy="40.5" r="1.5" fill="#FFFFFF"/>
    </svg>
  );
}

// Sleek Luxury Libreta / Spiral Notebook SVG Icon
export function LibretaIcon({ className = "w-6 h-6", ...props }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <rect x="5" y="2.5" width="16" height="19" rx="2" fill="none" stroke="currentColor" />
      <line x1="9" y1="2.5" x2="9" y2="21.5" stroke="currentColor" strokeDasharray="1 1" />
      <line x1="12" y1="7" x2="18" y2="7" />
      <line x1="12" y1="11" x2="18" y2="11" />
      <line x1="12" y1="15" x2="16" y2="15" />
      <path d="M3 5h3.5" />
      <path d="M3 9h3.5" />
      <path d="M3 13h3.5" />
      <path d="M3 17h3.5" />
    </svg>
  );
}

// TikTok Pure SVG Icon
export function TikTokIcon({ className = "w-6 h-6", ...props }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...props}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.42a6.33 6.33 0 0 0-.86-.06 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.58a8.28 8.28 0 0 0 4.77 1.52v-3.41Z"/>
    </svg>
  );
}

// Instagram Pure SVG Icon
export function InstagramIcon({ className = "w-6 h-6", ...props }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

// Facebook Pure SVG Icon
export function FacebookIcon({ className = "w-6 h-6", ...props }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...props}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

// WhatsApp Pure SVG Icon
export function WhatsAppIcon({ className = "w-6 h-6", ...props }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
      <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
    </svg>
  );
}

// Phone Call Pure SVG Icon
export function PhoneCallIcon({ className = "w-6 h-6", ...props }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  );
}

// Quimbaya Poporo Golden Glyph Emblem SVG
export function QuimbayaGlyph({ className = "w-8 h-8", ...props }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
      <circle cx="50" cy="50" r="45" stroke="#D4AF37" strokeWidth="2" strokeDasharray="4 2" opacity="0.6"/>
      <circle cx="50" cy="50" r="36" stroke="#E5C068" strokeWidth="1.5" opacity="0.8"/>
      <path d="M50 18C42 18 36 24 36 32C36 38 40 43 45 45V55C38 58 32 65 32 74C32 82 40 88 50 88C60 88 68 82 68 74C68 65 62 58 55 55V45C60 43 64 38 64 32C64 24 58 18 50 18Z" fill="url(#poporoGold)" stroke="#997A2E" strokeWidth="2"/>
      <circle cx="50" cy="32" r="5" fill="#1E3A2B" stroke="#D4AF37"/>
      <circle cx="50" cy="74" r="7" fill="#1E3A2B" stroke="#D4AF37"/>
      <defs>
        <linearGradient id="poporoGold" x1="32" y1="18" x2="68" y2="88" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFF0B3"/>
          <stop offset="0.5" stopColor="#D4AF37"/>
          <stop offset="1" stopColor="#997A2E"/>
        </linearGradient>
      </defs>
    </svg>
  );
}
