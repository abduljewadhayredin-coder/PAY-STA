import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, ViewState, WorkerPayment, WorkerDiscipline } from '../types';
import { DataTable } from './DataTable';
import { WorkerPaymentModal } from './WorkerPaymentModal';
import { ScheduleProgramModal } from './ScheduleProgramModal';
import { DISCIPLINE_METADATA, WORKER_DISCIPLINES, STATUS_BUTTON_STYLES, SCHEDULE_PROGRAM_CONFIG } from '../constants';
import { 
  FileSpreadsheet, FileText, Filter, Briefcase, DollarSign, 
  ArrowDownRight, ArrowUpRight, Plus, TrendingUp, Users, Edit2, Trash2, 
  Search, HardHat, Zap, Droplets, Compass, Building, Wrench,
  AlertTriangle, AlertOctagon, Palette, Eye, EyeOff, Clock, CalendarDays, Sliders, CheckCircle2, Hammer
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface PaymentViewProps {
  data: Transaction[];
  workerPayments?: WorkerPayment[];
  onAddWorkerPayment?: (payment: Omit<WorkerPayment, 'id'>, id?: string) => void;
  onDeleteWorkerPayment?: (id: string) => void;
  onUpdateTransaction?: (transaction: Transaction) => void;
  initialFilter?: string;
  onNavigate?: (view: ViewState, params?: any) => void;
}

export const PaymentView: React.FC<PaymentViewProps> = ({ 
  data, 
  workerPayments = [],
  onAddWorkerPayment,
  onDeleteWorkerPayment,
  onUpdateTransaction,
  initialFilter, 
  onNavigate 
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'financial' | 'workers' | 'work'>('financial');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<WorkerPayment | null>(null);
  const [selectedDisciplineForNew, setSelectedDisciplineForNew] = useState<WorkerDiscipline>('Structure');
  const [workerDisciplineFilter, setWorkerDisciplineFilter] = useState<string>('All');
  const [workerSearchTerm, setWorkerSearchTerm] = useState<string>('');

  // Work Schedule Program & Lag Shading State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleSelectedTx, setScheduleSelectedTx] = useState<Transaction | null>(null);
  const [enableScheduleShading, setEnableScheduleShading] = useState<boolean>(true);
  const [scheduleProgramFilter, setScheduleProgramFilter] = useState<string>('All');

  // Apply initial filter if provided
  useEffect(() => {
    if (initialFilter && initialFilter !== statusFilter) {
      setStatusFilter(initialFilter);
    }
  }, [initialFilter]);

  const filteredData = useMemo(() => {
    if (statusFilter === 'All') return data;
    return data.filter(d => d.status === statusFilter);
  }, [data, statusFilter]);

  // Financial Metrics
  const totalClientIncome = useMemo(() => {
    return data.reduce((sum, d) => sum + (d.dilAmount || d.amount || 0), 0);
  }, [data]);

  const totalWorkerOutcome = useMemo(() => {
    return workerPayments.reduce((sum, wp) => sum + wp.amount, 0);
  }, [workerPayments]);

  const netIncome = totalClientIncome - totalWorkerOutcome;

  // Work Schedule Program & Lag Calculations on Client Inflow
  const scheduleStats = useMemo(() => {
    const safeData = Array.isArray(data) ? data : [];
    const laggingTxs = safeData.filter(d => (d.scheduleProgram === 'Schedule Lag' || d.scheduleProgram === 'Critical Lag'));
    const criticalTxs = safeData.filter(d => d.scheduleProgram === 'Critical Lag');
    const underWorkTxs = safeData.filter(d => (d.scheduleProgram === 'Under Work' || (!d.scheduleProgram && d.status === 'In Progress')));
    const aheadTxs = safeData.filter(d => d.scheduleProgram === 'Under Schedule');
    const onTrackTxs = safeData.filter(d => (d.scheduleProgram === 'On Schedule' || d.scheduleProgram === 'Completed'));

    const lagTotalInflow = laggingTxs.reduce((sum, d) => sum + (d.dilAmount || d.amount || 0), 0);
    const underWorkTotalInflow = underWorkTxs.reduce((sum, d) => sum + (d.dilAmount || d.amount || 0), 0);
    const aheadTotalInflow = aheadTxs.reduce((sum, d) => sum + (d.dilAmount || d.amount || 0), 0);
    const onTrackTotalInflow = onTrackTxs.reduce((sum, d) => sum + (d.dilAmount || d.amount || 0), 0);

    return {
      laggingCount: laggingTxs.length,
      criticalLagCount: criticalTxs.length,
      lagTotalInflow,
      underWorkCount: underWorkTxs.length,
      underWorkTotalInflow,
      aheadCount: aheadTxs.length,
      aheadTotalInflow,
      onTrackCount: onTrackTxs.length,
      onTrackTotalInflow
    };
  }, [data]);

  const handleAssignSchedule = (tx: Transaction) => {
    setScheduleSelectedTx(tx);
    setIsScheduleModalOpen(true);
  };

  const handleSaveSchedule = (updatedTx: Transaction) => {
    if (onUpdateTransaction) {
      onUpdateTransaction(updatedTx);
    }
  };

  // Filtered Worker Payments
  const filteredWorkerPayments = useMemo(() => {
    return workerPayments.filter(wp => {
      const matchesDisc = workerDisciplineFilter === 'All' || wp.discipline === workerDisciplineFilter;
      const matchesSearch = !workerSearchTerm || 
        wp.workerName.toLowerCase().includes(workerSearchTerm.toLowerCase()) ||
        wp.role.toLowerCase().includes(workerSearchTerm.toLowerCase()) ||
        (wp.clientName && wp.clientName.toLowerCase().includes(workerSearchTerm.toLowerCase())) ||
        (wp.notes && wp.notes.toLowerCase().includes(workerSearchTerm.toLowerCase()));
      return matchesDisc && matchesSearch;
    });
  }, [workerPayments, workerDisciplineFilter, workerSearchTerm]);

  const handleOpenDisciplineModal = (discipline: WorkerDiscipline) => {
    setEditingPayment(null);
    setSelectedDisciplineForNew(discipline);
    setIsModalOpen(true);
  };

  const handleExport = (extension: 'xlsx' | 'csv') => {
    const wb = XLSX.utils.book_new();
    if (viewMode === 'workers') {
      const wsWorkers = XLSX.utils.json_to_sheet(filteredWorkerPayments);
      XLSX.utils.book_append_sheet(wb, wsWorkers, "Worker Outcomes");
      XLSX.writeFile(wb, `AJ_Architects_Worker_Outcomes.${extension}`);
    } else {
      const ws = XLSX.utils.json_to_sheet(filteredData);
      XLSX.utils.book_append_sheet(wb, ws, "Client Records");
      XLSX.writeFile(wb, `AJ_Architects_Client_Records.${extension}`);
    }
  };

  const handleClientClick = (clientId: string) => {
    if (onNavigate) {
      onNavigate('clients', { clientId });
    }
  };

  const filterOptions = ['All', 'Completed', 'In Progress', 'Pending', 'On Hold', 'Cancelled'];

  const quickWorkerButtons = [
    { label: 'Structure Employee', discipline: 'Structure' as WorkerDiscipline, icon: Building, color: 'hover:border-blue-500 hover:bg-blue-50 text-blue-700 bg-blue-50/60 border-blue-200' },
    { label: 'Sanitary Employee', discipline: 'Sanitary' as WorkerDiscipline, icon: Droplets, color: 'hover:border-cyan-500 hover:bg-cyan-50 text-cyan-700 bg-cyan-50/60 border-cyan-200' },
    { label: 'Electrical Employee', discipline: 'Electrical' as WorkerDiscipline, icon: Zap, color: 'hover:border-amber-500 hover:bg-amber-50 text-amber-700 bg-amber-50/60 border-amber-200' },
    { label: 'Architecture Employee', discipline: 'Architecture' as WorkerDiscipline, icon: Compass, color: 'hover:border-violet-500 hover:bg-violet-50 text-violet-700 bg-violet-50/60 border-violet-200' },
    { label: 'Site Supervision', discipline: 'Site Supervision' as WorkerDiscipline, icon: HardHat, color: 'hover:border-emerald-500 hover:bg-emerald-50 text-emerald-700 bg-emerald-50/60 border-emerald-200' },
    { label: 'Mechanical Employee', discipline: 'Mechanical' as WorkerDiscipline, icon: Wrench, color: 'hover:border-pink-500 hover:bg-pink-50 text-pink-700 bg-pink-50/60 border-pink-200' },
  ];

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Top Banner: Client Income (Inflow) vs. Worker Outcome (Expense) Reconciliation */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
              <ArrowDownRight className="w-4 h-4" />
            </span>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Client Inflow (Income)</div>
              <div className="text-base font-black text-slate-800 font-mono">
                ${totalClientIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-rose-50 text-rose-600 border border-rose-200">
              <ArrowUpRight className="w-4 h-4" />
            </span>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Worker Outcome (Payroll)</div>
              <div className="text-base font-black text-rose-600 font-mono">
                -${totalWorkerOutcome.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
              <TrendingUp className="w-4 h-4" />
            </span>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Net Profit</div>
              <div className={`text-base font-black font-mono ${netIncome >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                ${netIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onAddWorkerPayment && (
            <button
              onClick={() => handleOpenDisciplineModal('Structure')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-2xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Pay Employed Worker</span>
            </button>
          )}
          {onNavigate && (
            <>
              <button
                onClick={() => onNavigate('income-statement')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded-lg shadow-2xs transition-all cursor-pointer"
              >
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>Income Statement (P&L)</span>
              </button>
              <button
                onClick={() => onNavigate('reports')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg shadow-2xs transition-all cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                <span>Daily / Monthly Statement (PDF)</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Employed Worker Payment Inputter Bar (Direct Integration to Client Payment System) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-4 rounded-xl text-white shadow-md border border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-rose-500/20 border border-rose-400/30 text-rose-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-tight text-white">
                  Employed Worker Payment Inputter (Outcome System)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Payroll Outflow
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Click any employee discipline below to immediately disburse and link worker outcomes to Client revenue:
              </p>
            </div>
          </div>
          <div className="text-xs text-slate-400 font-mono hidden lg:block text-right">
            Client Inflow = <b className="text-emerald-400">Income</b> | Worker Payroll = <b className="text-rose-400">Outcome</b>
          </div>
        </div>

        {/* 1-Click Quick Input Buttons for Each Discipline */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
          {quickWorkerButtons.map((btn) => {
            const Icon = btn.icon;
            return (
              <button
                key={btn.discipline}
                type="button"
                onClick={() => handleOpenDisciplineModal(btn.discipline)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 ${btn.color}`}
                title={`Log ${btn.label} payment outcome`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">+ {btn.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Ledger Header & Navigation Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            {viewMode === 'workers' 
              ? 'Employed Worker Disbursements (Outcome Ledger)' 
              : 'Client Payments & Fee Inflow Ledger'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {viewMode === 'workers' 
              ? 'Payroll disbursements for Structural, Sanitary, Electrical, and Architectural staff.'
              : 'Comprehensive view of all client fee inflows and contract stage settlements.'}
          </p>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
           {/* View Toggle */}
           <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
             <button
               onClick={() => setViewMode('financial')}
               className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                 viewMode === 'financial' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
               }`}
             >
               <ArrowDownRight className="w-3.5 h-3.5" /> Client Income ({data.length})
             </button>
             <button
               onClick={() => setViewMode('workers')}
               className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                 viewMode === 'workers' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
               }`}
             >
               <ArrowUpRight className="w-3.5 h-3.5" /> Worker Outcome ({workerPayments.length})
             </button>
             <button
               onClick={() => setViewMode('work')}
               className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                 viewMode === 'work' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
               }`}
             >
               <Briefcase className="w-3.5 h-3.5" /> Work Log
             </button>
           </div>

           <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

           <div className="flex items-center bg-white border border-slate-200 rounded shadow-sm">
            <button 
              onClick={() => handleExport('xlsx')}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 border-r border-slate-200 rounded-l transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              Excel
            </button>
            <button 
              onClick={() => handleExport('csv')}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-r transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              CSV
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      {viewMode === 'workers' ? (
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
              <Filter className="w-3 h-3" /> Filter Discipline:
            </span>
            <button
              onClick={() => setWorkerDisciplineFilter('All')}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                workerDisciplineFilter === 'All'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({workerPayments.length})
            </button>
            {WORKER_DISCIPLINES.map((disc) => {
              const meta = DISCIPLINE_METADATA[disc];
              const isSelected = workerDisciplineFilter === disc;
              const count = workerPayments.filter(wp => wp.discipline === disc).length;
              return (
                <button
                  key={disc}
                  onClick={() => setWorkerDisciplineFilter(disc)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? `${meta.bg} ${meta.border} ${meta.text} border ring-1 ring-blue-500 shadow-xs`
                      : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {disc} ({count})
                </button>
              );
            })}
          </div>

          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={workerSearchTerm}
              onChange={(e) => setWorkerSearchTerm(e.target.value)}
              placeholder="Search worker, role, client..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-3 mb-4">
          {/* Work Schedule Program & Lag Client Inflow Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {/* Card 1: Schedule Lag (Behind) */}
            <div 
              onClick={() => setScheduleProgramFilter(scheduleProgramFilter === 'Schedule Lag' ? 'All' : 'Schedule Lag')}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                scheduleProgramFilter === 'Schedule Lag' 
                  ? 'bg-amber-100/90 border-amber-400 ring-2 ring-amber-400/40 shadow-xs' 
                  : 'bg-amber-50/70 border-amber-200 hover:bg-amber-100/60'
              }`}
              title="Click to filter client inflows with schedule lag"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Schedule Lag</span>
                </span>
                <span className="text-[10px] font-mono font-bold bg-amber-200/80 text-amber-900 px-1.5 py-0.2 rounded">
                  {scheduleStats.laggingCount} Contracts
                </span>
              </div>
              <div className="font-mono font-black text-amber-950 text-base">
                ${scheduleStats.lagTotalInflow.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className="text-[10px] text-amber-800/80 mt-0.5">
                {scheduleStats.criticalLagCount > 0 ? (
                  <span className="text-rose-700 font-bold">Includes {scheduleStats.criticalLagCount} critical lag</span>
                ) : 'Timeline lagging program'}
              </div>
            </div>

            {/* Card 2: Under Work (Active Execution) */}
            <div 
              onClick={() => setScheduleProgramFilter(scheduleProgramFilter === 'Under Work' ? 'All' : 'Under Work')}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                scheduleProgramFilter === 'Under Work' 
                  ? 'bg-blue-100/90 border-blue-400 ring-2 ring-blue-400/40 shadow-xs' 
                  : 'bg-blue-50/60 border-blue-200 hover:bg-blue-100/50'
              }`}
              title="Click to filter client inflows currently under active execution"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                  <Hammer className="w-3.5 h-3.5 text-blue-600" />
                  <span>Under Work</span>
                </span>
                <span className="text-[10px] font-mono font-bold bg-blue-200/80 text-blue-900 px-1.5 py-0.2 rounded">
                  {scheduleStats.underWorkCount} Active
                </span>
              </div>
              <div className="font-mono font-black text-blue-950 text-base">
                ${scheduleStats.underWorkTotalInflow.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className="text-[10px] text-blue-700/80 mt-0.5">
                Actively underway
              </div>
            </div>

            {/* Card 3: Under Schedule (Ahead of Schedule) */}
            <div 
              onClick={() => setScheduleProgramFilter(scheduleProgramFilter === 'Under Schedule' ? 'All' : 'Under Schedule')}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                scheduleProgramFilter === 'Under Schedule' 
                  ? 'bg-emerald-100/90 border-emerald-400 ring-2 ring-emerald-400/40 shadow-xs' 
                  : 'bg-emerald-50/60 border-emerald-200 hover:bg-emerald-100/50'
              }`}
              title="Click to filter client inflows running ahead of schedule program"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                  <Zap className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Under Schedule</span>
                </span>
                <span className="text-[10px] font-mono font-bold bg-emerald-200/80 text-emerald-900 px-1.5 py-0.2 rounded">
                  {scheduleStats.aheadCount} Ahead
                </span>
              </div>
              <div className="font-mono font-black text-emerald-950 text-base">
                ${scheduleStats.aheadTotalInflow.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className="text-[10px] text-emerald-700/80 mt-0.5">
                Earlier than baseline
              </div>
            </div>

            {/* Card 4: On Schedule (Synchronized) */}
            <div 
              onClick={() => setScheduleProgramFilter(scheduleProgramFilter === 'On Schedule' ? 'All' : 'On Schedule')}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                scheduleProgramFilter === 'On Schedule' 
                  ? 'bg-teal-100/90 border-teal-400 ring-2 ring-teal-400/40 shadow-xs' 
                  : 'bg-teal-50/40 border-teal-200 hover:bg-teal-100/40'
              }`}
              title="Click to filter client inflows synchronized with program"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="flex items-center gap-1.5 text-xs font-bold text-teal-900">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                  <span>On Schedule</span>
                </span>
                <span className="text-[10px] font-mono font-bold bg-teal-200/80 text-teal-900 px-1.5 py-0.2 rounded">
                  {scheduleStats.onTrackCount} Sync
                </span>
              </div>
              <div className="font-mono font-black text-teal-950 text-base">
                ${scheduleStats.onTrackTotalInflow.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className="text-[10px] text-teal-700/80 mt-0.5">
                Within planned targets
              </div>
            </div>
          </div>

          {/* Schedule Program Shading Toolbar & Filters */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mr-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> Program Filter:
              </span>
              {[
                { id: 'All', label: 'All Inflows', count: data.length },
                { id: 'Schedule Lag', label: 'Schedule Lag', count: scheduleStats.laggingCount, badge: 'text-amber-800' },
                { id: 'Critical Lag', label: 'Critical Lag', count: scheduleStats.criticalLagCount, badge: 'text-rose-800' },
                { id: 'Under Work', label: 'Under Work', count: scheduleStats.underWorkCount, badge: 'text-blue-800' },
                { id: 'Under Schedule', label: 'Under Schedule', count: scheduleStats.aheadCount, badge: 'text-emerald-800' },
                { id: 'On Schedule', label: 'On Schedule', count: scheduleStats.onTrackCount, badge: 'text-teal-800' },
              ].map((prog) => {
                const isActive = scheduleProgramFilter === prog.id;
                return (
                  <button
                    key={prog.id}
                    onClick={() => setScheduleProgramFilter(prog.id)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
                      isActive 
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs' 
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {prog.label} ({prog.count})
                  </button>
                );
              })}
            </div>

            {/* Shading Toggle & Quick Legend */}
            <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
              <button
                type="button"
                onClick={() => setEnableScheduleShading(!enableScheduleShading)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer shadow-2xs ${
                  enableScheduleShading
                    ? 'bg-blue-600 text-white border-blue-700 hover:bg-blue-700'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                }`}
                title="Toggle visual schedule program color shading on client inflow rows"
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Program Shade: {enableScheduleShading ? 'ON (Active)' : 'OFF'}</span>
              </button>

              {/* Shade Color Key Pills */}
              <div className="hidden xl:flex items-center gap-1.5 text-[10px] font-bold text-slate-500 pl-2 border-l border-slate-200">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Lag
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Critical
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Under Work
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Under Sched
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Table Content */}
      {viewMode === 'workers' ? (
        <div className="bg-white border border-slate-200 shadow-xs rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-rose-600" />
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Employed Staff Compensation Ledger
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="text-slate-500">
                Filtered Total: <b className="text-rose-600 font-mono font-bold">
                  -${filteredWorkerPayments.reduce((s, w) => s + w.amount, 0).toLocaleString()}
                </b>
              </span>
              <button
                onClick={() => handleOpenDisciplineModal('Structure')}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded cursor-pointer shadow-2xs"
              >
                <Plus className="w-3 h-3" /> Add Outcome
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3">Worker Name</th>
                  <th className="p-3">Discipline</th>
                  <th className="p-3">Role / Specialty</th>
                  <th className="p-3">Linked Client Project (Inflow Source)</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Method</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Amount (Outcome)</th>
                  <th className="p-3 text-right w-16">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredWorkerPayments.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400 italic">
                      No worker disbursements matching current filters. Click any discipline button above to log a payment outcome.
                    </td>
                  </tr>
                ) : (
                  filteredWorkerPayments.map((wp) => {
                    const meta = DISCIPLINE_METADATA[wp.discipline] || DISCIPLINE_METADATA['Other'];
                    return (
                      <tr key={wp.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 font-bold text-slate-800 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.color }}></span>
                          {wp.workerName}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${meta.bg} ${meta.border} ${meta.text}`}>
                            {wp.discipline}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600">{wp.role}</td>
                        <td className="p-3 text-slate-700">
                          {wp.clientName ? (
                            <span className="truncate max-w-[200px] inline-flex items-center gap-1 font-medium bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                              <Building className="w-3 h-3 text-blue-500 shrink-0" />
                              <span className="truncate">{wp.clientName}</span>
                              {wp.projectItem && <span className="text-slate-400 text-[10px]">({wp.projectItem})</span>}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Firm Overhead</span>
                          )}
                        </td>
                        <td className="p-3 text-slate-500 font-mono">{wp.date}</td>
                        <td className="p-3 text-slate-600">{wp.paymentMethod}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            wp.status === 'Paid' 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : (wp.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700')
                          }`}>
                            {wp.status}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-sm text-rose-600">
                          -${wp.amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setEditingPayment(wp);
                                setSelectedDisciplineForNew(wp.discipline);
                                setIsModalOpen(true);
                              }}
                              className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                              title="Edit Worker Payment"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {onDeleteWorkerPayment && (
                              <button
                                onClick={() => onDeleteWorkerPayment(wp.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                                title="Delete Payment"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-300 shadow-sm rounded">
          <DataTable 
            data={filteredData} 
            viewMode={viewMode}
            onClientClick={handleClientClick}
            onAssignSchedule={handleAssignSchedule}
            enableScheduleShading={enableScheduleShading}
            scheduleProgramFilter={scheduleProgramFilter}
          />
        </div>
      )}

      {/* Worker Payment Modal with pre-configured Discipline */}
      {onAddWorkerPayment && (
        <WorkerPaymentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={(paymentData, id) => onAddWorkerPayment(paymentData, id)}
          existingPayment={editingPayment}
          transactions={data}
          initialDiscipline={selectedDisciplineForNew}
        />
      )}

      {/* Assign Work Schedule Program & Lag Modal */}
      <ScheduleProgramModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        transaction={scheduleSelectedTx}
        onSave={handleSaveSchedule}
      />
    </div>
  );
};
