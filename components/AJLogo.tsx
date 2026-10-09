import React from 'react';

interface AJLogoProps {
  className?: string;
  theme?: 'professional' | 'futuristic';
  showText?: boolean;
  useImage?: boolean;
}

export const AJLogo: React.FC<AJLogoProps> = ({ 
  className = "w-8 h-8", 
  theme = 'professional',
  showText = false,
  useImage = false
}) => {
  const isFuturistic = theme === 'futuristic';
  
  // Theme colors matching the CAD drawing: Blue emblem + Red/Coral architectural line-work
  const redColor = isFuturistic ? '#ff007f' : '#e05353';

  if (useImage) {
    return (
      <div className={`relative inline-flex items-center justify-center overflow-hidden rounded ${className}`}>
        <img 
          src="/src/assets/images/aj_logo_1790951016662.jpg" 
          alt="AJ Architects & Engineers Logo"
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  return (
    <svg 
      viewBox={showText ? "0 0 220 220" : "0 0 210 165"}
      className={className} 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="ajBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isFuturistic ? "#00f3ff" : "#4f72c7"} />
          <stop offset="100%" stopColor={isFuturistic ? "#3b82f6" : "#3b5fc2"} />
        </linearGradient>
      </defs>

      {/* --- LETTER A (Solid Blue Geometry) --- */}
      {/* Upper A & Left Leg */}
      <path
        d="M 12 145 L 72 25 L 94 25 L 122 84 L 105 92 L 83 45 L 34 145 Z"
        fill="url(#ajBlueGrad)"
      />

      {/* A Inner Triangle Negative Space */}
      <path
        d="M 83 48 L 98 84 L 68 84 Z"
        fill="white"
        fillOpacity={isFuturistic ? "0.08" : "1"}
      />

      {/* Lower Right Segment of A (Framed Architectural Leg) */}
      <polygon
        points="109,102 124,96 148,138 133,145"
        stroke={redColor}
        strokeWidth="2.5"
        fill={isFuturistic ? "rgba(255,0,127,0.1)" : "none"}
        strokeLinejoin="round"
      />

      {/* --- LETTER J (Solid Blue Hook) --- */}
      <path
        d="M 162 90 L 186 90 L 186 126 C 186 142 168 152 135 152 C 148 145 162 136 162 124 Z"
        fill="url(#ajBlueGrad)"
      />

      {/* --- ARCHITECTURAL SKYSCRAPER / TOWER SILHOUETTE (Red) --- */}
      <g stroke={redColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {/* Left Tower Wall & Angled Roof */}
        <polygon points="163,55 174,48 174,86 163,86" fill={isFuturistic ? "rgba(255,0,127,0.15)" : "none"} />
        {/* Right Tower Wall & Angled Roof */}
        <polygon points="174,48 186,55 186,86 174,86" fill={isFuturistic ? "rgba(255,0,127,0.1)" : "none"} />
        {/* Center Vertical Mullion Divider */}
        <line x1="174" y1="48" x2="174" y2="86" />

        {/* Rising Vertical Architectural Spires / Columns */}
        <line x1="165" y1="54" x2="165" y2="35" strokeWidth="1.6" />
        <line x1="169" y1="51" x2="169" y2="28" strokeWidth="1.6" />
        <line x1="172" y1="49" x2="172" y2="24" strokeWidth="1.8" />
        <line x1="176" y1="49" x2="176" y2="24" strokeWidth="1.8" />
        <line x1="179" y1="51" x2="179" y2="28" strokeWidth="1.6" />
        <line x1="183" y1="54" x2="183" y2="35" strokeWidth="1.6" />
      </g>

      {/* --- SWEEPING CURVED BRIDGE / HORIZON ARC (Double Red Lines) --- */}
      <path
        d="M 28 148 Q 105 80 200 92"
        stroke={redColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 40 148 Q 110 88 196 98"
        stroke={redColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        strokeOpacity="0.85"
      />

      {/* --- TYPOGRAPHY (Rendered when showText is true) --- */}
      {showText && (
        <g textAnchor="middle">
          <text
            x="105"
            y="185"
            fill={redColor}
            fontSize="17"
            fontFamily="Inter, sans-serif"
            fontWeight="800"
            letterSpacing="3"
          >
            AJ ARCHITECTS
          </text>
          <text
            x="105"
            y="204"
            fill={redColor}
            fontSize="8.5"
            fontFamily="Inter, sans-serif"
            fontWeight="700"
            letterSpacing="2"
          >
            ENGINEERS CONSULTING
          </text>
        </g>
      )}
    </svg>
  );
};
