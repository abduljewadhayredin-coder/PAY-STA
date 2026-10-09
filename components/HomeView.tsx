

import React from 'react';
import { Theme, KPIStats } from '../types';
import { LayoutDashboard, Users, CreditCard, Settings, ArrowRight, Clock, Calculator, KanbanSquare, CalendarDays, TrendingUp, FileSpreadsheet } from 'lucide-react';
import { SpartanLogo } from './SpartanLogo';

interface HomeViewProps {
  user: { name: string; role: string; initials: string };
  stats: KPIStats;
  theme: Theme;
  onNavigate: (view: any) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ user, stats, theme, onNavigate }) => {
  const isFuturistic = theme === 'futuristic';

  const menuItems = [
    { 
      id: 'dashboard', 
      label: 'Operational Dashboard', 
      desc: 'Real-time financial analytics and trends.',
      icon: LayoutDashboard,
      color: isFuturistic ? 'text-cyan-400' : 'text-blue-600',
      bg: isFuturistic ? 'bg-cyan-950/30' : 'bg-blue-50'
    },
    { 
      id: 'kanban', 
      label: 'Workflow Board', 
      desc: 'Track project status visually.',
      icon: KanbanSquare,
      color: isFuturistic ? 'text-orange-400' : 'text-orange-600',
      bg: isFuturistic ? 'bg-orange-950/30' : 'bg-orange-50'
    },
    { 
      id: 'calendar', 
      label: 'Master Schedule', 
      desc: 'Timeline and deadline management.',
      icon: CalendarDays,
      color: isFuturistic ? 'text-purple-400' : 'text-violet-600',
      bg: isFuturistic ? 'bg-purple-950/30' : 'bg-violet-50'
    },
    { 
      id: 'estimator', 
      label: 'Quick Quote Engine', 
      desc: 'Calculate costs and generate records.',
      icon: Calculator,
      color: isFuturistic ? 'text-lime-400' : 'text-indigo-600',
      bg: isFuturistic ? 'bg-lime-950/30' : 'bg-indigo-50'
    },
    { 
      id: 'clients', 
      label: 'Client Registry', 
      desc: 'Manage active contracts and prospects.',
      icon: Users,
      color: isFuturistic ? 'text-emerald-400' : 'text-emerald-600',
      bg: isFuturistic ? 'bg-emerald-950/30' : 'bg-emerald-50'
    },
    { 
      id: 'payments', 
      label: 'Payment Ledger', 
      desc: 'View transaction history and export.',
      icon: CreditCard,
      color: isFuturistic ? 'text-pink-400' : 'text-amber-600',
      bg: isFuturistic ? 'bg-pink-950/30' : 'bg-amber-50'
    },
    { 
      id: 'income-statement', 
      label: 'Income Statement (P&L)', 
      desc: 'Reconcile Client Income vs. Worker Payroll.',
      icon: TrendingUp,
      color: isFuturistic ? 'text-emerald-400' : 'text-emerald-600',
      bg: isFuturistic ? 'bg-emerald-950/30' : 'bg-emerald-50'
    },
    { 
      id: 'reports', 
      label: 'Daily to Monthly Reports & Statements', 
      desc: 'Audit statements and reconciliation in PDF format.',
      icon: FileSpreadsheet,
      color: isFuturistic ? 'text-cyan-400' : 'text-indigo-600',
      bg: isFuturistic ? 'bg-cyan-950/30' : 'bg-indigo-50'
    },
  ];

  return (
    <div className={`min-h-screen p-6 md:p-12 animate-fadeIn flex flex-col
      ${isFuturistic 
        ? 'bg-[#020617] text-cyan-50 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-[#0f172a] via-[#050914] to-black' 
        : 'bg-slate-50 text-slate-800'
      }`}
    >
      <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
             <div className={`p-2 rounded-lg ${isFuturistic ? 'bg-cyan-900/50 text-cyan-400 border border-cyan-500/50' : 'bg-slate-900 text-white shadow-md'}`}>
               <SpartanLogo className="w-9 h-8" theme={theme} />
             </div>
             <div>
               <h1 className={`text-xl font-extrabold tracking-tight ${isFuturistic ? 'font-futuristic' : ''}`}>AJ ARCHITECTS</h1>
               <div className="flex items-center gap-2 text-xs opacity-75 font-medium">
                 <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                 ENGINEERS CONSULTING • TERMINAL ACTIVE
               </div>
             </div>
          </div>
          <div className={`flex items-center gap-3 px-4 py-2 rounded-full border ${isFuturistic ? 'border-cyan-900 bg-[#0B1221]' : 'border-slate-200 bg-white'}`}>
             <Clock className="w-4 h-4 opacity-50" />
             <span className="text-sm font-mono opacity-80">{new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {/* Welcome Section */}
        <div className="mb-12">
          <h2 className={`text-4xl md:text-5xl font-bold mb-4 ${isFuturistic ? 'text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-400 font-futuristic' : 'text-slate-900'}`}>
            Welcome back, {user.name.split(' ')[0]}.
          </h2>
          <p className={`text-lg max-w-2xl ${isFuturistic ? 'text-cyan-200/60' : 'text-slate-500'}`}>
            Your financial command center is ready. You have processed <span className="font-bold">{stats.totalTransactions} transactions</span> generating <span className="font-bold">${stats.totalRevenue.toLocaleString()}</span> in total revenue.
          </p>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`group relative p-6 rounded-2xl text-left border transition-all duration-300 hover:-translate-y-1 h-full flex flex-col
                  ${isFuturistic 
                    ? 'bg-[#0B1221] border-cyan-900/50 hover:border-cyan-400/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]' 
                    : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-xl'
                  }
                `}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors ${item.bg} ${item.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className={`text-lg font-bold mb-1 group-hover:text-blue-500 transition-colors ${isFuturistic ? 'text-white' : 'text-slate-800'}`}>
                  {item.label}
                </h3>
                <p className={`text-xs mb-6 flex-1 ${isFuturistic ? 'text-slate-400' : 'text-slate-500'}`}>
                  {item.desc}
                </p>
                <div className={`flex items-center gap-2 text-xs font-medium ${item.color}`}>
                  Access <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                </div>
              </button>
            )
          })}
        </div>

        {/* Quick Footer */}
        <div className={`mt-auto pt-6 border-t flex justify-between items-center text-xs
          ${isFuturistic ? 'border-cyan-900/30 text-cyan-900' : 'border-slate-200 text-slate-400'}`}
        >
          <div className="font-mono">SYS.CONFIG.V2.7</div>
          <button 
            onClick={() => onNavigate('settings')}
            className={`flex items-center gap-2 hover:underline ${isFuturistic ? 'text-cyan-500' : 'text-slate-600'}`}
          >
            <Settings className="w-3 h-3" /> System Preferences
          </button>
        </div>

      </div>
    </div>
  );
};