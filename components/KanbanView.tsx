import React, { useMemo, useState } from 'react';
import { Transaction, Client, ViewState, Milestone } from '../types';
import { 
  Clock, CheckCircle, AlertCircle, RotateCw, GripVertical, Plus, Layers, 
  X, Save, Trash2, Layout, Calculator, Target, Calendar, CheckSquare, 
  Square, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp, Flag, 
  Search, Filter, ExternalLink, User 
} from 'lucide-react';
import { MilestonesModal } from './MilestonesModal';

interface KanbanViewProps {
  data: Transaction[];
  workTypes: string[];
  clients: Client[];
  onUpdateTransaction: (transaction: Transaction) => void;
  onRecordPayment: (transaction: Omit<Transaction, 'id'> & { id?: string }) => void;
  onDeleteTransaction: (id: string) => void;
  onNavigate?: (view: ViewState, params?: any) => void;
}

// Fixed Status Columns for Phase View
const STATUS_COLUMNS = [
  { id: 'Pending', label: 'Pending', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  { id: 'In Progress', label: 'In Progress', icon: RotateCw, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  { id: 'Completed', label: 'Completed', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  { id: 'On Hold', label: 'On Hold', icon: AlertCircle, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' },
] as const;

// Milestones Columns
const MILESTONE_COLUMNS = [
  { key: 'overdue', label: 'Overdue Milestones', icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', countBg: 'bg-rose-100 text-rose-800' },
  { key: 'due-soon', label: 'Due This Week', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', countBg: 'bg-amber-100 text-amber-800' },
  { key: 'scheduled', label: 'Upcoming & Scheduled', icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', countBg: 'bg-indigo-100 text-indigo-800' },
  { key: 'completed', label: 'Completed & Verified', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', countBg: 'bg-emerald-100 text-emerald-800' },
] as const;

export const KanbanView: React.FC<KanbanViewProps> = ({ 
  data, 
  workTypes, 
  clients, 
  onUpdateTransaction, 
  onRecordPayment, 
  onDeleteTransaction, 
  onNavigate 
}) => {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [viewBy, setViewBy] = useState<'status' | 'system' | 'milestones'>('status');
  const [activeMobileCol, setActiveMobileCol] = useState<string>('all');
  
  // Visual Feedback States
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [successCol, setSuccessCol] = useState<string | null>(null);
  
  // Modals & Milestones States
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [selectedTxForMilestones, setSelectedTxForMilestones] = useState<string | undefined>(undefined);

  // Card Milestone expansion state
  const [expandedMilestones, setExpandedMilestones] = useState<Record<string, boolean>>({});

  // Filter & Search states for Milestones View
  const [milestoneClientFilter, setMilestoneClientFilter] = useState<string>('All');
  const [milestoneSearch, setMilestoneSearch] = useState<string>('');

  // New quick milestone inline state inside editTx modal
  const [quickMilestoneTitle, setQuickMilestoneTitle] = useState('');
  const [quickMilestoneDueDate, setQuickMilestoneDueDate] = useState('');

  const toggleCardMilestones = (txId: string) => {
    setExpandedMilestones(prev => ({
      ...prev,
      [txId]: !prev[txId]
    }));
  };

  const handleOpenMilestoneModal = (txId?: string) => {
    setSelectedTxForMilestones(txId);
    setIsMilestoneModalOpen(true);
  };

  // Toggle milestone completion directly on a transaction
  const handleToggleMilestone = (tx: Transaction, mId: string, currentStatus: boolean) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const updatedMilestones: Milestone[] = (tx.milestones || []).map(m => {
      if (m.id === mId) {
        return {
          ...m,
          completed: !currentStatus,
          completedDate: !currentStatus ? todayStr : undefined
        };
      }
      return m;
    });

    const updatedTx = {
      ...tx,
      milestones: updatedMilestones
    };

    onUpdateTransaction(updatedTx);

    // If currently editing this transaction, keep modal in sync
    if (editTx && editTx.id === tx.id) {
      setEditTx(updatedTx);
    }
  };

  // Delete milestone directly
  const handleDeleteMilestone = (tx: Transaction, mId: string) => {
    const updatedMilestones = (tx.milestones || []).filter(m => m.id !== mId);
    const updatedTx = {
      ...tx,
      milestones: updatedMilestones
    };
    onUpdateTransaction(updatedTx);
    if (editTx && editTx.id === tx.id) {
      setEditTx(updatedTx);
    }
  };

  // Quick add milestone within editTx modal
  const handleAddQuickMilestoneToEditTx = () => {
    if (!editTx || !quickMilestoneTitle.trim()) return;
    const defaultDate = quickMilestoneDueDate || editTx.targetCompletionDate || new Date().toISOString().split('T')[0];
    const newM: Milestone = {
      id: `MLS-${Date.now().toString().slice(-6)}`,
      title: quickMilestoneTitle.trim(),
      dueDate: defaultDate,
      completed: false,
      transactionId: editTx.id,
      clientId: editTx.clientId,
      clientName: editTx.clientName,
      assignedTo: editTx.assignedLead
    };
    const updated = {
      ...editTx,
      milestones: [...(editTx.milestones || []), newM]
    };
    setEditTx(updated);
    onUpdateTransaction(updated);
    setQuickMilestoneTitle('');
    setQuickMilestoneDueDate('');
  };

  // Derive Columns based on View Mode
  const columns = useMemo(() => {
    if (viewBy === 'status') {
      return STATUS_COLUMNS.map(c => ({ ...c, key: c.id }));
    } else if (viewBy === 'system') {
      // System View: Columns are Work Types with unique color styles
      const colors = [
        { color: 'text-indigo-600', bg: 'bg-indigo-50/50', border: 'border-indigo-100', dot: 'bg-indigo-500' },
        { color: 'text-emerald-600', bg: 'bg-emerald-50/50', border: 'border-emerald-100', dot: 'bg-emerald-500' },
        { color: 'text-sky-600', bg: 'bg-sky-50/50', border: 'border-sky-100', dot: 'bg-sky-500' },
        { color: 'text-amber-600', bg: 'bg-amber-50/50', border: 'border-amber-100', dot: 'bg-amber-500' },
        { color: 'text-rose-600', bg: 'bg-rose-50/50', border: 'border-rose-100', dot: 'bg-rose-500' },
        { color: 'text-violet-600', bg: 'bg-violet-50/50', border: 'border-violet-100', dot: 'bg-violet-500' },
        { color: 'text-teal-600', bg: 'bg-teal-50/50', border: 'border-teal-100', dot: 'bg-teal-500' },
        { color: 'text-orange-600', bg: 'bg-orange-50/50', border: 'border-orange-100', dot: 'bg-orange-500' },
        { color: 'text-fuchsia-600', bg: 'bg-fuchsia-50/50', border: 'border-fuchsia-100', dot: 'bg-fuchsia-500' },
        { color: 'text-cyan-600', bg: 'bg-cyan-50/50', border: 'border-cyan-100', dot: 'bg-cyan-500' }
      ];
      return workTypes.map((type, index) => {
        const colorSet = colors[index % colors.length];
        return {
          key: type,
          label: type,
          icon: Layers,
          ...colorSet
        };
      });
    } else {
      // viewBy === 'milestones'
      return MILESTONE_COLUMNS;
    }
  }, [viewBy, workTypes]);

  // Aggregate all milestones across transactions with their linked transaction record
  const allMilestonesWithTx = useMemo(() => {
    const list: { milestone: Milestone; transaction: Transaction }[] = [];
    (data || []).forEach(tx => {
      (tx.milestones || []).forEach(m => {
        list.push({ milestone: m, transaction: tx });
      });
    });
    return list;
  }, [data]);

  // Aggregated Milestone Metrics
  const milestoneStats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const total = allMilestonesWithTx.length;
    const completed = allMilestonesWithTx.filter(item => item.milestone.completed).length;
    const overdue = allMilestonesWithTx.filter(
      item => !item.milestone.completed && item.milestone.dueDate < todayStr
    ).length;

    const next7Days = new Date();
    next7Days.setDate(next7Days.getDate() + 7);
    const next7DaysStr = next7Days.toISOString().split('T')[0];
    const dueThisWeek = allMilestonesWithTx.filter(
      item => !item.milestone.completed && item.milestone.dueDate >= todayStr && item.milestone.dueDate <= next7DaysStr
    ).length;

    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, overdue, dueThisWeek, rate };
  }, [allMilestonesWithTx]);

  // Group transactions for Phase and System board views
  const boardData = useMemo(() => {
    if (viewBy === 'milestones') return {};
    const grouped: Record<string, Transaction[]> = {};
    columns.forEach(c => grouped[c.key] = []);

    const sorted = [...data].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    sorted.forEach(t => {
      const key = viewBy === 'status' ? t.status : t.workType;
      if (grouped[key]) {
        grouped[key].push(t);
      } else if (viewBy === 'system') {
        if (!grouped['Other']) grouped['Other'] = [];
        grouped['Other'].push(t);
      }
    });
    return grouped;
  }, [data, columns, viewBy]);

  // Group milestones into columns for Milestones View
  const milestoneBoardData = useMemo(() => {
    if (viewBy !== 'milestones') return {};
    const todayStr = new Date().toISOString().split('T')[0];
    const next7Days = new Date();
    next7Days.setDate(next7Days.getDate() + 7);
    const next7DaysStr = next7Days.toISOString().split('T')[0];

    // Filter milestones by client & search
    let filtered = allMilestonesWithTx;
    if (milestoneClientFilter !== 'All') {
      filtered = filtered.filter(item => item.transaction.clientId === milestoneClientFilter || item.transaction.clientName === milestoneClientFilter);
    }
    if (milestoneSearch.trim()) {
      const q = milestoneSearch.toLowerCase();
      filtered = filtered.filter(item => 
        item.milestone.title.toLowerCase().includes(q) ||
        item.transaction.clientName.toLowerCase().includes(q) ||
        item.transaction.item.toLowerCase().includes(q) ||
        item.transaction.id.toLowerCase().includes(q)
      );
    }

    const grouped: Record<string, { milestone: Milestone; transaction: Transaction }[]> = {
      'overdue': [],
      'due-soon': [],
      'scheduled': [],
      'completed': []
    };

    filtered.forEach(item => {
      const m = item.milestone;
      if (m.completed) {
        grouped['completed'].push(item);
      } else if (m.dueDate < todayStr) {
        grouped['overdue'].push(item);
      } else if (m.dueDate <= next7DaysStr) {
        grouped['due-soon'].push(item);
      } else {
        grouped['scheduled'].push(item);
      }
    });

    // Sort items within each column by due date ascending
    Object.keys(grouped).forEach(k => {
      grouped[k].sort((a, b) => a.milestone.dueDate.localeCompare(b.milestone.dueDate));
    });

    return grouped;
  }, [viewBy, allMilestonesWithTx, milestoneClientFilter, milestoneSearch]);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, colKey: string) => {
    e.preventDefault();
    if (dragOverCol !== colKey) {
      setDragOverCol(colKey);
    }
  };

  const handleDrop = (e: React.DragEvent, targetKey: string) => {
    e.preventDefault();
    setDragOverCol(null);
    
    if (draggedId) {
      const item = data.find(t => t.id === draggedId);
      if (item) {
        let changed = false;
        if (viewBy === 'status' && item.status !== targetKey) {
          onUpdateTransaction({ ...item, status: targetKey as any });
          changed = true;
        } else if (viewBy === 'system' && item.workType !== targetKey) {
           onUpdateTransaction({ ...item, workType: targetKey });
           changed = true;
        }

        if (changed) {
          setSuccessCol(targetKey);
          setTimeout(() => setSuccessCol(null), 600);
        }
      }
      setDraggedId(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverCol(null);
  };

  // Quick Add Form Handling
  const [quickAddForm, setQuickAddForm] = useState({
    clientName: '',
    workType: workTypes[0] || '',
    amount: '',
    startTime: '09:00',
    endTime: '17:00'
  });

  const submitQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const newTxId = `TRX-QUICK-${Date.now()}`;
    const todayStr = new Date().toISOString().split('T')[0];
    const dueDate14 = new Date();
    dueDate14.setDate(dueDate14.getDate() + 14);

    onRecordPayment({
      id: newTxId,
      date: todayStr,
      startTime: quickAddForm.startTime || '09:00',
      endTime: quickAddForm.endTime || '17:00',
      clientId: 'C-QUICK-' + Date.now(),
      clientName: quickAddForm.clientName || 'New Client',
      category: 'Engineering Services',
      workType: quickAddForm.workType,
      item: 'Quick Task & Deliverable',
      status: 'Pending',
      paymentStatus: 'Unpaid',
      isAdvanceReceived: false,
      amount: Number(quickAddForm.amount) || 0,
      baseAmount: Number(quickAddForm.amount) || 0,
      dilAmount: 0,
      balanceAmount: Number(quickAddForm.amount) || 0,
      region: 'Headquarters',
      milestones: [
        {
          id: `MLS-${Date.now()}-1`,
          title: 'Initial Scope Verification & Site Visit',
          dueDate: todayStr,
          completed: false,
          transactionId: newTxId,
          clientName: quickAddForm.clientName || 'New Client'
        },
        {
          id: `MLS-${Date.now()}-2`,
          title: 'Preliminary Design Package Submission',
          dueDate: dueDate14.toISOString().split('T')[0],
          completed: false,
          transactionId: newTxId,
          clientName: quickAddForm.clientName || 'New Client'
        }
      ]
    });
    setQuickAddForm({ clientName: '', workType: workTypes[0] || '', amount: '', startTime: '09:00', endTime: '17:00' });
    setIsQuickAddOpen(false);
  };

  // Column Totals
  const getColumnTotal = (key: string) => {
    const items = boardData[key] || [];
    return items.reduce((acc, t) => acc + t.amount, 0);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col animate-fadeIn">
      {/* Control Bar */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            Workflow & Milestones Board
            {viewBy === 'milestones' && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                Milestones Hub
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500">
            {viewBy === 'status' 
              ? 'Tracking project progress by Phase & associated milestone deliverables.' 
              : viewBy === 'system'
                ? 'Tracking workload by Engineering System.'
                : 'Project Milestone Tracking — Deliverables, Due Dates, and Completion Verification linked to Transactions.'
            }
          </p>
        </div>
        
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* View Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 shadow-sm">
             <button
               onClick={() => { setViewBy('status'); setActiveMobileCol('all'); }}
               className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                 viewBy === 'status' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'
               }`}
             >
               <Layout className="w-3.5 h-3.5" /> Phase View
             </button>
             <button
               onClick={() => { setViewBy('system'); setActiveMobileCol('all'); }}
               className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                 viewBy === 'system' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'
               }`}
             >
               <Layers className="w-3.5 h-3.5" /> System View
             </button>
             <button
               onClick={() => { setViewBy('milestones'); setActiveMobileCol('all'); }}
               className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                 viewBy === 'milestones' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'
               }`}
             >
               <Target className="w-3.5 h-3.5 text-indigo-600" /> Milestones View
               <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                 viewBy === 'milestones' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-700'
               }`}>
                 {milestoneStats.completed}/{milestoneStats.total}
               </span>
             </button>
          </div>

          {/* Add Milestone Button */}
          <button
            onClick={() => handleOpenMilestoneModal()}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            title="Add Milestone to any Client Project"
          >
            <Target className="w-4 h-4" /> Add Milestone
          </button>

          {/* Quick Add Task */}
          <button 
            onClick={() => setIsQuickAddOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Quick Task
          </button>
        </div>
      </div>

      {/* Special Milestone KPI Bar & Filter Toolbar when in Milestones View */}
      {viewBy === 'milestones' && (
        <div className="mb-4 space-y-3">
          {/* Milestone Metrics Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Total Milestones</span>
                <Target className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-slate-800">{milestoneStats.total}</span>
                <span className="text-xs text-slate-400">across {data.length} projects</span>
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-emerald-200/80 shadow-sm">
              <div className="flex items-center justify-between text-emerald-700 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Completed & Verified</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-emerald-700">{milestoneStats.completed}</span>
                <span className="text-xs font-semibold text-emerald-600">({milestoneStats.rate}% achieved)</span>
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-amber-200/80 shadow-sm">
              <div className="flex items-center justify-between text-amber-700 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Due This Week</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-amber-700">{milestoneStats.dueThisWeek}</span>
                <span className="text-xs text-amber-600 font-medium">next 7 days</span>
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-rose-200/80 shadow-sm">
              <div className="flex items-center justify-between text-rose-700 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Overdue Milestones</span>
                <AlertTriangle className="w-4 h-4 text-rose-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-rose-700">{milestoneStats.overdue}</span>
                <span className="text-xs text-rose-600 font-medium">requires action</span>
              </div>
            </div>
          </div>

          {/* Filters & Search Toolbar */}
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-600 flex items-center gap-1 shrink-0">
                <Filter className="w-3.5 h-3.5" /> Client:
              </span>
              <select
                value={milestoneClientFilter}
                onChange={(e) => setMilestoneClientFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-medium text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm w-full sm:w-48"
              >
                <option value="All">All Clients ({clients.length})</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.company}</option>
                ))}
              </select>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search milestone title, TRX ID..."
                value={milestoneSearch}
                onChange={(e) => setMilestoneSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded text-xs outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Mobile-only Column Selector for extreme Mobility & responsiveness */}
      <div className="md:hidden mb-3 overflow-x-auto pb-1 flex gap-1.5 scrollbar-none snap-x">
        <button
          onClick={() => setActiveMobileCol('all')}
          className={`flex-shrink-0 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
            activeMobileCol === 'all'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          All Columns
        </button>
        {columns.map(col => {
          const count = viewBy === 'milestones'
            ? (milestoneBoardData[col.key]?.length || 0)
            : (boardData[col.key]?.length || 0);
          const isActive = activeMobileCol === col.key;
          return (
            <button
              key={col.key}
              onClick={() => setActiveMobileCol(col.key)}
              className={`flex-shrink-0 px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 border snap-align-start ${
                isActive
                  ? `${col.bg} ${col.color} border-current ring-1 ring-current`
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <col.icon className="w-3.5 h-3.5" />
              <span>{col.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white/80' : 'bg-slate-100 text-slate-400'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Board Area */}
      <div className="flex-1 overflow-x-auto pb-4">
        {viewBy === 'milestones' ? (
          /* MILESTONES VIEW BOARD */
          <div className={`flex gap-4 h-full ${activeMobileCol === 'all' ? 'min-w-[1050px]' : 'min-w-0 md:min-w-[1050px]'}`}>
            {MILESTONE_COLUMNS.map(col => {
              const items = milestoneBoardData[col.key] || [];
              const isColHiddenOnMobile = activeMobileCol !== 'all' && activeMobileCol !== col.key;

              return (
                <div
                  key={col.key}
                  className={`flex-1 flex flex-col rounded-lg border transition-all duration-300
                    ${isColHiddenOnMobile ? 'hidden md:flex' : 'flex'}
                    ${activeMobileCol === 'all' ? 'min-w-[280px]' : 'min-w-full md:min-w-[280px]'}
                    bg-slate-100/50 ${col.border}`}
                >
                  {/* Column Header */}
                  <div className={`p-3 border-b flex items-center justify-between rounded-t-lg bg-white ${col.border}`}>
                    <div className="flex items-center gap-2">
                      <col.icon className={`w-4 h-4 ${col.color}`} />
                      <h3 className="font-bold text-slate-800 text-sm">{col.label}</h3>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${col.countBg}`}>
                      {items.length}
                    </span>
                  </div>

                  {/* Column Milestones List */}
                  <div className="flex-1 overflow-y-auto p-2 space-y-2.5 excel-scrollbar">
                    {items.map(({ milestone: m, transaction: tx }) => {
                      const todayStr = new Date().toISOString().split('T')[0];
                      const isOverdue = !m.completed && m.dueDate < todayStr;
                      const isDueToday = !m.completed && m.dueDate === todayStr;

                      return (
                        <div
                          key={m.id}
                          className={`bg-white p-3 rounded-lg border transition-all shadow-sm hover:shadow-md ${
                            m.completed 
                              ? 'border-emerald-200 bg-emerald-50/20' 
                              : isOverdue 
                                ? 'border-rose-200 bg-rose-50/20' 
                                : 'border-slate-200 hover:border-indigo-300'
                          }`}
                        >
                          {/* Top Row: Checkbox, ID & Due status */}
                          <div className="flex items-start gap-2.5 mb-1.5">
                            {/* Interactive Completion Checkbox */}
                            <button
                              type="button"
                              onClick={() => handleToggleMilestone(tx, m.id, m.completed)}
                              className="mt-0.5 text-slate-400 hover:text-indigo-600 transition-colors flex-shrink-0"
                              title={m.completed ? 'Mark incomplete' : 'Mark completed'}
                            >
                              {m.completed ? (
                                <CheckSquare className="w-5 h-5 text-emerald-600" />
                              ) : (
                                <Square className="w-5 h-5 text-slate-300 hover:text-slate-400" />
                              )}
                            </button>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1 mb-0.5">
                                <span className="text-[10px] font-mono text-slate-400">{m.id}</span>
                                {m.completed ? (
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                                    Done {m.completedDate ? `(${m.completedDate})` : ''}
                                  </span>
                                ) : isOverdue ? (
                                  <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded">
                                    Overdue: {m.dueDate}
                                  </span>
                                ) : isDueToday ? (
                                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                                    Due Today
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded">
                                    Due: {m.dueDate}
                                  </span>
                                )}
                              </div>

                              <h4 className={`text-xs font-bold ${
                                m.completed ? 'text-slate-500 line-through' : 'text-slate-800'
                              }`}>
                                {m.title}
                              </h4>
                            </div>
                          </div>

                          {/* Linked Transaction Record Badge */}
                          <div className="mt-2 pt-2 border-t border-slate-100 bg-slate-50/70 p-2 rounded border border-slate-100 flex flex-col gap-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span 
                                className="font-bold text-indigo-600 hover:underline cursor-pointer truncate max-w-[170px]"
                                onClick={() => {
                                  if (onNavigate) {
                                    onNavigate('clients', { clientId: tx.clientId });
                                  }
                                }}
                                title={tx.clientName}
                              >
                                {tx.clientName}
                              </span>
                              <span className="text-[10px] font-mono font-bold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                {tx.id}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-slate-500">
                              <span className="truncate max-w-[140px]">{tx.item}</span>
                              <span className="font-bold text-slate-700">${tx.amount.toLocaleString()}</span>
                            </div>
                          </div>

                          {/* Notes if available */}
                          {m.notes && (
                            <p className="text-[10px] text-slate-500 mt-1.5 italic line-clamp-2">
                              {m.notes}
                            </p>
                          )}

                          {/* Footer with Assigned Lead & Actions */}
                          <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-50 text-[10px] text-slate-400">
                            <span className="flex items-center gap-1 truncate max-w-[140px]">
                              <User className="w-3 h-3 text-slate-400" />
                              {m.assignedTo || tx.assignedLead || 'Unassigned'}
                            </span>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenMilestoneModal(tx.id)}
                                className="text-indigo-600 hover:text-indigo-800 font-semibold"
                              >
                                Edit
                              </button>
                              <span>•</span>
                              <button
                                type="button"
                                onClick={() => handleDeleteMilestone(tx, m.id)}
                                className="text-slate-400 hover:text-rose-600 font-semibold"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {items.length === 0 && (
                      <div className="text-center py-12 text-slate-400 text-xs italic border-2 border-dashed rounded-lg mx-2 border-slate-200 bg-slate-50/30">
                        No {col.label.toLowerCase()} found
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* STANDARD PHASE & SYSTEM VIEWS */
          <div className={`flex gap-4 h-full ${activeMobileCol === 'all' ? 'min-w-[1000px] md:min-w-[1000px]' : 'min-w-0 md:min-w-[1000px]'}`}>
            {columns.map(col => {
              const isColHiddenOnMobile = activeMobileCol !== 'all' && activeMobileCol !== col.key;
              const items = boardData[col.key] || [];

              return (
                <div 
                  key={col.key}
                  className={`flex-1 flex flex-col rounded-lg border transition-all duration-300
                    ${isColHiddenOnMobile ? 'hidden md:flex' : 'flex'}
                    ${activeMobileCol === 'all' ? 'min-w-[280px] md:min-w-[280px]' : 'min-w-full md:min-w-[280px]'}
                    ${dragOverCol === col.key 
                       ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-200 shadow-xl scale-[1.01] z-10' 
                       : successCol === col.key 
                         ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-200 shadow-md' 
                         : `bg-slate-100/50 ${col.border}`
                    }`}
                  onDragOver={(e) => handleDragOver(e, col.key)}
                  onDrop={(e) => handleDrop(e, col.key)}
                >
                {/* Column Header */}
                <div className={`p-3 border-b flex flex-col gap-2 rounded-t-lg transition-colors
                   ${dragOverCol === col.key ? 'bg-blue-100/50 border-blue-200' : (successCol === col.key ? 'bg-emerald-100/50 border-emerald-200' : `bg-white ${col.border}`)}`}>
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <col.icon className={`w-4 h-4 ${col.color}`} />
                        <h3 className="font-bold text-slate-700 text-sm">{col.label}</h3>
                     </div>
                     <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${col.bg} ${col.color}`}>
                       {items.length}
                     </span>
                  </div>
                  {/* Financial Summary */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-50/50">
                     <span className="text-slate-400 font-medium">Value</span>
                     <span className="font-bold text-slate-700">${getColumnTotal(col.key).toLocaleString()}</span>
                  </div>
                </div>

                {/* Column Body */}
                <div className="flex-1 overflow-y-auto p-2 space-y-2.5 excel-scrollbar">
                   {items.map(item => {
                     const mTotal = item.milestones?.length || 0;
                     const mDone = item.milestones?.filter(m => m.completed).length || 0;
                     const mPct = mTotal > 0 ? Math.round((mDone / mTotal) * 100) : 0;
                     const isExpanded = !!expandedMilestones[item.id];

                     return (
                      <div 
                        key={item.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => setEditTx(item)}
                        className={`bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-all hover:border-blue-300 group relative
                          ${draggedId === item.id ? 'opacity-50' : 'opacity-100'}
                        `}
                      >
                        {/* Status Strip if in System View */}
                        {viewBy === 'system' && (
                          <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l ${
                            item.status === 'Completed' ? 'bg-emerald-500' :
                            item.status === 'In Progress' ? 'bg-blue-500' :
                            item.status === 'On Hold' ? 'bg-violet-500' : 'bg-amber-500'
                          }`}></div>
                        )}

                        <div className="flex justify-between items-start mb-1.5 pl-2">
                           <span className="text-[10px] font-mono text-slate-400">{item.id}</span>
                           <GripVertical className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100" />
                        </div>
                        <p 
                          className={`font-bold text-sm mb-1 pl-2 transition-colors ${onNavigate ? 'text-blue-600 hover:underline cursor-pointer' : 'text-slate-800'}`}
                          onClick={(e) => {
                            if (onNavigate) {
                              e.stopPropagation(); // Prevent opening Edit Modal
                              onNavigate('clients', { clientId: item.clientId });
                            }
                          }}
                        >
                          {item.clientName}
                        </p>
                        
                        {/* Show different secondary info based on view */}
                        {viewBy === 'status' ? (
                           <p className="text-xs text-slate-500 mb-2 truncate pl-2 flex items-center gap-1">
                             <Layers className="w-3 h-3 text-slate-300" /> {item.workType}
                           </p>
                        ) : (
                           <p className="text-xs text-slate-500 mb-2 truncate pl-2 flex items-center gap-1">
                             {item.status}
                           </p>
                        )}

                        {/* Amount & Time strip */}
                        <div className="flex items-center justify-between pt-1.5 border-t border-slate-50 pl-2">
                           <div className="flex flex-col text-[10px] text-slate-400">
                             <span>{item.date}</span>
                             {(item.startTime || item.endTime) && (
                               <span className="flex items-center gap-1 font-mono text-[10px] text-indigo-600 font-semibold">
                                 <Clock className="w-2.5 h-2.5 text-indigo-500" />
                                 {item.startTime} - {item.endTime}
                               </span>
                             )}
                           </div>
                           <div className="text-right">
                             <span className="text-xs font-bold text-slate-800">${item.amount.toLocaleString()}</span>
                             {item.paymentStatus === 'Unpaid' && (
                               <div className="text-[9px] text-red-500 font-bold uppercase">Unpaid</div>
                             )}
                           </div>
                        </div>

                        {/* MILESTONES FEATURE INTEGRATION ON CARD */}
                        <div className="mt-2.5 pt-2 border-t border-slate-100 pl-2">
                           {/* Milestone Header bar on Card */}
                           <div className="flex items-center justify-between text-[11px] mb-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleCardMilestones(item.id);
                                }}
                                className="font-bold flex items-center gap-1 text-slate-700 hover:text-indigo-600 transition-colors"
                              >
                                 <Target className="w-3.5 h-3.5 text-indigo-500" />
                                 <span>Milestones</span>
                                 <span className="text-[10px] font-semibold text-slate-500">
                                   ({mDone}/{mTotal})
                                 </span>
                                 {isExpanded ? (
                                   <ChevronUp className="w-3 h-3 text-slate-400" />
                                 ) : (
                                   <ChevronDown className="w-3 h-3 text-slate-400" />
                                 )}
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenMilestoneModal(item.id);
                                }}
                                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-1.5 py-0.5 rounded transition-colors flex items-center gap-0.5"
                                title="Add or manage milestones for this project"
                              >
                                 <Plus className="w-2.5 h-2.5" /> Milestone
                              </button>
                           </div>

                           {/* Progress Bar */}
                           {mTotal > 0 && (
                              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mb-1.5">
                                <div
                                  className={`h-full transition-all duration-300 ${
                                    mDone === mTotal ? 'bg-emerald-500' : 'bg-indigo-500'
                                  }`}
                                  style={{ width: `${mPct}%` }}
                                />
                              </div>
                           )}

                           {/* Expandable Checklist with Interactive Checkboxes */}
                           {isExpanded && (
                              <div className="space-y-1.5 mt-2 bg-slate-50/80 p-2 rounded-lg border border-slate-100 animate-fadeIn">
                                {mTotal === 0 ? (
                                   <div className="text-[10px] text-slate-400 italic text-center py-1">
                                      No milestones yet. Click "+ Milestone" to add.
                                   </div>
                                ) : (
                                   (item.milestones || []).map(m => {
                                      const todayStr = new Date().toISOString().split('T')[0];
                                      const isOverdue = !m.completed && m.dueDate < todayStr;
                                      return (
                                         <div 
                                           key={m.id} 
                                           className="flex items-start gap-1.5 text-[11px] group/item"
                                           onClick={(e) => e.stopPropagation()}
                                         >
                                            {/* Interactive completion checkbox */}
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                 e.stopPropagation();
                                                 handleToggleMilestone(item, m.id, m.completed);
                                              }}
                                              className="mt-0.5 text-slate-400 hover:text-indigo-600 flex-shrink-0"
                                              title={m.completed ? 'Mark incomplete' : 'Mark completed'}
                                            >
                                               {m.completed ? (
                                                 <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                                               ) : (
                                                 <Square className="w-3.5 h-3.5 text-slate-300 hover:text-slate-400" />
                                               )}
                                            </button>
                                            <div className="flex-1 min-w-0">
                                               <span className={`block truncate ${m.completed ? 'text-slate-400 line-through' : 'text-slate-700 font-medium'}`}>
                                                  {m.title}
                                               </span>
                                               <div className="flex items-center gap-1 text-[9px] text-slate-400">
                                                  <Calendar className="w-2.5 h-2.5" />
                                                  <span className={isOverdue ? 'text-rose-600 font-bold' : ''}>
                                                    {isOverdue ? `Overdue: ${m.dueDate}` : m.dueDate}
                                                  </span>
                                               </div>
                                            </div>
                                         </div>
                                      );
                                   })
                                )}
                              </div>
                           )}
                        </div>
                      </div>
                     );
                   })}

                   {items.length === 0 && (
                     <div className={`text-center py-10 text-slate-400 text-xs italic border-2 border-dashed rounded mx-2 transition-colors
                       ${dragOverCol === col.key ? 'border-blue-300 bg-blue-50/50 text-blue-500' : 'border-slate-200 bg-slate-50/30'}`}>
                       {dragOverCol === col.key ? 'Drop Here' : 'No active items'}
                     </div>
                   )}
                </div>
              </div>
            );
          })}
            
            {/* Fallback "Other" column for System View if needed */}
            {viewBy === 'system' && (
               <div className="w-[1px] h-full"></div> 
            )}
          </div>
        )}
      </div>

      {/* Quick Add Modal */}
      {isQuickAddOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden animate-fadeIn">
            <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
               <h3 className="font-bold text-slate-700">Quick Add Task</h3>
               <button onClick={() => setIsQuickAddOpen(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <form onSubmit={submitQuickAdd} className="p-4 space-y-4">
               <input 
                 required
                 placeholder="Client Name"
                 className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded text-sm outline-none focus:bg-white focus:border-blue-500"
                 value={quickAddForm.clientName}
                 onChange={e => setQuickAddForm({...quickAddForm, clientName: e.target.value})}
               />

               {/* Time Schedule Inputs */}
               <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded border border-slate-200">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-indigo-500" /> Start Time
                    </label>
                    <input 
                      type="time" 
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono font-bold"
                      value={quickAddForm.startTime}
                      onChange={e => setQuickAddForm({...quickAddForm, startTime: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-indigo-500" /> End Time
                    </label>
                    <input 
                      type="time" 
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono font-bold"
                      value={quickAddForm.endTime}
                      onChange={e => setQuickAddForm({...quickAddForm, endTime: e.target.value})}
                    />
                  </div>
               </div>

               <select 
                 className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded text-sm outline-none focus:bg-white focus:border-blue-500"
                 value={quickAddForm.workType}
                 onChange={e => setQuickAddForm({...quickAddForm, workType: e.target.value})}
               >
                 {workTypes.map(t => <option key={t} value={t}>{t}</option>)}
               </select>
               <div className="relative">
                 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                 <input 
                   required
                   type="number"
                   placeholder="Est. Amount"
                   className="w-full pl-6 pr-3 py-2 bg-slate-100 border border-slate-300 rounded text-sm outline-none focus:bg-white focus:border-blue-500"
                   value={quickAddForm.amount}
                   onChange={e => setQuickAddForm({...quickAddForm, amount: e.target.value})}
                 />
               </div>
               <button type="submit" className="w-full py-2 bg-slate-900 text-white text-sm font-bold rounded hover:bg-slate-800">
                 Add to Board
               </button>
               {onNavigate && (
                 <button
                   type="button"
                   onClick={() => {
                     setIsQuickAddOpen(false);
                     onNavigate('estimator', { startTime: quickAddForm.startTime, endTime: quickAddForm.endTime });
                   }}
                   className="w-full py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold rounded flex items-center justify-center gap-1.5 transition-colors"
                 >
                   <Calculator className="w-3.5 h-3.5 text-indigo-600" /> Draft Full Quote in Estimator
                 </button>
               )}
            </form>
          </div>
        </div>
      )}

      {/* Edit Transaction Modal with Milestones management section */}
      {editTx && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slideUp">
             <div className="p-4 border-b bg-slate-50 flex justify-between items-center sticky top-0 bg-white z-10">
               <div>
                  <h3 className="font-bold text-slate-800">Edit Details & Milestones</h3>
                  <span className="text-xs text-slate-500 font-mono">{editTx.id} • {editTx.clientName}</span>
               </div>
               <button onClick={() => setEditTx(null)}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Status</label>
                <div className="flex gap-2">
                   {['Pending', 'In Progress', 'Completed'].map(s => (
                     <button
                       key={s}
                       onClick={() => setEditTx({...editTx, status: s as any})}
                       className={`flex-1 py-2 text-xs font-bold rounded border transition-colors ${
                         editTx.status === s 
                           ? 'bg-blue-600 text-white border-blue-600' 
                           : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                       }`}
                     >
                       {s}
                     </button>
                   ))}
                </div>
              </div>

              {/* Edit Time Schedule */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                 <div>
                   <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1 flex items-center gap-1">
                     <Clock className="w-3 h-3 text-indigo-500" /> Start Time
                   </label>
                   <input 
                     type="time" 
                     className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold"
                     value={editTx.startTime || '09:00'}
                     onChange={e => setEditTx({...editTx, startTime: e.target.value})}
                   />
                 </div>
                 <div>
                   <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1 flex items-center gap-1">
                     <Clock className="w-3 h-3 text-indigo-500" /> End Time
                   </label>
                   <input 
                     type="time" 
                     className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold"
                     value={editTx.endTime || '17:00'}
                     onChange={e => setEditTx({...editTx, endTime: e.target.value})}
                   />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Amount</label>
                  <input 
                    type="number"
                    value={editTx.amount}
                    onChange={e => setEditTx({...editTx, amount: Number(e.target.value)})}
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded text-sm outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Work Type</label>
                   <select 
                     value={editTx.workType}
                     onChange={e => setEditTx({...editTx, workType: e.target.value})}
                     className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded text-sm outline-none focus:bg-white focus:border-blue-500"
                   >
                     {workTypes.map(t => <option key={t} value={t}>{t}</option>)}
                   </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Notes / Item</label>
                <textarea 
                  rows={2}
                  value={editTx.item}
                  onChange={e => setEditTx({...editTx, item: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded text-sm outline-none focus:bg-white focus:border-blue-500 resize-none"
                />
              </div>

              {/* PROJECT MILESTONES SECTION IN EDIT MODAL */}
              <div className="pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                   <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                     <Target className="w-4 h-4 text-indigo-600" /> Project Milestones
                     <span className="text-[10px] text-slate-500 font-normal">
                       ({(editTx.milestones || []).filter(m => m.completed).length}/{(editTx.milestones || []).length} completed)
                     </span>
                   </h4>
                   <button
                     type="button"
                     onClick={() => handleOpenMilestoneModal(editTx.id)}
                     className="text-xs text-indigo-600 hover:text-indigo-800 font-bold hover:underline"
                   >
                     Manage in Full Hub
                   </button>
                </div>

                {/* List of current milestones */}
                <div className="space-y-1.5 max-h-40 overflow-y-auto mb-3 bg-slate-50 p-2 rounded-lg border border-slate-200">
                  {(!editTx.milestones || editTx.milestones.length === 0) ? (
                    <div className="text-xs text-slate-400 italic text-center py-2">
                      No milestones for this project yet.
                    </div>
                  ) : (
                    editTx.milestones.map(m => (
                      <div key={m.id} className="flex items-center justify-between gap-2 text-xs bg-white p-2 rounded border border-slate-200">
                        <div className="flex items-center gap-2 min-w-0">
                          <button
                            type="button"
                            onClick={() => handleToggleMilestone(editTx, m.id, m.completed)}
                            className="text-slate-400 hover:text-indigo-600"
                          >
                            {m.completed ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300" />
                            )}
                          </button>
                          <span className={`truncate ${m.completed ? 'text-slate-400 line-through' : 'text-slate-800 font-medium'}`}>
                            {m.title}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 shrink-0">
                          Due: {m.dueDate}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* Inline quick add milestone */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="New milestone title..."
                    value={quickMilestoneTitle}
                    onChange={(e) => setQuickMilestoneTitle(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 bg-slate-100 border border-slate-300 rounded text-xs outline-none focus:bg-white focus:border-indigo-500"
                  />
                  <input
                    type="date"
                    value={quickMilestoneDueDate}
                    onChange={(e) => setQuickMilestoneDueDate(e.target.value)}
                    className="w-32 px-2 py-1.5 bg-slate-100 border border-slate-300 rounded text-xs font-mono outline-none focus:bg-white focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddQuickMilestoneToEditTx}
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded text-xs font-bold hover:bg-indigo-700 transition-colors shrink-0"
                  >
                    + Add
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between pt-4 border-t border-slate-100">
                 <button 
                   onClick={() => {
                     if(window.confirm('Delete this record?')) {
                       onDeleteTransaction(editTx.id);
                       setEditTx(null);
                     }
                   }}
                   className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-1"
                 >
                   <Trash2 className="w-4 h-4" /> Delete
                 </button>
                 <div className="flex gap-2">
                    <button onClick={() => setEditTx(null)} className="px-4 py-2 text-slate-600 text-sm font-medium hover:bg-slate-100 rounded">Cancel</button>
                    <button 
                      onClick={() => {
                        onUpdateTransaction(editTx);
                        setEditTx(null);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded hover:bg-blue-700 flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" /> Save Changes
                    </button>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Standalone Milestones Manager Modal */}
      {isMilestoneModalOpen && (
        <MilestonesModal
          isOpen={isMilestoneModalOpen}
          onClose={() => setIsMilestoneModalOpen(false)}
          initialTransactionId={selectedTxForMilestones}
          transactions={data}
          clients={clients}
          onUpdateTransaction={onUpdateTransaction}
        />
      )}
    </div>
  );
};
