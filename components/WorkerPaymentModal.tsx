import React, { useState, useEffect } from 'react';
import { WorkerPayment, WorkerDiscipline, Transaction } from '../types';
import { WORKER_DISCIPLINES, DISCIPLINE_METADATA } from '../constants';
import { X, DollarSign, Calendar, User, Briefcase, FileText, CheckCircle, CreditCard, Building } from 'lucide-react';

interface WorkerPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payment: Omit<WorkerPayment, 'id'>, id?: string) => void;
  existingPayment?: WorkerPayment | null;
  transactions?: Transaction[];
  initialDiscipline?: WorkerDiscipline;
}

export const WorkerPaymentModal: React.FC<WorkerPaymentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingPayment,
  transactions = [],
  initialDiscipline = 'Structure'
}) => {
  const [workerName, setWorkerName] = useState(existingPayment?.workerName || '');
  const [discipline, setDiscipline] = useState<WorkerDiscipline>(existingPayment?.discipline || initialDiscipline);
  const [role, setRole] = useState(existingPayment?.role || 'Structural Engineer');
  const [selectedTxId, setSelectedTxId] = useState(existingPayment?.transactionId || '');
  const [amount, setAmount] = useState(existingPayment ? existingPayment.amount.toString() : '');
  const [date, setDate] = useState(existingPayment?.date || new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'Bank Transfer' | 'Cash' | 'Cheque' | 'Credit Card' | 'Other'>(existingPayment?.paymentMethod || 'Bank Transfer');
  const [status, setStatus] = useState<'Paid' | 'Pending' | 'Scheduled'>(existingPayment?.status || 'Paid');
  const [notes, setNotes] = useState(existingPayment?.notes || '');
  const [error, setError] = useState('');

  // Sync state on open or existingPayment / initialDiscipline change
  useEffect(() => {
    if (isOpen) {
      if (existingPayment) {
        setWorkerName(existingPayment.workerName || '');
        setDiscipline(existingPayment.discipline || 'Structure');
        setRole(existingPayment.role || 'Structural Engineer');
        setSelectedTxId(existingPayment.transactionId || '');
        setAmount(existingPayment.amount !== undefined ? existingPayment.amount.toString() : '');
        setDate(existingPayment.date || new Date().toISOString().split('T')[0]);
        setPaymentMethod(existingPayment.paymentMethod || 'Bank Transfer');
        setStatus(existingPayment.status || 'Paid');
        setNotes(existingPayment.notes || '');
      } else {
        setWorkerName('');
        const d = initialDiscipline || 'Structure';
        setDiscipline(d);
        switch (d) {
          case 'Structure':
            setRole('Structural Engineer');
            break;
          case 'Sanitary':
            setRole('Sanitary & Plumbing Engineer');
            break;
          case 'Electrical':
            setRole('Electrical Systems Engineer');
            break;
          case 'Architecture':
            setRole('Architect / CAD Designer');
            break;
          case 'Site Supervision':
            setRole('Site QA/QC Inspector');
            break;
          case 'Mechanical':
            setRole('HVAC & Mechanical Engineer');
            break;
          default:
            setRole('Consulting Engineer');
            break;
        }
        setSelectedTxId('');
        setAmount('');
        setDate(new Date().toISOString().split('T')[0]);
        setPaymentMethod('Bank Transfer');
        setStatus('Paid');
        setNotes('');
      }
      setError('');
    }
  }, [isOpen, existingPayment, initialDiscipline]);

  if (!isOpen) return null;

  // Auto-populate default role when discipline changes if role is generic
  const handleDisciplineChange = (newDiscipline: WorkerDiscipline) => {
    setDiscipline(newDiscipline);
    switch (newDiscipline) {
      case 'Structure':
        if (!role || role.includes('Engineer') || role.includes('Drafter')) setRole('Structural Engineer');
        break;
      case 'Sanitary':
        if (!role || role.includes('Engineer') || role.includes('Drafter')) setRole('Sanitary & Plumbing Engineer');
        break;
      case 'Electrical':
        if (!role || role.includes('Engineer') || role.includes('Drafter')) setRole('Electrical Systems Engineer');
        break;
      case 'Architecture':
        if (!role || role.includes('Engineer') || role.includes('Drafter')) setRole('Architect / CAD Designer');
        break;
      case 'Site Supervision':
        if (!role || role.includes('Engineer') || role.includes('Drafter')) setRole('Site QA/QC Inspector');
        break;
      case 'Mechanical':
        if (!role || role.includes('Engineer') || role.includes('Drafter')) setRole('HVAC & Mechanical Engineer');
        break;
      default:
        break;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!workerName.trim()) {
      setError('Worker name is required.');
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid payment amount greater than 0.');
      return;
    }

    const linkedTx = transactions.find(t => t.id === selectedTxId);

    onSave({
      workerName: workerName.trim(),
      discipline,
      role: role.trim() || `${discipline} Specialist`,
      transactionId: selectedTxId || undefined,
      clientName: linkedTx?.clientName || existingPayment?.clientName,
      projectItem: linkedTx?.item || existingPayment?.projectItem,
      date,
      amount: numAmount,
      paymentMethod,
      status,
      notes: notes.trim()
    }, existingPayment?.id);

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden my-8">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-600/30 border border-blue-400/40 text-blue-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                {existingPayment ? 'Edit Worker Payment' : 'Log Employed Worker Payment (Outcome)'}
              </h3>
              <p className="text-xs text-slate-400">
                Disburse payroll to Structure, Sanitary, Electrical, or Architecture staff
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto excel-scrollbar">
          {error && (
            <div className="p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-lg">
              {error}
            </div>
          )}

          {/* Discipline Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Engineering Discipline / Specialty *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {WORKER_DISCIPLINES.slice(0, 4).map((disc) => {
                const meta = DISCIPLINE_METADATA[disc];
                const isSelected = discipline === disc;
                return (
                  <button
                    key={disc}
                    type="button"
                    onClick={() => handleDisciplineChange(disc)}
                    className={`py-2 px-2.5 rounded-lg border text-xs font-bold transition-all text-center flex flex-col items-center gap-1 cursor-pointer ${
                      isSelected 
                        ? `${meta.bg} ${meta.border} ${meta.text} ring-2 ring-blue-500 shadow-xs` 
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>{disc}</span>
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {WORKER_DISCIPLINES.slice(4).map((disc) => {
                const meta = DISCIPLINE_METADATA[disc];
                const isSelected = discipline === disc;
                return (
                  <button
                    key={disc}
                    type="button"
                    onClick={() => handleDisciplineChange(disc)}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-medium transition-all text-center cursor-pointer ${
                      isSelected 
                        ? `${meta.bg} ${meta.border} ${meta.text} ring-2 ring-blue-500 shadow-xs` 
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {disc}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Worker Name & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Worker Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={workerName}
                  onChange={(e) => setWorkerName(e.target.value)}
                  placeholder="e.g. Dawit Mengistu"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Role / Title
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Senior Structural Engineer"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Amount ($ Outcome) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-mono font-bold transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Disbursement Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Link to Client Project */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span>Link to Client Project (Optional)</span>
              <span className="text-[10px] text-slate-400">Integrates with Client Income System</span>
            </label>
            <div className="relative">
              <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={selectedTxId}
                onChange={(e) => setSelectedTxId(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              >
                <option value="">-- General Firm Overhead / Unassigned --</option>
                {transactions.map((tx) => (
                  <option key={tx.id} value={tx.id}>
                    {tx.clientName} • {tx.item} (${tx.amount.toLocaleString()} Inflow)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Payment Method & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Method
              </label>
              <div className="relative">
                <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                >
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Cash">Cash</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className={`w-full px-3 py-2 text-xs rounded-lg border font-semibold outline-none transition-all ${
                  status === 'Paid' 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                    : (status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-300' : 'bg-blue-50 text-blue-700 border-blue-300')
                }`}
              >
                <option value="Paid">Paid (Disbursed)</option>
                <option value="Pending">Pending Approval</option>
                <option value="Scheduled">Scheduled</option>
              </select>
            </div>
          </div>

          {/* Scope / Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Work Description / Engineering Scope
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Completed structural slab beam analysis, sanitary line routing, or electrical single-line diagram."
              className="w-full p-2.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{existingPayment ? 'Update Payment' : 'Record Worker Outcome'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
