import React from 'react';
import { KPIStats } from '../types';
import { DollarSign, Activity, ShoppingBag, PieChart } from 'lucide-react';

interface KPICardsProps {
  stats: KPIStats;
}

export const KPICards: React.FC<KPICardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div 
        data-widget="kpi-revenue" 
        tabIndex={0} 
        aria-label="KPI Total Revenue"
        className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all cursor-pointer"
      >
        <div>
          <p className="text-sm font-medium text-slate-500">Total Revenue</p>
          <h3 className="text-2xl font-bold text-slate-800">
            ${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
        </div>
        <div className="p-3 bg-blue-50 rounded-full">
          <DollarSign className="w-6 h-6 text-blue-600" />
        </div>
      </div>

      <div 
        data-widget="kpi-transactions" 
        tabIndex={0} 
        aria-label="KPI Transactions count"
        className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all cursor-pointer"
      >
        <div>
          <p className="text-sm font-medium text-slate-500">Transactions</p>
          <h3 className="text-2xl font-bold text-slate-800">
            {stats.totalTransactions.toLocaleString()}
          </h3>
        </div>
        <div className="p-3 bg-emerald-50 rounded-full">
          <ShoppingBag className="w-6 h-6 text-emerald-600" />
        </div>
      </div>

      <div 
        data-widget="kpi-value" 
        tabIndex={0} 
        aria-label="KPI Average Value"
        className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all cursor-pointer"
      >
        <div>
          <p className="text-sm font-medium text-slate-500">Avg. Value</p>
          <h3 className="text-2xl font-bold text-slate-800">
            ${stats.averageValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </h3>
        </div>
        <div className="p-3 bg-purple-50 rounded-full">
          <Activity className="w-6 h-6 text-purple-600" />
        </div>
      </div>

      <div 
        data-widget="kpi-completion" 
        tabIndex={0} 
        aria-label="KPI Completion Rate"
        className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all cursor-pointer"
      >
        <div>
          <p className="text-sm font-medium text-slate-500">Completion Rate</p>
          <h3 className="text-2xl font-bold text-slate-800">
            {stats.completionRate.toFixed(1)}%
          </h3>
        </div>
        <div className="p-3 bg-amber-50 rounded-full">
          <PieChart className="w-6 h-6 text-amber-600" />
        </div>
      </div>
    </div>
  );
};
