import React, { useState, useMemo } from 'react';
import { Transaction, ScheduleProgramStatus } from '../types';
import { 
  ArrowUpDown, ChevronUp, ChevronDown, User, Calendar, Briefcase, 
  DollarSign, CreditCard, Clock, AlertTriangle, AlertOctagon, 
  CheckCircle2, Hammer, Zap, Sliders, UserCheck, Layers
} from 'lucide-react';
import { STATUS_STYLES, SCHEDULE_PROGRAM_CONFIG } from '../constants';

interface DataTableProps {
  data: Transaction[];
  viewMode?: 'financial' | 'work';
  onClientClick?: (clientId: string) => void;
  onAssignSchedule?: (transaction: Transaction) => void;
  enableScheduleShading?: boolean;
  scheduleProgramFilter?: string;
}

type SortKey = keyof Transaction;

export const DataTable: React.FC<DataTableProps> = ({ 
  data, 
  viewMode = 'financial', 
  onClientClick,
  onAssignSchedule,
  enableScheduleShading = true,
  scheduleProgramFilter = 'All'
}) => {
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>(null);

  // Filter by schedule program if filter applied
  const filteredData = useMemo(() => {
    if (!scheduleProgramFilter || scheduleProgramFilter === 'All') return data;
    return data.filter(d => (d.scheduleProgram || 'Under Work') === scheduleProgramFilter);
  }, [data, scheduleProgramFilter]);

  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return 1;
      if (bValue === undefined) return -1;

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredData, sortConfig]);

  const requestSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: SortKey) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-50 transition-opacity" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-3 h-3 text-blue-600" />
      : <ChevronDown className="w-3 h-3 text-blue-600" />;
  };

  const SortableHeader: React.FC<{ 
    label: string; 
    sortKey: SortKey; 
    align?: 'left' | 'right' 
  }> = ({ label, sortKey, align = 'left' }) => (
    <th 
      className={`px-3 py-2 text-left font-semibold text-slate-700 border-r border-slate-300 whitespace-nowrap cursor-pointer hover:bg-slate-200 transition-colors select-none group ${align === 'right' ? 'text-right' : 'text-left'}`}
      onClick={() => requestSort(sortKey)}
    >
      <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
        {label}
        {getSortIcon(sortKey)}
      </div>
    </th>
  );

  return (
    <div className="bg-white border border-slate-300 shadow-sm rounded-sm overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto excel-scrollbar">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-300 text-slate-700">
              <SortableHeader label="ID" sortKey="id" />
              <SortableHeader label="Date & Time" sortKey="date" />
              <SortableHeader label="Client Inflow Source" sortKey="clientName" />
              
              {/* Work Schedule Program & Lag Shading Column */}
              <SortableHeader label="Work Schedule Program & Lag" sortKey="scheduleProgram" />

              {viewMode === 'work' && (
                <>
                  <SortableHeader label="Work Type" sortKey="workType" />
                  <SortableHeader label="Description / Milestone" sortKey="item" />
                  <SortableHeader label="Region" sortKey="region" />
                </>
              )}
              
              {viewMode === 'financial' && (
                <>
                  <SortableHeader label="Category" sortKey="category" />
                  <SortableHeader label="Payment Method" sortKey="paymentMethod" />
                </>
              )}
              
              <SortableHeader label="Work Status" sortKey="status" />

              {viewMode === 'financial' && (
                <>
                  <SortableHeader label="Pay Status" sortKey="paymentStatus" />
                  <SortableHeader label="Received (Inflow)" sortKey="dilAmount" align="right" />
                  <SortableHeader label="Contract Total" sortKey="amount" align="right" />
                </>
              )}

              {onAssignSchedule && (
                <th className="px-3 py-2 text-center font-semibold text-slate-700 whitespace-nowrap">
                  Program Action
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {sortedData.length === 0 ? (
               <tr>
                 <td colSpan={viewMode === 'financial' ? (onAssignSchedule ? 11 : 10) : (onAssignSchedule ? 9 : 8)} className="px-4 py-8 text-center text-slate-500 italic">
                   No client inflow records found matching current criteria.
                 </td>
               </tr>
            ) : (
              sortedData.map((row, index) => {
                const prog = (row.scheduleProgram || 'Under Work') as ScheduleProgramStatus;
                const progConfig = SCHEDULE_PROGRAM_CONFIG[prog] || SCHEDULE_PROGRAM_CONFIG['Under Work'];
                const lag = row.lagDays !== undefined ? row.lagDays : (prog === 'Schedule Lag' ? 4 : (prog === 'Critical Lag' ? 14 : (prog === 'Under Schedule' ? -3 : 0)));
                
                // Color shade application on client inflow row
                const rowShadeClasses = enableScheduleShading
                  ? `${progConfig.rowShade} ${progConfig.borderAccent}`
                  : (index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50');

                return (
                  <tr 
                    key={row.id} 
                    className={`border-b border-slate-200/80 transition-colors ${rowShadeClasses}`}
                  >
                    {/* ID */}
                    <td className="px-3 py-2 border-r border-slate-200 text-slate-600 font-mono text-[11px] font-semibold">
                      {row.id}
                    </td>

                    {/* Date & Shift */}
                    <td className="px-3 py-2 border-r border-slate-200 text-slate-700 whitespace-nowrap">
                      <div className="font-mono text-xs font-medium">{row.date}</div>
                      {(row.startTime || row.endTime) && (
                        <div className="text-[10px] text-indigo-700 flex items-center gap-1 font-mono font-semibold">
                          <Clock className="w-2.5 h-2.5 text-indigo-500" />
                          {row.startTime || '--:--'} - {row.endTime || '--:--'}
                        </div>
                      )}
                    </td>

                    {/* Client Inflow Source */}
                    <td 
                      className={`px-3 py-2 border-r border-slate-200 text-slate-800 font-semibold ${onClientClick ? 'cursor-pointer hover:text-blue-600 hover:underline transition-colors' : ''}`}
                      onClick={() => onClientClick && onClientClick(row.clientId)}
                      title={onClientClick ? "View Client Profile & Contract Ledger" : ""}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: progConfig.dotColor }}></span>
                        <span className="truncate max-w-[150px]">{row.clientName}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-normal font-mono truncate max-w-[150px]">
                        {row.item}
                      </div>
                    </td>
                    
                    {/* Work Schedule Program & Lag Shading Column */}
                    <td className="px-3 py-2 border-r border-slate-200 whitespace-nowrap">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tight border ${progConfig.badge}`}>
                            {prog === 'Schedule Lag' && <AlertTriangle className="w-3 h-3 text-amber-600" />}
                            {prog === 'Critical Lag' && <AlertOctagon className="w-3 h-3 text-rose-600 animate-pulse" />}
                            {prog === 'Under Work' && <Hammer className="w-3 h-3 text-blue-600" />}
                            {prog === 'Under Schedule' && <Zap className="w-3 h-3 text-emerald-600" />}
                            {prog === 'On Schedule' && <CheckCircle2 className="w-3 h-3 text-teal-600" />}
                            <span>{progConfig.tag}</span>
                          </span>

                          {/* Lag deviation pill */}
                          {lag !== 0 ? (
                            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                              lag > 10 
                                ? 'bg-rose-100 text-rose-800 border-rose-300' 
                                : lag > 0 
                                  ? 'bg-amber-100 text-amber-800 border-amber-300' 
                                  : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            }`}>
                              {lag > 0 ? `+${lag}d Lag` : `${lag}d Early`}
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-teal-700 bg-teal-50 px-1 py-0.2 rounded border border-teal-200">
                              0d Sync
                            </span>
                          )}
                        </div>

                        {/* Assigned Lead & Phase snippet */}
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                          {row.assignedLead ? (
                            <span className="truncate max-w-[140px] text-slate-600" title={row.assignedLead}>
                              👤 {row.assignedLead.split(' ')[0]}
                            </span>
                          ) : (
                            <span>Lead: Core Team</span>
                          )}
                          {row.targetCompletionDate && (
                            <span className="text-slate-400 font-mono">
                              &bull; Due: {row.targetCompletionDate.slice(5)}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Work View Specific Columns */}
                    {viewMode === 'work' && (
                      <>
                        <td className="px-3 py-2 border-r border-slate-200 text-slate-700">
                          <span className="inline-block px-2 py-0.5 bg-slate-100 rounded text-slate-700 text-xs font-medium border border-slate-200">
                            {row.workType}
                          </span>
                        </td>
                        <td className="px-3 py-2 border-r border-slate-200 text-slate-600 italic text-xs truncate max-w-[180px]">
                          {row.item}
                        </td>
                        <td className="px-3 py-2 border-r border-slate-200 text-slate-600 text-xs">
                          {row.region}
                        </td>
                      </>
                    )}

                    {/* Financial View Specific Columns */}
                    {viewMode === 'financial' && (
                      <>
                        <td className="px-3 py-2 border-r border-slate-200 text-slate-600 text-xs">
                          {row.workType}
                        </td>
                        <td className="px-3 py-2 border-r border-slate-200 text-slate-600 text-xs">
                          {row.paymentMethod || 'Invoiced'}
                        </td>
                      </>
                    )}

                    {/* Status */}
                    <td className="px-3 py-2 border-r border-slate-200">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLES[row.status] || STATUS_STYLES['default']}`}>
                        {row.status}
                      </span>
                    </td>

                    {/* Financial Amounts */}
                    {viewMode === 'financial' && (
                      <>
                        <td className="px-3 py-2 border-r border-slate-200">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLES[row.paymentStatus] || STATUS_STYLES['default']}`}>
                            {row.paymentStatus || 'Unpaid'}
                          </span>
                        </td>
                        <td className="px-3 py-2 border-r border-slate-200 text-right font-mono font-semibold text-emerald-700">
                          ${row.dilAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-slate-800">
                          ${row.amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                        </td>
                      </>
                    )}

                    {/* Quick Assign Schedule Action */}
                    {onAssignSchedule && (
                      <td className="px-3 py-2 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onAssignSchedule(row)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 shadow-2xs transition-all cursor-pointer active:scale-95"
                          title="Assign work schedule program status and lag days"
                        >
                          <Sliders className="w-3 h-3 text-blue-600" />
                          <span>Assign Lag</span>
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden bg-slate-100/60 p-2.5 space-y-3">
        {sortedData.length === 0 ? (
          <div className="text-center py-8 text-slate-500 italic bg-white rounded-lg p-4">
            No client inflow records found.
          </div>
        ) : (
          sortedData.map((row) => {
            const prog = (row.scheduleProgram || 'Under Work') as ScheduleProgramStatus;
            const progConfig = SCHEDULE_PROGRAM_CONFIG[prog] || SCHEDULE_PROGRAM_CONFIG['Under Work'];
            const lag = row.lagDays !== undefined ? row.lagDays : (prog === 'Schedule Lag' ? 4 : (prog === 'Critical Lag' ? 14 : (prog === 'Under Schedule' ? -3 : 0)));

            const cardShadeClass = enableScheduleShading
              ? `${progConfig.cardShade} ${progConfig.borderAccent}`
              : 'bg-white border-slate-200';

            return (
              <div 
                key={row.id} 
                className={`p-3.5 rounded-xl shadow-xs border transition-all flex flex-col gap-2.5 ${cardShadeClass}`}
              >
                {/* Top Row: Date, Work Status & Schedule Program Shade Badge */}
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2 text-slate-600 text-xs flex-wrap">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span className="font-mono font-medium">{row.date}</span>
                    </div>
                    {(row.startTime || row.endTime) && (
                      <div className="flex items-center gap-1 font-mono text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100 font-semibold">
                        <Clock className="w-2.5 h-2.5 text-indigo-500" />
                        <span>{row.startTime} - {row.endTime}</span>
                      </div>
                    )}
                  </div>
                  
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLES[row.status] || STATUS_STYLES['default']}`}>
                    {row.status}
                  </span>
                </div>

                {/* Client Inflow Title */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div 
                      className={`font-bold text-sm text-slate-900 flex items-center gap-1.5 ${onClientClick ? 'text-blue-600 cursor-pointer' : ''}`}
                      onClick={() => onClientClick && onClientClick(row.clientId)}
                    >
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{row.clientName}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono pl-5">{row.id} &bull; {row.workType}</div>
                  </div>

                  {/* Financial amount badge on mobile */}
                  <div className="text-right">
                    <span className="text-[9px] text-slate-400 uppercase font-bold block">Inflow</span>
                    <span className="font-mono font-black text-slate-800 text-sm">
                      ${row.amount.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Work Schedule Program & Lag Shade Banner on Card */}
                <div className="bg-white/80 p-2.5 rounded-lg border border-slate-200/80 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tight border ${progConfig.badge}`}>
                        {prog === 'Schedule Lag' && <AlertTriangle className="w-3 h-3 text-amber-600" />}
                        {prog === 'Critical Lag' && <AlertOctagon className="w-3 h-3 text-rose-600 animate-pulse" />}
                        {prog === 'Under Work' && <Hammer className="w-3 h-3 text-blue-600" />}
                        {prog === 'Under Schedule' && <Zap className="w-3 h-3 text-emerald-600" />}
                        {prog === 'On Schedule' && <CheckCircle2 className="w-3 h-3 text-teal-600" />}
                        <span>{progConfig.label}</span>
                      </span>

                      {lag !== 0 && (
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                          lag > 10 ? 'bg-rose-100 text-rose-800 border-rose-300' : (lag > 0 ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-emerald-100 text-emerald-800 border-emerald-300')
                        }`}>
                          {lag > 0 ? `+${lag}d Lag` : `${lag}d Ahead`}
                        </span>
                      )}
                    </div>

                    {onAssignSchedule && (
                      <button
                        type="button"
                        onClick={() => onAssignSchedule(row)}
                        className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-slate-900 text-white rounded-md shadow-xs active:scale-95"
                      >
                        <Sliders className="w-3 h-3 text-blue-400" />
                        <span>Assign Lag</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                    <span>Lead: <b>{row.assignedLead ? row.assignedLead.split(' ')[0] : 'Engineering'}</b></span>
                    <span>Phase: <b>{row.schedulePhase || 'Execution'}</b></span>
                  </div>
                </div>

                {/* View specific content */}
                {viewMode === 'financial' && (
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                    <span className="text-slate-500">
                      Received: <b className="text-emerald-700 font-mono">${row.dilAmount.toLocaleString()}</b>
                    </span>
                    <span className="text-slate-500">
                      Balance: <b className="text-slate-800 font-mono">${(row.amount - row.dilAmount).toLocaleString()}</b>
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
