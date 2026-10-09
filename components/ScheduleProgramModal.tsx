import React, { useState, useEffect } from 'react';
import { Transaction, ScheduleProgramStatus } from '../types';
import { 
  SCHEDULE_PROGRAM_CONFIG, 
  WORK_SCHEDULE_LEADS, 
  WORK_SCHEDULE_PHASES 
} from '../constants';
import { 
  X, Calendar, Clock, AlertTriangle, AlertOctagon, CheckCircle2, 
  Hammer, Zap, UserCheck, Check, Layers, ArrowRight, ShieldAlert
} from 'lucide-react';

interface ScheduleProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  onSave: (updatedTransaction: Transaction) => void;
}

export const ScheduleProgramModal: React.FC<ScheduleProgramModalProps> = ({
  isOpen,
  onClose,
  transaction,
  onSave
}) => {
  const [scheduleProgram, setScheduleProgram] = useState<ScheduleProgramStatus>('Schedule Lag');
  const [lagDays, setLagDays] = useState<number>(3);
  const [schedulePhase, setSchedulePhase] = useState<string>('Schematic Drawings (ST/AR)');
  const [assignedLead, setAssignedLead] = useState<string>('Dawit Mengistu (Structure)');
  const [targetCompletionDate, setTargetCompletionDate] = useState<string>('');
  const [scheduleNotes, setScheduleNotes] = useState<string>('');

  useEffect(() => {
    if (transaction) {
      setScheduleProgram(transaction.scheduleProgram || 'Under Work');
      setLagDays(transaction.lagDays !== undefined ? transaction.lagDays : 0);
      setSchedulePhase(transaction.schedulePhase || 'Schematic Drawings (ST/AR)');
      setAssignedLead(transaction.assignedLead || 'Dawit Mengistu (Structure)');
      setTargetCompletionDate(transaction.targetCompletionDate || transaction.date || '');
      setScheduleNotes(transaction.scheduleNotes || '');
    }
  }, [transaction]);

  if (!isOpen || !transaction) return null;

  const handleProgramSelect = (prog: ScheduleProgramStatus) => {
    setScheduleProgram(prog);
    if (prog === 'Schedule Lag' && lagDays <= 0) {
      setLagDays(4);
    } else if (prog === 'Critical Lag' && lagDays < 10) {
      setLagDays(14);
    } else if (prog === 'Under Schedule' && lagDays >= 0) {
      setLagDays(-3);
    } else if (prog === 'On Schedule' || prog === 'Completed') {
      setLagDays(0);
    }
  };

  const handleApplyPreset = (days: number, program: ScheduleProgramStatus) => {
    setLagDays(days);
    setScheduleProgram(program);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transaction) return;

    const updatedTx: Transaction = {
      ...transaction,
      scheduleProgram,
      lagDays: Number(lagDays) || 0,
      schedulePhase,
      assignedLead,
      targetCompletionDate,
      scheduleNotes
    };

    onSave(updatedTx);
    onClose();
  };

  const currentConfig = SCHEDULE_PROGRAM_CONFIG[scheduleProgram] || SCHEDULE_PROGRAM_CONFIG['Under Work'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Assign Work Schedule Program & Lag</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-slate-700 text-slate-300">
                  {transaction.id}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Client: <b className="text-white">{transaction.clientName}</b> &bull; {transaction.item}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Inflow Snapshot Card */}
        <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-slate-400 uppercase tracking-wider font-semibold text-[10px]">Client Inflow Value:</span>
            <div className="font-mono font-black text-slate-800 text-sm">
              ${transaction.amount.toLocaleString()} 
              <span className="text-slate-400 text-xs font-normal"> (Received: ${transaction.dilAmount.toLocaleString()})</span>
            </div>
          </div>
          <div>
            <span className="text-slate-400 uppercase tracking-wider font-semibold text-[10px]">Current Status:</span>
            <div className="font-semibold text-slate-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentConfig.dotColor }}></span>
              {transaction.status}
            </div>
          </div>
          <div>
            <span className="text-slate-400 uppercase tracking-wider font-semibold text-[10px]">Work Type:</span>
            <div className="font-medium text-slate-700">{transaction.workType}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Schedule Program Mode Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              1. Work Schedule Program Status & Color Shade
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(['Schedule Lag', 'Critical Lag', 'Under Work', 'Under Schedule', 'On Schedule', 'Completed'] as ScheduleProgramStatus[]).map((prog) => {
                const cfg = SCHEDULE_PROGRAM_CONFIG[prog];
                const isSelected = scheduleProgram === prog;
                return (
                  <button
                    key={prog}
                    type="button"
                    onClick={() => handleProgramSelect(prog)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                      isSelected 
                        ? `${cfg.cardShade} border-blue-500 shadow-xs ring-2 ring-blue-500/20` 
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg.dotColor }}></span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-black uppercase ${cfg.badge}`}>
                        {cfg.tag}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-800 leading-snug">{cfg.label}</div>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1 italic">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: currentConfig.dotColor }}></span>
              {currentConfig.description}
            </p>
          </div>

          {/* Lag / Schedule Deviation Preset & Custom Input */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                2. Program Lag / Advance Days
              </label>
              <span className="text-[10px] text-slate-500 font-medium">
                Positive (+) = Lag Behind | Negative (-) = Under/Ahead
              </span>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[10px] text-slate-400 font-semibold uppercase self-center mr-1">Presets:</span>
              <button
                type="button"
                onClick={() => handleApplyPreset(3, 'Schedule Lag')}
                className={`px-2 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                  lagDays === 3 && scheduleProgram === 'Schedule Lag'
                    ? 'bg-amber-500 text-white border-amber-600'
                    : 'bg-white border-slate-200 text-amber-800 hover:bg-amber-50'
                }`}
              >
                +3d Lag
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset(7, 'Schedule Lag')}
                className={`px-2 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                  lagDays === 7 && scheduleProgram === 'Schedule Lag'
                    ? 'bg-amber-600 text-white border-amber-700'
                    : 'bg-white border-slate-200 text-amber-900 hover:bg-amber-50'
                }`}
              >
                +7d Lag
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset(14, 'Critical Lag')}
                className={`px-2 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                  lagDays === 14 && scheduleProgram === 'Critical Lag'
                    ? 'bg-rose-600 text-white border-rose-700'
                    : 'bg-white border-slate-200 text-rose-800 hover:bg-rose-50'
                }`}
              >
                +14d Critical Lag
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset(0, 'On Schedule')}
                className={`px-2 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                  lagDays === 0
                    ? 'bg-teal-600 text-white border-teal-700'
                    : 'bg-white border-slate-200 text-teal-800 hover:bg-teal-50'
                }`}
              >
                0d On Schedule
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset(-2, 'Under Schedule')}
                className={`px-2 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                  lagDays === -2 && scheduleProgram === 'Under Schedule'
                    ? 'bg-emerald-600 text-white border-emerald-700'
                    : 'bg-white border-slate-200 text-emerald-800 hover:bg-emerald-50'
                }`}
              >
                -2d Under Schedule (Ahead)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset(-5, 'Under Schedule')}
                className={`px-2 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                  lagDays === -5 && scheduleProgram === 'Under Schedule'
                    ? 'bg-emerald-700 text-white border-emerald-800'
                    : 'bg-white border-slate-200 text-emerald-900 hover:bg-emerald-50'
                }`}
              >
                -5d Early
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Lag / Variance in Days:
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={lagDays}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setLagDays(val);
                      if (val > 10 && scheduleProgram !== 'Critical Lag') {
                        setScheduleProgram('Critical Lag');
                      } else if (val > 0 && (scheduleProgram === 'On Schedule' || scheduleProgram === 'Under Schedule')) {
                        setScheduleProgram('Schedule Lag');
                      } else if (val < 0 && scheduleProgram !== 'Under Schedule') {
                        setScheduleProgram('Under Schedule');
                      } else if (val === 0 && (scheduleProgram === 'Schedule Lag' || scheduleProgram === 'Critical Lag')) {
                        setScheduleProgram('On Schedule');
                      }
                    }}
                    className="w-full px-3 py-1.5 text-sm font-mono font-bold rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. 5 for lag, -2 for ahead"
                  />
                  <div className="text-[10px] text-slate-500 mt-1 font-mono">
                    {lagDays > 0 ? (
                      <span className="text-amber-700 font-bold">⚠️ Program is lagging behind by +{lagDays} calendar day(s)</span>
                    ) : lagDays < 0 ? (
                      <span className="text-emerald-700 font-bold">⚡ Program is ahead / under schedule by {Math.abs(lagDays)} calendar day(s)</span>
                    ) : (
                      <span className="text-teal-700 font-bold">✓ Program is perfectly synchronized (0d variance)</span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Target Program Completion:
                </label>
                <input
                  type="date"
                  value={targetCompletionDate}
                  onChange={(e) => setTargetCompletionDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm font-mono rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Assigned Lead Engineer & Program Phase */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                3. Assigned Engineer / Lead
              </label>
              <select
                value={assignedLead}
                onChange={(e) => setAssignedLead(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {WORK_SCHEDULE_LEADS.map((lead) => (
                  <option key={lead} value={lead}>{lead}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-purple-600" />
                4. Schedule Program Phase
              </label>
              <select
                value={schedulePhase}
                onChange={(e) => setSchedulePhase(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {WORK_SCHEDULE_PHASES.map((phase) => (
                  <option key={phase} value={phase}>{phase}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Schedule Program Notes / Cause */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              5. Schedule Program Notes & Variance Justification
            </label>
            <textarea
              rows={2}
              value={scheduleNotes}
              onChange={(e) => setScheduleNotes(e.target.value)}
              placeholder="e.g. Schedule lag caused by revision on foundation rebar specs requested by municipal review board..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-400"
            />
          </div>

          {/* Live Preview Box of Row Shade */}
          <div className="p-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/70">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Live Preview of Inflow Ledger Row Appearance:
            </span>
            <div className={`p-2.5 rounded-lg border flex items-center justify-between text-xs transition-all ${currentConfig.rowShade} ${currentConfig.borderAccent}`}>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${currentConfig.badge}`}>
                  {currentConfig.label}
                </span>
                <span className="font-bold text-slate-800">{transaction.clientName}</span>
                <span className="text-slate-500 font-mono text-[11px]">
                  {lagDays > 0 ? `+${lagDays}d Lag` : (lagDays < 0 ? `${lagDays}d Ahead` : 'On Track')}
                </span>
              </div>
              <div className="text-right font-mono font-bold text-slate-800">
                ${transaction.amount.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-md transition-all cursor-pointer"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Apply Schedule Program & Shade</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
