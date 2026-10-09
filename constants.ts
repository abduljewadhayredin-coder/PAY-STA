

import { Transaction, Client, WorkerPayment, WorkerDiscipline, ScheduleProgramStatus, Milestone } from './types';

export const INITIAL_CLIENTS: Client[] = [
  { id: 'C-001', name: 'Acme Corp', company: 'Acme Industries', email: 'contact@acme.com', phone: '+1 555-0101', status: 'Active', joinedDate: '2023-01-15' },
  { id: 'C-002', name: 'Globex Inc', company: 'Globex Corporation', email: 'info@globex.com', phone: '+1 555-0102', status: 'Active', joinedDate: '2023-02-20' },
  { id: 'C-003', name: 'Soylent Corp', company: 'Soylent Corp', email: 'sales@soylent.com', phone: '+1 555-0103', status: 'Inactive', joinedDate: '2023-03-10' },
  { id: 'C-004', name: 'Initech', company: 'Initech LLC', email: 'support@initech.com', phone: '+1 555-0104', status: 'Active', joinedDate: '2023-04-05' },
  { id: 'C-005', name: 'Umbrella Corp', company: 'Umbrella Pharmaceuticals', email: 'danger@umbrella.com', phone: '+1 555-0105', status: 'Prospect', joinedDate: '2023-05-12' },
];

export const INITIAL_WORK_TYPES = [
  'Structural Analysis', 
  'ST Drawing', 
  'BOQ', 
  'AR', 
  'EL', 
  'SN', 
  'Site Inspection',
  'Feasibility Study',
  'Consultation'
];

// Specific categories for the "Ground Floor is Blue" logic
export const PROJECT_LEVELS = [
  'Ground Floor',
  'First Floor',
  'Second Floor',
  'Foundation',
  'Roof Level',
  'External Works',
  'Basement'
];

export const generateSampleData = (): Transaction[] => {
  const statuses = ['Completed', 'Pending', 'In Progress', 'Cancelled', 'On Hold'] as const;
  const methods = ['Bank Transfer', 'Cheque', 'Cash', 'Credit Card', 'Other'] as const;
  const regions = ['North America', 'Europe', 'Asia Pacific', 'Latin America'];
  
  // Extra unusual types for variety
  const unusualWorkTypes = ['Emergency Repair', 'Pro Bono Consult', 'Warranty Claim', 'Correction Order', 'Dispute Resolution'];

  const data: Transaction[] = [];
  const now = new Date();
  
  for (let i = 0; i < 75; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
    const dateStr = date.toISOString().split('T')[0];
    const client = INITIAL_CLIENTS[Math.floor(Math.random() * INITIAL_CLIENTS.length)];
    
    // 10% chance of unusual work type
    const isUnusual = Math.random() < 0.1;
    const selectedWorkType = isUnusual 
      ? unusualWorkTypes[Math.floor(Math.random() * unusualWorkTypes.length)] 
      : INITIAL_WORK_TYPES[Math.floor(Math.random() * INITIAL_WORK_TYPES.length)];

    const selectedCategory = PROJECT_LEVELS[Math.floor(Math.random() * PROJECT_LEVELS.length)];
    
    // Amount logic with edge cases
    let totalAmount = Math.floor(Math.random() * 5000) + 500;
    
    // Edge cases for amount
    if (Math.random() < 0.05) {
       totalAmount = 0; // Pro bono / Warranty / Correction
    } else if (Math.random() < 0.05) {
       totalAmount = Math.floor(Math.random() * 20000) + 10000; // High Value Project
    }

    // Determine payment logic
    const isCompleted = Math.random() > 0.5;
    const isAdvance = Math.random() > 0.3;
    
    let dilAmount = 0;
    if (totalAmount === 0) {
        dilAmount = 0;
    } else if (isCompleted) {
        // Edge case: Completed but unpaid (bad debt or late payment) - 10% chance
        dilAmount = Math.random() < 0.1 ? 0 : totalAmount;
    } else {
        // Pending/In Progress
        if (isAdvance) {
            // Edge case: Overpaid or Fully paid in advance - 5% chance
            dilAmount = Math.random() < 0.05 ? totalAmount : Math.floor(totalAmount * (0.1 + Math.random() * 0.4));
        }
    }
    
    const workStatus = isCompleted ? 'Completed' : statuses[Math.floor(Math.random() * statuses.length)];
    
    let paymentStatus: 'Settled' | 'Partial' | 'Unpaid' = 'Unpaid';
    if (totalAmount === 0) paymentStatus = 'Settled'; // Free services are technically settled
    else if (dilAmount >= totalAmount) paymentStatus = 'Settled';
    else if (dilAmount > 0) paymentStatus = 'Partial';
    
    // Random Times
    const startHour = 8 + Math.floor(Math.random() * 8);
    const startTime = `${startHour.toString().padStart(2, '0')}:00`;
    const endTime = `${(startHour + 2 + Math.floor(Math.random() * 4)).toString().padStart(2, '0')}:00`;

    const baseAmount = totalAmount;
    
    // Schedule Program & Lag calculation
    let scheduleProgram: ScheduleProgramStatus = 'On Schedule';
    let lagDays = 0;
    let schedulePhase = 'Schematic Drawings (ST/AR)';
    let assignedLead = 'Dawit Mengistu (Structure)';

    const leads = [
      'Dawit Mengistu (Structure)',
      'Selamawit Tadesse (Architecture)',
      'Yonas Berhe (Sanitary)',
      'Kidus Abebe (Electrical)',
      'Bethlehem Haile (Site Supervision)',
      'Tigist Wolde (BOQ & Quantity)'
    ];
    assignedLead = leads[i % leads.length];

    const phases = [
      'Feasibility & Site Analysis',
      'Schematic Drawings (ST/AR)',
      'Structural Calculations & BOQ',
      'Council Permitting & Review',
      'Foundation & Structural Framing',
      'Finishes & Sanitary/Electrical Installation',
      'Final Site Inspection & Handover'
    ];
    schedulePhase = phases[i % phases.length];

    if (workStatus === 'Completed') {
      scheduleProgram = 'Completed';
      lagDays = 0;
      schedulePhase = 'Final Site Inspection & Handover';
    } else if (workStatus === 'In Progress') {
      const mode = i % 10;
      if (mode <= 2) {
        // Schedule Lag (Behind)
        scheduleProgram = 'Schedule Lag';
        lagDays = 3 + (i % 7);
      } else if (mode === 3) {
        // Critical Lag
        scheduleProgram = 'Critical Lag';
        lagDays = 14 + (i % 12);
      } else if (mode <= 6) {
        // Under Work (Active)
        scheduleProgram = 'Under Work';
        lagDays = 1;
      } else if (mode <= 8) {
        // Under Schedule (Ahead)
        scheduleProgram = 'Under Schedule';
        lagDays = -(2 + (i % 4));
      } else {
        scheduleProgram = 'On Schedule';
        lagDays = 0;
      }
    } else if (workStatus === 'Pending') {
      scheduleProgram = (i % 3 === 0) ? 'Schedule Lag' : 'Under Work';
      lagDays = (i % 3 === 0) ? 5 : 0;
    } else if (workStatus === 'On Hold') {
      scheduleProgram = 'Schedule Lag';
      lagDays = 10;
    } else {
      scheduleProgram = 'Completed';
      lagDays = 0;
    }

    // Target completion date (2-6 weeks from start date)
    const targetComp = new Date(date);
    targetComp.setDate(targetComp.getDate() + 28);
    const targetCompletionDate = targetComp.toISOString().split('T')[0];

    data.push({
      id: `TRX-${1000 + i}`,
      date: dateStr,
      startTime,
      endTime,
      targetCompletionDate,
      scheduleProgram,
      lagDays,
      schedulePhase,
      assignedLead,
      scheduleNotes: lagDays > 0 ? `Lag of ${lagDays}d due to design revisions and site inspection sync.` : (lagDays < 0 ? `Ahead of schedule program by ${Math.abs(lagDays)}d.` : 'Progression exactly on track with milestone program.'),
      clientId: client.id,
      clientName: client.company,
      category: selectedCategory, // Now uses Ground Floor, 1st Floor, etc.
      workType: selectedWorkType,
      item: `${selectedWorkType} - ${selectedCategory}${totalAmount === 0 ? ' (No Charge)' : ''}`,
      status: workStatus,
      paymentStatus: paymentStatus,
      isAdvanceReceived: dilAmount > 0,
      paymentMethod: dilAmount > 0 ? methods[Math.floor(Math.random() * methods.length)] : undefined,
      amount: totalAmount,
      baseAmount: baseAmount,
      dilAmount: dilAmount,
      balanceAmount: totalAmount - dilAmount,
      region: regions[Math.floor(Math.random() * regions.length)],
      installments: dilAmount > 0 ? [
        { id: `PAY-${Date.now()}-${i}`, date: dateStr, amount: dilAmount, method: methods[Math.floor(Math.random() * methods.length)], label: 'Initial Payment' }
      ] : [],
      adjustments: [],
      milestones: [
        {
          id: `MLS-${1000 + i}-1`,
          title: 'Site Inspection & Soil Survey',
          dueDate: dateStr,
          completed: workStatus === 'Completed' || workStatus === 'In Progress',
          completedDate: (workStatus === 'Completed' || workStatus === 'In Progress') ? dateStr : undefined,
          transactionId: `TRX-${1000 + i}`,
          clientId: client.id,
          clientName: client.company,
          assignedTo: assignedLead,
          notes: 'Geotechnical & site topography survey documentation'
        },
        {
          id: `MLS-${1000 + i}-2`,
          title: 'Preliminary Architecture & Concept Drawings',
          dueDate: (() => {
            const d = new Date(date);
            d.setDate(d.getDate() + 10);
            return d.toISOString().split('T')[0];
          })(),
          completed: workStatus === 'Completed' || (workStatus === 'In Progress' && i % 2 === 0),
          completedDate: (workStatus === 'Completed' || (workStatus === 'In Progress' && i % 2 === 0)) ? dateStr : undefined,
          transactionId: `TRX-${1000 + i}`,
          clientId: client.id,
          clientName: client.company,
          assignedTo: assignedLead,
          notes: 'Client concept review & design adjustments'
        },
        {
          id: `MLS-${1000 + i}-3`,
          title: 'Structural Calculations & BOQ Approval',
          dueDate: (() => {
            const d = new Date(date);
            d.setDate(d.getDate() + 20);
            return d.toISOString().split('T')[0];
          })(),
          completed: workStatus === 'Completed',
          completedDate: workStatus === 'Completed' ? dateStr : undefined,
          transactionId: `TRX-${1000 + i}`,
          clientId: client.id,
          clientName: client.company,
          assignedTo: assignedLead,
          notes: 'Engineering stamp & quantity takeoff verification'
        },
        {
          id: `MLS-${1000 + i}-4`,
          title: 'Final Permit & Construction Handover',
          dueDate: targetCompletionDate,
          completed: workStatus === 'Completed',
          completedDate: workStatus === 'Completed' ? targetCompletionDate : undefined,
          transactionId: `TRX-${1000 + i}`,
          clientId: client.id,
          clientName: client.company,
          assignedTo: assignedLead,
          notes: 'Authority sign-off & client digital packet handover'
        }
      ]
    });
  }
  return data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const INITIAL_DATA: Transaction[] = generateSampleData();

export const COLORS = {
  primary: '#3b82f6', // blue-500
  secondary: '#64748b', // slate-500
  success: '#10b981', // emerald-500
  warning: '#f59e0b', // amber-500
  danger: '#ef4444', // red-500
  info: '#06b6d4', // cyan-500
  // Expanded Palette for charts
  chart: [
    '#3b82f6', // Blue (Reserved usually for Ground Floor if needed)
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#84cc16', // Lime
    '#f97316', // Orange
    '#14b8a6', // Teal
    '#6366f1', // Indigo
    '#d946ef', // Fuchsia
    '#64748b', // Slate
  ]
};

// Centralized Status Styles using Full Color Spectrum
export const STATUS_STYLES: Record<string, string> = {
  // Work Statuses
  'Completed': 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  'In Progress': 'bg-blue-100 text-blue-800 border border-blue-200',
  'Pending': 'bg-amber-100 text-amber-800 border border-amber-200',
  'On Hold': 'bg-violet-100 text-violet-800 border border-violet-200',
  'Cancelled': 'bg-rose-100 text-rose-800 border border-rose-200',
  
  // Client Statuses
  'Active': 'bg-teal-100 text-teal-800 border border-teal-200',
  'Inactive': 'bg-slate-100 text-slate-600 border border-slate-200',
  'Prospect': 'bg-indigo-100 text-indigo-800 border border-indigo-200',

  // Payment Statuses
  'Settled': 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  'Partial': 'bg-orange-100 text-orange-800 border border-orange-200',
  'Unpaid': 'bg-red-100 text-red-800 border border-red-200',
  
  // Default
  'default': 'bg-slate-100 text-slate-800 border border-slate-200'
};

// Button Styles for Filters
export const STATUS_BUTTON_STYLES: Record<string, { active: string, inactive: string }> = {
  'Completed': { active: 'bg-emerald-600 text-white border-emerald-700 shadow-md shadow-emerald-200', inactive: 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50' },
  'In Progress': { active: 'bg-blue-600 text-white border-blue-700 shadow-md shadow-blue-200', inactive: 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50' },
  'Pending': { active: 'bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-200', inactive: 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50' },
  'On Hold': { active: 'bg-violet-600 text-white border-violet-700 shadow-md shadow-violet-200', inactive: 'bg-white text-violet-700 border-violet-200 hover:bg-violet-50' },
  'Cancelled': { active: 'bg-rose-600 text-white border-rose-700 shadow-md shadow-rose-200', inactive: 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50' },
  'All': { active: 'bg-slate-800 text-white border-slate-900 shadow-md', inactive: 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50' },
  // Default fallback
  'default': { active: 'bg-slate-800 text-white', inactive: 'bg-white text-slate-600' }
};

export const WORKER_DISCIPLINES: WorkerDiscipline[] = [
  'Structure',
  'Sanitary',
  'Electrical',
  'Architecture',
  'Site Supervision',
  'Mechanical',
  'Other'
];

export const DISCIPLINE_METADATA: Record<WorkerDiscipline, { label: string; color: string; bg: string; border: string; text: string }> = {
  'Structure': { label: 'Structural Engineering', color: '#3b82f6', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
  'Sanitary': { label: 'Sanitary & Plumbing', color: '#06b6d4', bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700' },
  'Electrical': { label: 'Electrical Systems', color: '#f59e0b', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
  'Architecture': { label: 'Architecture & Design', color: '#8b5cf6', bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700' },
  'Site Supervision': { label: 'Site Supervision', color: '#10b981', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
  'Mechanical': { label: 'Mechanical & HVAC', color: '#ec4899', bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700' },
  'Other': { label: 'Consulting & Admin', color: '#64748b', bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700' }
};

export const INITIAL_WORKER_PAYMENTS: WorkerPayment[] = [
  {
    id: 'EXP-101',
    workerName: 'Dawit Mengistu',
    discipline: 'Structure',
    role: 'Senior Structural Engineer',
    clientName: 'Acme Industries',
    projectItem: 'Structural Analysis - Ground Floor',
    date: '2026-09-15',
    amount: 1850,
    paymentMethod: 'Bank Transfer',
    status: 'Paid',
    notes: 'Load calculations and foundation reinforcement schedule'
  },
  {
    id: 'EXP-102',
    workerName: 'Selamawit Tadesse',
    discipline: 'Architecture',
    role: 'Lead Architect',
    clientName: 'Globex Corporation',
    projectItem: 'AR - First Floor',
    date: '2026-09-18',
    amount: 2200,
    paymentMethod: 'Bank Transfer',
    status: 'Paid',
    notes: 'Architectural schematic drawings and 3D exterior renders'
  },
  {
    id: 'EXP-103',
    workerName: 'Yonas Bekele',
    discipline: 'Electrical',
    role: 'Electrical Systems Engineer',
    clientName: 'Soylent Corp',
    projectItem: 'EL - Roof Level',
    date: '2026-09-22',
    amount: 1400,
    paymentMethod: 'Bank Transfer',
    status: 'Paid',
    notes: 'Main distribution board design and solar wiring layout'
  },
  {
    id: 'EXP-104',
    workerName: 'Ephrem Assefa',
    discipline: 'Sanitary',
    role: 'Sanitary & Plumbing Specialist',
    clientName: 'Initech LLC',
    projectItem: 'SN - Basement',
    date: '2026-09-25',
    amount: 1250,
    paymentMethod: 'Cheque',
    status: 'Paid',
    notes: 'Storm water drainage and basement sump pump design'
  },
  {
    id: 'EXP-105',
    workerName: 'Mulugeta Haile',
    discipline: 'Structure',
    role: 'Rebar & Steel Drafter',
    clientName: 'Umbrella Pharmaceuticals',
    projectItem: 'ST Drawing - Foundation',
    date: '2026-09-28',
    amount: 950,
    paymentMethod: 'Cash',
    status: 'Paid',
    notes: 'Beam section and column reinforcement detail drafting'
  },
  {
    id: 'EXP-106',
    workerName: 'Blen Girma',
    discipline: 'Architecture',
    role: 'Interior Architecture Drafter',
    clientName: 'Acme Industries',
    projectItem: 'AR - Ground Floor',
    date: '2026-10-01',
    amount: 1600,
    paymentMethod: 'Bank Transfer',
    status: 'Pending',
    notes: 'Internal partition schedules and reflected ceiling plans'
  },
  {
    id: 'EXP-107',
    workerName: 'Kidus Wolde',
    discipline: 'Sanitary',
    role: 'Sanitary Engineer',
    clientName: 'Globex Corporation',
    projectItem: 'SN - Second Floor',
    date: '2026-10-02',
    amount: 1100,
    paymentMethod: 'Bank Transfer',
    status: 'Scheduled',
    notes: 'Plumbing riser diagrams and fixture schedule'
  },
  {
    id: 'EXP-108',
    workerName: 'Natnael Tesfaye',
    discipline: 'Electrical',
    role: 'Electrical Drafter',
    clientName: 'Initech LLC',
    projectItem: 'EL - First Floor',
    date: '2026-10-02',
    amount: 850,
    paymentMethod: 'Bank Transfer',
    status: 'Pending',
    notes: 'Lighting layout and socket outlet circuiting'
  },
  {
    id: 'EXP-109',
    workerName: 'Alemayehu Kebede',
    discipline: 'Site Supervision',
    role: 'Resident Site Inspector',
    clientName: 'Umbrella Pharmaceuticals',
    projectItem: 'Site Inspection - Foundation',
    date: '2026-09-30',
    amount: 1300,
    paymentMethod: 'Bank Transfer',
    status: 'Paid',
    notes: 'Concrete slump tests and rebar placement verification'
  }
];

export const WORK_SCHEDULE_LEADS = [
  'Dawit Mengistu (Structure)',
  'Selamawit Tadesse (Architecture)',
  'Yonas Berhe (Sanitary)',
  'Kidus Abebe (Electrical)',
  'Bethlehem Haile (Site Supervision)',
  'Tigist Wolde (BOQ & Quantity)',
  'Alemayehu Kebede (Civil Engineering)',
  'Unassigned / Team Core'
];

export const WORK_SCHEDULE_PHASES = [
  'Feasibility & Site Analysis',
  'Schematic Drawings (ST/AR)',
  'Structural Calculations & BOQ',
  'Council Permitting & Review',
  'Foundation & Structural Framing',
  'Finishes & Sanitary/Electrical Installation',
  'Final Site Inspection & Handover'
];

export const SCHEDULE_PROGRAM_CONFIG: Record<ScheduleProgramStatus, {
  label: string;
  badge: string;
  dotColor: string;
  rowShade: string;
  cardShade: string;
  borderAccent: string;
  tag: string;
  description: string;
}> = {
  'Schedule Lag': {
    label: 'Schedule Lag (Behind)',
    badge: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
    dotColor: '#f59e0b',
    rowShade: 'bg-amber-50/75 hover:bg-amber-100/70',
    cardShade: 'bg-amber-50/60 border-amber-300 ring-1 ring-amber-400/30',
    borderAccent: 'border-l-4 border-l-amber-500',
    tag: 'LAG',
    description: 'Work execution is lagging behind the milestone program.'
  },
  'Critical Lag': {
    label: 'Critical Lag (Severe)',
    badge: 'bg-rose-100 text-rose-900 border-rose-300 font-bold',
    dotColor: '#ef4444',
    rowShade: 'bg-rose-50/80 hover:bg-rose-100/80',
    cardShade: 'bg-rose-50/70 border-rose-300 ring-1 ring-rose-400/40',
    borderAccent: 'border-l-4 border-l-rose-500',
    tag: 'CRITICAL LAG',
    description: 'Severe schedule delay requiring immediate site and drafting re-allocation.'
  },
  'Under Work': {
    label: 'Under Work (In Progress)',
    badge: 'bg-blue-100 text-blue-900 border-blue-300 font-bold',
    dotColor: '#3b82f6',
    rowShade: 'bg-blue-50/60 hover:bg-blue-100/60',
    cardShade: 'bg-blue-50/40 border-blue-200 ring-1 ring-blue-300/30',
    borderAccent: 'border-l-4 border-l-blue-500',
    tag: 'UNDER WORK',
    description: 'Active engineering, drafting, or site tasks in normal execution.'
  },
  'Under Schedule': {
    label: 'Under Schedule (Ahead)',
    badge: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold',
    dotColor: '#10b981',
    rowShade: 'bg-emerald-50/60 hover:bg-emerald-100/60',
    cardShade: 'bg-emerald-50/40 border-emerald-200 ring-1 ring-emerald-300/30',
    borderAccent: 'border-l-4 border-l-emerald-500',
    tag: 'AHEAD',
    description: 'Milestones achieved earlier than planned baseline delivery.'
  },
  'On Schedule': {
    label: 'On Schedule (Normal)',
    badge: 'bg-teal-100 text-teal-900 border-teal-300 font-bold',
    dotColor: '#14b8a6',
    rowShade: 'bg-teal-50/30 hover:bg-teal-100/40',
    cardShade: 'bg-teal-50/20 border-teal-200 ring-1 ring-teal-300/20',
    borderAccent: 'border-l-4 border-l-teal-500',
    tag: 'ON TRACK',
    description: 'Tracking directly on projected schedule program.'
  },
  'Completed': {
    label: 'Program Completed',
    badge: 'bg-slate-100 text-slate-700 border-slate-200 font-medium',
    dotColor: '#64748b',
    rowShade: 'bg-white hover:bg-slate-50',
    cardShade: 'bg-white border-slate-200',
    borderAccent: 'border-l-4 border-l-slate-300',
    tag: 'DONE',
    description: 'Project deliverables concluded and accepted.'
  }
};
