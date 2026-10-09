import React, { useState, useMemo, useEffect } from 'react';
import { Client, Transaction, ViewState } from '../types';
import { 
  Plus, Trash2, Printer, CheckCircle, Calculator, FileText, 
  ArrowRight, Eye, Edit3, Clock, Calendar, MapPin, Check, 
  Layers, ArrowLeft, CalendarDays, KanbanSquare, CreditCard,
  Building, Sparkles, ShieldCheck, Hash, RotateCw, Tag
} from 'lucide-react';

interface EstimatorViewProps {
  workTypes: string[];
  clients: Client[];
  onConvert: (tx: Omit<Transaction, 'id'> & { id?: string }) => void;
  onNavigate?: (view: ViewState, params?: any) => void;
  initialParams?: {
    date?: string;
    startTime?: string;
    endTime?: string;
    clientId?: string;
    workType?: string;
  };
}

interface EstimateItem {
  id: number;
  workType: string;
  description: string;
  quantity: number;
  rate: number;
  estimatedHours?: number;
}

const SCHEDULE_PRESETS = [
  { label: 'Standard Business', start: '09:00', end: '17:00', desc: '8.0 hrs/day' },
  { label: 'Morning Session', start: '08:30', end: '12:30', desc: '4.0 hrs/day' },
  { label: 'Afternoon Shift', start: '13:00', end: '17:00', desc: '4.0 hrs/day' },
  { label: 'Extended Site Day', start: '08:00', end: '18:00', desc: '10.0 hrs/day' },
  { label: 'Site Inspection', start: '10:00', end: '14:00', desc: '4.0 hrs/day' },
  { label: 'Technical Review', start: '14:00', end: '16:30', desc: '2.5 hrs/day' },
];

export const EstimatorView: React.FC<EstimatorViewProps> = ({ 
  workTypes, 
  clients, 
  onConvert, 
  onNavigate,
  initialParams 
}) => {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [selectedClientId, setSelectedClientId] = useState(initialParams?.clientId || '');
  
  // Persistent Sequence Counter for Invoice & Continuity Reference
  const currentYear = new Date().getFullYear();
  const [sequenceNumber, setSequenceNumber] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('aj_invoice_continuity_seq');
      if (saved) return parseInt(saved, 10) || 101;
    } catch (e) {}
    return 101;
  });

  // Invoice Number & Continuity Reference Number
  const [invoicePrefix, setInvoicePrefix] = useState<'INV' | 'EST' | 'QT'>('INV');
  const [invoiceNumber, setInvoiceNumber] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('aj_invoice_continuity_seq');
      const seq = saved ? parseInt(saved, 10) || 101 : 101;
      return `INV-${new Date().getFullYear()}-${String(seq).padStart(4, '0')}`;
    } catch (e) {
      return `INV-${new Date().getFullYear()}-0101`;
    }
  });

  const [continuityRef, setContinuityRef] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('aj_invoice_continuity_seq');
      const seq = saved ? parseInt(saved, 10) || 101 : 101;
      return `AJ-CRN-${new Date().getFullYear()}-${String(seq).padStart(4, '0')}`;
    } catch (e) {
      return `AJ-CRN-${new Date().getFullYear()}-0101`;
    }
  });

  const [items, setItems] = useState<EstimateItem[]>([
    { 
      id: 1, 
      workType: initialParams?.workType || workTypes[0] || 'Structural Analysis', 
      description: 'Initial Engineering Consultation & Site Feasibility', 
      quantity: 1, 
      rate: 1500,
      estimatedHours: 8
    }
  ]);
  
  // Date & Time Scheduling States
  const [date, setDate] = useState(initialParams?.date || new Date().toISOString().split('T')[0]);
  const [targetCompletionDate, setTargetCompletionDate] = useState(() => {
    if (initialParams?.date) {
      const d = new Date(initialParams.date);
      d.setDate(d.getDate() + 7);
      return d.toISOString().split('T')[0];
    }
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });

  const [startTime, setStartTime] = useState(initialParams?.startTime || '09:00');
  const [endTime, setEndTime] = useState(initialParams?.endTime || '17:00');
  const [scheduleLocation, setScheduleLocation] = useState('Headquarters & Project Site');
  const [scheduleNotes, setScheduleNotes] = useState('Standard work schedule (09:00 – 17:00). All on-site inspections comply with municipal structural guidelines.');

  // Financial Modifiers: Default discount set to a realistic value '150' without stuck '0'
  const [taxRate, setTaxRate] = useState<number>(0);
  const [discountInput, setDiscountInput] = useState<string>('150');
  
  const [notes, setNotes] = useState('Payment terms: 50% mobilization advance, 50% upon delivery of engineering drawings.\nQuote valid for 30 calendar days from issue date.');
  const [successMsg, setSuccessMsg] = useState('');
  const [convertedRecord, setConvertedRecord] = useState<Transaction | null>(null);

  // Sync initialParams if they change
  useEffect(() => {
    if (initialParams) {
      if (initialParams.date) setDate(initialParams.date);
      if (initialParams.startTime) setStartTime(initialParams.startTime);
      if (initialParams.endTime) setEndTime(initialParams.endTime);
      if (initialParams.clientId) setSelectedClientId(initialParams.clientId);
    }
  }, [initialParams]);

  const selectedClient = useMemo(() => clients.find(c => c.id === selectedClientId), [clients, selectedClientId]);

  // Duration Calculations
  const durationDetails = useMemo(() => {
    if (!startTime || !endTime) return { hours: 0, minutes: 0, text: 'N/A', totalHours: 0 };
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    
    let diffMinutes = (endH * 60 + (endM || 0)) - (startH * 60 + (startM || 0));
    if (diffMinutes < 0) diffMinutes += 24 * 60; // Overnight shift
    
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    const totalHours = Number((diffMinutes / 60).toFixed(1));
    
    return {
      hours,
      minutes,
      text: `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`.trim(),
      totalHours
    };
  }, [startTime, endTime]);

  // Day span calculation
  const totalDays = useMemo(() => {
    const start = new Date(date);
    const end = new Date(targetCompletionDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return isNaN(diffDays) || diffDays < 1 ? 1 : diffDays;
  }, [date, targetCompletionDate]);

  // Total project estimated hours
  const totalEstimatedProjectHours = useMemo(() => {
    return Number((durationDetails.totalHours * totalDays).toFixed(1));
  }, [durationDetails.totalHours, totalDays]);

  // Financial Calculations with clean numeric parsing
  const subtotal = useMemo(() => items.reduce((acc, item) => acc + (item.quantity * item.rate), 0), [items]);
  const discountAmount = useMemo(() => {
    const parsed = parseFloat(discountInput);
    return isNaN(parsed) || parsed < 0 ? 0 : parsed;
  }, [discountInput]);

  const taxAmount = useMemo(() => Math.max(0, (subtotal - discountAmount) * (taxRate / 100)), [subtotal, discountAmount, taxRate]);
  const grandTotal = useMemo(() => Math.max(0, subtotal - discountAmount + taxAmount), [subtotal, discountAmount, taxAmount]);

  // Format 24h to 12h AM/PM
  const formatTime12 = (timeStr: string) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${displayH}:${String(m).padStart(2, '0')} ${period}`;
  };

  // Next Continuous Sequence Generator
  const handleNextContinuitySequence = () => {
    const nextSeq = sequenceNumber + 1;
    setSequenceNumber(nextSeq);
    setInvoiceNumber(`${invoicePrefix}-${currentYear}-${String(nextSeq).padStart(4, '0')}`);
    setContinuityRef(`AJ-CRN-${currentYear}-${String(nextSeq).padStart(4, '0')}`);
    try {
      localStorage.setItem('aj_invoice_continuity_seq', nextSeq.toString());
    } catch (e) {}
  };

  const handlePrefixChange = (newPrefix: 'INV' | 'EST' | 'QT') => {
    setInvoicePrefix(newPrefix);
    setInvoiceNumber(`${newPrefix}-${currentYear}-${String(sequenceNumber).padStart(4, '0')}`);
  };

  const handleAddItem = () => {
    setItems([...items, { 
      id: Date.now(), 
      workType: workTypes[0] || 'Structural Analysis', 
      description: '', 
      quantity: 1, 
      rate: 0,
      estimatedHours: 4
    }]);
  };

  const handleRemoveItem = (id: number) => {
    if (items.length > 1) {
      setItems(items.filter(i => i.id !== id));
    }
  };

  const updateItem = (id: number, field: keyof EstimateItem, value: any) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const applyPreset = (preset: typeof SCHEDULE_PRESETS[0]) => {
    setStartTime(preset.start);
    setEndTime(preset.end);
  };

  // Quick Preset Discount handlers
  const setQuickDiscount = (val: number) => {
    setDiscountInput(val.toString());
  };

  const setPercentDiscount = (percent: number) => {
    const calc = Math.round((subtotal * percent) / 100);
    setDiscountInput(calc.toString());
  };

  const handleConvertToRecord = () => {
    if (!selectedClient) {
      alert("Please select a client from the registry first.");
      return;
    }

    const description = items.map(i => `${i.quantity}x ${i.workType}`).join(', ');
    const noteAppend = discountAmount > 0 ? ` (Discount: -$${discountAmount.toLocaleString()})` : '';
    const scheduleSummary = `[Schedule: ${startTime} - ${endTime} (${durationDetails.text}/day, ${totalDays}d)]`;

    const newTx: Transaction = {
      id: `TRX-${invoiceNumber}`,
      invoiceNumber: invoiceNumber,
      continuityRef: continuityRef,
      date: date,
      startTime: startTime,
      endTime: endTime,
      targetCompletionDate: targetCompletionDate,
      scheduleNotes: scheduleNotes,
      clientId: selectedClient.id,
      clientName: selectedClient.company,
      category: 'Engineering Services',
      workType: items[0].workType,
      item: `${invoiceNumber} [Ref: ${continuityRef}]: ${description} ${scheduleSummary}${noteAppend}`, 
      status: 'Pending',
      paymentStatus: 'Unpaid',
      isAdvanceReceived: false,
      amount: grandTotal,
      baseAmount: grandTotal,
      dilAmount: 0,
      balanceAmount: grandTotal,
      region: scheduleLocation || 'Headquarters'
    };

    onConvert(newTx);
    setConvertedRecord(newTx);
    
    // Auto-advance continuity sequence for next document
    const nextSeq = sequenceNumber + 1;
    try {
      localStorage.setItem('aj_invoice_continuity_seq', nextSeq.toString());
    } catch (e) {}

    setSuccessMsg(`Invoice #${invoiceNumber} (Continuity Ref: ${continuityRef}) registered successfully with $${discountAmount} discount!`);
  };

  const handlePrint = () => {
    window.print();
  };

  // --- Document Preview Component ---
  const DocumentPreview = () => (
    <div className="bg-white shadow-xl mx-auto max-w-4xl p-10 md:p-14 min-h-[1050px] border border-slate-200 print-area text-slate-800 rounded-sm">
      {/* Header with Continuous Invoice & Continuity Reference */}
      <div className="flex justify-between items-start pb-8 border-b-2 border-slate-900 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-3 h-3 bg-indigo-600 rounded-sm"></span>
            <span className="text-xs font-black tracking-widest uppercase text-indigo-600">Official Consulting Practice</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">
            {invoicePrefix === 'INV' ? 'TAX INVOICE' : invoicePrefix === 'EST' ? 'COST ESTIMATE' : 'COMMERCIAL QUOTATION'}
          </h1>
          
          {/* Continuous Reference Numbers */}
          <div className="mt-2 space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Invoice No:</span>
              <span className="text-sm font-black font-mono text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {invoiceNumber}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Continuity Ref:</span>
              <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                {continuityRef}
              </span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">AJ ARCHITECTS & ENGINEERS</h2>
          <p className="text-xs text-slate-500 font-medium">Consulting Engineering Practice</p>
          <p className="text-xs text-slate-500">Continuity Audit Sequence: #{String(sequenceNumber).padStart(4, '0')}</p>
          <p className="text-xs text-slate-500">ajarchitects.consulting@gmail.com</p>
        </div>
      </div>

      {/* Client & Date Grid */}
      <div className="grid grid-cols-2 gap-8 mb-8 pb-6 border-b border-slate-100">
        <div>
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Bill To / Project Owner</h3>
          {selectedClient ? (
            <div className="text-sm space-y-0.5">
              <p className="font-bold text-slate-900 text-base">{selectedClient.company}</p>
              <p className="text-slate-700">{selectedClient.name}</p>
              <p className="text-slate-500 text-xs">{selectedClient.email}</p>
              <p className="text-slate-500 text-xs">{selectedClient.phone}</p>
            </div>
          ) : (
            <p className="text-sm text-slate-300 italic">[No Client Selected]</p>
          )}
        </div>
        <div className="text-right space-y-1.5 text-xs">
          <div>
            <span className="font-bold text-slate-400 uppercase tracking-wider mr-4">Issue Date:</span>
            <span className="font-mono font-bold text-slate-800">{date}</span>
          </div>
          <div>
            <span className="font-bold text-slate-400 uppercase tracking-wider mr-4">Target Completion:</span>
            <span className="font-mono font-bold text-slate-800">{targetCompletionDate}</span>
          </div>
          <div>
            <span className="font-bold text-slate-400 uppercase tracking-wider mr-4">Quote Valid Until:</span>
            <span className="font-mono text-slate-600">{validUntil}</span>
          </div>
          <div>
            <span className="font-bold text-slate-400 uppercase tracking-wider mr-4">Location / Zone:</span>
            <span className="text-slate-700 font-medium">{scheduleLocation}</span>
          </div>
        </div>
      </div>

      {/* PROJECT TIME SCHEDULE & SHIFT ALLOCATION SECTION */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 mb-8">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Project Schedule & Time Allocation</h3>
          </div>
          <span className="text-[11px] font-mono font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
            Scheduled Shift Window
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="p-2.5 bg-white rounded border border-slate-200">
            <div className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Execution Window</div>
            <div className="font-mono font-bold text-slate-800 text-sm">{formatTime12(startTime)} – {formatTime12(endTime)}</div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">{startTime} to {endTime} (24h)</div>
          </div>
          <div className="p-2.5 bg-white rounded border border-slate-200">
            <div className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Daily Working Hours</div>
            <div className="font-bold text-indigo-600 text-sm">{durationDetails.text}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{durationDetails.totalHours} billable hours/day</div>
          </div>
          <div className="p-2.5 bg-white rounded border border-slate-200">
            <div className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Schedule Span</div>
            <div className="font-bold text-slate-800 text-sm">{totalDays} Calendar Day{totalDays > 1 ? 's' : ''}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{date} to {targetCompletionDate}</div>
          </div>
          <div className="p-2.5 bg-white rounded border border-slate-200">
            <div className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Total Service Hours</div>
            <div className="font-bold text-emerald-600 text-sm">~{totalEstimatedProjectHours} Hours</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Cumulative engineering time</div>
          </div>
        </div>

        {scheduleNotes && (
          <div className="mt-3 text-xs text-slate-600 bg-white/70 p-2.5 rounded border border-slate-200/60">
            <span className="font-bold text-slate-700 mr-1.5">Schedule Protocol:</span>
            {scheduleNotes}
          </div>
        )}
      </div>

      {/* Items Table */}
      <table className="w-full mb-8">
        <thead>
          <tr className="border-b-2 border-slate-900 bg-slate-50 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
            <th className="text-left py-2.5 px-3">Scope & Work Discipline</th>
            <th className="text-center py-2.5 px-2 w-20">Est. Hours</th>
            <th className="text-right py-2.5 px-2 w-16">Qty</th>
            <th className="text-right py-2.5 px-3 w-28">Rate</th>
            <th className="text-right py-2.5 px-3 w-32">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 text-xs">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-slate-50/50">
              <td className="py-3 px-3">
                <p className="font-bold text-slate-900 text-sm">{item.workType}</p>
                <p className="text-slate-500 mt-0.5">{item.description || 'Standard technical deliverables & verification.'}</p>
              </td>
              <td className="py-3 px-2 text-center font-mono text-slate-600">{item.estimatedHours ? `${item.estimatedHours}h` : '-'}</td>
              <td className="py-3 px-2 text-right font-mono text-slate-700">{item.quantity}</td>
              <td className="py-3 px-3 text-right font-mono text-slate-700">${item.rate.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">${(item.quantity * item.rate).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Financial Totals with explicit Discount deduction */}
      <div className="flex justify-end mb-10">
        <div className="w-80 space-y-2 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Engineering Subtotal</span>
            <span className="font-mono font-semibold">${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>

          {discountAmount > 0 ? (
            <div className="flex justify-between text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
              <span className="flex items-center gap-1">
                <Tag className="w-3 h-3" /> Special Client Discount
              </span>
              <span className="font-mono">-${discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          ) : (
            <div className="flex justify-between text-slate-400">
              <span>Applied Discount</span>
              <span className="font-mono">$0.00</span>
            </div>
          )}

          {taxRate > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>VAT / Municipal Tax ({taxRate}%)</span>
              <span className="font-mono">${taxAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="border-t-2 border-slate-900 pt-2 flex justify-between text-sm font-black text-slate-900">
            <span>Grand Total (USD)</span>
            <span className="font-mono text-indigo-700 text-base">${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Terms & Notes */}
      {notes && (
        <div className="border-t border-slate-200 pt-6 mb-12">
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Terms of Agreement & Mobilization Conditions</h4>
          <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">{notes}</p>
        </div>
      )}

      {/* Sign-off Block */}
      <div className="border-t border-slate-200 pt-8 mt-12 grid grid-cols-2 gap-12 text-xs">
        <div>
          <div className="h-14 border-b border-slate-300"></div>
          <p className="mt-2 font-bold text-slate-800">Authorized Signature — AJ Architects</p>
          <p className="text-slate-400 text-[10px]">Audit Reference: {continuityRef}</p>
        </div>
        <div>
          <div className="h-14 border-b border-slate-300"></div>
          <p className="mt-2 font-bold text-slate-800">Client Acceptance Signature</p>
          <p className="text-slate-400 text-[10px]">{selectedClient?.company || 'Client Representative'}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-800">Invoice & Quote Estimator</h2>
                <span className="font-mono text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded">
                  Seq #{String(sequenceNumber).padStart(4, '0')}
                </span>
              </div>
              <p className="text-xs text-slate-500">Continuous reference numbering, custom discount values, and shift time scheduling.</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {mode === 'edit' ? (
            <button 
              onClick={() => setMode('preview')}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors text-xs shadow-xs"
            >
              <Eye className="w-4 h-4 text-slate-500" /> Preview Invoice Document
            </button>
          ) : (
            <>
              <button 
                onClick={() => setMode('edit')}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors text-xs shadow-xs"
              >
                <Edit3 className="w-4 h-4 text-slate-500" /> Edit Specifications
              </button>
              <button 
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors text-xs shadow-sm"
              >
                <Printer className="w-4 h-4" /> Print / Save PDF
              </button>
            </>
          )}
        </div>
      </div>

      {/* Success Banner with Instant Navigation Links */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl shadow-xs space-y-3 animate-fadeIn no-print">
          <div className="flex items-center gap-2 font-bold text-sm">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>

          {convertedRecord && onNavigate && (
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-emerald-200/60">
              <span className="text-xs font-semibold text-emerald-700">Quick Jump:</span>
              <button 
                onClick={() => onNavigate('calendar', { date: convertedRecord.date })}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold hover:bg-indigo-50 shadow-2xs transition-all"
              >
                <CalendarDays className="w-3.5 h-3.5 text-indigo-500" /> View in Calendar ({convertedRecord.date})
              </button>
              <button 
                onClick={() => onNavigate('kanban')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-blue-700 border border-blue-200 rounded-lg text-xs font-bold hover:bg-blue-50 shadow-2xs transition-all"
              >
                <KanbanSquare className="w-3.5 h-3.5 text-blue-500" /> Track on Kanban Board
              </button>
              <button 
                onClick={() => onNavigate('payments')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-700 border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-50 shadow-2xs transition-all"
              >
                <CreditCard className="w-3.5 h-3.5 text-slate-500" /> Open Payment Ledger
              </button>
              <button 
                onClick={() => onNavigate('clients', { clientId: convertedRecord.clientId })}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold hover:bg-emerald-50 shadow-2xs transition-all"
              >
                <Building className="w-3.5 h-3.5 text-emerald-500" /> Client Profile
              </button>
            </div>
          )}
        </div>
      )}

      {mode === 'preview' ? (
        <DocumentPreview />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form Section */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 0. INVOICE NUMBER & CONTINUITY REFERENCE NUMBER SECTION */}
            <div className="bg-white border-2 border-slate-200 rounded-xl shadow-xs p-5 md:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-slate-900 text-white rounded-md">
                    <Hash className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                      Invoice & Continuity Reference Setup
                    </h3>
                    <p className="text-xs text-slate-500">Continuous sequential numbering for audit trail and commercial tracking.</p>
                  </div>
                </div>

                <button 
                  type="button"
                  onClick={handleNextContinuitySequence}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-200"
                  title="Generate next sequential continuity reference number"
                >
                  <RotateCw className="w-3 h-3 text-indigo-600" /> Next Sequence (+1)
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Prefix Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Document Type</label>
                  <div className="flex rounded-lg border border-slate-300 p-0.5 bg-slate-50">
                    {(['INV', 'EST', 'QT'] as const).map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => handlePrefixChange(p)}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                          invoicePrefix === p ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">INV: Invoice | EST: Estimate | QT: Quote</span>
                </div>

                {/* Invoice Number Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Invoice Number</label>
                  <input 
                    type="text" 
                    value={invoiceNumber}
                    onChange={e => setInvoiceNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g. INV-2026-0101"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Unique Commercial Identifier</span>
                </div>

                {/* Continuity Reference Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Continuity Reference Number</label>
                  <input 
                    type="text" 
                    value={continuityRef}
                    onChange={e => setContinuityRef(e.target.value)}
                    className="w-full px-3 py-2 bg-indigo-50/50 border border-indigo-200 rounded-lg font-mono font-bold text-xs text-indigo-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g. AJ-CRN-2026-0101"
                  />
                  <span className="text-[10px] text-indigo-600/80 mt-1 block">Master Audit Trail Sequence #{String(sequenceNumber).padStart(4, '0')}</span>
                </div>
              </div>
            </div>

            {/* 1. Client & Dates */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-5 md:p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                <Building className="w-4 h-4 text-indigo-600" /> 1. Client & Quotation Dates
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Select Client</label>
                  <select 
                    value={selectedClientId}
                    onChange={e => setSelectedClientId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-800"
                  >
                    <option value="">-- Choose Client from Registry --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.company} ({c.name})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Issue Date</label>
                    <input 
                      type="date" 
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Target Completion</label>
                    <input 
                      type="date" 
                      value={targetCompletionDate}
                      onChange={e => setTargetCompletionDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Project Location / Region</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      value={scheduleLocation}
                      onChange={e => setScheduleLocation(e.target.value)}
                      placeholder="e.g. Headquarters & Site Inspection"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Quote Validity Until</label>
                  <input 
                    type="date" 
                    value={validUntil}
                    onChange={e => setValidUntil(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* 2. TIME SCHEDULE & START / END TIME FUNCTION */}
            <div className="bg-white border-2 border-indigo-200 rounded-xl shadow-xs p-5 md:p-6 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full blur-2xl -z-0"></div>

              <div className="flex items-center justify-between border-b border-slate-100 pb-2 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-600 text-white rounded-md">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                      2. Time Schedule & Shift Hours Function
                    </h3>
                    <p className="text-xs text-slate-500">Configure daily working hours, shift start time, end time, and schedule presets.</p>
                  </div>
                </div>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full border border-indigo-200">
                  <Sparkles className="w-3 h-3 text-indigo-500" /> Active Scheduler
                </span>
              </div>

              {/* Quick Presets */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Quick Shift Presets</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {SCHEDULE_PRESETS.map((preset) => {
                    const isSelected = startTime === preset.start && endTime === preset.end;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => applyPreset(preset)}
                        className={`p-2 rounded-lg text-left border transition-all text-xs flex flex-col justify-between ${
                          isSelected 
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' 
                            : 'bg-slate-50 hover:bg-indigo-50/60 border-slate-200 text-slate-700 hover:border-indigo-200'
                        }`}
                      >
                        <span className="font-bold truncate text-[11px]">{preset.label}</span>
                        <span className={`text-[10px] mt-1 font-mono ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                          {preset.start} - {preset.end}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Start Time & End Time Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" /> Start Time (HH:mm)
                  </label>
                  <input 
                    type="time" 
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-500">Starts at {formatTime12(startTime) || 'N/A'}</span>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" /> End Time (HH:mm)
                  </label>
                  <input 
                    type="time" 
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-500">Concludes at {formatTime12(endTime) || 'N/A'}</span>
                </div>

                {/* Real-time Schedule Metric Display */}
                <div className="bg-indigo-50/70 p-3.5 rounded-lg border border-indigo-200 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
                    <span>Computed Duration</span>
                    <span className="text-indigo-600 text-base font-black font-mono">{durationDetails.text}</span>
                  </div>
                  <div className="space-y-0.5 text-[11px] text-indigo-800 pt-1 border-t border-indigo-200/60">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Daily Hours:</span>
                      <span className="font-bold">{durationDetails.totalHours} hrs</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total Work Days:</span>
                      <span className="font-bold">{totalDays} day{totalDays > 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex justify-between font-bold text-emerald-700">
                      <span>Total Est. Hours:</span>
                      <span>~{totalEstimatedProjectHours} hrs</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Schedule Protocol & Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Schedule Protocol & Working Hours Description
                </label>
                <textarea 
                  rows={2}
                  value={scheduleNotes}
                  onChange={e => setScheduleNotes(e.target.value)}
                  placeholder="e.g. Daily schedule 09:00 - 17:00, including structural on-site surveys and technical review."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs outline-none focus:bg-white focus:border-indigo-500 resize-none text-slate-800"
                />
              </div>
            </div>

            {/* 3. Line Items & Discipline Scopes */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-5 md:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" /> 3. Bill of Quantities / Scope Deliverables
                </h3>
                <button 
                  type="button"
                  onClick={handleAddItem}
                  className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Scope Item
                </button>
              </div>

              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2.5 items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div className="col-span-1 text-xs font-mono font-bold text-slate-400 text-center">#{index + 1}</div>

                    <div className="col-span-11 sm:col-span-3">
                      <select 
                        value={item.workType}
                        onChange={e => updateItem(item.id, 'workType', e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-md font-medium text-slate-800"
                      >
                        {workTypes.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>

                    <div className="col-span-12 sm:col-span-4">
                      <input 
                        type="text" 
                        placeholder="Description of engineering work / task"
                        value={item.description}
                        onChange={e => updateItem(item.id, 'description', e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-slate-800"
                      />
                    </div>

                    <div className="col-span-4 sm:col-span-1">
                      <input 
                        type="number" 
                        placeholder="Qty"
                        min="1"
                        value={item.quantity}
                        onChange={e => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                        className="w-full text-xs px-2 py-1.5 bg-white border border-slate-300 rounded-md text-center font-mono"
                        title="Quantity"
                      />
                    </div>

                    <div className="col-span-4 sm:col-span-1">
                      <input 
                        type="number" 
                        placeholder="Est. Hours"
                        min="0"
                        value={item.estimatedHours || 0}
                        onChange={e => updateItem(item.id, 'estimatedHours', parseFloat(e.target.value) || 0)}
                        className="w-full text-xs px-2 py-1.5 bg-white border border-slate-300 rounded-md text-center font-mono"
                        title="Estimated Hours for this item"
                      />
                    </div>

                    <div className="col-span-3 sm:col-span-2">
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                        <input 
                          type="number" 
                          placeholder="Rate"
                          min="0"
                          value={item.rate}
                          onChange={e => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                          className="w-full text-xs pl-5 pr-2 py-1.5 bg-white border border-slate-300 rounded-md text-right font-mono"
                        />
                      </div>
                    </div>

                    <div className="col-span-1 flex justify-end">
                      <button 
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-slate-400 hover:text-red-500 p-1 transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Commercial Terms & Custom Discount (Removed literal 0, supports clean numbers & presets) */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-5 md:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Tag className="w-4 h-4 text-emerald-600" /> 4. Commercial Terms & Custom Discount
                </h3>
                <span className="text-xs text-slate-400">Clean input without sticky zeros</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Discount Input Area */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Discount Amount ($)
                    </label>
                    <span className="text-xs font-mono font-bold text-emerald-600">
                      Applied: -${discountAmount.toLocaleString()}
                    </span>
                  </div>

                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                    <input 
                      type="text"
                      inputMode="decimal"
                      value={discountInput}
                      onChange={e => {
                        let val = e.target.value.replace(/[^0-9.]/g, '');
                        // Strip leading zero if typing another digit (e.g. '050' -> '50')
                        if (val.length > 1 && val.startsWith('0') && val[1] !== '.') {
                          val = val.replace(/^0+/, '');
                        }
                        setDiscountInput(val);
                      }}
                      onFocus={e => {
                        if (discountInput === '0') setDiscountInput('');
                        e.target.select();
                      }}
                      placeholder="Enter discount amount"
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  {/* Quick Preset Buttons for Discount */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase mr-1">Presets:</span>
                    {[50, 100, 150, 250, 500].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setQuickDiscount(val)}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border transition-all ${
                          discountAmount === val 
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs' 
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                        }`}
                      >
                        ${val}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setPercentDiscount(5)}
                      className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200"
                    >
                      5%
                    </button>
                    <button
                      type="button"
                      onClick={() => setPercentDiscount(10)}
                      className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200"
                    >
                      10%
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscountInput('')}
                      className="px-2 py-0.5 rounded text-[11px] font-sans font-medium text-slate-400 hover:text-red-500 hover:bg-red-50"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Tax Rate */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Tax / VAT Rate (%)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      min="0"
                      max="100"
                      value={taxRate === 0 ? '' : taxRate}
                      placeholder="0"
                      onChange={e => setTaxRate(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">%</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Applicable municipal service sales tax</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Payment Terms & Quote Conditions</label>
                <textarea 
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs outline-none focus:bg-white resize-none text-slate-800"
                />
              </div>
            </div>

          </div>

          {/* Sidebar Summary & Conversion Action */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 sticky top-20 space-y-6">
              
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">{invoiceNumber}</h3>
                  <p className="text-xs text-indigo-600 font-mono font-bold">Ref: {continuityRef}</p>
                </div>
              </div>

              {/* Schedule & Identification Summary Card */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5 text-xs">
                <div className="flex items-center justify-between font-bold text-slate-700">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Hash className="w-3.5 h-3.5 text-indigo-600" /> Sequence ID:
                  </span>
                  <span className="font-mono text-indigo-700">#{String(sequenceNumber).padStart(4, '0')}</span>
                </div>
                <div className="flex items-center justify-between font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Issue Date:
                  </span>
                  <span className="font-mono text-slate-800">{date}</span>
                </div>
                <div className="flex items-center justify-between font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" /> Shift Hours:
                  </span>
                  <span className="font-mono text-indigo-700">{startTime} - {endTime}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Daily Span:</span>
                  <span className="font-bold text-slate-700">{durationDetails.text} ({durationDetails.totalHours}h)</span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Target Delivery:</span>
                  <span className="font-bold text-slate-700">{targetCompletionDate}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] font-bold text-emerald-700">
                  <span>Est. Project Service Hours:</span>
                  <span>~{totalEstimatedProjectHours} hrs</span>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Engineering Subtotal</span>
                  <span className="font-bold font-mono text-slate-800">${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded">
                    <span>Applied Discount</span>
                    <span className="font-mono">-${discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {taxRate > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Tax ({taxRate}%)</span>
                    <span className="font-mono">${taxAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="h-px bg-slate-200 my-2"></div>
                <div className="flex justify-between text-base">
                  <span className="font-black text-slate-800">Grand Total</span>
                  <span className="font-black font-mono text-indigo-600 text-lg">${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* Conversion Actions */}
              <div className="space-y-2.5 pt-2">
                <button 
                  type="button"
                  onClick={handleConvertToRecord}
                  className="w-full py-3 bg-slate-900 text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                >
                  Convert to Pending Record <ArrowRight className="w-4 h-4" />
                </button>

                <button 
                  type="button"
                  onClick={() => setMode('preview')}
                  className="w-full py-2.5 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4 text-slate-500" /> Preview Invoice Document
                </button>
              </div>

              {/* Helpful Integration Tip */}
              <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 text-[11px] text-slate-500 space-y-1">
                <p className="font-bold text-indigo-900 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> Continuous Audit Trail
                </p>
                <p>
                  Every generated quote is registered under sequence <span className="font-mono font-bold text-indigo-700">#{String(sequenceNumber).padStart(4, '0')}</span> and links to Master Schedule, Kanban, and Payment Ledger.
                </p>
              </div>

            </div>
          </div>

        </div>
      )}
    </div>
  );
};
