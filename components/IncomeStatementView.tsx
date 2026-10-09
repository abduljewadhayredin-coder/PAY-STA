import React, { useState, useMemo } from 'react';
import { Transaction, WorkerPayment, WorkerDiscipline, ViewState, Theme } from '../types';
import { WORKER_DISCIPLINES, DISCIPLINE_METADATA } from '../constants';
import { WorkerPaymentModal } from './WorkerPaymentModal';
import { 
  TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight, 
  Plus, Filter, FileSpreadsheet, FileText, Search, User, Calendar, 
  Briefcase, CheckCircle2, Clock, AlertCircle, Trash2, Edit2, ChevronRight,
  PieChart as PieChartIcon, BarChart2
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, LineChart, Line 
} from 'recharts';
import * as XLSX from 'xlsx';

interface IncomeStatementViewProps {
  transactions: Transaction[];
  workerPayments: WorkerPayment[];
  onAddWorkerPayment: (payment: Omit<WorkerPayment, 'id'>, id?: string) => void;
  onDeleteWorkerPayment: (id: string) => void;
  theme?: Theme;
  onNavigate?: (view: ViewState, params?: any) => void;
}

export const IncomeStatementView: React.FC<IncomeStatementViewProps> = ({
  transactions,
  workerPayments,
  onAddWorkerPayment,
  onDeleteWorkerPayment,
  theme = 'professional',
  onNavigate
}) => {
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('All');
  const [activeLedgerTab, setActiveLedgerTab] = useState<'all' | 'income' | 'outcome'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<WorkerPayment | null>(null);

  // Financial Calculations
  const clientRevenue = useMemo(() => {
    return transactions.reduce((sum, tx) => sum + (tx.dilAmount || tx.amount || 0), 0);
  }, [transactions]);

  const totalContractValue = useMemo(() => {
    return transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
  }, [transactions]);

  const totalWorkerOutcome = useMemo(() => {
    return workerPayments.reduce((sum, wp) => sum + wp.amount, 0);
  }, [workerPayments]);

  const paidWorkerOutcome = useMemo(() => {
    return workerPayments
      .filter(wp => wp.status === 'Paid')
      .reduce((sum, wp) => sum + wp.amount, 0);
  }, [workerPayments]);

  const pendingWorkerOutcome = useMemo(() => {
    return workerPayments
      .filter(wp => wp.status !== 'Paid')
      .reduce((sum, wp) => sum + wp.amount, 0);
  }, [workerPayments]);

  const netIncome = clientRevenue - totalWorkerOutcome;
  const profitMargin = clientRevenue > 0 ? ((netIncome / clientRevenue) * 100).toFixed(1) : '0';

  // Discipline Outcome Breakdown
  const disciplineBreakdown = useMemo(() => {
    const stats: Record<string, { total: number; count: number }> = {};
    WORKER_DISCIPLINES.forEach(d => {
      stats[d] = { total: 0, count: 0 };
    });

    workerPayments.forEach(wp => {
      const disc = wp.discipline || 'Other';
      if (!stats[disc]) stats[disc] = { total: 0, count: 0 };
      stats[disc].total += wp.amount;
      stats[disc].count += 1;
    });

    return Object.entries(stats).map(([name, data]) => ({
      name,
      value: data.total,
      count: data.count,
      pct: totalWorkerOutcome > 0 ? ((data.total / totalWorkerOutcome) * 100).toFixed(1) : '0'
    })).sort((a, b) => b.value - a.value);
  }, [workerPayments, totalWorkerOutcome]);

  // Monthly Comparison: Inflow vs. Outcome
  const monthlyComparisonData = useMemo(() => {
    const months: Record<string, { month: string; income: number; outcome: number; net: number }> = {};

    transactions.forEach(t => {
      const month = (t.date || '').substring(0, 7);
      if (month) {
        if (!months[month]) months[month] = { month, income: 0, outcome: 0, net: 0 };
        months[month].income += (t.dilAmount || t.amount || 0);
      }
    });

    workerPayments.forEach(w => {
      const month = (w.date || '').substring(0, 7);
      if (month) {
        if (!months[month]) months[month] = { month, income: 0, outcome: 0, net: 0 };
        months[month].outcome += w.amount;
      }
    });

    return Object.values(months)
      .map(m => ({
        ...m,
        net: m.income - m.outcome
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6); // Last 6 recorded months
  }, [transactions, workerPayments]);

  // Filtered Worker Payments
  const filteredWorkerPayments = useMemo(() => {
    return workerPayments.filter(wp => {
      const matchesDiscipline = selectedDiscipline === 'All' || wp.discipline === selectedDiscipline;
      const matchesQuery = !searchQuery || 
        wp.workerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wp.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (wp.clientName && wp.clientName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (wp.notes && wp.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesDiscipline && matchesQuery;
    });
  }, [workerPayments, selectedDiscipline, searchQuery]);

  // Combined P&L Ledger Items
  const combinedLedger = useMemo(() => {
    const items: Array<{
      id: string;
      date: string;
      type: 'INCOME' | 'OUTCOME';
      entity: string;
      category: string;
      description: string;
      amount: number;
      status: string;
    }> = [];

    if (activeLedgerTab === 'all' || activeLedgerTab === 'income') {
      transactions.forEach(tx => {
        items.push({
          id: tx.id,
          date: tx.date,
          type: 'INCOME',
          entity: tx.clientName,
          category: tx.workType || 'Client Project',
          description: tx.item,
          amount: tx.dilAmount || tx.amount,
          status: tx.paymentStatus
        });
      });
    }

    if (activeLedgerTab === 'all' || activeLedgerTab === 'outcome') {
      filteredWorkerPayments.forEach(wp => {
        items.push({
          id: wp.id,
          date: wp.date,
          type: 'OUTCOME',
          entity: wp.workerName,
          category: wp.discipline,
          description: `${wp.role}${wp.clientName ? ` (${wp.clientName})` : ''}`,
          amount: wp.amount,
          status: wp.status
        });
      });
    }

    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filteredWorkerPayments, activeLedgerTab]);

  const handleExportStatement = (format: 'xlsx' | 'csv') => {
    const pnlSummary = [
      { Category: 'INCOME', Subcategory: 'Gross Client Revenue (Received)', Amount: clientRevenue },
      { Category: 'INCOME', Subcategory: 'Total Contract Value', Amount: totalContractValue },
      { Category: 'OUTCOME', Subcategory: 'Total Employed Worker Disbursements', Amount: totalWorkerOutcome },
      { Category: 'OUTCOME', Subcategory: 'Paid Worker Compensation', Amount: paidWorkerOutcome },
      { Category: 'OUTCOME', Subcategory: 'Pending / Scheduled Worker Compensation', Amount: pendingWorkerOutcome },
      { Category: 'NET', Subcategory: 'Net Operating Income', Amount: netIncome },
      { Category: 'NET', Subcategory: 'Operating Profit Margin %', Amount: `${profitMargin}%` }
    ];

    const workerDisciplineSummary = disciplineBreakdown.map(d => ({
      Discipline: d.name,
      TotalPayouts: d.value,
      WorkerCount: d.count,
      PercentageOfPayroll: `${d.pct}%`
    }));

    const wb = XLSX.utils.book_new();
    const wsSummary = XLSX.utils.json_to_sheet(pnlSummary);
    const wsDisciplines = XLSX.utils.json_to_sheet(workerDisciplineSummary);
    const wsLedger = XLSX.utils.json_to_sheet(combinedLedger);

    XLSX.utils.book_append_sheet(wb, wsSummary, "Income Statement Summary");
    XLSX.utils.book_append_sheet(wb, wsDisciplines, "Discipline Breakdown");
    XLSX.utils.book_append_sheet(wb, wsLedger, "Detailed Cash Flows");

    XLSX.writeFile(wb, `AJ_Architects_Income_Statement_${new Date().toISOString().split('T')[0]}.${format}`);
  };

  const handleOpenEdit = (wp: WorkerPayment) => {
    setEditingPayment(wp);
    setIsModalOpen(true);
  };

  const handleOpenNew = () => {
    setEditingPayment(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">
              Income Statement & Worker Payroll
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              P&L Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time reconciliation: Client Collections (Income) versus Employed Engineering Disbursements (Outcome).
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {onNavigate && (
            <button
              onClick={() => onNavigate('reports')}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              <span>Daily / Monthly Statement (PDF)</span>
            </button>
          )}
          <button
            onClick={() => handleExportStatement('xlsx')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Excel P&L</span>
          </button>
          <button
            onClick={() => handleExportStatement('csv')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>CSV</span>
          </button>
          <button
            onClick={handleOpenNew}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Log Worker Payment</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Income (Inflow) Card */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Client Income (Inflow)</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-800 font-mono">
              ${clientRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            <span>Contract Pipeline:</span>
            <span className="font-semibold text-slate-700">${totalContractValue.toLocaleString()}</span>
          </div>
        </div>

        {/* Worker Outcome (Expenses) Card */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Worker Outcome (Expense)</span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-600 font-mono">
              ${totalWorkerOutcome.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            <span>Paid: <b className="text-slate-700">${paidWorkerOutcome.toLocaleString()}</b></span>
            <span>Pending: <b className="text-amber-600">${pendingWorkerOutcome.toLocaleString()}</b></span>
          </div>
        </div>

        {/* Net Operating Income Card */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Net Operating Income</span>
            <div className={`p-1.5 rounded-lg border ${netIncome >= 0 ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-black font-mono ${netIncome >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
              ${netIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            <span>Bottom Line:</span>
            <span className={`font-bold ${netIncome >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {netIncome >= 0 ? '✓ Profitable Surplus' : '⚠ Operating Deficit'}
            </span>
          </div>
        </div>

        {/* Profit Margin Card */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Operating Profit Margin</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-indigo-600 font-mono">
              {profitMargin}%
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            <span>Payroll Burden:</span>
            <span className="font-semibold text-slate-700">
              {clientRevenue > 0 ? ((totalWorkerOutcome / clientRevenue) * 100).toFixed(1) : 0}% of Income
            </span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid: Monthly Inflow vs Outcome & Discipline Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Cash Flow Inflow vs Outcome Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">Cash Flow: Client Income vs. Worker Outcome</h3>
              <p className="text-xs text-slate-500">Monthly comparison tracking collections against engineering disbursements</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-blue-600">
                <span className="w-3 h-3 rounded-sm bg-blue-500"></span> Income
              </span>
              <span className="flex items-center gap-1.5 text-rose-600">
                <span className="w-3 h-3 rounded-sm bg-rose-500"></span> Outcome
              </span>
              <span className="flex items-center gap-1.5 text-emerald-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Net Profit
              </span>
            </div>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyComparisonData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(val) => `$${val/1000}k`} />
                <Tooltip 
                  formatter={(value: any, name?: any) => [`$${Number(value).toLocaleString()}`, String(name || '')]}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="income" name="Client Income" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={26} />
                <Bar dataKey="outcome" name="Worker Outcome" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={26} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Worker Outcome by Engineering Discipline */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-800">Worker Outcome by Discipline</h3>
            <p className="text-xs text-slate-500">Structure, Sanitary, Electrical, & Architecture spend</p>
          </div>

          <div className="h-[180px] w-full mb-3">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={disciplineBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {disciplineBreakdown.map((entry) => {
                    const meta = DISCIPLINE_METADATA[entry.name as WorkerDiscipline];
                    return <Cell key={entry.name} fill={meta?.color || '#94a3b8'} />;
                  })}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Total Payout']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[140px] excel-scrollbar pr-1">
            {disciplineBreakdown.map((item) => {
              const meta = DISCIPLINE_METADATA[item.name as WorkerDiscipline];
              return (
                <div key={item.name} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: meta?.color || '#94a3b8' }}></span>
                    <span className="font-semibold text-slate-700">{item.name}</span>
                  </div>
                  <div className="text-right font-mono">
                    <span className="font-bold text-slate-800">${item.value.toLocaleString()}</span>
                    <span className="text-[10px] text-slate-400 ml-1.5">({item.pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Engineering Discipline Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter Discipline:
          </span>
          <button
            onClick={() => setSelectedDiscipline('All')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
              selectedDiscipline === 'All'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Disciplines
          </button>
          {WORKER_DISCIPLINES.map(disc => {
            const isSelected = selectedDiscipline === disc;
            const meta = DISCIPLINE_METADATA[disc];
            return (
              <button
                key={disc}
                onClick={() => setSelectedDiscipline(disc)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? `${meta.bg} ${meta.border} ${meta.text} border ring-2 ring-blue-500 shadow-xs`
                    : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {disc}
              </button>
            );
          })}
        </div>

        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search worker or role..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Comprehensive Ledger & Table View */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Ledger Tabs */}
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveLedgerTab('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                activeLedgerTab === 'all'
                  ? 'bg-white text-slate-800 shadow-xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Unified P&L Flow ({combinedLedger.length})
            </button>
            <button
              onClick={() => setActiveLedgerTab('income')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeLedgerTab === 'income'
                  ? 'bg-white text-emerald-700 shadow-xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" />
              Client Income Inflow
            </button>
            <button
              onClick={() => setActiveLedgerTab('outcome')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeLedgerTab === 'outcome'
                  ? 'bg-white text-rose-700 shadow-xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
              Worker Outcome Disbursements ({filteredWorkerPayments.length})
            </button>
          </div>

          <div className="text-xs text-slate-500">
            Showing {combinedLedger.length} transactional line items
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3">Flow</th>
                <th className="p-3">Date</th>
                <th className="p-3">Party / Worker</th>
                <th className="p-3">Discipline / Project</th>
                <th className="p-3">Description</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Amount</th>
                <th className="p-3 text-right w-16">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {combinedLedger.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                    No transactions matching current filters.
                  </td>
                </tr>
              ) : (
                combinedLedger.map((row) => {
                  const isIncome = row.type === 'INCOME';
                  return (
                    <tr 
                      key={`${row.type}-${row.id}`} 
                      className={`hover:bg-slate-50/80 transition-colors ${isIncome ? 'bg-emerald-50/20' : 'bg-rose-50/20'}`}
                    >
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          isIncome 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}>
                          {isIncome ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          {row.type}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600 font-mono">{row.date}</td>
                      <td className="p-3 font-semibold text-slate-800">
                        {row.entity}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {row.category}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600 max-w-xs truncate" title={row.description}>
                        {row.description}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          row.status === 'Paid' || row.status === 'Settled' || row.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-700'
                            : (row.status === 'Pending' || row.status === 'Partial' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600')
                        }`}>
                          {row.status}
                        </span>
                      </td>
                      <td className={`p-3 text-right font-mono font-bold text-sm ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isIncome ? '+' : '-'}${row.amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-right">
                        {!isIncome ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                const orig = workerPayments.find(wp => wp.id === row.id);
                                if (orig) handleOpenEdit(orig);
                              }}
                              className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                              title="Edit Worker Payment"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteWorkerPayment(row.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                              title="Delete Payment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => onNavigate && onNavigate('payments')}
                            className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                            title="View in Payments Ledger"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Inputting / Editing Worker Payments */}
      <WorkerPaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={(data, id) => onAddWorkerPayment(data, id)}
        existingPayment={editingPayment}
        transactions={transactions}
      />
    </div>
  );
};
