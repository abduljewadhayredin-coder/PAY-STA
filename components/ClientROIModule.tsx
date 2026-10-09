import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, ComposedChart, BarChart, Bar, Line, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ReferenceLine 
} from 'recharts';
import { Transaction, Client, WorkerPayment, ViewState } from '../types';
import { 
  TrendingUp, TrendingDown, DollarSign, Percent, ArrowUpRight, 
  ArrowDownRight, Users, Award, Filter, ExternalLink, Layers, 
  ChevronRight, Building, Sparkles, Scale
} from 'lucide-react';
import { WidgetTooltipOverlay } from './WidgetTooltipOverlay';

interface ClientROIModuleProps {
  transactions: Transaction[];
  clients?: Client[];
  workerPayments?: WorkerPayment[];
  onNavigate?: (view: ViewState, params?: any) => void;
}

export interface ClientROIData {
  clientId: string;
  clientName: string;
  companyName: string;
  status: string;
  incomingPayments: number; // Received cash (DIL)
  contractValue: number;    // Total contract value
  projectCosts: number;     // Direct labor/worker expenses
  netProfit: number;        // Incoming - Costs
  roiPercent: number;       // ((Incoming - Costs) / Costs) * 100
  profitMarginPercent: number; // (NetProfit / Incoming) * 100
  costRatioPercent: number; // (Costs / Incoming) * 100
  projectCount: number;
}

export const ClientROIModule: React.FC<ClientROIModuleProps> = ({
  transactions,
  clients = [],
  workerPayments = [],
  onNavigate
}) => {
  const [calculationBasis, setCalculationBasis] = useState<'received' | 'contract'>('received');
  const [chartViewMode, setChartViewMode] = useState<'dual-axis' | 'net-profit' | 'roi-rank'>('dual-axis');
  const [selectedClientForFocus, setSelectedClientForFocus] = useState<string | null>(null);

  // Compute ROI dataset for all clients
  const clientROIData = useMemo(() => {
    // 1. Gather all unique client keys
    const clientMap = new Map<string, {
      clientId: string;
      companyName: string;
      name: string;
      status: string;
      transactions: Transaction[];
    }>();

    // Seed from clients list
    clients.forEach(c => {
      clientMap.set(c.id, {
        clientId: c.id,
        companyName: c.company,
        name: c.name,
        status: c.status,
        transactions: []
      });
    });

    // Populate from transactions (handles any clients present in data)
    transactions.forEach(t => {
      const existing = clientMap.get(t.clientId);
      if (existing) {
        existing.transactions.push(t);
      } else {
        clientMap.set(t.clientId, {
          clientId: t.clientId,
          companyName: t.clientName || 'Client ' + t.clientId,
          name: t.clientName || 'Contact',
          status: 'Active',
          transactions: [t]
        });
      }
    });

    // 2. Calculate Inflow & Outflow for each client
    const results: ClientROIData[] = [];

    clientMap.forEach((c) => {
      const txs = c.transactions;
      const projectCount = txs.length;

      // Inflow
      const receivedPayments = txs.reduce((sum, t) => sum + (t.dilAmount || 0), 0);
      const contractValue = txs.reduce((sum, t) => sum + (t.amount || 0), 0);
      const incomingPayments = calculationBasis === 'received' ? receivedPayments : contractValue;

      // Project Costs (Worker disbursements / Payroll expenses)
      // Matches by company name, client name, or transaction ID
      const directCosts = workerPayments
        .filter(wp => {
          const matchCompany = wp.clientName && c.companyName && 
            wp.clientName.toLowerCase().includes(c.companyName.toLowerCase());
          const matchName = wp.clientName && c.name && 
            wp.clientName.toLowerCase().includes(c.name.toLowerCase());
          const matchTx = wp.transactionId && txs.some(t => t.id === wp.transactionId);
          return matchCompany || matchName || matchTx;
        })
        .reduce((sum, wp) => sum + wp.amount, 0);

      const netProfit = incomingPayments - directCosts;

      // Standard ROI Formula: ((Incoming - Costs) / Costs) * 100
      let roiPercent = 0;
      if (directCosts > 0) {
        roiPercent = Number((((incomingPayments - directCosts) / directCosts) * 100).toFixed(1));
      } else if (incomingPayments > 0) {
        // Zero direct expenses: 100% net gain on zero capital expended
        roiPercent = 100;
      } else {
        roiPercent = 0;
      }

      const profitMarginPercent = incomingPayments > 0 
        ? Number(((netProfit / incomingPayments) * 100).toFixed(1)) 
        : 0;

      const costRatioPercent = incomingPayments > 0 
        ? Number(((directCosts / incomingPayments) * 100).toFixed(1)) 
        : 0;

      // Include clients that have either incoming payments or costs
      if (incomingPayments > 0 || directCosts > 0 || projectCount > 0) {
        results.push({
          clientId: c.clientId,
          clientName: c.name,
          companyName: c.companyName,
          status: c.status,
          incomingPayments,
          contractValue,
          projectCosts: directCosts,
          netProfit,
          roiPercent,
          profitMarginPercent,
          costRatioPercent,
          projectCount
        });
      }
    });

    // Sort by Net Profit descending by default
    return results.sort((a, b) => b.netProfit - a.netProfit);
  }, [transactions, clients, workerPayments, calculationBasis]);

  // Portfolio Level High-Level Aggregates
  const portfolioSummary = useMemo(() => {
    const totalIncoming = clientROIData.reduce((sum, c) => sum + c.incomingPayments, 0);
    const totalCosts = clientROIData.reduce((sum, c) => sum + c.projectCosts, 0);
    const totalNetProfit = totalIncoming - totalCosts;

    const portfolioROI = totalCosts > 0 
      ? Number((((totalIncoming - totalCosts) / totalCosts) * 100).toFixed(1))
      : 100;

    const topPerformer = [...clientROIData]
      .filter(c => c.projectCosts > 0)
      .sort((a, b) => b.roiPercent - a.roiPercent)[0] || clientROIData[0] || null;

    const costRatio = totalIncoming > 0 
      ? Number(((totalCosts / totalIncoming) * 100).toFixed(1))
      : 0;

    return {
      totalIncoming,
      totalCosts,
      totalNetProfit,
      portfolioROI,
      topPerformer,
      costRatio,
      clientCount: clientROIData.length
    };
  }, [clientROIData]);

  // Chart Formatted Data
  const chartData = useMemo(() => {
    let sorted = [...clientROIData];
    if (chartViewMode === 'roi-rank') {
      sorted = sorted.sort((a, b) => b.roiPercent - a.roiPercent);
    } else if (chartViewMode === 'net-profit') {
      sorted = sorted.sort((a, b) => b.netProfit - a.netProfit);
    }

    return sorted.map(c => ({
      name: c.companyName.length > 14 ? c.companyName.substring(0, 12) + '…' : c.companyName,
      fullName: c.companyName,
      clientId: c.clientId,
      status: c.status,
      'Incoming Payments': c.incomingPayments,
      'Project Costs': c.projectCosts,
      'Net Profit': c.netProfit,
      'ROI (%)': c.roiPercent,
      'Margin (%)': c.profitMarginPercent
    }));
  }, [clientROIData, chartViewMode]);

  // Custom Recharts Tooltip
  const ROITooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      const isPositiveROI = dataPoint['ROI (%)'] >= 0;

      return (
        <div className="bg-slate-900 text-white p-4 rounded-xl shadow-2xl border border-slate-700 text-xs space-y-2 min-w-[240px]">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <p className="font-black text-sm text-white">{dataPoint.fullName}</p>
              <p className="text-[10px] text-slate-400 font-mono">ID: {dataPoint.clientId}</p>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
              isPositiveROI ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}>
              {dataPoint['ROI (%)']}% ROI
            </span>
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Incoming Payments:
              </span>
              <span className="font-mono font-bold text-emerald-300">
                ${dataPoint['Incoming Payments'].toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400"></span> Project Costs:
              </span>
              <span className="font-mono font-bold text-rose-300">
                ${dataPoint['Project Costs'].toLocaleString()}
              </span>
            </div>

            <div className="h-px bg-slate-800 my-1"></div>

            <div className="flex justify-between items-center font-bold">
              <span className="text-slate-300">Net Profit Return:</span>
              <span className={`font-mono ${dataPoint['Net Profit'] >= 0 ? 'text-indigo-300' : 'text-rose-400'}`}>
                ${dataPoint['Net Profit'].toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center text-[11px] text-slate-400">
              <span>Profit Margin:</span>
              <span className="font-mono">{dataPoint['Margin (%)']}%</span>
            </div>
          </div>

          {onNavigate && (
            <div className="pt-2 border-t border-slate-800 text-[10px] text-indigo-300 flex items-center justify-between">
              <span>Click bar to view profile</span>
              <ExternalLink className="w-3 h-3" />
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const getROIColorBadge = (roi: number) => {
    if (roi >= 150) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (roi >= 50) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (roi >= 0) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-rose-50 text-rose-700 border-rose-200';
  };

  return (
    <div 
      data-widget="client-roi-module"
      tabIndex={0}
      aria-label="Client Return on Investment (ROI) analytics module"
      className="bg-white border border-slate-200 rounded-xl shadow-xs p-5 md:p-6 space-y-6 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all"
    >
      {/* Module Header & Control Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-800">Client Return on Investment (ROI)</h3>
                <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                  Recharts Visual Engine
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Calculates capital return and profitability per client: Incoming Inflow vs. Project Outflow Expenses.
              </p>
            </div>
          </div>
        </div>

        {/* Interactive Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Basis Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setCalculationBasis('received')}
              className={`px-3 py-1 font-bold rounded-md transition-all ${
                calculationBasis === 'received' 
                  ? 'bg-white text-indigo-700 shadow-2xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Calculate ROI using actual collected payments (DIL received)"
            >
              Collected Inflow
            </button>
            <button
              onClick={() => setCalculationBasis('contract')}
              className={`px-3 py-1 font-bold rounded-md transition-all ${
                calculationBasis === 'contract' 
                  ? 'bg-white text-indigo-700 shadow-2xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Calculate ROI using total agreed contract value"
            >
              Contract Value
            </button>
          </div>

          {/* Chart View Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setChartViewMode('dual-axis')}
              className={`px-2.5 py-1 font-bold rounded-md transition-all ${
                chartViewMode === 'dual-axis' 
                  ? 'bg-white text-blue-700 shadow-2xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Dual-Axis
            </button>
            <button
              onClick={() => setChartViewMode('roi-rank')}
              className={`px-2.5 py-1 font-bold rounded-md transition-all ${
                chartViewMode === 'roi-rank' 
                  ? 'bg-white text-blue-700 shadow-2xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              ROI % Curve
            </button>
            <button
              onClick={() => setChartViewMode('net-profit')}
              className={`px-2.5 py-1 font-bold rounded-md transition-all ${
                chartViewMode === 'net-profit' 
                  ? 'bg-white text-blue-700 shadow-2xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Net Profit
            </button>
          </div>

          <WidgetTooltipOverlay
            title="Client ROI Engine"
            category="Profitability Metric"
            description="ROI (%) = ((Incoming Payments - Direct Project Costs) / Direct Project Costs) * 100. Tracks exact financial efficiency per account."
          />
        </div>
      </div>

      {/* High-Impact Portfolio Summary Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span className="font-semibold text-[11px] uppercase tracking-wider text-slate-400">Portfolio Return (ROI)</span>
            <Percent className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="text-xl font-black font-mono text-indigo-700">
            +{portfolioSummary.portfolioROI}%
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Avg. yield across {portfolioSummary.clientCount} clients
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span className="font-semibold text-[11px] uppercase tracking-wider text-slate-400">Total Net Return</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-xl font-black font-mono text-emerald-600">
            ${portfolioSummary.totalNetProfit.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            ${portfolioSummary.totalIncoming.toLocaleString()} in / ${portfolioSummary.totalCosts.toLocaleString()} out
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span className="font-semibold text-[11px] uppercase tracking-wider text-slate-400">Cost-to-Income Ratio</span>
            <Scale className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl font-black font-mono text-slate-800">
            {portfolioSummary.costRatio}%
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Direct expenses per dollar received
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span className="font-semibold text-[11px] uppercase tracking-wider text-slate-400">Top ROI Client</span>
            <Award className="w-3.5 h-3.5 text-yellow-500" />
          </div>
          <div className="text-base font-black text-slate-900 truncate" title={portfolioSummary.topPerformer?.companyName}>
            {portfolioSummary.topPerformer?.companyName || 'N/A'}
          </div>
          <div className="text-[10px] font-bold text-emerald-600 mt-0.5 font-mono">
            +{portfolioSummary.topPerformer?.roiPercent}% Return
          </div>
        </div>
      </div>

      {/* Main Recharts Visualization */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-3 h-3 rounded-sm bg-emerald-500"></span> Incoming Payments ($)
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-3 h-3 rounded-sm bg-rose-500"></span> Project Costs ($)
            </span>
            {chartViewMode === 'dual-axis' && (
              <span className="flex items-center gap-1.5 font-medium text-indigo-600">
                <span className="w-3 h-0.5 bg-indigo-600"></span> ROI Trend (%)
              </span>
            )}
          </div>
          <span className="text-[11px] italic text-slate-400 hidden sm:inline">
            Interactive chart — Click on a bar to view client profile
          </span>
        </div>

        <div className="h-80 w-full bg-slate-50/50 p-2 rounded-xl border border-slate-100">
          <ResponsiveContainer width="100%" height="100%">
            {chartViewMode === 'dual-axis' ? (
              <ComposedChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 10, bottom: 25 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload[0] && onNavigate) {
                    const cId = e.activePayload[0].payload.clientId;
                    onNavigate('clients', { clientId: cId });
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                  interval={0}
                />
                <YAxis 
                  yAxisId="left"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                  tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: '#6366f1', fontSize: 11, fontWeight: 700 }}
                  axisLine={{ stroke: '#c7d2fe' }}
                  tickLine={false}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip content={<ROITooltip />} />
                <ReferenceLine yAxisId="right" y={0} stroke="#94a3b8" strokeDasharray="3 3" />
                <Bar 
                  yAxisId="left" 
                  dataKey="Incoming Payments" 
                  fill="#10b981" 
                  radius={[4, 4, 0, 0]} 
                  maxBarSize={36} 
                />
                <Bar 
                  yAxisId="left" 
                  dataKey="Project Costs" 
                  fill="#f43f5e" 
                  radius={[4, 4, 0, 0]} 
                  maxBarSize={36} 
                />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="ROI (%)" 
                  stroke="#6366f1" 
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#6366f1', stroke: '#ffffff', strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: '#4f46e5' }}
                />
              </ComposedChart>
            ) : chartViewMode === 'roi-rank' ? (
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 10, bottom: 25 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload[0] && onNavigate) {
                    const cId = e.activePayload[0].payload.clientId;
                    onNavigate('clients', { clientId: cId });
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                  interval={0}
                />
                <YAxis 
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip content={<ROITooltip />} />
                <ReferenceLine y={0} stroke="#94a3b8" />
                <Bar 
                  dataKey="ROI (%)" 
                  radius={[4, 4, 0, 0]} 
                  maxBarSize={44}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry['ROI (%)'] >= 150 ? '#10b981' : entry['ROI (%)'] >= 50 ? '#3b82f6' : entry['ROI (%)'] >= 0 ? '#f59e0b' : '#ef4444'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <ComposedChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 10, bottom: 25 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload[0] && onNavigate) {
                    const cId = e.activePayload[0].payload.clientId;
                    onNavigate('clients', { clientId: cId });
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                  interval={0}
                />
                <YAxis 
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                  tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<ROITooltip />} />
                <ReferenceLine y={0} stroke="#94a3b8" />
                <Bar 
                  dataKey="Net Profit" 
                  fill="#6366f1" 
                  radius={[4, 4, 0, 0]} 
                  maxBarSize={40} 
                />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Client ROI Breakdown Grid */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-indigo-600" /> Account ROI Leaderboard & Margins
          </h4>
          <span className="text-[11px] text-slate-400">
            {clientROIData.length} Client Accounts Analyzed
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {clientROIData.map((client) => {
            const isTop = portfolioSummary.topPerformer?.clientId === client.clientId;
            
            return (
              <div 
                key={client.clientId}
                onClick={() => onNavigate && onNavigate('clients', { clientId: client.clientId })}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer group hover:shadow-md ${
                  isTop 
                    ? 'bg-indigo-50/40 border-indigo-200 hover:border-indigo-300' 
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between mb-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-slate-700 text-xs shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      {client.companyName.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h5 className="font-bold text-slate-800 text-sm truncate">{client.companyName}</h5>
                        {isTop && (
                          <span className="p-0.5 bg-yellow-100 text-yellow-800 rounded text-[9px] font-black uppercase tracking-tight flex items-center gap-0.5 shrink-0">
                            <Award className="w-2.5 h-2.5" /> Top
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">{client.clientName} • {client.projectCount} Projects</p>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-black font-mono border shrink-0 ${getROIColorBadge(client.roiPercent)}`}>
                    +{client.roiPercent}%
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 text-xs font-mono">
                  <div>
                    <span className="text-[9px] font-sans font-bold text-slate-400 uppercase block">Inflow</span>
                    <span className="font-bold text-emerald-600">${client.incomingPayments.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-sans font-bold text-slate-400 uppercase block">Costs</span>
                    <span className="font-bold text-rose-500">${client.projectCosts.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-sans font-bold text-slate-400 uppercase block">Net Profit</span>
                    <span className={`font-bold ${client.netProfit >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                      ${client.netProfit.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2.5 text-[11px]">
                  <span className="text-slate-400">
                    Margin: <span className="font-mono font-bold text-slate-700">{client.profitMarginPercent}%</span>
                  </span>
                  <span className="text-indigo-600 group-hover:text-indigo-800 font-bold flex items-center gap-0.5 text-[11px]">
                    Client Details <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
