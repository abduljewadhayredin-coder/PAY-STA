
import React, { useState, useMemo } from 'react';
import { Transaction, Client, PaymentInstallment, ContractAdjustment } from '../types';
import { X, Plus, Trash2, DollarSign, Calendar, CreditCard, FileText, TrendingUp, TrendingDown, Receipt } from 'lucide-react';
import { ReceiptView } from './ReceiptView';

interface FinancialManagerModalProps {
  client: Client;
  transaction: Transaction;
  onClose: () => void;
  onUpdate: (updatedTx: Transaction) => void;
}

export const FinancialManagerModal: React.FC<FinancialManagerModalProps> = ({ client, transaction, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'installments' | 'adjustments'>('installments');
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentInstallment | null>(null);

  // Installment Form State
  const [newInstallment, setNewInstallment] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    method: 'Bank Transfer',
    label: ''
  });

  // Adjustment Form State
  const [newAdjustment, setNewAdjustment] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    label: '',
    type: 'addition' as 'addition' | 'deduction'
  });

  const handleAddInstallment = () => {
    const amount = Number(newInstallment.amount);
    if (!amount || amount <= 0) return;

    const installment: PaymentInstallment = {
      id: `PAY-${Date.now()}`,
      date: newInstallment.date,
      amount: amount,
      method: newInstallment.method,
      label: newInstallment.label || `${transaction.installments?.length ? transaction.installments.length + 1 : 1}${getOrdinal(transaction.installments?.length ? transaction.installments.length + 1 : 1)} Payment`
    };

    const updatedInstallments = [...(transaction.installments || []), installment];
    const totalReceived = updatedInstallments.reduce((sum, inst) => sum + inst.amount, 0);
    
    const updatedTx: Transaction = {
      ...transaction,
      installments: updatedInstallments,
      dilAmount: totalReceived,
      balanceAmount: transaction.amount - totalReceived,
      paymentStatus: totalReceived >= transaction.amount ? 'Settled' : (totalReceived > 0 ? 'Partial' : 'Unpaid'),
      status: totalReceived >= transaction.amount ? 'Completed' : transaction.status,
      isAdvanceReceived: totalReceived > 0
    };

    onUpdate(updatedTx);
    setNewInstallment({
      date: new Date().toISOString().split('T')[0],
      amount: '',
      method: 'Bank Transfer',
      label: ''
    });
  };

  const handleRemoveInstallment = (id: string) => {
    const updatedInstallments = (transaction.installments || []).filter(i => i.id !== id);
    const totalReceived = updatedInstallments.reduce((sum, inst) => sum + inst.amount, 0);

    const updatedTx: Transaction = {
      ...transaction,
      installments: updatedInstallments,
      dilAmount: totalReceived,
      balanceAmount: transaction.amount - totalReceived,
      paymentStatus: totalReceived >= transaction.amount ? 'Settled' : (totalReceived > 0 ? 'Partial' : 'Unpaid'),
      status: totalReceived >= transaction.amount ? 'Completed' : transaction.status,
      isAdvanceReceived: totalReceived > 0
    };

    onUpdate(updatedTx);
  };

  const handleAddAdjustment = () => {
    const amount = Number(newAdjustment.amount);
    if (!amount || amount <= 0) return;

    const finalAmount = newAdjustment.type === 'addition' ? amount : -amount;

    const adjustment: ContractAdjustment = {
      id: `ADJ-${Date.now()}`,
      date: newAdjustment.date,
      amount: finalAmount,
      label: newAdjustment.label || (newAdjustment.type === 'addition' ? 'Contract Addition' : 'Contract Deduction')
    };

    const updatedAdjustments = [...(transaction.adjustments || []), adjustment];
    const totalAdjustments = updatedAdjustments.reduce((sum, adj) => sum + adj.amount, 0);
    const newTotalAmount = transaction.baseAmount + totalAdjustments;

    const updatedTx: Transaction = {
      ...transaction,
      adjustments: updatedAdjustments,
      amount: newTotalAmount,
      balanceAmount: newTotalAmount - transaction.dilAmount,
      paymentStatus: transaction.dilAmount >= newTotalAmount ? 'Settled' : (transaction.dilAmount > 0 ? 'Partial' : 'Unpaid'),
      status: transaction.dilAmount >= newTotalAmount ? 'Completed' : transaction.status
    };

    onUpdate(updatedTx);
    setNewAdjustment({
      date: new Date().toISOString().split('T')[0],
      amount: '',
      label: '',
      type: 'addition'
    });
  };

  const handleRemoveAdjustment = (id: string) => {
    const updatedAdjustments = (transaction.adjustments || []).filter(a => a.id !== id);
    const totalAdjustments = updatedAdjustments.reduce((sum, adj) => sum + adj.amount, 0);
    const newTotalAmount = transaction.baseAmount + totalAdjustments;

    const updatedTx: Transaction = {
      ...transaction,
      adjustments: updatedAdjustments,
      amount: newTotalAmount,
      balanceAmount: newTotalAmount - transaction.dilAmount,
      paymentStatus: transaction.dilAmount >= newTotalAmount ? 'Settled' : (transaction.dilAmount > 0 ? 'Partial' : 'Unpaid'),
      status: transaction.dilAmount >= newTotalAmount ? 'Completed' : transaction.status
    };

    onUpdate(updatedTx);
  };

  const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return (s[(v - 20) % 10] || s[v] || s[0]);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl overflow-hidden animate-fadeIn flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 text-white rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Financial Management</h3>
              <p className="text-xs text-slate-500">{transaction.workType} - {transaction.item}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Balance Checker Header */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Base Contract</p>
              <p className="text-xl font-black text-slate-800">${transaction.baseAmount.toLocaleString()}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">Adjusted Total</p>
              <p className="text-xl font-black text-blue-700">${transaction.amount.toLocaleString()}</p>
              {transaction.adjustments && transaction.adjustments.length > 0 && (
                <p className="text-[10px] text-blue-500 mt-1">
                  {transaction.adjustments.reduce((sum, a) => sum + a.amount, 0) >= 0 ? '+' : ''}
                  ${transaction.adjustments.reduce((sum, a) => sum + a.amount, 0).toLocaleString()} in adjustments
                </p>
              )}
            </div>
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">Total Received</p>
              <p className="text-xl font-black text-emerald-700">${transaction.dilAmount.toLocaleString()}</p>
              <p className="text-[10px] text-emerald-500 mt-1">{transaction.installments?.length || 0} installments paid</p>
            </div>
          </div>

          <div className="bg-red-50 p-4 rounded-xl border border-red-100 mb-8 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">Outstanding Balance</p>
              <p className="text-2xl font-black text-red-600">${(transaction.amount - transaction.dilAmount).toLocaleString()}</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border ${
              transaction.paymentStatus === 'Settled' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 
              transaction.paymentStatus === 'Partial' ? 'bg-amber-100 text-amber-700 border-amber-200' : 
              'bg-red-100 text-red-700 border-red-200'
            }`}>
              {transaction.paymentStatus}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-200 mb-6">
            <button 
              onClick={() => setActiveTab('installments')}
              className={`px-6 py-3 text-sm font-bold transition-all border-b-2 ${
                activeTab === 'installments' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Payment Installments
            </button>
            <button 
              onClick={() => setActiveTab('adjustments')}
              className={`px-6 py-3 text-sm font-bold transition-all border-b-2 ${
                activeTab === 'adjustments' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Contract Adjustments
            </button>
          </div>

          {activeTab === 'installments' ? (
            <div className="space-y-6">
              {/* Add Installment Form */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h4 className="text-xs font-bold text-slate-700 uppercase mb-3 flex items-center gap-2">
                  <Plus className="w-3.5 h-3.5" /> Record New Payment
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Date</label>
                    <input 
                      type="date" 
                      className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                      value={newInstallment.date}
                      onChange={e => setNewInstallment({...newInstallment, date: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Amount</label>
                    <input 
                      type="number" 
                      placeholder="0.00"
                      className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                      value={newInstallment.amount}
                      onChange={e => setNewInstallment({...newInstallment, amount: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Method</label>
                    <select 
                      className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                      value={newInstallment.method}
                      onChange={e => setNewInstallment({...newInstallment, method: e.target.value})}
                    >
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Cash">Cash</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button 
                      onClick={handleAddInstallment}
                      className="w-full py-1.5 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700 transition-colors"
                    >
                      Add Payment
                    </button>
                  </div>
                </div>
                <div className="mt-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Label (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 1st Installment, Final Payment"
                    className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newInstallment.label}
                    onChange={e => setNewInstallment({...newInstallment, label: e.target.value})}
                  />
                </div>
              </div>

              {/* Installments List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Payment History</h4>
                {transaction.installments && transaction.installments.length > 0 ? (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-2">Date</th>
                          <th className="px-4 py-2">Label</th>
                          <th className="px-4 py-2">Method</th>
                          <th className="px-4 py-2 text-right">Amount</th>
                          <th className="px-4 py-2 text-center">Receipt</th>
                          <th className="px-4 py-2 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {transaction.installments.map(inst => (
                          <tr key={inst.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-2 text-xs font-mono text-slate-500">{inst.date}</td>
                            <td className="px-4 py-2 font-medium text-slate-700">{inst.label}</td>
                            <td className="px-4 py-2 text-xs text-slate-500">{inst.method}</td>
                            <td className="px-4 py-2 text-right font-bold text-emerald-600">${inst.amount.toLocaleString()}</td>
                            <td className="px-4 py-2 text-center">
                              <button 
                                onClick={() => setSelectedReceipt(inst)}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="View Receipt"
                              >
                                <Receipt className="w-4 h-4" />
                              </button>
                            </td>
                            <td className="px-4 py-2 text-center">
                              <button 
                                onClick={() => handleRemoveInstallment(inst.id)}
                                className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-300 text-slate-400 text-sm italic">
                    No payments recorded yet.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Add Adjustment Form */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h4 className="text-xs font-bold text-slate-700 uppercase mb-3 flex items-center gap-2">
                  <Plus className="w-3.5 h-3.5" /> Add Contract Adjustment
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Date</label>
                    <input 
                      type="date" 
                      className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                      value={newAdjustment.date}
                      onChange={e => setNewAdjustment({...newAdjustment, date: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Type</label>
                    <select 
                      className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                      value={newAdjustment.type}
                      onChange={e => setNewAdjustment({...newAdjustment, type: e.target.value as any})}
                    >
                      <option value="addition">Addition (+)</option>
                      <option value="deduction">Deduction (-)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Amount</label>
                    <input 
                      type="number" 
                      placeholder="0.00"
                      className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                      value={newAdjustment.amount}
                      onChange={e => setNewAdjustment({...newAdjustment, amount: e.target.value})}
                    />
                  </div>
                  <div className="flex items-end">
                    <button 
                      onClick={handleAddAdjustment}
                      className="w-full py-1.5 bg-slate-800 text-white text-xs font-bold rounded hover:bg-slate-900 transition-colors"
                    >
                      Apply Adjustment
                    </button>
                  </div>
                </div>
                <div className="mt-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Adjustment Reason / Label</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Scope Expansion, Discount Applied"
                    className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newAdjustment.label}
                    onChange={e => setNewAdjustment({...newAdjustment, label: e.target.value})}
                  />
                </div>
              </div>

              {/* Adjustments List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Adjustment History</h4>
                {transaction.adjustments && transaction.adjustments.length > 0 ? (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-2">Date</th>
                          <th className="px-4 py-2">Label</th>
                          <th className="px-4 py-2 text-right">Amount</th>
                          <th className="px-4 py-2 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {transaction.adjustments.map(adj => (
                          <tr key={adj.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-2 text-xs font-mono text-slate-500">{adj.date}</td>
                            <td className="px-4 py-2 font-medium text-slate-700">{adj.label}</td>
                            <td className={`px-4 py-2 text-right font-bold ${adj.amount >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                              {adj.amount >= 0 ? '+' : ''}${adj.amount.toLocaleString()}
                            </td>
                            <td className="px-4 py-2 text-center">
                              <button 
                                onClick={() => handleRemoveAdjustment(adj.id)}
                                className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-300 text-slate-400 text-sm italic">
                    No contract adjustments recorded.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedReceipt && (
        <ReceiptView 
          client={client}
          transaction={transaction}
          installment={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
};
