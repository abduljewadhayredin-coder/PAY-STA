
import React, { useMemo, useState, useEffect } from 'react';
import { Transaction, KPIStats, ViewState, Client, WorkerPayment } from '../types';
import { KPICards } from './KPICards';
import { GeminiInsights } from './GeminiInsights';
import { StatusSlicer } from './StatusSlicer';
import { ChartsSection } from './ChartsSection';
import { ClientROIModule } from './ClientROIModule';
import { WidgetTooltipOverlay } from './WidgetTooltipOverlay';
import { Database } from 'lucide-react';

interface DashboardViewProps {
  data: Transaction[];
  clients?: Client[];
  workerPayments?: WorkerPayment[];
  onGenerateData: () => void;
  generating: boolean;
  onNavigate?: (view: ViewState, params?: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  data, 
  clients = [], 
  workerPayments = [], 
  onGenerateData, 
  generating, 
  onNavigate 
}) => {
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const filteredData = useMemo(() => {
    if (!statusFilter) return data;
    return data.filter(d => d.status === statusFilter);
  }, [data, statusFilter]);

  const kpiStats: KPIStats = useMemo(() => {
    const totalRevenue = filteredData.reduce((acc, curr) => acc + curr.amount, 0);
    const totalTransactions = filteredData.length;
    const averageValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    const completedCount = filteredData.filter(d => d.status === 'Completed').length;
    const completionRate = totalTransactions > 0 ? (completedCount / totalTransactions) * 100 : 0;

    return { totalRevenue, totalTransactions, averageValue, completionRate };
  }, [filteredData]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement as HTMLElement | null;
      if (!activeElement) return;

      const activeTagName = activeElement.tagName;
      // Allow key operations inside interactive text nodes
      if (activeTagName === 'INPUT' || activeTagName === 'TEXTAREA' || activeTagName === 'SELECT') {
        if (e.key === 'Escape') {
          const widgetParent = activeElement.closest('[data-widget]') as HTMLElement | null;
          if (widgetParent) {
            widgetParent.focus();
            e.preventDefault();
          }
        }
        return;
      }

      const activeWidget = activeElement.closest('[data-widget]') as HTMLElement | null;
      if (!activeWidget) return;

      const isContainerFocused = activeElement.hasAttribute('data-widget');

      if (isContainerFocused) {
        if (e.key === 'Enter' || e.key === ' ') {
          // Focus first actionable child inside
          const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
          const children = Array.from(activeElement.querySelectorAll(focusableSelector)) as HTMLElement[];
          const actionable = children.filter(child => child !== activeElement && !child.hasAttribute('data-widget'));
          if (actionable.length > 0) {
            e.preventDefault();
            actionable[0].focus();
          } else {
            // Execute default click on active widget
            activeElement.click();
          }
          return;
        }

        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
          e.preventDefault(); // Prevent native web scrolling

          const widgets = Array.from(document.querySelectorAll('[data-widget]')) as HTMLElement[];
          if (widgets.length <= 1) return;

          const activeRect = activeElement.getBoundingClientRect();
          const activeCenter = {
            x: activeRect.left + activeRect.width / 2,
            y: activeRect.top + activeRect.height / 2
          };

          let bestCandidate: HTMLElement | null = null;
          let bestScore = Infinity;

          for (const widget of widgets) {
            if (widget === activeElement) continue;

            const rect = widget.getBoundingClientRect();
            const center = {
              x: rect.left + rect.width / 2,
              y: rect.top + rect.height / 2
            };

            const dx = center.x - activeCenter.x;
            const dy = center.y - activeCenter.y;

            let isMatch = false;
            let primaryDiff = 0;
            let secondaryDiff = 0;

            switch (e.key) {
              case 'ArrowUp':
                isMatch = dy < -5;
                primaryDiff = -dy;
                secondaryDiff = Math.abs(dx);
                break;
              case 'ArrowDown':
                isMatch = dy > 5;
                primaryDiff = dy;
                secondaryDiff = Math.abs(dx);
                break;
              case 'ArrowLeft':
                isMatch = dx < -5;
                primaryDiff = -dx;
                secondaryDiff = Math.abs(dy);
                break;
              case 'ArrowRight':
                isMatch = dx > 5;
                primaryDiff = dx;
                secondaryDiff = Math.abs(dy);
                break;
            }

            if (isMatch) {
              const score = primaryDiff + secondaryDiff * 1.8;
              if (score < bestScore) {
                bestScore = score;
                bestCandidate = widget;
              }
            }
          }

          if (bestCandidate) {
            bestCandidate.focus();
          } else {
            // Sequential selection fallback
            const currIndex = widgets.indexOf(activeElement);
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
              const nextIndex = (currIndex + 1) % widgets.length;
              widgets[nextIndex].focus();
            } else {
              const prevIndex = (currIndex - 1 + widgets.length) % widgets.length;
              widgets[prevIndex].focus();
            }
          }
        }
      } else {
        // Child focused: Escape exits focus back up to widget container
        if (e.key === 'Escape') {
          e.preventDefault();
          activeWidget.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-slate-800">Operational Overview</h2>
          <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-medium bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full border border-slate-200">
            <kbd className="bg-white px-1 py-0.5 rounded border border-slate-200 shadow-sm text-[10px] font-mono leading-none">Tab</kbd>
            <span>then</span>
            <kbd className="bg-white px-1 py-0.5 rounded border border-slate-200 shadow-sm text-[10px] font-mono leading-none">↑ ↓ ← →</kbd>
            <span>Keyboard Nav Active</span>
          </span>
        </div>
        <button 
          data-widget="generate-data"
          onClick={onGenerateData}
          disabled={generating}
          className="text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 px-3 py-1.5 rounded-md border border-blue-200 bg-white shadow-sm transition-all cursor-pointer"
        >
          {generating ? 'Processing AI Request...' : '+ Generate More Data'}
        </button>
      </div>

      <KPICards stats={kpiStats} />
      
      <GeminiInsights data={filteredData} />

      {/* Return on Investment (ROI) Visual Analytics Module */}
      <ClientROIModule 
        transactions={filteredData}
        clients={clients}
        workerPayments={workerPayments}
        onNavigate={onNavigate}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <StatusSlicer 
            data={data} 
            selectedStatus={statusFilter} 
            onSelectStatus={setStatusFilter} 
            onNavigate={onNavigate}
          />
          <div 
            data-widget="data-summary" 
            tabIndex={0}
            title="Data Summary: Live record counter showing the number of active transactions currently in view based on applied filters."
            aria-label="Data Summary widget"
            className="mt-4 bg-white p-4 rounded border border-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all cursor-pointer relative group"
          >
             <div className="flex items-center justify-between mb-2">
               <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                 <Database className="w-4 h-4 text-blue-500" /> Data Summary
               </h4>
               <WidgetTooltipOverlay
                 title="Data Summary"
                 category="Record Monitor"
                 description="Real-time operational tally reflecting active and filtered transaction records across the current dataset view."
               />
             </div>
             <p className="text-xs text-slate-500">
               Active Records: <span className="font-mono font-semibold text-slate-800">{filteredData.length}</span>
             </p>
          </div>
        </div>

        <div className="lg:col-span-3">
           <ChartsSection data={filteredData} />
        </div>
      </div>
    </div>
  );
};
