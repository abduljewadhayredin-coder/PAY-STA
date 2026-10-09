import React, { useState } from 'react';
import { Transaction } from '../types';
import { analyzeDashboard } from '../services/geminiService';
import { Sparkles, Loader2, RefreshCw } from 'lucide-react';

interface GeminiInsightsProps {
  data: Transaction[];
}

export const GeminiInsights: React.FC<GeminiInsightsProps> = ({ data }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const result = await analyzeDashboard(data);
      setAnalysis(result);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      data-widget="gemini-insights" 
      tabIndex={0}
      aria-label="Gemini AI Executive Summary"
      className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border border-indigo-100 p-4 mb-6 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all cursor-pointer"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold text-indigo-900">AI Executive Summary</h3>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={loading || data.length === 0}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-white text-indigo-600 border border-indigo-200 rounded-md hover:bg-indigo-50 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          {analysis ? 'Update Analysis' : 'Generate Insights'}
        </button>
      </div>

      {analysis ? (
        <div className="prose prose-sm prose-indigo max-w-none text-slate-700 bg-white/50 p-4 rounded-md border border-indigo-100/50">
          <div className="whitespace-pre-wrap leading-relaxed">
            {analysis}
          </div>
        </div>
      ) : (
        <p className="text-sm text-indigo-400 italic">
          Click "Generate Insights" to get an AI-powered breakdown of your current dashboard metrics using Gemini.
        </p>
      )}
    </div>
  );
};
