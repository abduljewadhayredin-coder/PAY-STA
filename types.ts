
export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: 'Active' | 'Inactive' | 'Prospect';
  joinedDate: string;
  avatar?: string; // Base64 or URL
}

export interface PaymentInstallment {
  id: string;
  date: string;
  amount: number;
  method: string;
  label: string; // e.g., "1st Payment", "Advance"
}

export interface ContractAdjustment {
  id: string;
  date: string;
  amount: number; // positive for addition, negative for deduction
  label: string;
}

export interface Milestone {
  id: string;
  title: string;
  dueDate: string; // ISO Date YYYY-MM-DD
  completed: boolean;
  completedDate?: string; // ISO Date YYYY-MM-DD
  transactionId: string; // Linking milestone to associated transaction record
  clientId?: string;
  clientName?: string;
  notes?: string;
  assignedTo?: string;
}

export type ScheduleProgramStatus = 
  | 'On Schedule' 
  | 'Schedule Lag' 
  | 'Under Work' 
  | 'Under Schedule' 
  | 'Critical Lag' 
  | 'Completed';

export interface Transaction {
  id: string;
  date: string; // ISO Date YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  targetCompletionDate?: string; // ISO Date YYYY-MM-DD
  scheduleNotes?: string;
  scheduleProgram?: ScheduleProgramStatus; // Work schedule program status
  lagDays?: number; // Days of lag (positive = behind schedule e.g. +5, negative = ahead e.g. -2)
  schedulePhase?: string; // e.g. "Phase 1: Foundation", "Phase 2: Framing", "Drafting"
  assignedLead?: string; // e.g. "Dawit M. (Structure)", "Selamawit T. (Arch)"
  invoiceNumber?: string; // Continuous Invoice/Quote Number (e.g. INV-2026-0101)
  continuityRef?: string; // Master Continuity Reference (e.g. AJ-CRN-2026-0101)
  clientId: string; // Link to Client
  clientName: string; // Denormalized for display ease
  category: string;
  workType: string; // e.g., Structural Analysis, BOQ
  item: string;
  status: 'Completed' | 'Pending' | 'In Progress' | 'Cancelled' | 'On Hold'; // Work Status
  paymentStatus: 'Settled' | 'Partial' | 'Unpaid'; // Payment Status
  paymentMethod?: 'Bank Transfer' | 'Cheque' | 'Cash' | 'Credit Card' | 'Other';
  isAdvanceReceived: boolean;
  dilAmount: number; // Total Amount Received (Sum of installments)
  amount: number; // Total Contract Value (Base + Adjustments)
  baseAmount: number; // Original contract amount
  balanceAmount?: number; // Calculated: amount - dilAmount
  region: string;
  installments?: PaymentInstallment[];
  adjustments?: ContractAdjustment[];
  milestones?: Milestone[];
}

export interface KPIStats {
  totalRevenue: number;
  totalTransactions: number;
  averageValue: number;
  completionRate: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: any;
}

export enum FilterTimeRange {
  ALL = 'All Time',
  THIS_YEAR = 'This Year',
  LAST_MONTH = 'Last Month',
  THIS_MONTH = 'This Month'
}

export type Theme = 'professional' | 'futuristic';

export type ViewState = 'home' | 'dashboard' | 'clients' | 'payments' | 'income-statement' | 'estimator' | 'kanban' | 'calendar' | 'reports' | 'settings';

export type WorkerDiscipline = 
  | 'Structure' 
  | 'Sanitary' 
  | 'Electrical' 
  | 'Architecture' 
  | 'Site Supervision' 
  | 'Mechanical' 
  | 'Other';

export interface WorkerPayment {
  id: string;
  workerName: string;
  discipline: WorkerDiscipline;
  role: string;
  transactionId?: string; // Link to specific Client project
  clientName?: string;
  projectItem?: string;
  date: string; // YYYY-MM-DD
  amount: number; // Outcome (expense disbursement)
  paymentMethod: 'Bank Transfer' | 'Cash' | 'Cheque' | 'Credit Card' | 'Other';
  status: 'Paid' | 'Pending' | 'Scheduled';
  notes?: string;
}

export interface RegisteredUser {
  username: string;
  password: string; // Note: In production, store hashes only
  role: string;
  initials: string;
}
