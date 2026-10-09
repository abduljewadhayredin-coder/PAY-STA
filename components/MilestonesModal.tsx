import React, { useState, useEffect } from 'react';
import { Transaction, Client, Milestone } from '../types';
import { 
  X, Calendar, Target, CheckCircle2, Clock, AlertTriangle, 
  Plus, Trash2, CheckSquare, Square, User, FileText, ArrowRight 
} from 'lucide-react';

interface MilestonesModalProps {
  isOpen: boolean;
  onClose: () => void;
  // If editing for a specific transaction
  initialTransactionId?: string;
  transactions: Transaction[];
  clients: Client[];
  onUpdateTransaction: (transaction: Transaction) => void;
}

const COMMON_MILESTONE_PRESETS = [
  'Site Survey & Geotechnical Soil Test',
  'Schematic & Architectural Concepts',
  'Structural Calculations & Permitting Package',
  'Municipal Council Permit Approval',
  'Foundation & Ground Slab Inspection Signoff',
  'Superstructure Framing & Structural Verification',
  'MEP Rough-in & Sanitary Systems Inspection',
  'Final Inspection & Client Handover Packet'
];

export const MilestonesModal: React.FC<MilestonesModalProps> = ({
  isOpen,
  onClose,
  initialTransactionId,
  transactions,
  clients,
  onUpdateTransaction
}) => {
  const [selectedTxId, setSelectedTxId] = useState<string>(initialTransactionId || transactions[0]?.id || '');
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [completed, setCompleted] = useState(false);
  const [assignedTo, setAssignedTo] = useState('');
  const [notes, setNotes] = useState('');

  // Sync initialTransactionId if passed
  useEffect(() => {
    if (initialTransactionId) {
      setSelectedTxId(initialTransactionId);
    } else if (!selectedTxId && transactions.length > 0) {
      setSelectedTxId(transactions[0].id);
    }
  }, [initialTransactionId, transactions]);

  // Find currently selected transaction
  const selectedTx = transactions.find(t => t.id === selectedTxId) || transactions[0];

  // Set default due date based on selected transaction or today + 14 days
  useEffect(() => {
    if (!dueDate) {
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 14);
      setDueDate(defaultDate.toISOString().split('T')[0]);
    }
    if (selectedTx && !assignedTo) {
      setAssignedTo(selectedTx.assignedLead || '');
    }
  }, [selectedTx]);

  if (!isOpen) return null;

  const currentMilestones = selectedTx?.milestones || [];

  const handleQuickPreset = (preset: string) => {
    setTitle(preset);
  };

  const handleAddDays = (days: number) => {
    const base = new Date();
    base.setDate(base.getDate() + days);
    setDueDate(base.toISOString().split('T')[0]);
  };

  const handleMatchProjectTarget = () => {
    if (selectedTx?.targetCompletionDate) {
      setDueDate(selectedTx.targetCompletionDate);
    }
  };

  const handleToggleMilestone = (mId: string, currentStatus: boolean) => {
    if (!selectedTx) return;
    const nowStr = new Date().toISOString().split('T')[0];
    const updatedList: Milestone[] = (selectedTx.milestones || []).map(m => {
      if (m.id === mId) {
        return {
          ...m,
          completed: !currentStatus,
          completedDate: !currentStatus ? nowStr : undefined
        };
      }
      return m;
    });

    onUpdateTransaction({
      ...selectedTx,
      milestones: updatedList
    });
  };

  const handleDeleteMilestone = (mId: string) => {
    if (!selectedTx) return;
    const updatedList = (selectedTx.milestones || []).filter(m => m.id !== mId);
    onUpdateTransaction({
      ...selectedTx,
      milestones: updatedList
    });
  };

  const handleEditMilestoneClick = (m: Milestone) => {
    setEditingMilestoneId(m.id);
    setTitle(m.title);
    setDueDate(m.dueDate);
    setCompleted(m.completed);
    setAssignedTo(m.assignedTo || selectedTx?.assignedLead || '');
    setNotes(m.notes || '');
  };

  const handleCancelEdit = () => {
    setEditingMilestoneId(null);
    setTitle('');
    setCompleted(false);
    setNotes('');
  };

  const handleSubmitMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTx || !title.trim() || !dueDate) return;

    const nowStr = new Date().toISOString().split('T')[0];

    if (editingMilestoneId) {
      // Update existing milestone
      const updatedList: Milestone[] = (selectedTx.milestones || []).map(m => {
        if (m.id === editingMilestoneId) {
          return {
            ...m,
            title: title.trim(),
            dueDate,
            completed,
            completedDate: completed ? (m.completedDate || nowStr) : undefined,
            assignedTo: assignedTo.trim() || undefined,
            notes: notes.trim() || undefined
          };
        }
        return m;
      });

      onUpdateTransaction({
        ...selectedTx,
        milestones: updatedList
      });
      setEditingMilestoneId(null);
    } else {
      // Create new milestone
      const newMilestone: Milestone = {
        id: `MLS-${Date.now().toString().slice(-6)}`,
        title: title.trim(),
        dueDate,
        completed,
        completedDate: completed ? nowStr : undefined,
        transactionId: selectedTx.id,
        clientId: selectedTx.clientId,
        clientName: selectedTx.clientName,
        assignedTo: assignedTo.trim() || selectedTx.assignedLead || undefined,
        notes: notes.trim() || undefined
      };

      const updatedList = [...(selectedTx.milestones || []), newMilestone];
      onUpdateTransaction({
        ...selectedTx,
        milestones: updatedList
      });
    }

    // Reset inputs
    setTitle('');
    setCompleted(false);
    setNotes('');
  };

  // Completion stats for this transaction
  const totalCount = currentMilestones.length;
  const completedCount = currentMilestones.filter(m => m.completed).length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 rounded-lg border border-blue-400/30">
              <Target className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Project Milestones Manager
                <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/20">
                  Kanban Integration
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Define key deliverables, target completion due dates, and track milestone signoffs.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Project Selector & Summary Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Associated Client Project Transaction Record
            </label>
            <select
              value={selectedTxId}
              onChange={(e) => {
                setSelectedTxId(e.target.value);
                setEditingMilestoneId(null);
              }}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            >
              {transactions.map(t => (
                <option key={t.id} value={t.id}>
                  {t.clientName} — {t.item} ({t.id}) | Val: ${t.amount.toLocaleString()} | {t.status}
                </option>
              ))}
            </select>
          </div>

          {selectedTx && (
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Milestone Progress</span>
                <span className="text-xs font-bold text-slate-800">
                  {completedCount} of {totalCount} completed ({progressPct}%)
                </span>
              </div>
              <div className="w-20 bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
                <div 
                  className={`h-full transition-all duration-500 ${
                    progressPct === 100 ? 'bg-emerald-500' : progressPct > 50 ? 'bg-blue-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Content Body: Split View */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column (5 cols): Add / Edit Milestone Form */}
          <div className="lg:col-span-5 bg-slate-50/80 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
            <form onSubmit={handleSubmitMilestone} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-indigo-600" />
                  {editingMilestoneId ? 'Edit Milestone' : 'Add New Milestone'}
                </h3>
                {editingMilestoneId && (
                  <button 
                    type="button" 
                    onClick={handleCancelEdit} 
                    className="text-xs text-slate-500 hover:text-slate-800 underline"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Milestone Deliverable Title <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Geotechnical Soil Report & Permitting"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {/* Preset suggestions */}
                <div className="mt-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Quick Architecture & Engineering Templates:
                  </span>
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                    {COMMON_MILESTONE_PRESETS.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleQuickPreset(p)}
                        className="text-[10px] px-2 py-0.5 rounded bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 transition-colors text-left"
                      >
                        + {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Due Date & Quick Offsets */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Target Due Date <span className="text-red-500">*</span></span>
                  {selectedTx?.targetCompletionDate && (
                    <button
                      type="button"
                      onClick={handleMatchProjectTarget}
                      className="text-[10px] text-blue-600 hover:underline"
                    >
                      Target: {selectedTx.targetCompletionDate}
                    </button>
                  )}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    required
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <button
                    type="button"
                    onClick={() => handleAddDays(7)}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold"
                  >
                    +7d
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddDays(14)}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold"
                  >
                    +14d
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddDays(30)}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold"
                  >
                    +30d
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddDays(60)}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold"
                  >
                    +60d
                  </button>
                </div>
              </div>

              {/* Assigned Lead */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" /> Assigned Lead / Specialist
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dawit M. (Structure)"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Completion status checkbox */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <label htmlFor="completedCheckbox" className="text-xs font-bold text-slate-800 cursor-pointer block">
                    Completion Status
                  </label>
                  <span className="text-[10px] text-slate-500 block">
                    {completed ? 'Marked as completed & verified' : 'Pending deliverable sign-off'}
                  </span>
                </div>
                <input
                  id="completedCheckbox"
                  type="checkbox"
                  checked={completed}
                  onChange={(e) => setCompleted(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-slate-300 cursor-pointer"
                />
              </div>

              {/* Scope Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-slate-400" /> Deliverables / Verification Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Provide scope criteria or verification checklist..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-2"
              >
                {editingMilestoneId ? (
                  <>Save Milestone Changes</>
                ) : (
                  <>
                    <Plus className="w-4 h-4" /> Add Milestone to Project
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column (7 cols): List of Milestones linked to this transaction record */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">
                  Milestones for {selectedTx?.clientName}
                </h3>
                <span className="text-xs text-slate-500">
                  Linked to Transaction: <span className="font-mono font-bold text-indigo-600">{selectedTx?.id}</span> ({selectedTx?.workType})
                </span>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {currentMilestones.length} Milestones
              </span>
            </div>

            {currentMilestones.length === 0 ? (
              <div className="flex-1 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-8 text-center bg-slate-50/50">
                <Target className="w-10 h-10 text-slate-300 mb-2" />
                <h4 className="font-bold text-slate-700 text-sm mb-1">No Milestones Added Yet</h4>
                <p className="text-xs text-slate-500 max-w-xs mb-4">
                  Add project deliverables and due dates using the form on the left to start tracking milestone progress.
                </p>
                <button
                  type="button"
                  onClick={() => handleQuickPreset('Preliminary Architecture & Schematic Design')}
                  className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  Load Schematic Template
                </button>
              </div>
            ) : (
              <div className="space-y-2.5 overflow-y-auto max-h-[500px] pr-1">
                {currentMilestones.map((m, idx) => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  const isOverdue = !m.completed && m.dueDate < todayStr;
                  const isDueToday = !m.completed && m.dueDate === todayStr;

                  return (
                    <div
                      key={m.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        m.completed 
                          ? 'bg-emerald-50/40 border-emerald-200 text-slate-800' 
                          : isOverdue 
                            ? 'bg-rose-50/40 border-rose-200 text-slate-800' 
                            : 'bg-white border-slate-200 hover:border-blue-200 shadow-sm'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Interactive Checkbox for Completion Status */}
                        <button
                          type="button"
                          onClick={() => handleToggleMilestone(m.id, m.completed)}
                          className="mt-0.5 text-slate-400 hover:text-blue-600 transition-colors flex-shrink-0"
                          title={m.completed ? 'Mark incomplete' : 'Mark completed'}
                        >
                          {m.completed ? (
                            <CheckSquare className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-300 hover:text-slate-400" />
                          )}
                        </button>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-mono text-slate-400">
                              #{idx + 1} • {m.id}
                            </span>

                            {/* Status and Due Date Badges */}
                            <div className="flex items-center gap-1.5">
                              {m.completed ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3" /> Completed
                                  {m.completedDate ? ` (${m.completedDate})` : ''}
                                </span>
                              ) : isOverdue ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                                  <AlertTriangle className="w-3 h-3" /> Overdue ({m.dueDate})
                                </span>
                              ) : isDueToday ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                  <Clock className="w-3 h-3" /> Due Today
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                  <Calendar className="w-3 h-3" /> Due: {m.dueDate}
                                </span>
                              )}
                            </div>
                          </div>

                          <h4 className={`text-xs font-bold mt-1 ${
                            m.completed ? 'text-slate-500 line-through' : 'text-slate-800'
                          }`}>
                            {m.title}
                          </h4>

                          {m.notes && (
                            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 bg-slate-50/80 p-1.5 rounded border border-slate-100">
                              {m.notes}
                            </p>
                          )}

                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                            <span className="flex items-center gap-1 font-medium">
                              <User className="w-3 h-3 text-slate-400" />
                              {m.assignedTo || selectedTx?.assignedLead || 'Unassigned'}
                            </span>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleEditMilestoneClick(m)}
                                className="text-slate-500 hover:text-blue-600 font-semibold"
                              >
                                Edit
                              </button>
                              <span>•</span>
                              <button
                                type="button"
                                onClick={() => handleDeleteMilestone(m.id)}
                                className="text-slate-400 hover:text-rose-600 font-semibold"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span className="font-semibold text-slate-700">Client:</span> {selectedTx?.clientName}
            <span>•</span>
            <span className="font-semibold text-slate-700">Contract:</span> ${selectedTx?.amount?.toLocaleString()}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
