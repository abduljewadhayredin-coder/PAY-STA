
import React, { useMemo } from 'react';
import { Transaction, ViewState } from '../types';
import { Filter, ExternalLink } from 'lucide-react';
import { WidgetTooltipOverlay } from './WidgetTooltipOverlay';

interface StatusSlicerProps {
  data: Transaction[];
  selectedStatus: string | null;
  onSelectStatus: (status: string | null) => void;
  onNavigate?: (view: ViewState, params?: any) => void;
}

export const StatusSlicer: React.FC<StatusSlicerProps> = ({ data, selectedStatus, onSelectStatus, onNavigate }) => {
  const aggregated = useMemo(() => {
    // SAFETY FIX: Prevent crash if data is null/undefined
    if (!data || !Array.isArray(data)) return [];

    const stats: Record<string, { count: number; total: number }> = {};
    
    data.forEach(t => {
      if (!stats[t.status]) {
        stats[t.status] = { count: 0, total: 0 };
      }
      stats[t.status].count += 1;
      stats[t.status].total += t.amount;
    });

    return Object.entries(stats).map(([status, val]) => ({
      status,
      ...val
    })).sort((a, b) => b.total - a.total);
  }, [data]);

  return (
    <div 
      data-widget="status-slicer" 
      tabIndex={0}
      aria-label="Status Filter Slicer"
      title="Status Filter Slicer: Filter transactions and operational metrics across workflow stages (Completed, In Progress, Pending), view volume breakdowns, and navigate to ledger records."
      className="bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col h-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all cursor-pointer relative group"
    >
      <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between rounded-t-lg">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <h4 className="font-semibold text-slate-700 text-sm">Status Filter</h4>
        </div>
        <WidgetTooltipOverlay
          title="Status Filter Slicer"
          category="Operational Filter"
          description="Interactive status slicer that filters all dashboard metrics, charts, and transaction rows. Displays counts and dollar totals per stage, with quick navigation links to the ledger."
        />
      </div>
      <div className="overflow-y-auto max-h-[300px] excel-scrollbar">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 sticky top-0 z-10">
            <tr>
              <th className="p-2 font-medium text-slate-500 border-b border-slate-200">Status</th>
              <th className="p-2 font-medium text-slate-500 border-b border-slate-200 text-right">Count</th>
              <th className="p-2 font-medium text-slate-500 border-b border-slate-200 text-right">Total</th>
              <th className="p-2 border-b border-slate-200 w-8"></th>
            </tr>
          </thead>
          <tbody>
            <tr 
              onClick={() => onSelectStatus(null)}
              className={`cursor-pointer transition-colors border-b border-slate-100 last:border-0 ${
                selectedStatus === null ? 'bg-blue-50' : 'hover:bg-slate-50'
              }`}
            >
              <td className="p-2 font-medium text-slate-700">All</td>
              <td className="p-2 text-slate-600 text-right">{data ? data.length : 0}</td>
              <td className="p-2 text-slate-600 text-right">
                ${data ? data.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString(undefined, { maximumFractionDigits: 0 }) : 0}
              </td>
              <td className="p-2"></td>
            </tr>
            {aggregated.map((row) => (
              <tr 
                key={row.status}
                className={`transition-colors border-b border-slate-100 last:border-0 group ${
                  selectedStatus === row.status ? 'bg-blue-100' : 'hover:bg-slate-50'
                }`}
              >
                <td className="p-2 text-slate-700 cursor-pointer" onClick={() => onSelectStatus(selectedStatus === row.status ? null : row.status)}>{row.status}</td>
                <td className="p-2 text-slate-500 text-right cursor-pointer" onClick={() => onSelectStatus(selectedStatus === row.status ? null : row.status)}>{row.count}</td>
                <td className="p-2 text-slate-500 text-right cursor-pointer" onClick={() => onSelectStatus(selectedStatus === row.status ? null : row.status)}>
                  ${row.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </td>
                <td className="p-2 text-right">
                  <button 
                     onClick={(e) => {
                       e.stopPropagation();
                       onNavigate && onNavigate('payments', { filter: row.status });
                     }}
                     className="text-slate-300 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all p-1"
                     title={`View ${row.status} in Ledger`}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
