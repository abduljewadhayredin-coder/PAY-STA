
import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line
} from 'recharts';
import { Transaction } from '../types';
import { COLORS } from '../constants';
import { WidgetTooltipOverlay } from './WidgetTooltipOverlay';

interface ChartsSectionProps {
  data: Transaction[];
}

export const ChartsSection: React.FC<ChartsSectionProps> = ({ data }) => {

  // SAFETY FIX: Ensure data is an array before processing to prevent "Uncaught TypeError"
  if (!data || !Array.isArray(data)) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 text-center text-slate-500 italic">
        No data available for visualization.
      </div>
    );
  }

  const monthlyData = useMemo(() => {
    const grouped: Record<string, number> = {};
    data.forEach(t => {
      const month = t.date.substring(0, 7); // YYYY-MM
      grouped[month] = (grouped[month] || 0) + t.amount;
    });
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);

  const categoryData = useMemo(() => {
    const grouped: Record<string, number> = {};
    data.forEach(t => {
      // Use category (Ground Floor, 1st Floor etc)
      grouped[t.category] = (grouped[t.category] || 0) + t.amount;
    });
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value); // Descending
  }, [data]);

  const statusData = useMemo(() => {
    const grouped: Record<string, number> = {};
    data.forEach(t => {
      grouped[t.status] = (grouped[t.status] || 0) + 1; // Count
    });
    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [data]);

  const growthData = useMemo(() => {
    return monthlyData.map((curr, index) => {
      const prev = index > 0 ? monthlyData[index - 1] : null;
      const prevValue = prev ? prev.value : 0;
      const growthAmount = curr.value - prevValue;
      const growthPercent = prevValue > 0 ? parseFloat(((growthAmount / prevValue) * 100).toFixed(1)) : 0;
      return {
        name: curr.name,
        'Current Month': curr.value,
        'Previous Month': prevValue,
        'Growth Rate (%)': growthPercent,
        'Growth Amount': growthAmount
      };
    });
  }, [monthlyData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-md">
          <p className="font-semibold text-slate-700">{label}</p>
          <p className="text-blue-600">
            {typeof payload[0].value === 'number' && payload[0].name !== 'count' // Rough check for currency
              ? `$${payload[0].value.toLocaleString()}`
              : payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  const GrowthTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const current = payload.find((p: any) => p.name === 'Current Month')?.value || 0;
      const previous = payload.find((p: any) => p.name === 'Previous Month')?.value || 0;
      const difference = current - previous;
      const growthPct = previous > 0 ? ((difference / previous) * 100).toFixed(1) : '—';
      const isPositive = difference >= 0;

      return (
        <div className="bg-white p-4 border border-slate-200 shadow-lg rounded-md space-y-2">
          <p className="font-bold text-slate-800">{label}</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between gap-6">
              <span className="text-slate-500">Current Month:</span>
              <span className="font-semibold text-slate-800">${current.toLocaleString()}</span>
            </div>
            <div className="flex justify-between gap-6 border-b border-dashed border-slate-100 pb-1">
              <span className="text-slate-500">Previous Month:</span>
              <span className="font-semibold text-slate-600">${previous.toLocaleString()}</span>
            </div>
            <div className="flex justify-between gap-6 pt-1">
              <span className="text-slate-500">Growth:</span>
              <span className={`font-bold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                {isPositive ? '+' : ''}${difference.toLocaleString()} ({growthPct}%)
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Helper to map status to specific colors for the Pie Chart
  const getStatusColor = (status: string, index: number) => {
    switch(status) {
      case 'Completed': return '#10b981'; // Emerald
      case 'In Progress': return '#3b82f6'; // Blue
      case 'Pending': return '#f59e0b'; // Amber
      case 'On Hold': return '#8b5cf6'; // Violet
      case 'Cancelled': return '#f43f5e'; // Rose
      default: return COLORS.chart[index % COLORS.chart.length];
    }
  }

  // Helper to map Category (Project Level) colors
  const getCategoryColor = (category: string, index: number) => {
    // Explicit rule: GROUND FLOOR IS BLUE
    if (category.toLowerCase().includes('ground')) return '#3b82f6'; // Blue
    
    // Others use color codes from the palette
    // Shift index by 1 to avoid using Blue (index 0) again immediately if possible, but palette is large
    return COLORS.chart[(index + 1) % COLORS.chart.length];
  }

  const totalTransactions = useMemo(() => {
    return statusData.reduce((sum, item) => sum + item.value, 0);
  }, [statusData]);

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // Don't render very small slices' text to avoid overlaps/crowding
    const radius = innerRadius + (outerRadius - innerRadius) * 0.45;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor="middle" 
        dominantBaseline="central" 
        className="text-[10px] font-bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const renderLegendText = (value: string) => {
    const item = statusData.find((d) => d.name === value);
    if (!item || !totalTransactions) return value;
    const percentage = ((item.value / totalTransactions) * 100).toFixed(1);
    return (
      <span className="text-xs font-semibold text-slate-600">
        {value} <span className="text-slate-400 font-normal ml-0.5">({item.value} - {percentage}%)</span>
      </span>
    );
  };

  const StatusTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const { name, value } = payload[0].payload;
      const pct = totalTransactions > 0 ? ((value / totalTransactions) * 100).toFixed(1) : 0;
      return (
        <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-md">
          <p className="font-semibold text-slate-800 mb-1">{name}</p>
          <div className="space-y-0.5 text-xs">
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Count:</span>
              <span className="font-semibold text-slate-800">{value}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Percentage:</span>
              <span className="font-semibold text-blue-600">{pct}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
      {/* Monthly Trend */}
      <div 
        data-widget="chart-monthly-trend" 
        tabIndex={0}
        aria-label="Monthly Revenue Trend chart"
        title="Monthly Revenue Trend: Timeline visualization of overall revenue trajectory and seasonal cash flow patterns."
        className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 lg:col-span-2 xl:col-span-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all cursor-pointer relative group"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800">Monthly Revenue Trend</h3>
          <WidgetTooltipOverlay
            title="Monthly Revenue Trend"
            category="Cash Flow Analytics"
            description="Area chart visualizing the monthly revenue progression and cash flow trajectory over time to track long-term financial health."
          />
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.1}/>
                  <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 12 }} 
                tickFormatter={(val) => val.slice(5)} // Show MM
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 12 }} 
                tickFormatter={(val) => `$${val / 1000}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="value" stroke={COLORS.primary} fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Status Pie */}
      <div 
        data-widget="chart-status-pie" 
        tabIndex={0}
        aria-label="Transaction Status Distribution pie chart"
        title="Transaction Status Distribution: Proportional breakdown of transactions by workflow status to identify operational bottlenecks."
        className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all cursor-pointer relative group"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Transaction Status Distribution</h3>
            <p className="text-xs text-slate-500">Breakdown of operational stages to identify bottlenecks</p>
          </div>
          <WidgetTooltipOverlay
            title="Status Distribution"
            category="Pipeline Analysis"
            description="Interactive donut chart breaking down transactions by operational stage to identify project bottlenecks and pending workloads."
          />
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
                label={renderCustomizedLabel}
                labelLine={false}
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getStatusColor(entry.name, index)} />
                ))}
              </Pie>
              <Tooltip content={<StatusTooltip />} />
              <Legend formatter={renderLegendText} verticalAlign="bottom" height={44}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Total Monthly Revenue Bar Chart */}
      <div 
        data-widget="chart-total-monthly" 
        tabIndex={0}
        aria-label="Total Monthly Revenue bar chart"
        title="Total Monthly Revenue: Absolute monthly revenue volume bars to track billing totals and financial velocity."
        className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 lg:col-span-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all cursor-pointer relative group"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Total Monthly Revenue</h3>
            <p className="text-xs text-slate-500">Absolute revenue generated per month</p>
          </div>
          <WidgetTooltipOverlay
            title="Total Monthly Revenue"
            category="Revenue Volume"
            description="Absolute dollar revenue generated per month to compare sales volume and financial performance across accounting cycles."
          />
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 12 }} 
                tickFormatter={(val) => val.slice(5)} // Show MM
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 12 }} 
                tickFormatter={(val) => `$${val / 1000}k`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9', opacity: 0.5 }} />
              <Bar 
                dataKey="value" 
                name="Revenue" 
                fill={COLORS.primary} 
                radius={[4, 4, 0, 0]} 
                barSize={50}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Revenue Growth Comparison */}
      <div 
        data-widget="chart-mom-growth" 
        tabIndex={0}
        aria-label="MoM Revenue Growth line chart"
        title="MoM Revenue Growth Comparison: Side-by-side growth trend lines comparing current month against previous month revenue performance."
        className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 lg:col-span-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all cursor-pointer relative group"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">MoM Revenue Growth</h3>
            <p className="text-xs text-slate-500">Comparing current month total versus previous month</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                <span>Current Month</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 border-t border-dashed border-slate-400 bg-slate-200" style={{height: '2px', width: '12px'}}></span>
                <span>Previous Month</span>
              </div>
            </div>
            <WidgetTooltipOverlay
              title="MoM Revenue Growth"
              category="Growth Trends"
              description="Comparative trend line tracking current versus previous month revenue figures, growth amounts, and percentage changes."
            />
          </div>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={growthData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 12 }} 
                tickFormatter={(val) => val.slice(5)} // Show MM
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 12 }} 
                tickFormatter={(val) => `$${val / 1000}k`}
              />
              <Tooltip content={<GrowthTooltip />} />
              <Line 
                type="monotone" 
                name="Current Month" 
                dataKey="Current Month" 
                stroke={COLORS.primary} 
                strokeWidth={3} 
                activeDot={{ r: 8 }} 
                dot={{ r: 4, fill: COLORS.primary }} 
              />
              <Line 
                type="monotone" 
                name="Previous Month" 
                dataKey="Previous Month" 
                stroke="#94a3b8" 
                strokeWidth={2} 
                strokeDasharray="5 5" 
                dot={{ r: 3, fill: '#94a3b8' }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Bar */}
      <div 
        data-widget="chart-category-bar" 
        tabIndex={0}
        aria-label="Revenue by Project Level bar chart"
        title="Revenue by Project Level: Categorical distribution of project billing across construction tiers and building levels."
        className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 lg:col-span-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all cursor-pointer relative group"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800">Revenue by Project Level</h3>
          <WidgetTooltipOverlay
            title="Revenue by Project Level"
            category="Structural Tier Analysis"
            description="Categorical breakdown of project billing across construction tiers and building levels (Ground Floor, 1st Floor, Roof Level, etc.)."
          />
        </div>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(val) => `$${val/1000}k`} />
              <Tooltip content={<CustomTooltip />} cursor={{fill: '#f1f5f9'}} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                {categoryData.map((entry, index) => (
                   <Cell key={`cell-${index}`} fill={getCategoryColor(entry.name, index)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
