import React from 'react';
import { ViewState } from '../types';
import { LayoutDashboard, Users, KanbanSquare, CalendarDays, Menu, CreditCard, Download } from 'lucide-react';

interface BottomNavProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  onOpenMenu: () => void;
  theme?: 'professional' | 'futuristic';
  showInstall?: boolean;
  onInstall?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, onChangeView, onOpenMenu, theme = 'professional', showInstall, onInstall }) => {
  const isFuturistic = theme === 'futuristic';
  
  const navItems = [
    { id: 'dashboard', label: 'Dash', icon: LayoutDashboard },
    { id: 'kanban', label: 'Flow', icon: KanbanSquare },
    { id: 'calendar', label: 'Plan', icon: CalendarDays },
    { id: 'clients', label: 'Clients', icon: Users },
  ];

  return (
    <div className={`md:hidden fixed bottom-0 left-0 right-0 z-50 border-t pb-safe
      ${isFuturistic 
        ? 'bg-slate-950 border-cyan-900/50 text-cyan-50' 
        : 'bg-white border-slate-200 text-slate-600 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]'
      }`}
    >
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id as ViewState)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 active:scale-95 transition-transform
                ${isActive 
                  ? (isFuturistic ? 'text-cyan-400' : 'text-blue-600') 
                  : (isFuturistic ? 'text-slate-500 hover:text-cyan-200' : 'text-slate-400 hover:text-slate-600')
                }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'fill-current opacity-20' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
        
        {/* Conditional Install or Menu Button */}
        {showInstall && onInstall ? (
           <button
             onClick={onInstall}
             className={`flex flex-col items-center justify-center w-full h-full space-y-1 active:scale-95 transition-transform
               ${isFuturistic ? 'text-cyan-400 animate-pulse' : 'text-blue-600'}`}
           >
             <Download className="w-5 h-5" />
             <span className="text-[10px] font-bold">Install</span>
           </button>
        ) : (
          <button
            onClick={onOpenMenu}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 active:scale-95 transition-transform
              ${isFuturistic ? 'text-slate-500 hover:text-cyan-200' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] font-medium">Menu</span>
          </button>
        )}
      </div>
    </div>
  );
};