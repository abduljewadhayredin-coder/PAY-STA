import React, { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

interface WidgetTooltipOverlayProps {
  title: string;
  description: string;
  category?: string;
  className?: string;
  align?: 'right' | 'left';
}

export const WidgetTooltipOverlay: React.FC<WidgetTooltipOverlayProps> = ({
  title,
  description,
  category = 'Widget Purpose',
  className = '',
  align = 'right'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`relative inline-block z-30 ${className}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        aria-label={`Guidance for ${title}`}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(prev => !prev);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-blue-600 bg-slate-100/90 hover:bg-blue-50 px-2 py-0.5 rounded border border-slate-200 hover:border-blue-300 transition-all cursor-help focus:outline-none focus:ring-1 focus:ring-blue-400 select-none shadow-xs group-hover:border-blue-200"
      >
        <Info className="w-3 h-3 text-blue-500 shrink-0" />
        <span className="hidden sm:inline">Purpose</span>
      </button>

      {isOpen && (
        <div 
          role="tooltip"
          className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} top-full mt-2 w-72 p-3 bg-slate-900/95 text-white text-xs rounded-lg shadow-xl border border-slate-700/80 backdrop-blur-sm pointer-events-auto transition-all duration-200 animate-fadeIn z-50`}
        >
          <div className="flex items-start gap-2.5">
            <div className="p-1 rounded bg-blue-500/20 text-blue-400 shrink-0 mt-0.5 border border-blue-500/30">
              <Info className="w-3.5 h-3.5" />
            </div>
            <div className="space-y-1 text-left flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-white text-xs">{title}</span>
                <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-blue-300 border border-slate-700 font-mono font-medium">
                  {category}
                </span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {description}
              </p>
            </div>
          </div>
          {/* Arrow pointer */}
          <div 
            className={`absolute -top-1.5 ${align === 'right' ? 'right-4' : 'left-4'} w-3 h-3 bg-slate-900 border-t border-l border-slate-700/80 transform rotate-45`}
          />
        </div>
      )}
    </div>
  );
};
