
import React from 'react';
import { Transaction, PaymentInstallment, Client } from '../types';
import { Printer, Download } from 'lucide-react';
import { SpartanLogo } from './SpartanLogo';

interface ReceiptViewProps {
  client: Client;
  transaction: Transaction;
  installment: PaymentInstallment;
  onClose: () => void;
}

export const ReceiptView: React.FC<ReceiptViewProps> = ({ client, transaction, installment, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm no-print">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden animate-fadeIn">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <h3 className="font-bold text-slate-800">Payment Receipt</h3>
          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded hover:bg-slate-800 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
            <button 
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full"
            >
              <Printer className="w-5 h-5 hidden" /> {/* Placeholder for alignment */}
              <span className="text-xl font-bold leading-none">&times;</span>
            </button>
          </div>
        </div>

        <div className="p-8 print-area bg-white text-slate-900 font-sans">
          {/* Receipt Header */}
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-3">
              <div className="w-14 h-12 bg-slate-900 text-white flex items-center justify-center rounded-lg shadow-sm">
                <SpartanLogo className="w-10 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900">AJ ARCHITECTS</h1>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Engineers Consulting</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold text-slate-800 uppercase">Receipt</h2>
              <p className="text-sm text-slate-500">No: {installment.id}</p>
              <p className="text-sm text-slate-500">Date: {installment.date}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">From:</h4>
              <p className="font-bold text-slate-800">Spartan Systems Ltd.</p>
              <p className="text-sm text-slate-600">123 Engineering Way</p>
              <p className="text-sm text-slate-600">Tech District, ST 54321</p>
              <p className="text-sm text-slate-600">contact@spartan.sys</p>
            </div>
            <div>
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Bill To:</h4>
              <p className="font-bold text-slate-800">{client.company}</p>
              <p className="text-sm text-slate-600">{client.name}</p>
              <p className="text-sm text-slate-600">{client.email}</p>
              <p className="text-sm text-slate-600">{client.phone}</p>
            </div>
          </div>

          <div className="border-t border-b border-slate-200 py-4 mb-8">
            <div className="grid grid-cols-4 gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              <div className="col-span-2">Description</div>
              <div className="text-right">Reference</div>
              <div className="text-right">Amount</div>
            </div>
            <div className="grid grid-cols-4 gap-4 text-sm text-slate-700">
              <div className="col-span-2">
                <p className="font-bold text-slate-800">{installment.label}</p>
                <p className="text-xs text-slate-500">For: {transaction.workType} - {transaction.item}</p>
              </div>
              <div className="text-right font-mono text-xs">{transaction.id}</div>
              <div className="text-right font-bold">${installment.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            </div>
          </div>

          <div className="flex justify-end mb-8">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Payment Method:</span>
                <span className="font-medium text-slate-800">{installment.method}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Transaction Date:</span>
                <span className="font-medium text-slate-800">{installment.date}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                <span className="text-lg font-bold text-slate-800">Total Paid</span>
                <span className="text-2xl font-black text-emerald-600">${installment.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 mb-8">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Contract Summary:</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-[10px] text-slate-500 uppercase">Total Contract</p>
                <p className="font-bold text-slate-800">${transaction.amount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase">Total Received</p>
                <p className="font-bold text-emerald-600">${transaction.dilAmount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase">Remaining Balance</p>
                <p className="font-bold text-red-600">${(transaction.amount - transaction.dilAmount).toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="text-center pt-8 border-t border-slate-100">
            <p className="text-xs text-slate-400 italic">Thank you for your business. This is a computer generated receipt.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
