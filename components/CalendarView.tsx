
import React, { useState, useMemo } from 'react';
import { Transaction, ViewState } from '../types';
import { ChevronLeft, ChevronRight, Calendar as CalIcon, Plus, X, DollarSign, Clock, CheckCircle, AlertCircle, RotateCw, Calculator } from 'lucide-react';
import { STATUS_STYLES } from '../constants';

interface CalendarViewProps {
  data: Transaction[];
  onRecordPayment: (transaction: Omit<Transaction, 'id'> & { id?: string }) => void;
  onNavigate?: (view: ViewState, params?: any) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ data, onRecordPayment, onNavigate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Modals State
  const [selectedDayDetails, setSelectedDayDetails] = useState<{ date: string, events: Transaction[] } | null>(null);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddDate, setQuickAddDate] = useState<string>('');
  
  // Quick Add Form State
  const [quickAddForm, setQuickAddForm] = useState({
    clientName: '',
    workType: 'General',
    amount: '',
    status: 'Pending',
    startTime: '09:00',
    endTime: '17:00'
  });

  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return new Date(year, month + 1, 0).getDate();
  }, [currentDate]);

  const firstDayOfMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return new Date(year, month, 1).getDay();
  }, [currentDate]);

  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, currentDate.getMonth() + 1, 1));
  };

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return data.filter(t => t.date === dateStr);
  };

  const getDailyRevenue = (events: Transaction[]) => {
    return events.reduce((sum, t) => sum + t.amount, 0);
  };

  const openQuickAdd = (e: React.MouseEvent, day: number) => {
    e.stopPropagation();
    const dateStr = `${year}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setQuickAddDate(dateStr);
    setIsQuickAddOpen(true);
  };

  const submitQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    onRecordPayment({
      id: `TRX-CAL-${Date.now()}`,
      date: quickAddDate,
      startTime: quickAddForm.startTime || '09:00',
      endTime: quickAddForm.endTime || '17:00',
      clientId: 'C-QUICK-' + Date.now(),
      clientName: quickAddForm.clientName || 'Unassigned',
      category: 'Scheduled Task',
      workType: quickAddForm.workType,
      item: 'Scheduled via Calendar',
      status: quickAddForm.status as any,
      paymentStatus: 'Unpaid',
      isAdvanceReceived: false,
      amount: Number(quickAddForm.amount) || 0,
      baseAmount: Number(quickAddForm.amount) || 0,
      dilAmount: 0,
      balanceAmount: Number(quickAddForm.amount) || 0,
      region: 'Headquarters'
    });
    // Reset
    setIsQuickAddOpen(false);
    setQuickAddForm({ clientName: '', workType: 'General', amount: '', status: 'Pending', startTime: '09:00', endTime: '17:00' });
  };

  // Status dot color helper
  const getStatusDotColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-emerald-500';
      case 'In Progress': return 'bg-blue-500';
      case 'Pending': return 'bg-amber-500';
      case 'On Hold': return 'bg-violet-500';
      case 'Cancelled': return 'bg-rose-500';
      default: return 'bg-slate-400';
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col animate-fadeIn bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden relative">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-white border border-slate-200 rounded-md shadow-sm">
            <CalIcon className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">{monthName} {year}</h2>
            <p className="text-xs text-slate-500 font-medium">Master Schedule & Revenue Map</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-white hover:shadow-sm rounded transition-all border border-transparent hover:border-slate-200">
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <button onClick={() => setCurrentDate(new Date())} className="text-xs font-bold px-3 py-1.5 bg-white border border-slate-200 rounded text-slate-600 hover:text-indigo-600 shadow-sm">
            Today
          </button>
          <button onClick={handleNextMonth} className="p-2 hover:bg-white hover:shadow-sm rounded transition-all border border-transparent hover:border-slate-200">
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Grid Header */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="py-2 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Grid Body */}
      <div className="flex-1 grid grid-cols-7 grid-rows-6">
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-slate-50/30 border-b border-r border-slate-100 min-h-[100px]" />
        ))}
        
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const events = getEventsForDay(day);
          const dailyRevenue = getDailyRevenue(events);
          const isToday = new Date().toDateString() === new Date(year, currentDate.getMonth(), day).toDateString();
          const dateStr = `${year}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          
          return (
            <div 
              key={day} 
              onClick={() => events.length > 0 && setSelectedDayDetails({ date: dateStr, events })}
              className={`border-b border-r border-slate-100 p-2 min-h-[100px] overflow-hidden group hover:bg-slate-50 transition-colors relative cursor-pointer ${isToday ? 'bg-indigo-50/30' : ''}`}
            >
              {/* Day Number and Quick Add */}
              <div className="flex justify-between items-start mb-1">
                <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500'}`}>
                  {day}
                </span>
                <button 
                  onClick={(e) => openQuickAdd(e, day)}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded p-0.5 transition-all"
                  title="Add Task"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              {/* Events Visualization */}
              <div className="space-y-1 mb-4">
                {events.slice(0, 3).map(event => (
                  <div key={event.id} className="flex items-center justify-between text-[10px] pr-1 py-0.5 px-1 rounded bg-slate-50/80 hover:bg-indigo-50 border border-slate-100">
                    <div className="flex items-center gap-1.5 truncate">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${getStatusDotColor(event.status)}`} />
                      <span className="truncate text-slate-700 font-medium">{event.clientName}</span>
                    </div>
                    {event.startTime && (
                      <span className="text-[9px] text-slate-400 font-mono shrink-0">
                        {event.startTime}
                      </span>
                    )}
                  </div>
                ))}
                {events.length > 3 && (
                  <div className="pl-3.5 text-[9px] text-slate-400 font-medium">
                    + {events.length - 3} more
                  </div>
                )}
              </div>

              {/* Financial Overlay */}
              {dailyRevenue > 0 && (
                <div className="absolute bottom-1 right-1">
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 shadow-sm">
                    ${dailyRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {/* Fill remaining cells */}
        {Array.from({ length: 42 - (daysInMonth + firstDayOfMonth) }).map((_, i) => (
          <div key={`end-empty-${i}`} className="bg-slate-50/30 border-b border-r border-slate-100 min-h-[100px]" />
        ))}
      </div>

      {/* Event Details Modal */}
      {selectedDayDetails && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-fadeIn p-4" onClick={() => setSelectedDayDetails(null)}>
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden animate-slideUp" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <CalIcon className="w-4 h-4 text-indigo-500" /> {selectedDayDetails.date}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedDayDetails.events.length} Scheduled Items
                </p>
              </div>
              <button onClick={() => setSelectedDayDetails(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3">
              {selectedDayDetails.events.map(event => (
                <div key={event.id} className="p-3 bg-white border border-slate-200 rounded shadow-sm hover:border-indigo-300 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <span 
                      className={`font-bold text-sm transition-colors ${onNavigate ? 'text-blue-600 hover:underline cursor-pointer' : 'text-slate-700'}`}
                      onClick={() => onNavigate && onNavigate('clients', { clientId: event.clientId })}
                    >
                      {event.clientName}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${STATUS_STYLES[event.status] || 'bg-slate-100 text-slate-600'}`}>
                      {event.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-500 mb-2">
                    <span className="font-medium text-slate-700">{event.workType}</span>
                    <span className="flex items-center gap-1 font-mono text-[11px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">
                      <Clock className="w-3 h-3 text-indigo-500" />
                      {event.startTime || '09:00'} - {event.endTime || '17:00'}
                    </span>
                  </div>
                  {event.item && (
                    <p className="text-xs text-slate-500 italic mb-2 line-clamp-2">{event.item}</p>
                  )}
                  <div className="flex justify-between items-center border-t border-slate-100 pt-2">
                     <span className="text-xs font-medium text-slate-400">Revenue</span>
                     <span className="text-sm font-bold text-slate-800">${event.amount.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
               <div className="flex justify-between items-center">
                 <span className="font-medium text-slate-600 text-xs">Total Daily Revenue</span>
                 <span className="text-base font-bold text-emerald-600 font-mono">
                   ${getDailyRevenue(selectedDayDetails.events).toLocaleString()}
                 </span>
               </div>

               {onNavigate && (
                 <button
                   onClick={() => {
                     const dateToPass = selectedDayDetails.date;
                     setSelectedDayDetails(null);
                     onNavigate('estimator', { date: dateToPass });
                   }}
                   className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                 >
                   <Calculator className="w-3.5 h-3.5" /> Draft New Quote for {selectedDayDetails.date}
                 </button>
               )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Modal */}
      {isQuickAddOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-fadeIn p-4" onClick={() => setIsQuickAddOpen(false)}>
           <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm overflow-hidden animate-slideUp" onClick={e => e.stopPropagation()}>
             <div className="p-4 border-b border-slate-200 bg-indigo-50 flex items-center justify-between">
               <div>
                  <h3 className="font-bold text-indigo-900">Add Task to Schedule</h3>
                  <p className="text-xs text-indigo-600 font-mono">{quickAddDate}</p>
               </div>
               <button onClick={() => setIsQuickAddOpen(false)}><X className="w-5 h-5 text-indigo-400 hover:text-indigo-600" /></button>
             </div>
             
             <form onSubmit={submitQuickAdd} className="p-5 space-y-4">
               <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Client / Project</label>
                 <input 
                   autoFocus
                   required
                   className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                   placeholder="e.g. Acme Corp Phase 2"
                   value={quickAddForm.clientName}
                   onChange={e => setQuickAddForm({...quickAddForm, clientName: e.target.value})}
                 />
               </div>

               {/* Time Schedule Inputs */}
               <div className="grid grid-cols-2 gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                 <div>
                   <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1 flex items-center gap-1">
                     <Clock className="w-3 h-3 text-indigo-500" /> Start Time
                   </label>
                   <input 
                     type="time" 
                     className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold"
                     value={quickAddForm.startTime}
                     onChange={e => setQuickAddForm({...quickAddForm, startTime: e.target.value})}
                   />
                 </div>
                 <div>
                   <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1 flex items-center gap-1">
                     <Clock className="w-3 h-3 text-indigo-500" /> End Time
                   </label>
                   <input 
                     type="time" 
                     className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold"
                     value={quickAddForm.endTime}
                     onChange={e => setQuickAddForm({...quickAddForm, endTime: e.target.value})}
                   />
                 </div>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type</label>
                    <select 
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={quickAddForm.workType}
                      onChange={e => setQuickAddForm({...quickAddForm, workType: e.target.value})}
                    >
                      <option value="General">General</option>
                      <option value="Structural Analysis">Structural</option>
                      <option value="BOQ">BOQ</option>
                      <option value="Meeting">Meeting</option>
                      <option value="Site Visit">Site Visit</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
                    <select 
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={quickAddForm.status}
                      onChange={e => setQuickAddForm({...quickAddForm, status: e.target.value})}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                 </div>
               </div>

               <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Value ($)</label>
                 <div className="relative">
                   <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                   <input 
                     type="number" 
                     min="0"
                     className="w-full pl-9 pr-3 py-2 bg-slate-100 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                     placeholder="0.00"
                     value={quickAddForm.amount}
                     onChange={e => setQuickAddForm({...quickAddForm, amount: e.target.value})}
                   />
                 </div>
               </div>

               <button type="submit" className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded shadow-sm transition-colors text-xs">
                 Add to Schedule
               </button>

               {onNavigate && (
                 <button
                   type="button"
                   onClick={() => {
                     const dateToPass = quickAddDate;
                     const start = quickAddForm.startTime;
                     const end = quickAddForm.endTime;
                     setIsQuickAddOpen(false);
                     onNavigate('estimator', { date: dateToPass, startTime: start, endTime: end });
                   }}
                   className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded transition-colors text-xs flex items-center justify-center gap-1.5"
                 >
                   <Calculator className="w-3.5 h-3.5 text-indigo-600" /> Open Full Quote Estimator
                 </button>
               )}
             </form>
           </div>
        </div>
      )}
    </div>
  );
};
