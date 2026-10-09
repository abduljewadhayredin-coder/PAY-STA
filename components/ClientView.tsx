
import React, { useState, useMemo, useEffect } from 'react';
import { Client, Transaction, PaymentInstallment, ContractAdjustment, WorkerPayment, WorkerDiscipline, ViewState, ScheduleProgramStatus } from '../types';
import { Search, Plus, Mail, Phone, Building, X, Briefcase, DollarSign, Calendar, ChevronRight, CreditCard, Pencil, Trash2, Check, XCircle, Save, User, Wallet, FileText, Layers, List, Clock, Calculator, Receipt, Camera, Users, AlertTriangle, AlertOctagon, Hammer, Zap, CheckCircle2 } from 'lucide-react';
import { STATUS_STYLES, DISCIPLINE_METADATA, SCHEDULE_PROGRAM_CONFIG } from '../constants';
import { FinancialManagerModal } from './FinancialManagerModal';
import { WorkerPaymentModal } from './WorkerPaymentModal';

interface ClientViewProps {
  clients: Client[];
  transactions: Transaction[];
  availableWorkTypes: string[];
  workerPayments?: WorkerPayment[];
  onAddWorkerPayment?: (payment: Omit<WorkerPayment, 'id'>, id?: string) => void;
  onDeleteWorkerPayment?: (id: string) => void;
  onAddClient: (client: Omit<Client, 'id' | 'joinedDate'> & { id?: string }) => void;
  onUpdateClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
  onRecordPayment: (transaction: Omit<Transaction, 'id'> & { id?: string }) => void;
  onUpdateTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  autoSelectedClientId?: string;
  onNavigate?: (view: ViewState, params?: any) => void;
}

export const ClientView: React.FC<ClientViewProps> = ({ clients, transactions, availableWorkTypes, workerPayments = [], onAddWorkerPayment, onDeleteWorkerPayment, onAddClient, onUpdateClient, onDeleteClient, onRecordPayment, onUpdateTransaction, onDeleteTransaction, autoSelectedClientId, onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Auto-select client if navigating from another view
  useEffect(() => {
    if (autoSelectedClientId) {
      const client = clients.find(c => c.id === autoSelectedClientId);
      if (client) {
        setSelectedClient(client);
      }
    }
  }, [autoSelectedClientId, clients]);

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn relative pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Client Register</h2>
          <p className="text-sm text-slate-500 mt-1">Manage active contracts and prospects.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded hover:bg-slate-800 transition-colors shadow-sm w-full md:w-auto"
        >
          <Plus className="w-4 h-4" /> Add Client
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search clients..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-100 border border-slate-300 rounded focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-slate-900 placeholder:text-slate-400"
            />
          </div>
        </div>
        
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Client Identity</th>
                <th className="px-6 py-3">Contact Info</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Joined Date</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.map((client) => {
                const clientTransactions = transactions.filter(t => t.clientId === client.id && t.status !== 'Cancelled');
                const totalContract = clientTransactions.reduce((sum, t) => sum + t.amount, 0);
                const totalReceived = clientTransactions.reduce((sum, t) => sum + t.dilAmount, 0);
                const balance = totalContract - totalReceived;
                const isFullyPaid = totalContract > 0 && balance <= 0;

                return (
                  <tr key={client.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs overflow-hidden">
                          {client.avatar ? (
                            <img src={client.avatar} alt={client.company} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            client.company.substring(0,2).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{client.company}</div>
                          <div className="text-xs text-slate-500">ID: {client.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Building className="w-3 h-3 text-slate-400" />
                          <span className="text-xs">{client.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span className="text-xs">{client.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span className="text-xs">{client.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <div className="space-y-1.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLES[client.status] || STATUS_STYLES['default']}`}>
                          {client.status}
                        </span>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${isFullyPaid ? 'bg-emerald-500' : balance > 0 ? 'bg-amber-500' : 'bg-slate-300'}`}></span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                              {isFullyPaid ? 'Fully Settled' : balance > 0 ? 'Balance Pending' : 'No Contracts'}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium">
                            ${totalReceived.toLocaleString()} / ${totalContract.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-slate-600">
                      {client.joinedDate}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                         <button
                           onClick={() => onDeleteClient(client.id)}
                           className="text-slate-400 hover:text-red-600 transition-colors"
                           title="Delete Client"
                         >
                           <Trash2 className="w-4 h-4" />
                         </button>
                         <button 
                          onClick={() => setSelectedClient(client)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center justify-end gap-1 opacity-80 hover:opacity-100"
                        >
                          View Profile <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500 italic">
                    No clients found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden bg-slate-50 p-4 space-y-4">
          {filteredClients.map((client) => {
            const clientTransactions = transactions.filter(t => t.clientId === client.id && t.status !== 'Cancelled');
            const totalContract = clientTransactions.reduce((sum, t) => sum + t.amount, 0);
            const totalReceived = clientTransactions.reduce((sum, t) => sum + t.dilAmount, 0);
            const balance = totalContract - totalReceived;
            const isFullyPaid = totalContract > 0 && balance <= 0;

            return (
              <div key={client.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm overflow-hidden">
                        {client.avatar ? (
                          <img src={client.avatar} alt={client.company} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          client.company.substring(0,2).toUpperCase()
                        )}
                     </div>
                     <div>
                       <h3 className="font-bold text-slate-800">{client.company}</h3>
                       <p className="text-xs text-slate-400 font-mono">{client.id}</p>
                     </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLES[client.status] || STATUS_STYLES['default']}`}>
                      {client.status}
                    </span>
                    <span className={`text-[9px] font-bold uppercase ${isFullyPaid ? 'text-emerald-600' : balance > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                      {isFullyPaid ? 'Settled' : balance > 0 ? 'Pending' : ''}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                   <div className="flex items-center gap-2 text-sm text-slate-600">
                      <User className="w-4 h-4 text-slate-400" /> {client.name}
                   </div>
                   <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Mail className="w-4 h-4 text-slate-400" /> {client.email}
                   </div>
                   <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Phone className="w-4 h-4 text-slate-400" /> {client.phone}
                   </div>
                   
                   <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                      <div className="bg-slate-50 p-2 rounded">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Received</p>
                        <p className="text-xs font-bold text-emerald-600">${totalReceived.toLocaleString()}</p>
                      </div>
                      <div className="bg-slate-50 p-2 rounded">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Balance</p>
                        <p className="text-xs font-bold text-red-600">${balance.toLocaleString()}</p>
                      </div>
                   </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                   <button 
                     onClick={() => onDeleteClient(client.id)}
                     className="text-slate-400 hover:text-red-500 p-2"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                   <button 
                     onClick={() => setSelectedClient(client)}
                     className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                   >
                     View Profile <ChevronRight className="w-4 h-4" />
                   </button>
                </div>
              </div>
            );
          })}
          {filteredClients.length === 0 && (
            <div className="text-center py-8 text-slate-500 italic">No clients found.</div>
          )}
        </div>
      </div>

      {/* Add Client Modal */}
      {isAddModalOpen && (
        <AddClientModal 
          onClose={() => setIsAddModalOpen(false)} 
          onSave={(data) => {
            onAddClient(data);
            setIsAddModalOpen(false);
          }}
        />
      )}

      {/* View Profile Modal */}
      {selectedClient && (
        <ClientProfileModal
          client={selectedClient}
          transactions={transactions.filter(t => t.clientId === selectedClient.id)}
          availableWorkTypes={availableWorkTypes}
          workerPayments={workerPayments.filter(wp => wp.clientName?.toLowerCase() === selectedClient.company.toLowerCase() || wp.clientName?.toLowerCase() === selectedClient.name.toLowerCase() || transactions.filter(t => t.clientId === selectedClient.id).some(t => t.id === wp.transactionId))}
          onAddWorkerPayment={onAddWorkerPayment}
          onDeleteWorkerPayment={onDeleteWorkerPayment}
          onClose={() => setSelectedClient(null)}
          onUpdateClient={onUpdateClient}
          onDeleteClient={onDeleteClient}
          onRecordPayment={onRecordPayment}
          onUpdateTransaction={onUpdateTransaction}
          onDeleteTransaction={onDeleteTransaction}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
};

// --- Sub-Components ---

const AddClientModal: React.FC<{ 
  onClose: () => void; 
  onSave: (data: Omit<Client, 'id' | 'joinedDate'> & { id?: string }) => void 
}> = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    status: 'Prospect' as Client['status'],
    avatar: ''
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const [customId, setCustomId] = useState('');

  // Auto-generate ID on mount
  useEffect(() => {
    setCustomId(`CLT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Pass customId so it persists
    onSave({ ...formData, id: customId });
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-fadeIn">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <h3 className="font-bold text-slate-800">Add New Client</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="flex flex-col items-center gap-3 mb-4">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center text-slate-400 overflow-hidden">
                {formData.avatar ? (
                  <img src={formData.avatar} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User className="w-10 h-10" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 p-1.5 bg-blue-600 text-white rounded-full cursor-pointer shadow-lg hover:bg-blue-700 transition-colors">
                <Camera className="w-3.5 h-3.5" />
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Profile Picture</span>
          </div>

          <div className="bg-blue-50 p-3 rounded border border-blue-100 flex items-center justify-between">
             <span className="text-xs text-blue-600 font-medium">Auto Reference ID</span>
             <span className="text-sm font-mono font-bold text-blue-800">{customId}</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Company Name</label>
            <input 
              required
              type="text" 
              className="w-full px-3 py-2 text-sm bg-slate-100 border border-slate-300 rounded focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-colors text-slate-900"
              value={formData.company}
              onChange={e => setFormData({...formData, company: e.target.value})}
              placeholder="e.g. Spartan Tech"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Contact Person</label>
            <input 
              required
              type="text" 
              className="w-full px-3 py-2 text-sm bg-slate-100 border border-slate-300 rounded focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-colors text-slate-900"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="e.g. John Doe"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
              <input 
                required
                type="email" 
                className="w-full px-3 py-2 text-sm bg-slate-100 border border-slate-300 rounded focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-colors text-slate-900"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                placeholder="john@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 text-sm bg-slate-100 border border-slate-300 rounded focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-colors text-slate-900"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                placeholder="+1 555-0000"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
            <select 
              className="w-full px-3 py-2 text-sm bg-slate-100 border border-slate-300 rounded focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-colors text-slate-900"
              value={formData.status}
              onChange={e => setFormData({...formData, status: e.target.value as any})}
            >
              <option value="Active">Active</option>
              <option value="Prospect">Prospect</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded shadow-sm"
            >
              Save Client
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const RecordPaymentModal: React.FC<{
  client: Client;
  availableWorkTypes: string[];
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id'> & { id?: string }) => void;
}> = ({ client, availableWorkTypes, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '17:00',
    workType: availableWorkTypes[0] || '',
    item: '',
    amount: '' as any,
    isAdvanceReceived: false,
    dilAmount: '' as any, // Acts as Advance Amount or Total Received
    status: 'In Progress' as Transaction['status'],
    paymentStatus: 'Unpaid' as Transaction['paymentStatus'],
    paymentMethod: 'Bank Transfer' as Transaction['paymentMethod']
  });

  const [customId, setCustomId] = useState('');

  // Auto-generate Transaction ID on mount
  useEffect(() => {
    const datePart = new Date().toISOString().split('T')[0].replace(/-/g, '').substring(2); // YYMMDD
    setCustomId(`TRX-${datePart}-${Math.floor(100 + Math.random() * 900)}`);
  }, []);

  // Calculate balance dynamically
  const balance = useMemo(() => {
    const total = Number(formData.amount) || 0;
    const received = Number(formData.dilAmount) || 0;
    return Math.max(0, total - received);
  }, [formData.amount, formData.dilAmount]);

  // Update Payment Status automatically based on amounts
  useEffect(() => {
    const total = Number(formData.amount) || 0;
    const received = Number(formData.dilAmount) || 0;
    
    // If user hasn't explicitly set status to Settled via dropdown (checked by amount logic)
    // we strictly calculate based on math.
    if (total > 0) {
      if (received >= total) setFormData(prev => ({ ...prev, paymentStatus: 'Settled' }));
      else if (received > 0) setFormData(prev => ({ ...prev, paymentStatus: 'Partial' }));
      else setFormData(prev => ({ ...prev, paymentStatus: 'Unpaid' }));
    }
  }, [formData.amount, formData.dilAmount]);

  // Handler for manual status change to support "One Click Complete"
  const handlePaymentStatusChange = (status: Transaction['paymentStatus']) => {
     setFormData(prev => {
       const total = Number(prev.amount) || 0;
       let newDilAmount = prev.dilAmount;

       if (status === 'Settled' && total > 0) {
          newDilAmount = total; // Auto-fill full amount
          return { ...prev, paymentStatus: status, dilAmount: newDilAmount, status: 'Completed' };
       } else if (status === 'Unpaid') {
          newDilAmount = 0;
       }

       return { ...prev, paymentStatus: status, dilAmount: newDilAmount };
     });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: customId, // Use the UI-generated ID
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      clientId: client.id,
      clientName: client.company,
      category: 'Engineering Services',
      workType: formData.workType,
      item: formData.item || formData.workType,
      status: formData.status,
      paymentStatus: formData.paymentStatus,
      paymentMethod: formData.paymentMethod,
      isAdvanceReceived: formData.isAdvanceReceived,
      amount: Number(formData.amount),
      baseAmount: Number(formData.amount),
      dilAmount: Number(formData.dilAmount),
      balanceAmount: balance,
      region: 'Headquarters',
      installments: Number(formData.dilAmount) > 0 ? [
        { 
          id: `PAY-${Date.now()}`, 
          date: formData.date, 
          amount: Number(formData.dilAmount), 
          method: formData.paymentMethod || 'Bank Transfer', 
          label: 'Initial Payment' 
        }
      ] : [],
      adjustments: []
    });
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn border border-slate-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-emerald-50">
          <div className="flex items-center gap-2">
             <div className="p-1.5 bg-emerald-100 rounded text-emerald-700">
               <Briefcase className="w-5 h-5" />
             </div>
             <div>
               <h3 className="font-bold text-slate-800 leading-none">New Work Record</h3>
               <span className="text-xs text-emerald-600 font-medium">Ref: {customId}</span>
             </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-5 h-[80vh] overflow-y-auto md:h-auto">
          
          {/* Work Details Section */}
          <div className="space-y-4">
             <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
               <Clock className="w-3 h-3" /> Work Schedule & Scope
             </h4>
             
             <div className="grid grid-cols-3 gap-3">
               <div className="col-span-1">
                 <label className="block text-[10px] font-semibold text-slate-700 mb-1">Date</label>
                 <input 
                   required
                   type="date" 
                   className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded bg-slate-100 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-colors text-slate-900"
                   value={formData.date}
                   onChange={e => setFormData({...formData, date: e.target.value})}
                 />
               </div>
               <div className="col-span-1">
                 <label className="block text-[10px] font-semibold text-slate-700 mb-1">Start Time</label>
                 <input 
                   type="time" 
                   className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded bg-slate-100 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-colors text-slate-900"
                   value={formData.startTime}
                   onChange={e => setFormData({...formData, startTime: e.target.value})}
                 />
               </div>
               <div className="col-span-1">
                 <label className="block text-[10px] font-semibold text-slate-700 mb-1">End Time</label>
                 <input 
                   type="time" 
                   className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded bg-slate-100 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-colors text-slate-900"
                   value={formData.endTime}
                   onChange={e => setFormData({...formData, endTime: e.target.value})}
                 />
               </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-xs font-semibold text-slate-700 mb-1.5">Work Type</label>
                 <select 
                   required
                   className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-slate-100 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-colors text-slate-900"
                   value={formData.workType}
                   onChange={e => setFormData({...formData, workType: e.target.value})}
                 >
                   {availableWorkTypes.map(type => (
                     <option key={type} value={type}>{type}</option>
                   ))}
                 </select>
               </div>
               <div>
                 <label className="block text-xs font-semibold text-slate-700 mb-1.5">Work State</label>
                 <select 
                   className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-slate-100 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-colors text-slate-900"
                   value={formData.status}
                   onChange={e => setFormData({...formData, status: e.target.value as any})}
                 >
                   <option value="Completed">Completed</option>
                   <option value="In Progress">In Progress</option>
                   <option value="Pending">Pending</option>
                   <option value="On Hold">On Hold</option>
                   <option value="Cancelled">Cancelled</option>
                 </select>
               </div>
             </div>
             
             <div>
               <label className="block text-xs font-semibold text-slate-700 mb-1.5">Description</label>
               <input 
                  type="text" 
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-slate-100 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-colors text-slate-900"
                  placeholder="e.g. Phase 1 Analysis"
                  value={formData.item}
                  onChange={e => setFormData({...formData, item: e.target.value})}
               />
             </div>
          </div>

          <div className="h-px bg-slate-200"></div>

          {/* Payment Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <DollarSign className="w-3 h-3" /> Financials
              </h4>
              <div className="flex items-center gap-2">
                 <input 
                   type="checkbox" 
                   id="advReceived"
                   className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                   checked={formData.isAdvanceReceived}
                   onChange={e => setFormData({...formData, isAdvanceReceived: e.target.checked})}
                 />
                 <label htmlFor="advReceived" className="text-xs font-medium text-slate-700">Advance Received?</label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                 <label className="block text-xs font-semibold text-slate-700 mb-1.5">Payment Method</label>
                 <select 
                   className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-slate-100 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-colors text-slate-900"
                   value={formData.paymentMethod}
                   onChange={e => setFormData({...formData, paymentMethod: e.target.value as any})}
                 >
                   <option value="Bank Transfer">Bank Transfer</option>
                   <option value="Cheque">Cheque</option>
                   <option value="Cash">Cash</option>
                   <option value="Credit Card">Credit Card</option>
                   <option value="Other">Other</option>
                 </select>
              </div>
              <div>
                 <label className="block text-xs font-semibold text-slate-700 mb-1.5">Payment State</label>
                 <select 
                   className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-slate-100 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-colors text-slate-900"
                   value={formData.paymentStatus}
                   onChange={e => handlePaymentStatusChange(e.target.value as any)}
                 >
                   <option value="Settled">Settled</option>
                   <option value="Partial">Partial</option>
                   <option value="Unpaid">Unpaid</option>
                 </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <label className="block text-[10px] font-bold text-slate-700 mb-1 uppercase tracking-wide">Contract Value</label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">$</span>
                  <input 
                    required
                    type="number" 
                    min="0"
                    step="0.01"
                    className="w-full pl-5 pr-2 py-1.5 text-xs font-semibold text-slate-900 border border-slate-300 rounded bg-slate-100 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-colors"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={e => setFormData({...formData, amount: e.target.value})}
                  />
                </div>
              </div>
              <div className="col-span-1">
                <label className="block text-[10px] font-bold text-slate-700 mb-1 uppercase tracking-wide">
                  {formData.isAdvanceReceived ? 'Advance/Recvd' : 'Received'}
                </label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">$</span>
                  <input 
                    type="number" 
                    min="0"
                    step="0.01"
                    className={`w-full pl-5 pr-2 py-1.5 text-xs font-semibold text-slate-900 border rounded outline-none transition-colors
                      ${formData.isAdvanceReceived ? 'bg-white border-emerald-300 ring-1 ring-emerald-100' : 'bg-slate-100 border-slate-300'}`}
                    placeholder="0.00"
                    value={formData.dilAmount}
                    onChange={e => setFormData({...formData, dilAmount: e.target.value})}
                  />
                </div>
              </div>
              <div className="col-span-1">
                <label className="block text-[10px] font-bold text-slate-700 mb-1 uppercase tracking-wide">Balance</label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-red-500 text-xs">$</span>
                  <input 
                    disabled
                    type="text" 
                    className="w-full pl-5 pr-2 py-1.5 text-xs font-bold text-red-600 bg-red-50 border border-red-100 rounded cursor-not-allowed"
                    value={balance.toFixed(2)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-2">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-6 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-sm hover:shadow-md transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Save Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ClientProfileModal: React.FC<{
  client: Client;
  transactions: Transaction[];
  availableWorkTypes: string[];
  workerPayments?: WorkerPayment[];
  onAddWorkerPayment?: (payment: Omit<WorkerPayment, 'id'>, id?: string) => void;
  onDeleteWorkerPayment?: (id: string) => void;
  onClose: () => void;
  onUpdateClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
  onRecordPayment: (transaction: Omit<Transaction, 'id'> & { id?: string }) => void;
  onUpdateTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onNavigate?: (view: ViewState, params?: any) => void;
}> = ({ client, transactions, availableWorkTypes, workerPayments = [], onAddWorkerPayment, onDeleteWorkerPayment, onClose, onUpdateClient, onDeleteClient, onRecordPayment, onUpdateTransaction, onDeleteTransaction, onNavigate }) => {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isWorkerModalOpen, setIsWorkerModalOpen] = useState(false);
  const [financialTxId, setFinancialTxId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<'work' | 'payments' | 'workers'>('work');
  
  // Edit Profile State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<Client>(client);
  
  // Edit Transaction States
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Transaction>>({});

  useEffect(() => {
    setProfileForm(client);
  }, [client]);

  const stats = useMemo(() => {
    const totalWorkValue = transactions
      .filter(t => t.status !== 'Cancelled')
      .reduce((acc, t) => acc + t.amount, 0);

    const receivedAmount = transactions.reduce((acc, t) => acc + t.dilAmount, 0);
    const balanceAmount = transactions.reduce((acc, t) => acc + (t.balanceAmount || (t.amount - t.dilAmount)), 0);

    return {
      totalWorkValue,
      receivedAmount,
      balanceAmount,
      count: transactions.length,
      lastActive: transactions.length > 0 ? transactions[0].date : 'N/A'
    };
  }, [transactions]);

  const visibleTransactions = useMemo(() => {
    if (statusFilter === 'All') return transactions;
    return transactions.filter(t => t.status === statusFilter);
  }, [transactions, statusFilter]);

  const handleStartEdit = (tx: Transaction) => {
    setEditingTxId(tx.id);
    setEditForm(tx);
  };

  const handleEditChange = (field: keyof Transaction, value: any) => {
    let updated = { ...editForm, [field]: value } as Partial<Transaction>;
    
    // Mathematical Consistency Logic for Inline Editing
    if (field === 'amount' || field === 'dilAmount' || field === 'paymentStatus') {
       // Ensure we have numbers to work with
       const currentAmount = Number(field === 'amount' ? value : updated.amount || 0);
       const currentDil = Number(field === 'dilAmount' ? value : updated.dilAmount || 0);

       if (field === 'paymentStatus' && value === 'Settled' && currentAmount > 0) {
          // One Click Complete: If status is set to Settled, auto-fill full amount
          updated.dilAmount = currentAmount;
          updated.balanceAmount = 0;
       } else {
          // Standard Calculation
          updated.balanceAmount = Math.max(0, currentAmount - currentDil);
          
          // Auto-Status Update based on math (if not manually setting status to something specific right now)
          if (field !== 'paymentStatus') {
             if (updated.balanceAmount <= 0 && currentAmount > 0) updated.paymentStatus = 'Settled';
             else if (currentDil > 0) updated.paymentStatus = 'Partial';
             else updated.paymentStatus = 'Unpaid';
          }
       }
    }
    
    setEditForm(updated);
  };

  const handleCancelEdit = () => {
    setEditingTxId(null);
    setEditForm({});
  };

  const handleSaveEdit = () => {
    if (editingTxId && editForm) {
      onUpdateTransaction(editForm as Transaction);
      setEditingTxId(null);
      setEditForm({});
    }
  };

  const handleSaveProfile = () => {
    onUpdateClient(profileForm);
    setIsEditingProfile(false);
  };

  const handleDeleteProfile = () => {
    onDeleteClient(client.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Slide-over Panel */}
      <div className="relative w-full max-w-5xl bg-white h-full shadow-2xl animate-slideLeft overflow-y-auto border-l border-slate-200">
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 overflow-hidden">
                {profileForm.avatar ? (
                  <img src={profileForm.avatar} alt={profileForm.company} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <Building className="w-6 h-6" />
                )}
              </div>
              {isEditingProfile && (
                <label className="absolute -bottom-1 -right-1 p-1 bg-blue-600 text-white rounded-full cursor-pointer shadow-lg hover:bg-blue-700 transition-colors">
                  <Camera className="w-3 h-3" />
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setProfileForm(prev => ({ ...prev, avatar: reader.result as string }));
                        };
                        reader.readAsDataURL(file);
                      }
                    }} 
                  />
                </label>
              )}
            </div>
            <div>
              {isEditingProfile ? (
                 <input 
                   type="text" 
                   value={profileForm.company}
                   onChange={e => setProfileForm({...profileForm, company: e.target.value})}
                   className="text-lg font-bold text-slate-800 bg-white border-b border-slate-300 focus:border-blue-500 outline-none rounded px-1 max-w-[200px]"
                 />
              ) : (
                <h2 className="text-xl font-bold text-slate-800 truncate max-w-[200px] md:max-w-md">{client.company}</h2>
              )}
              
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{client.id}</span>
                {isEditingProfile ? (
                   <select 
                     value={profileForm.status}
                     onChange={e => setProfileForm({...profileForm, status: e.target.value as any})}
                     className="text-[10px] uppercase font-bold tracking-wide border border-slate-300 rounded px-1 bg-white text-slate-800"
                   >
                     <option value="Active">Active</option>
                     <option value="Inactive">Inactive</option>
                     <option value="Prospect">Prospect</option>
                   </select>
                ) : (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wide ${STATUS_STYLES[client.status] || STATUS_STYLES['default']}`}>
                    {client.status}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleDeleteProfile}
              className="flex items-center gap-2 px-3 py-2 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-100 rounded text-xs font-medium transition-colors"
              title="Delete Client & Records"
            >
               <Trash2 className="w-4 h-4" /> <span className="hidden sm:inline">Delete</span>
            </button>
            <div className="h-6 w-px bg-slate-200 mx-1 md:mx-2"></div>
            {!isEditingProfile && (
               <button 
                onClick={() => setIsEditingProfile(true)}
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                title="Edit Client Details"
              >
                <Pencil className="w-5 h-5" />
              </button>
            )}
            {onNavigate && (
              <button 
                onClick={() => {
                  onClose();
                  onNavigate('estimator', { clientId: client.id });
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-xs font-bold uppercase tracking-wide rounded transition-colors shadow-2xs"
                title="Create Quote / Estimate for Client"
              >
                <Calculator className="w-4 h-4 text-indigo-600" /> <span className="hidden sm:inline">Draft Quote</span>
              </button>
            )}
            <button 
              onClick={() => setIsPaymentModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white text-xs font-bold uppercase tracking-wide rounded hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Add Record</span>
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-8 pb-20">
          
          {/* Quick Stats: Inflow (Income), Outflow (Disbursements), Net Margin */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
             <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
               <p className="text-[11px] text-blue-600 font-bold uppercase tracking-wider mb-1">Contract Pipeline</p>
               <p className="text-base font-black text-slate-800 font-mono">${stats.totalWorkValue.toLocaleString()}</p>
             </div>
             <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
               <p className="text-[11px] text-emerald-600 font-bold uppercase tracking-wider mb-1">Client Inflow (Income)</p>
               <p className="text-base font-black text-emerald-700 font-mono">${stats.receivedAmount.toLocaleString()}</p>
             </div>
             <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg">
               <p className="text-[11px] text-rose-600 font-bold uppercase tracking-wider mb-1">Worker Outcome (Payroll)</p>
               <p className="text-base font-black text-rose-600 font-mono">-${workerPayments.reduce((s, w) => s + w.amount, 0).toLocaleString()}</p>
             </div>
             <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
               <p className="text-[11px] text-indigo-600 font-bold uppercase tracking-wider mb-1">Net Project Profit</p>
               <p className={`text-base font-black font-mono ${(stats.receivedAmount - workerPayments.reduce((s, w) => s + w.amount, 0)) >= 0 ? 'text-indigo-700' : 'text-rose-600'}`}>
                 ${(stats.receivedAmount - workerPayments.reduce((s, w) => s + w.amount, 0)).toLocaleString()}
               </p>
             </div>
             <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg col-span-2 lg:col-span-1">
               <p className="text-[11px] text-amber-600 font-bold uppercase tracking-wider mb-1">Balance Due</p>
               <p className="text-base font-black text-amber-700 font-mono">${stats.balanceAmount.toLocaleString()}</p>
             </div>
          </div>

          {/* Contact Details */}
          <div className="relative">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Building className="w-4 h-4" /> Contact Information
              {isEditingProfile && <span className="text-xs font-normal text-amber-600 ml-2 animate-pulse">(Editing Mode)</span>}
            </h3>
            
            <div className={`bg-white border ${isEditingProfile ? 'border-amber-300 ring-2 ring-amber-50' : 'border-slate-200'} rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 transition-all`}>
              <div>
                 <label className="text-xs text-slate-500 block mb-1">Contact Person</label>
                 {isEditingProfile ? (
                   <input 
                    type="text"
                    className="w-full px-2 py-1 text-sm bg-white border border-slate-300 rounded text-slate-900"
                    value={profileForm.name}
                    onChange={e => setProfileForm({...profileForm, name: e.target.value})}
                   />
                 ) : (
                   <div className="font-medium text-slate-800 flex items-center gap-2">
                     <User className="w-3.5 h-3.5 text-slate-400" /> {client.name}
                   </div>
                 )}
              </div>
              <div>
                 <label className="text-xs text-slate-500 block mb-1">Email Address</label>
                 {isEditingProfile ? (
                   <input 
                    type="email"
                    className="w-full px-2 py-1 text-sm bg-white border border-slate-300 rounded text-slate-900"
                    value={profileForm.email}
                    onChange={e => setProfileForm({...profileForm, email: e.target.value})}
                   />
                 ) : (
                   <div className="font-medium text-slate-800 flex items-center gap-2">
                     <Mail className="w-3.5 h-3.5 text-slate-400" /> {client.email}
                   </div>
                 )}
              </div>
              <div>
                 <label className="text-xs text-slate-500 block mb-1">Phone Number</label>
                 {isEditingProfile ? (
                   <input 
                    type="text"
                    className="w-full px-2 py-1 text-sm bg-white border border-slate-300 rounded text-slate-900"
                    value={profileForm.phone}
                    onChange={e => setProfileForm({...profileForm, phone: e.target.value})}
                   />
                 ) : (
                   <div className="font-medium text-slate-800 flex items-center gap-2">
                     <Phone className="w-3.5 h-3.5 text-slate-400" /> {client.phone}
                   </div>
                 )}
              </div>
              <div>
                 <label className="text-xs text-slate-500 block mb-1">Member Since</label>
                 <div className="font-medium text-slate-800 flex items-center gap-2">
                   <Calendar className="w-3.5 h-3.5 text-slate-400" /> {client.joinedDate}
                 </div>
              </div>
            </div>
            
            {isEditingProfile && (
              <div className="flex justify-end gap-2 mt-3">
                <button 
                  onClick={() => {
                    setIsEditingProfile(false);
                    setProfileForm(client);
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveProfile}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded flex items-center gap-1"
                >
                  <Save className="w-3 h-3" /> Save Changes
                </button>
              </div>
            )}

            {!isEditingProfile && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <a 
                  href={`mailto:${client.email}`}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-bold uppercase tracking-wide rounded hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                >
                  <Mail className="w-4 h-4" /> Send Email
                </a>
                <a 
                  href={`tel:${client.phone}`}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-bold uppercase tracking-wide rounded hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm"
                >
                  <Phone className="w-4 h-4" /> Call Client
                </a>
              </div>
            )}
          </div>

          {/* Records & History Tabs */}
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
              {/* Tab Navigation */}
              <div className="flex bg-slate-100 p-1 rounded-lg w-full sm:w-auto flex-wrap gap-1">
                <button
                  onClick={() => setActiveTab('work')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    activeTab === 'work' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" /> Work Records ({visibleTransactions.length})
                </button>
                <button
                  onClick={() => setActiveTab('payments')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    activeTab === 'payments' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5" /> Client Inflow ({transactions.filter(t => (t.dilAmount || 0) > 0).length})
                </button>
                <button
                  onClick={() => setActiveTab('workers')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    activeTab === 'workers' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" /> Worker Outcome ({workerPayments.length})
                </button>
              </div>

              {/* Filters & Actions */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                 <button 
                   onClick={() => setIsPaymentModalOpen(true)}
                   className="p-1 rounded hover:bg-slate-100 text-emerald-600 transition-colors"
                   title="Add New Record"
                 >
                   <Plus className="w-4 h-4" />
                 </button>
                 <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs border border-slate-300 rounded px-2 py-1 bg-white text-slate-700 outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="All">All Status</option>
                  <option value="Completed">Completed</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Pending">Pending</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Worker Outcomes Tab Content */}
            {activeTab === 'workers' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-rose-600" />
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Staff Disbursements for {client.company}
                    </span>
                  </div>
                  {onAddWorkerPayment && (
                    <button
                      onClick={() => setIsWorkerModalOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-all cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Disburse to Worker</span>
                    </button>
                  )}
                </div>

                <div className="border border-slate-200 rounded-lg overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="p-3">Worker Name</th>
                        <th className="p-3">Discipline</th>
                        <th className="p-3">Role / Specialty</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Method</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Outcome Amount</th>
                        <th className="p-3 text-right w-16">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {workerPayments.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                            No worker disbursements recorded yet for this client. Click "+ Disburse to Worker" to record payroll expenses.
                          </td>
                        </tr>
                      ) : (
                        workerPayments.map((wp) => {
                          const meta = DISCIPLINE_METADATA[wp.discipline] || DISCIPLINE_METADATA['Other'];
                          return (
                            <tr key={wp.id} className="hover:bg-slate-50 transition-colors">
                              <td className="p-3 font-bold text-slate-800">{wp.workerName}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${meta.bg} ${meta.border} ${meta.text}`}>
                                  {wp.discipline}
                                </span>
                              </td>
                              <td className="p-3 text-slate-600">{wp.role}</td>
                              <td className="p-3 text-slate-500 font-mono">{wp.date}</td>
                              <td className="p-3 text-slate-600">{wp.paymentMethod}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  wp.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                }`}>
                                  {wp.status}
                                </span>
                              </td>
                              <td className="p-3 text-right font-mono font-bold text-sm text-rose-600">
                                -${wp.amount.toLocaleString()}
                              </td>
                              <td className="p-3 text-right">
                                {onDeleteWorkerPayment && (
                                  <button
                                    onClick={() => onDeleteWorkerPayment(wp.id)}
                                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
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
            )}

            {/* Desktop Table */}
            {activeTab !== 'workers' && (
            <div className="hidden md:block border border-slate-200 rounded-lg overflow-x-auto">
               {visibleTransactions.length > 0 ? (
                 <table className="w-full text-sm text-left min-w-[800px]">
                   <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                     <tr>
                       <th className="px-4 py-2 w-28">Date</th>
                       {activeTab === 'work' ? (
                         <>
                           <th className="px-4 py-2 w-32">Time</th>
                           <th className="px-4 py-2">Work Type / Item</th>
                           <th className="px-4 py-2 w-28">Status</th>
                           <th className="px-4 py-2 text-right">Contract</th>
                           <th className="px-4 py-2 text-right">Received</th>
                           <th className="px-4 py-2 text-right">Balance</th>
                         </>
                       ) : (
                         <>
                           <th className="px-4 py-2">Details</th>
                           <th className="px-4 py-2 w-28">Pay Status</th>
                           <th className="px-4 py-2 text-right">Adv / Rcvd</th>
                           <th className="px-4 py-2 text-right text-red-600">Balance</th>
                         </>
                       )}
                       <th className="px-4 py-2 w-20 text-center">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {visibleTransactions.map(t => {
                       const isEditing = editingTxId === t.id;
                       const currentBalance = isEditing 
                          ? (editForm.balanceAmount !== undefined ? editForm.balanceAmount : (editForm.amount || 0) - (editForm.dilAmount || 0))
                          : (t.balanceAmount || (t.amount - t.dilAmount));

                       const prog = (t.scheduleProgram || 'Under Work') as ScheduleProgramStatus;
                       const progConfig = SCHEDULE_PROGRAM_CONFIG[prog] || SCHEDULE_PROGRAM_CONFIG['Under Work'];
                       const lag = t.lagDays !== undefined ? t.lagDays : (prog === 'Schedule Lag' ? 4 : (prog === 'Critical Lag' ? 14 : (prog === 'Under Schedule' ? -3 : 0)));

                       return (
                         <tr key={t.id} className={`transition-colors border-b border-slate-200/80 ${progConfig.rowShade} ${progConfig.borderAccent}`}>
                           <td className="px-4 py-2">
                             {isEditing ? (
                               <input 
                                 type="date" 
                                 className="w-full px-1 py-1 text-xs bg-white border border-slate-300 rounded text-slate-900"
                                 value={editForm.date}
                                 onChange={e => handleEditChange('date', e.target.value)}
                               />
                             ) : (
                               <div>
                                 <span className="text-slate-600 font-mono text-xs block">{t.date}</span>
                                 <div className="flex items-center gap-1 mt-0.5">
                                   <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-tight border ${progConfig.badge}`}>
                                     {progConfig.tag}
                                   </span>
                                   {lag !== 0 && (
                                     <span className="text-[9px] font-mono font-bold text-slate-600">
                                       {lag > 0 ? `+${lag}d` : `${lag}d`}
                                     </span>
                                   )}
                                 </div>
                               </div>
                             )}
                           </td>
                           
                           {activeTab === 'work' ? (
                             <>
                              <td className="px-4 py-2 text-xs text-slate-500">
                                {isEditing ? (
                                  <div className="flex gap-1">
                                    <input type="time" className="w-16 bg-white border border-slate-300 rounded text-slate-900 px-1" value={editForm.startTime} onChange={e => handleEditChange('startTime', e.target.value)} />
                                    <input type="time" className="w-16 bg-white border border-slate-300 rounded text-slate-900 px-1" value={editForm.endTime} onChange={e => handleEditChange('endTime', e.target.value)} />
                                  </div>
                                ) : (
                                  <span>{t.startTime} - {t.endTime}</span>
                                )}
                              </td>
                              <td className="px-4 py-2">
                               {isEditing ? (
                                 <div className="space-y-1">
                                    <select 
                                      className="w-full px-1 py-1 text-xs bg-white border border-slate-300 rounded text-slate-900"
                                      value={editForm.workType}
                                      onChange={e => handleEditChange('workType', e.target.value)}
                                    >
                                      {availableWorkTypes.map(type => <option key={type} value={type}>{type}</option>)}
                                    </select>
                                    <input 
                                      className="w-full px-1 py-1 text-xs bg-white border border-slate-300 rounded text-slate-900"
                                      value={editForm.item}
                                      onChange={e => handleEditChange('item', e.target.value)}
                                    />
                                 </div>
                               ) : (
                                 <div className="space-y-0.5">
                                   <span className="text-slate-800 font-medium">{t.workType}</span>
                                   <span className="text-slate-500 text-xs block truncate max-w-[200px]" title={t.item}>{t.item}</span>
                                 </div>
                               )}
                             </td>
                             <td className="px-4 py-2">
                               {isEditing ? (
                                 <select 
                                   className="w-full px-1 py-1 text-xs bg-white border border-slate-300 rounded text-slate-900"
                                   value={editForm.status}
                                   onChange={e => handleEditChange('status', e.target.value as any)}
                                 >
                                   <option value="Completed">Completed</option>
                                   <option value="In Progress">In Progress</option>
                                   <option value="Pending">Pending</option>
                                   <option value="On Hold">On Hold</option>
                                   <option value="Cancelled">Cancelled</option>
                                 </select>
                               ) : (
                                 <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${STATUS_STYLES[t.status] || STATUS_STYLES['default']}`}>
                                   {t.status}
                                 </span>
                               )}
                             </td>
                             <td className="px-4 py-2 text-right">
                               {isEditing ? (
                                  <input 
                                    type="number" 
                                    className="w-full px-1 py-1 text-xs bg-white border border-slate-300 rounded text-right text-slate-900"
                                    value={editForm.amount}
                                    onChange={e => handleEditChange('amount', Number(e.target.value))}
                                  />
                               ) : (
                                  <span className="font-medium text-slate-700">${t.amount.toLocaleString()}</span>
                               )}
                             </td>
                             <td className="px-4 py-2 text-right">
                                {isEditing ? (
                                  <input 
                                    type="number" 
                                    className="w-full px-1 py-1 text-xs bg-white border border-slate-300 rounded text-right text-slate-900"
                                    value={editForm.dilAmount}
                                    onChange={e => handleEditChange('dilAmount', Number(e.target.value))}
                                  />
                                ) : (
                                  <span className="text-emerald-600 font-medium">${t.dilAmount.toLocaleString()}</span>
                                )}
                             </td>
                             <td className="px-4 py-2 text-right font-bold text-red-600">
                               ${currentBalance.toLocaleString()}
                             </td>
                             </>
                           ) : (
                              <>
                              <td className="px-4 py-2">
                               {isEditing ? (
                                  <select 
                                    className="w-full px-1 py-1 text-xs bg-white border border-slate-300 rounded text-slate-900"
                                    value={editForm.paymentMethod}
                                    onChange={e => handleEditChange('paymentMethod', e.target.value as any)}
                                  >
                                    <option value="Bank Transfer">Bank Transfer</option>
                                    <option value="Cheque">Cheque</option>
                                    <option value="Cash">Cash</option>
                                    <option value="Credit Card">Credit Card</option>
                                    <option value="Other">Other</option>
                                  </select>
                               ) : (
                                 <div>
                                    <div className="flex items-center gap-2">
                                      <div className="p-1 rounded bg-emerald-50 text-emerald-600">
                                          <Wallet className="w-3 h-3" />
                                      </div>
                                      <span className="text-slate-700 text-xs">{t.paymentMethod || 'N/A'}</span>
                                    </div>
                                    {t.isAdvanceReceived && <span className="text-[10px] text-emerald-600 font-bold ml-6">ADVANCE</span>}
                                 </div>
                               )}
                             </td>
                             <td className="px-4 py-2">
                                {isEditing ? (
                                  <select 
                                    className="w-full px-1 py-1 text-xs bg-white border border-slate-300 rounded text-slate-900"
                                    value={editForm.paymentStatus}
                                    onChange={e => handleEditChange('paymentStatus', e.target.value as any)}
                                  >
                                    <option value="Settled">Settled</option>
                                    <option value="Partial">Partial</option>
                                    <option value="Unpaid">Unpaid</option>
                                  </select>
                                ) : (
                                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${STATUS_STYLES[t.paymentStatus || 'Unpaid'] || STATUS_STYLES['default']}`}>
                                     {t.paymentStatus || 'Unpaid'}
                                  </span>
                                )}
                             </td>
                             <td className="px-4 py-2 text-right">
                               {isEditing ? (
                                 <input 
                                   type="number" 
                                   className="w-full px-1 py-1 text-xs bg-white border border-slate-300 rounded text-right text-slate-900"
                                   value={editForm.dilAmount}
                                   onChange={e => handleEditChange('dilAmount', Number(e.target.value))}
                                 />
                               ) : (
                                 <span className="font-bold text-emerald-700">${t.dilAmount.toLocaleString()}</span>
                               )}
                             </td>
                             <td className="px-4 py-2 text-right font-mono text-xs text-red-600">
                                ${currentBalance.toLocaleString()}
                             </td>
                             </>
                           )}

                           <td className="px-4 py-2">
                             <div className="flex items-center justify-center gap-2">
                               {isEditing ? (
                                 <>
                                   <button onClick={handleSaveEdit} className="text-emerald-600 hover:text-emerald-700">
                                     <Check className="w-4 h-4" />
                                   </button>
                                   <button onClick={handleCancelEdit} className="text-slate-400 hover:text-slate-600">
                                     <XCircle className="w-4 h-4" />
                                   </button>
                                 </>
                               ) : (
                                 <>
                                   <button 
                                     onClick={() => setFinancialTxId(t.id)}
                                     className="text-slate-400 hover:text-emerald-600 transition-colors"
                                     title="Financial Manager"
                                   >
                                     <Wallet className="w-3.5 h-3.5" />
                                   </button>
                                   <button 
                                     onClick={() => handleStartEdit(t)}
                                     className="text-slate-400 hover:text-blue-600 transition-colors"
                                     title="Edit"
                                   >
                                     <Pencil className="w-3.5 h-3.5" />
                                   </button>
                                   <button 
                                     onClick={() => onDeleteTransaction(t.id)}
                                     className="text-slate-400 hover:text-red-600 transition-colors"
                                     title="Delete"
                                   >
                                     <Trash2 className="w-3.5 h-3.5" />
                                   </button>
                                 </>
                               )}
                             </div>
                           </td>
                         </tr>
                       );
                     })}
                   </tbody>
                 </table>
               ) : (
                 <div className="p-8 text-center text-slate-500 bg-slate-50">
                   <p>{transactions.length > 0 ? "No transactions match the selected filter." : "No records found."}</p>
                 </div>
               )}
            </div>
            )}

            {/* Mobile Card View for Transactions */}
            {activeTab !== 'workers' && (
            <div className="md:hidden space-y-3">
              {visibleTransactions.length > 0 ? visibleTransactions.map(t => {
                 const isEditing = editingTxId === t.id;
                 const currentBalance = isEditing 
                    ? (editForm.balanceAmount !== undefined ? editForm.balanceAmount : (editForm.amount || 0) - (editForm.dilAmount || 0))
                    : (t.balanceAmount || (t.amount - t.dilAmount));
                 
                 return (
                   <div key={t.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm relative">
                      {isEditing ? (
                         <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                               <div>
                                  <label className="text-[10px] uppercase text-slate-500 font-bold">Date</label>
                                  <input type="date" className="w-full text-xs p-1 border rounded bg-white text-slate-900" value={editForm.date} onChange={e => handleEditChange('date', e.target.value)} />
                               </div>
                               <div>
                                  <label className="text-[10px] uppercase text-slate-500 font-bold">Status</label>
                                  <select className="w-full text-xs p-1 border rounded bg-white text-slate-900" value={editForm.status} onChange={e => handleEditChange('status', e.target.value as any)}>
                                     <option value="Completed">Completed</option>
                                     <option value="In Progress">In Progress</option>
                                     <option value="Pending">Pending</option>
                                     <option value="On Hold">On Hold</option>
                                     <option value="Cancelled">Cancelled</option>
                                  </select>
                               </div>
                            </div>
                            <div>
                               <label className="text-[10px] uppercase text-slate-500 font-bold">Work Type</label>
                               <select className="w-full text-xs p-1 border rounded bg-white text-slate-900" value={editForm.workType} onChange={e => handleEditChange('workType', e.target.value)}>
                                 {availableWorkTypes.map(type => <option key={type} value={type}>{type}</option>)}
                               </select>
                            </div>
                            <div>
                               <label className="text-[10px] uppercase text-slate-500 font-bold">Item / Desc</label>
                               <input type="text" className="w-full text-xs p-1 border rounded bg-white text-slate-900" value={editForm.item} onChange={e => handleEditChange('item', e.target.value)} />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                               <div>
                                  <label className="text-[10px] uppercase text-slate-500 font-bold">Contract</label>
                                  <input type="number" className="w-full text-xs p-1 border rounded bg-white text-slate-900" value={editForm.amount} onChange={e => handleEditChange('amount', Number(e.target.value))} />
                               </div>
                               <div>
                                  <label className="text-[10px] uppercase text-slate-500 font-bold">Received</label>
                                  <input type="number" className="w-full text-xs p-1 border rounded bg-white text-slate-900" value={editForm.dilAmount} onChange={e => handleEditChange('dilAmount', Number(e.target.value))} />
                               </div>
                               <div>
                                  <label className="text-[10px] uppercase text-slate-500 font-bold">Balance</label>
                                  <div className="w-full text-xs p-1.5 font-bold text-red-600 bg-red-50 rounded">${currentBalance.toLocaleString()}</div>
                               </div>
                            </div>
                            <div className="flex justify-end gap-2 border-t pt-2">
                               <button onClick={handleCancelEdit} className="px-3 py-1.5 text-xs text-slate-600 border rounded">Cancel</button>
                               <button onClick={handleSaveEdit} className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded font-bold">Save</button>
                            </div>
                         </div>
                      ) : (
                         <>
                           <div className="flex justify-between items-start mb-2">
                              <span className="text-xs font-mono text-slate-500">{t.date}</span>
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${STATUS_STYLES[t.status] || STATUS_STYLES['default']}`}>
                                 {t.status}
                              </span>
                           </div>
                           <h4 className="text-sm font-bold text-slate-800 mb-0.5">{t.workType}</h4>
                           <p className="text-xs text-slate-500 mb-3 truncate">{t.item}</p>
                           
                           <div className="grid grid-cols-3 gap-2 text-xs border-t border-slate-100 pt-2 mb-2">
                              <div>
                                 <span className="block text-[10px] text-slate-400 uppercase">Contract</span>
                                 <span className="font-bold text-slate-700">${t.amount.toLocaleString()}</span>
                              </div>
                              <div>
                                 <span className="block text-[10px] text-slate-400 uppercase">Received</span>
                                 <span className="font-bold text-emerald-600">${t.dilAmount.toLocaleString()}</span>
                              </div>
                              <div>
                                 <span className="block text-[10px] text-slate-400 uppercase">Balance</span>
                                 <span className="font-bold text-red-600">${currentBalance.toLocaleString()}</span>
                              </div>
                           </div>

                           <div className="flex justify-end gap-3 pt-1">
                              <button 
                                 onClick={() => setFinancialTxId(t.id)}
                                 className="text-emerald-600 text-xs font-medium flex items-center gap-1"
                              >
                                 <Wallet className="w-3 h-3" /> Finance
                              </button>
                              <button onClick={() => handleStartEdit(t)} className="text-blue-600 text-xs font-medium flex items-center gap-1">
                                 <Pencil className="w-3 h-3" /> Edit
                              </button>
                              <button onClick={() => onDeleteTransaction(t.id)} className="text-red-500 text-xs font-medium flex items-center gap-1">
                                 <Trash2 className="w-3 h-3" /> Delete
                              </button>
                           </div>
                         </>
                      )}
                   </div>
                 );
              }) : (
                 <div className="p-6 text-center text-slate-500 bg-slate-50 rounded italic text-sm">
                   No transactions found.
                 </div>
              )}
            </div>
             )}

          </div>

        </div>
      </div>
      
      {isPaymentModalOpen && (
        <RecordPaymentModal 
          client={client}
          availableWorkTypes={availableWorkTypes}
          onClose={() => setIsPaymentModalOpen(false)}
          onSave={(transaction) => {
            onRecordPayment(transaction);
            setIsPaymentModalOpen(false);
          }}
        />
      )}

      {financialTxId && (
        <FinancialManagerModal
          client={client}
          transaction={transactions.find(t => t.id === financialTxId)!}
          onClose={() => setFinancialTxId(null)}
          onUpdate={(updatedTx) => {
            onUpdateTransaction(updatedTx);
          }}
        />
      )}

      {isWorkerModalOpen && onAddWorkerPayment && (
        <WorkerPaymentModal
          isOpen={isWorkerModalOpen}
          onClose={() => setIsWorkerModalOpen(false)}
          onSave={(paymentData, id) => {
            onAddWorkerPayment({ ...paymentData, clientName: client.company }, id);
            setIsWorkerModalOpen(false);
          }}
          transactions={transactions}
          initialDiscipline="Structure"
        />
      )}
    </div>
  );
};
