import React, { useState, useMemo } from 'react';
import { Transaction, WorkerPayment, Client, ViewState, Theme } from '../types';
import { 
  Printer, Download, Calendar, Filter, FileText, ChevronLeft, 
  ChevronRight, ArrowDownRight, ArrowUpRight, DollarSign, 
  TrendingUp, Building, User, Clock, CheckCircle, ShieldCheck, 
  Layers, HardHat, FileSpreadsheet, Eye, Sparkles, Scale, Hash
} from 'lucide-react';
import { STATUS_STYLES, DISCIPLINE_METADATA } from '../constants';
import * as XLSX from 'xlsx';

interface ReportStatementViewProps {
  transactions: Transaction[];
  workerPayments: WorkerPayment[];
  clients: Client[];
  initialParams?: {
    date?: string;
    month?: string;
    periodType?: 'daily' | 'monthly' | 'custom';
    clientId?: string;
  };
  theme?: Theme;
  onNavigate?: (view: ViewState, params?: any) => void;
}

export const ReportStatementView: React.FC<ReportStatementViewProps> = ({
  transactions,
  workerPayments,
  clients,
  initialParams,
  theme = 'professional',
  onNavigate
}) => {
  // Report Period States
  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = todayStr.substring(0, 7); // YYYY-MM

  const [periodType, setPeriodType] = useState<'daily' | 'monthly' | 'custom'>(
    initialParams?.periodType || (initialParams?.month ? 'monthly' : 'monthly')
  );
  
  const [selectedDate, setSelectedDate] = useState<string>(initialParams?.date || todayStr);
  const [selectedMonth, setSelectedMonth] = useState<string>(initialParams?.month || currentMonthStr);
  const [startDate, setStartDate] = useState<string>(`${currentMonthStr}-01`);
  const [endDate, setEndDate] = useState<string>(todayStr);

  const [selectedClientId, setSelectedClientId] = useState<string>(initialParams?.clientId || 'All');
  const [viewMode, setViewMode] = useState<'document' | 'interactive'>('document');

  // Continuity Reference State
  const statementSeq = useMemo(() => {
    try {
      const saved = localStorage.getItem('aj_statement_continuity_seq');
      if (saved) return parseInt(saved, 10) || 101;
    } catch (e) {}
    return 101;
  }, []);

  const statementRef = useMemo(() => {
    const year = new Date().getFullYear();
    if (periodType === 'daily') {
      return `STM-DLY-${selectedDate.replace(/-/g, '')}-${String(statementSeq).padStart(3, '0')}`;
    } else if (periodType === 'monthly') {
      return `STM-MTH-${selectedMonth.replace(/-/g, '')}-${String(statementSeq).padStart(3, '0')}`;
    }
    return `STM-PER-${startDate.replace(/-/g, '')}-${String(statementSeq).padStart(3, '0')}`;
  }, [periodType, selectedDate, selectedMonth, startDate, statementSeq]);

  const continuityCode = useMemo(() => {
    return `AJ-CRN-${new Date().getFullYear()}-${String(statementSeq).padStart(4, '0')}`;
  }, [statementSeq]);

  // Date Range Filtering Logic
  const { dateFilterStart, dateFilterEnd, periodDisplayTitle } = useMemo(() => {
    if (periodType === 'daily') {
      return {
        dateFilterStart: selectedDate,
        dateFilterEnd: selectedDate,
        periodDisplayTitle: `Daily Operational Statement — ${selectedDate}`
      };
    } else if (periodType === 'monthly') {
      const [y, m] = selectedMonth.split('-').map(Number);
      const lastDay = new Date(y, m, 0).getDate();
      const start = `${selectedMonth}-01`;
      const end = `${selectedMonth}-${String(lastDay).padStart(2, '0')}`;
      const monthName = new Date(y, m - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
      return {
        dateFilterStart: start,
        dateFilterEnd: end,
        periodDisplayTitle: `Monthly Financial Statement & P&L — ${monthName}`
      };
    } else {
      return {
        dateFilterStart: startDate,
        dateFilterEnd: endDate,
        periodDisplayTitle: `Custom Period Statement — ${startDate} to ${endDate}`
      };
    }
  }, [periodType, selectedDate, selectedMonth, startDate, endDate]);

  // Filtered Transactions (Inflow)
  const periodTransactions = useMemo(() => {
    return transactions.filter(t => {
      const inDateRange = t.date >= dateFilterStart && t.date <= dateFilterEnd;
      const matchesClient = selectedClientId === 'All' || t.clientId === selectedClientId;
      return inDateRange && matchesClient;
    });
  }, [transactions, dateFilterStart, dateFilterEnd, selectedClientId]);

  // Filtered Worker Payments (Outflow)
  const periodWorkerPayments = useMemo(() => {
    return workerPayments.filter(wp => {
      const inDateRange = wp.date >= dateFilterStart && wp.date <= dateFilterEnd;
      const matchesClient = selectedClientId === 'All' || 
        (wp.clientName && clients.find(c => c.id === selectedClientId)?.company.toLowerCase().includes(wp.clientName.toLowerCase()));
      return inDateRange && matchesClient;
    });
  }, [workerPayments, dateFilterStart, dateFilterEnd, selectedClientId, clients]);

  // Financial Metrics Reconciliation
  const metrics = useMemo(() => {
    // Inflow
    const clientCollected = periodTransactions.reduce((sum, t) => sum + (t.dilAmount || 0), 0);
    const contractValue = periodTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const balancePending = contractValue - clientCollected;

    // Outflow
    const totalDisbursements = periodWorkerPayments.reduce((sum, wp) => sum + wp.amount, 0);
    const paidDisbursements = periodWorkerPayments.filter(wp => wp.status === 'Paid').reduce((sum, wp) => sum + wp.amount, 0);
    const pendingDisbursements = periodWorkerPayments.filter(wp => wp.status !== 'Paid').reduce((sum, wp) => sum + wp.amount, 0);

    // Net Margin
    const netCashFlow = clientCollected - totalDisbursements;
    const netContractMargin = contractValue - totalDisbursements;
    const profitMarginPercent = clientCollected > 0 
      ? Number(((netCashFlow / clientCollected) * 100).toFixed(1)) 
      : 0;

    // Project Counts
    const completedProjects = periodTransactions.filter(t => t.status === 'Completed').length;
    const inProgressProjects = periodTransactions.filter(t => t.status === 'In Progress').length;
    const pendingProjects = periodTransactions.filter(t => t.status === 'Pending').length;

    return {
      clientCollected,
      contractValue,
      balancePending,
      totalDisbursements,
      paidDisbursements,
      pendingDisbursements,
      netCashFlow,
      netContractMargin,
      profitMarginPercent,
      completedProjects,
      inProgressProjects,
      pendingProjects,
      transactionCount: periodTransactions.length,
      disbursementCount: periodWorkerPayments.length
    };
  }, [periodTransactions, periodWorkerPayments]);

  // Discipline Breakdown
  const disciplineBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    periodWorkerPayments.forEach(wp => {
      const disc = wp.discipline || 'Other';
      map[disc] = (map[disc] || 0) + wp.amount;
    });

    return Object.entries(map).map(([discipline, amount]) => ({
      discipline,
      amount,
      pct: metrics.totalDisbursements > 0 ? Number(((amount / metrics.totalDisbursements) * 100).toFixed(1)) : 0
    })).sort((a, b) => b.amount - a.amount);
  }, [periodWorkerPayments, metrics.totalDisbursements]);

  // Combined Chronological Ledger
  const chronologicalLedger = useMemo(() => {
    const entries: Array<{
      id: string;
      date: string;
      time?: string;
      type: 'INFLOW' | 'OUTFLOW';
      entity: string;
      category: string;
      description: string;
      amount: number;
      status: string;
      ref: string;
    }> = [];

    periodTransactions.forEach(t => {
      entries.push({
        id: t.id,
        date: t.date,
        time: t.startTime ? `${t.startTime} - ${t.endTime || ''}` : undefined,
        type: 'INFLOW',
        entity: t.clientName,
        category: t.workType,
        description: t.item,
        amount: t.dilAmount || t.amount,
        status: t.paymentStatus,
        ref: t.invoiceNumber || t.id
      });
    });

    periodWorkerPayments.forEach(wp => {
      entries.push({
        id: wp.id,
        date: wp.date,
        type: 'OUTFLOW',
        entity: wp.workerName,
        category: wp.discipline,
        description: `${wp.role} • ${wp.notes || wp.projectItem || 'Consulting Expense'}`,
        amount: wp.amount,
        status: wp.status,
        ref: wp.id
      });
    });

    return entries.sort((a, b) => b.date.localeCompare(a.date));
  }, [periodTransactions, periodWorkerPayments]);

  // Month & Day Navigators
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m - 2, 1);
    setSelectedMonth(d.toISOString().substring(0, 7));
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m, 1);
    setSelectedMonth(d.toISOString().substring(0, 7));
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const handleExportSpreadsheet = () => {
    const wb = XLSX.utils.book_new();

    const summarySheetData = [
      ["AJ ARCHITECTS & ENGINEERS CONSULTING PRACTICE"],
      ["FINANCIAL STATEMENT & RECONCILIATION REPORT"],
      ["Statement Reference:", statementRef],
      ["Continuity Code:", continuityCode],
      ["Reporting Period:", periodDisplayTitle],
      ["Date Range:", `${dateFilterStart} to ${dateFilterEnd}`],
      [],
      ["FINANCIAL EXECUTIVE RECONCILIATION"],
      ["Total Collected Inflow (Client Revenue):", metrics.clientCollected],
      ["Total Agreed Contract Scope Value:", metrics.contractValue],
      ["Outstanding Client Receivables:", metrics.balancePending],
      ["Total Project Outflow (Worker Payroll):", metrics.totalDisbursements],
      ["Paid Outflows:", metrics.paidDisbursements],
      ["Pending Outflows:", metrics.pendingDisbursements],
      ["Net Operating Cash Return:", metrics.netCashFlow],
      ["Operating Profit Margin (%):", `${metrics.profitMarginPercent}%`],
    ];

    const wsSummary = XLSX.utils.aoa_to_sheet(summarySheetData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Executive Summary");

    const ledgerSheetData = chronologicalLedger.map(item => ({
      "Date": item.date,
      "Schedule Time": item.time || "N/A",
      "Type": item.type,
      "Account / Entity": item.entity,
      "Category / Discipline": item.category,
      "Description": item.description,
      "Amount ($)": item.amount,
      "Status": item.status,
      "Reference ID": item.ref
    }));

    const wsLedger = XLSX.utils.json_to_sheet(ledgerSheetData);
    XLSX.utils.book_append_sheet(wb, wsLedger, "Detailed Ledger");

    XLSX.writeFile(wb, `AJ_Architects_${statementRef}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Controls Toolbar (Hidden on Print) */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-4 md:p-5 no-print space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">Reports & Statements (PDF / Print)</h2>
                <p className="text-xs text-slate-500">
                  Generate daily operational statements, monthly P&L balance sheets, and custom audit reports ready for PDF print.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'document' ? 'interactive' : 'document')}
              className="px-3.5 py-2 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-colors text-xs flex items-center gap-1.5 shadow-2xs"
            >
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              {viewMode === 'document' ? 'Interactive View' : 'Document PDF View'}
            </button>

            <button
              onClick={handleExportSpreadsheet}
              className="px-3.5 py-2 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-colors text-xs flex items-center gap-1.5 shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Export Excel
            </button>

            <button
              onClick={handlePrintPDF}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors text-xs flex items-center gap-2 shadow-sm"
            >
              <Printer className="w-4 h-4" /> Print / Save PDF
            </button>
          </div>
        </div>

        {/* Filter & Period Selector Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
          {/* 1. Period Frequency Mode */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Statement Frequency
            </label>
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setPeriodType('daily')}
                className={`flex-1 py-1.5 font-bold rounded-md transition-all ${
                  periodType === 'daily' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Daily Report
              </button>
              <button
                onClick={() => setPeriodType('monthly')}
                className={`flex-1 py-1.5 font-bold rounded-md transition-all ${
                  periodType === 'monthly' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Monthly Statement
              </button>
              <button
                onClick={() => setPeriodType('custom')}
                className={`flex-1 py-1.5 font-bold rounded-md transition-all ${
                  periodType === 'custom' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Custom Range
              </button>
            </div>
          </div>

          {/* 2. Specific Period Picker */}
          <div>
            {periodType === 'daily' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Select Day
                </label>
                <div className="flex items-center gap-1">
                  <button onClick={handlePrevDay} className="p-2 border border-slate-300 rounded hover:bg-slate-50">
                    <ChevronLeft className="w-3.5 h-3.5 text-slate-600" />
                  </button>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded font-mono font-bold text-slate-800 text-xs"
                  />
                  <button onClick={handleNextDay} className="p-2 border border-slate-300 rounded hover:bg-slate-50">
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  </button>
                  <button onClick={() => setSelectedDate(todayStr)} className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 rounded font-bold text-slate-700 text-[10px]">
                    Today
                  </button>
                </div>
              </div>
            )}

            {periodType === 'monthly' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Select Month
                </label>
                <div className="flex items-center gap-1">
                  <button onClick={handlePrevMonth} className="p-2 border border-slate-300 rounded hover:bg-slate-50">
                    <ChevronLeft className="w-3.5 h-3.5 text-slate-600" />
                  </button>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded font-mono font-bold text-slate-800 text-xs"
                  />
                  <button onClick={handleNextMonth} className="p-2 border border-slate-300 rounded hover:bg-slate-50">
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  </button>
                  <button onClick={() => setSelectedMonth(currentMonthStr)} className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 rounded font-bold text-slate-700 text-[10px]">
                    Current
                  </button>
                </div>
              </div>
            )}

            {periodType === 'custom' && (
              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">From Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">To Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded font-mono text-[11px]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 3. Client Account Scope */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Client Account Scope
            </label>
            <select
              value={selectedClientId}
              onChange={e => setSelectedClientId(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800 text-xs"
            >
              <option value="All">All Client Accounts</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.company} ({c.name})</option>
              ))}
            </select>
          </div>

          {/* 4. Audit Metadata Quick Indicator */}
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-bold uppercase">Statement Ref:</span>
              <span className="font-mono font-bold text-indigo-700">{statementRef}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-bold uppercase">Continuity:</span>
              <span className="font-mono font-bold text-slate-700">{continuityCode}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================== */}
      {/* EXECUTIVE STATEMENT & REPORT DOCUMENT (SCREEN & PRINT AREA) */}
      {/* ========================================================== */}
      <div className="bg-white shadow-xl mx-auto max-w-4xl p-8 sm:p-12 md:p-16 min-h-[1100px] border border-slate-200 print-area text-slate-800 rounded-sm">
        
        {/* Document Letterhead */}
        <div className="flex justify-between items-start pb-6 border-b-2 border-slate-900 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-3.5 h-3.5 bg-indigo-600 rounded-sm"></span>
              <span className="text-xs font-black tracking-widest uppercase text-indigo-700 font-mono">
                AJ ARCHITECTS & ENGINEERS CONSULTING
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 uppercase">
              {periodType === 'daily' ? 'DAILY OPERATIONAL & CASH STATEMENT' : periodType === 'monthly' ? 'MONTHLY FINANCIAL STATEMENT & P&L REPORT' : 'PERIODIC FINANCIAL AUDIT STATEMENT'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Official Consulting Reconciliation • Licensed Engineering Practice
            </p>
          </div>

          <div className="text-right space-y-1 text-xs">
            <div className="font-mono font-bold text-slate-900 text-sm">{statementRef}</div>
            <div className="text-slate-500 font-mono">Continuity Code: <span className="text-indigo-700 font-bold">{continuityCode}</span></div>
            <div className="text-slate-400 text-[10px]">Audit Sequence #{String(statementSeq).padStart(4, '0')}</div>
            <div className="text-slate-500 text-[10px] pt-1">Date Generated: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        </div>

        {/* Statement Scope & Date Interval Card */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mb-8 pb-6 border-b border-slate-100 text-xs">
          <div>
            <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Reporting Period</span>
            <p className="font-bold text-slate-900 text-sm">{periodDisplayTitle}</p>
            <p className="text-slate-500 font-mono mt-0.5">{dateFilterStart} to {dateFilterEnd}</p>
          </div>

          <div>
            <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Account Scope</span>
            <p className="font-bold text-slate-900 text-sm">
              {selectedClientId === 'All' ? 'Consolidated Master Accounts' : clients.find(c => c.id === selectedClientId)?.company || 'Single Account'}
            </p>
            <p className="text-slate-500 mt-0.5">
              {periodTransactions.length} Client Records • {periodWorkerPayments.length} Disbursements
            </p>
          </div>

          <div>
            <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Practice Authorization</span>
            <p className="font-bold text-slate-900">Headquarters Engineering Bureau</p>
            <p className="text-slate-500">Addis Ababa & Regional Sites</p>
          </div>
        </div>

        {/* Executive Financial Metrics Card (P&L Reconciliation) */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-8">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Executive Financial Reconciliation (Inflow vs. Outflow)
              </h3>
            </div>
            <span className="text-[11px] font-mono font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
              Audited Ledger
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Client Inflow (Collected)
              </span>
              <div className="text-lg font-black font-mono text-emerald-600">
                ${metrics.clientCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                Agreed Scope: ${metrics.contractValue.toLocaleString()}
              </div>
            </div>

            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Project Outflows (Expenses)
              </span>
              <div className="text-lg font-black font-mono text-rose-600">
                -${metrics.totalDisbursements.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                {metrics.paidDisbursements.toLocaleString()} Paid • {metrics.pendingDisbursements.toLocaleString()} Pending
              </div>
            </div>

            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Net Operating Margin
              </span>
              <div className={`text-lg font-black font-mono ${metrics.netCashFlow >= 0 ? 'text-indigo-700' : 'text-rose-600'}`}>
                ${metrics.netCashFlow.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-emerald-600 font-bold mt-0.5 font-mono">
                {metrics.profitMarginPercent}% Operating Margin
              </div>
            </div>

            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Outstanding Receivables
              </span>
              <div className="text-lg font-black font-mono text-amber-600">
                ${metrics.balancePending.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Uncollected client balances
              </div>
            </div>
          </div>
        </div>

        {/* Discipline Cost Disbursement Summary (if any disbursements exist) */}
        {disciplineBreakdown.length > 0 && (
          <div className="mb-8">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-600" /> Engineering Discipline Disbursement Breakdown
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
              {disciplineBreakdown.map((item) => (
                <div key={item.discipline} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                  <div className="font-bold text-slate-800 truncate text-[11px]">{item.discipline}</div>
                  <div className="text-xs font-black font-mono text-rose-600 mt-1">${item.amount.toLocaleString()}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{item.pct}% of total</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Itemized Chronological Ledger Table */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" /> Itemized Transaction & Disbursement Ledger
            </h4>
            <span className="text-[10px] text-slate-400 font-mono">
              {chronologicalLedger.length} Total Registered Entries
            </span>
          </div>

          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-900 bg-slate-50 text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                <th className="text-left py-2 px-2.5">Date & Time</th>
                <th className="text-left py-2 px-2">Type</th>
                <th className="text-left py-2 px-2.5">Account / Worker</th>
                <th className="text-left py-2 px-2.5">Discipline / Scope</th>
                <th className="text-left py-2 px-2.5">Reference ID</th>
                <th className="text-right py-2 px-2.5 w-24">Amount ($)</th>
                <th className="text-center py-2 px-2 w-20">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-[11px]">
              {chronologicalLedger.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                    No transactions or disbursements recorded in this period.
                  </td>
                </tr>
              ) : (
                chronologicalLedger.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50">
                    <td className="py-2 px-2.5">
                      <div className="font-mono text-slate-800 font-medium">{row.date}</div>
                      {row.time && <div className="text-[9px] text-slate-400 font-mono">{row.time}</div>}
                    </td>

                    <td className="py-2 px-2">
                      <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                        row.type === 'INFLOW' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {row.type}
                      </span>
                    </td>

                    <td className="py-2 px-2.5 font-bold text-slate-900 truncate max-w-[140px]">
                      {row.entity}
                    </td>

                    <td className="py-2 px-2.5">
                      <div className="font-medium text-slate-700">{row.category}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[180px]">{row.description}</div>
                    </td>

                    <td className="py-2 px-2.5 font-mono text-[10px] text-slate-500">
                      {row.ref}
                    </td>

                    <td className="py-2 px-2.5 text-right font-mono font-bold">
                      <span className={row.type === 'INFLOW' ? 'text-emerald-600' : 'text-rose-600'}>
                        {row.type === 'INFLOW' ? '+' : '-'}${row.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </td>

                    <td className="py-2 px-2 text-center">
                      <span className="text-[9px] font-bold uppercase text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Audit Verification & Signature Sign-off Block */}
        <div className="border-t-2 border-slate-900 pt-8 mt-12 grid grid-cols-2 gap-12 text-xs">
          <div>
            <div className="h-14 border-b border-slate-300"></div>
            <p className="mt-2 font-bold text-slate-900">Lead Architectural & Structural Principal</p>
            <p className="text-slate-400 text-[10px]">AJ Architects & Engineers Consulting</p>
            <p className="text-indigo-600 font-mono text-[10px] mt-0.5 font-bold">Audit Seal: {continuityCode}</p>
          </div>

          <div>
            <div className="h-14 border-b border-slate-300"></div>
            <p className="mt-2 font-bold text-slate-900">Chief Financial Controller / Audit Officer</p>
            <p className="text-slate-400 text-[10px]">Verified against Bank & Cash Records</p>
            <p className="text-slate-500 font-mono text-[10px] mt-0.5 font-medium">Reconciliation: Approved</p>
          </div>
        </div>

        {/* Corporate Legal & Compliance Footer */}
        <div className="mt-12 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400 space-y-1">
          <p className="font-semibold text-slate-500 uppercase tracking-widest">
            Official Corporate Statement • AJ Architects & Engineers Consulting Practice
          </p>
          <p>
            This statement was generated automatically from the system ledger. Confirmed in accordance with standard professional consulting practice.
          </p>
        </div>

      </div>
    </div>
  );
};
