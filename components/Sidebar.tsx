

import React, { useEffect, useState } from 'react';
import { ViewState } from '../types';
import { LayoutDashboard, Users, CreditCard, Settings, X, Calculator, Download, Wifi, WifiOff, KanbanSquare, CalendarDays, LogOut, TrendingUp, FileSpreadsheet } from 'lucide-react';
import { SpartanLogo } from './SpartanLogo';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  isOpen: boolean;
  onClose: () => void;
  showInstall: boolean;
  onInstall: () => void;
  onLogout: () => void;
  theme?: 'professional' | 'futuristic';
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, isOpen, onClose, showInstall, onInstall, onLogout, theme = 'professional' }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const isFuturistic = theme === 'futuristic';

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'kanban', label: 'Workflow Board', icon: KanbanSquare },
    { id: 'calendar', label: 'Master Schedule', icon: CalendarDays },
    { id: 'clients', label: 'Client Register', icon: Users },
    { id: 'payments', label: 'Client Inflow', icon: CreditCard },
    { id: 'income-statement', label: 'Income Statement (P&L)', icon: TrendingUp },
    { id: 'estimator', label: 'Quote Estimator', icon: Calculator },
    { id: 'reports', label: 'Reports & Statements', icon: FileSpreadsheet },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 text-slate-100 shadow-xl
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 flex flex-col
        ${isFuturistic ? 'bg-[#0B1221]' : 'bg-slate-900'}
      `}>
        <div className={`h-16 flex items-center justify-between px-6 border-b shrink-0 ${isFuturistic ? 'border-cyan-900/20 bg-[#050914]' : 'border-slate-800 bg-slate-950'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-1.5 rounded-lg flex items-center justify-center ${isFuturistic ? 'bg-cyan-950/50 text-cyan-400' : 'bg-slate-900 border border-slate-700/60 text-white'}`}>
              <SpartanLogo className="w-7 h-6" theme={theme} />
            </div>
            <div>
              <h1 className="font-extrabold tracking-tight text-white leading-none text-base">AJ ARCHITECTS</h1>
              <span className={`text-[9px] font-mono tracking-wider uppercase font-semibold ${isFuturistic ? 'text-cyan-400' : 'text-slate-400'}`}>Engineers Consulting</span>
            </div>
          </div>
          <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onChangeView(item.id as ViewState)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200 group
                  ${isActive 
                    ? (isFuturistic ? 'bg-cyan-900/40 text-cyan-50 border border-cyan-800' : 'bg-blue-600 text-white shadow-md')
                    : (isFuturistic ? 'text-slate-400 hover:bg-[#111a33] hover:text-cyan-100' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100')
                  }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : (isFuturistic ? 'text-slate-500 group-hover:text-cyan-400' : 'text-slate-500 group-hover:text-slate-300')}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className={`p-4 border-t mt-auto shrink-0 space-y-3 ${isFuturistic ? 'border-cyan-900/20' : 'border-slate-800'}`}>
          {showInstall && (
            <button 
              onClick={onInstall}
              className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded transition-colors border
                ${isFuturistic 
                  ? 'bg-[#111a33] hover:bg-[#1a2540] text-cyan-100 border-cyan-900/50' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 hover:border-slate-600'}`}
            >
              <Download className="w-3.5 h-3.5" /> Install App
            </button>
          )}

          <div className={`rounded p-3 text-xs transition-colors border ${isOnline ? (isFuturistic ? 'bg-[#111a33] border-cyan-900/30' : 'bg-slate-800/50 border-slate-800') : 'bg-red-900/20 border-red-900/50'}`}>
            <p className={`font-semibold mb-1 flex items-center gap-2 ${isOnline ? (isFuturistic ? 'text-cyan-400' : 'text-slate-400') : 'text-red-400'}`}>
              System Status
            </p>
            <div className="flex items-center gap-2 text-slate-500">
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
              {isOnline ? (
                <span className="flex items-center gap-1"><Wifi className="w-3 h-3" /> Online v2.7.0</span>
              ) : (
                <span className="flex items-center gap-1 text-red-400"><WifiOff className="w-3 h-3" /> Offline Mode</span>
              )}
            </div>
          </div>

          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 text-xs font-medium rounded transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </div>
    </>
  );
};