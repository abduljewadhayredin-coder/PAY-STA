
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { INITIAL_DATA, INITIAL_CLIENTS, INITIAL_WORK_TYPES, INITIAL_WORKER_PAYMENTS, generateSampleData } from './constants';
import { Transaction, ViewState, Client, Theme, RegisteredUser, WorkerPayment } from './types';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { DashboardView } from './components/DashboardView';
import { ClientView } from './components/ClientView';
import { PaymentView } from './components/PaymentView';
import { IncomeStatementView } from './components/IncomeStatementView';
import { SettingsView } from './components/SettingsView';
import { LoginView } from './components/LoginView';
import { HomeView } from './components/HomeView';
import { EstimatorView } from './components/EstimatorView';
import { KanbanView } from './components/KanbanView'; 
import { CalendarView } from './components/CalendarView'; 
import { ReportStatementView } from './components/ReportStatementView';
import { generateMoreData } from './services/geminiService';
import { Bell, Menu, Home, Command, ArrowLeft, RotateCw } from 'lucide-react';

// Helper hook for persistent state with safety checks
function usePersistentState<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return initialValue;
      
      const parsed = JSON.parse(item);
      // SAFETY FIX: If parsed is null/undefined (corrupted storage), return initialValue to prevent crash
      return parsed !== null && parsed !== undefined ? parsed : initialValue;
    } catch (error) {
      console.error(`Error reading ${key} from localStorage`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      if (state !== undefined) {
        localStorage.setItem(key, JSON.stringify(state));
      }
    } catch (error) {
      console.error(`Error saving ${key} to localStorage`, error);
    }
  }, [key, state]);

  return [state, setState];
}

const DEFAULT_ADMIN: RegisteredUser = {
  username: 'Commander',
  password: 'admin123', // Default password
  role: 'System Administrator',
  initials: 'CM'
};

const App: React.FC = () => {
  // Auth & Routing State
  const [isLoggedIn, setIsLoggedIn] = usePersistentState<boolean>('spartan_auth', false);
  const [theme, setTheme] = usePersistentState<Theme>('spartan_theme', 'professional');
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [navParams, setNavParams] = useState<any>(null); // State for navigation arguments
  
  // Data State
  const [registeredUsers, setRegisteredUsers] = usePersistentState<RegisteredUser[]>('spartan_users', [DEFAULT_ADMIN]);
  const [data, setData] = usePersistentState<Transaction[]>('spartan_data', INITIAL_DATA);
  const [clients, setClients] = usePersistentState<Client[]>('spartan_clients', INITIAL_CLIENTS);
  const [workerPayments, setWorkerPayments] = usePersistentState<WorkerPayment[]>('spartan_worker_payments', INITIAL_WORKER_PAYMENTS);
  const [workTypes, setWorkTypes] = usePersistentState<string[]>('spartan_work_types', INITIAL_WORK_TYPES);
  const [user, setUser] = usePersistentState('spartan_user', { name: 'Admin User', role: 'Level 5 Access', initials: 'AD' });
  
  const [generating, setGenerating] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Dynamic Title & Theme Color
  useEffect(() => {
    document.title = `AJ Architects - ${currentView.charAt(0).toUpperCase() + currentView.slice(1)}`;
    
    // Update theme color meta tag for mobile browsers
    const metaThemeColor = document.querySelector("meta[name=theme-color]");
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", theme === 'futuristic' ? '#020617' : '#0f172a');
    }
  }, [currentView, theme]);

  // Deep Linking: Sync State with URL on Load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view') as ViewState;
    if (viewParam && ['dashboard', 'clients', 'payments', 'income-statement', 'kanban', 'calendar', 'estimator', 'reports', 'settings', 'home'].includes(viewParam)) {
      setCurrentView(viewParam);
    } else {
      // Ensure clean URL state on load
      window.history.replaceState({ view: 'home' }, '', '?view=home');
    }
  }, []);

  // History API: Handle Native Back Button
  useEffect(() => {
    const onPopState = (event: PopStateEvent) => {
      if (event.state && event.state.view) {
        setNavParams(event.state.params || null);
        setCurrentView(event.state.view);
      } else {
        // Fallback for empty state (e.g. manual URL entry)
        const params = new URLSearchParams(window.location.search);
        const view = (params.get('view') as ViewState) || 'home';
        setCurrentView(view);
      }
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Haptic Feedback Helper
  const triggerHaptic = (pattern: number | number[] = 10) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  };

  // Unified Navigation Handler with History Push
  const handleNavigate = (view: ViewState, params?: any) => {
    triggerHaptic(15);
    setNavParams(params);
    setCurrentView(view);
    setIsMobileMenuOpen(false);
    
    // Push to browser history
    window.history.pushState({ view, params }, '', `?view=${view}`);
  };

  // Explicit Back Button Handler
  const handleBack = () => {
    triggerHaptic(20);
    if (currentView === 'home') return;

    if (window.history.state && window.history.length > 1) {
       window.history.back();
    } else {
       handleNavigate('home');
    }
  };

  const handleRefresh = () => {
    triggerHaptic(10);
    window.location.reload();
  };

  // Login Handler with Credential Check
  const handleLogin = (username: string, password?: string) => {
    const validUser = registeredUsers.find(u => 
      u.username.toLowerCase() === username.toLowerCase() && 
      u.password === password
    );

    if (validUser) {
      triggerHaptic([10, 30, 10]); // Success pattern
      setUser({
        name: validUser.username,
        role: validUser.role,
        initials: validUser.initials
      });
      setIsLoggedIn(true);
      return true;
    } else {
      triggerHaptic([50, 50, 50]); // Error pattern
      return false;
    }
  };

  // Logout Handler
  const handleLogout = () => {
    if(window.confirm('End secure session?')) {
      setIsLoggedIn(false);
      handleNavigate('home'); // Reset view for next login
    }
  };

  // Register New Admin Handler
  const handleRegister = (newUser: RegisteredUser) => {
    const exists = registeredUsers.some(u => u.username.toLowerCase() === newUser.username.toLowerCase());
    if (exists) {
      return false; // User already exists
    }
    setRegisteredUsers(prev => [...prev, newUser]);
    return true;
  };

  // Update Password Handler
  const handleUpdatePassword = (oldPass: string, newPass: string) => {
    // Find the current logged in user in the registry
    const userIndex = registeredUsers.findIndex(u => u.username === user.name);
    
    if (userIndex === -1) return false;
    
    // Verify old password
    if (registeredUsers[userIndex].password !== oldPass) {
      return false;
    }

    // Update password
    const updatedUsers = [...registeredUsers];
    updatedUsers[userIndex] = {
      ...updatedUsers[userIndex],
      password: newPass
    };
    setRegisteredUsers(updatedUsers);
    return true;
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if not typing in an input/textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.altKey) {
        switch(e.key.toLowerCase()) {
          case 'h': // Home
            e.preventDefault();
            handleNavigate('home');
            break;
          case 'd': // Dashboard
            e.preventDefault();
            handleNavigate('dashboard');
            break;
          case 'c': // Clients
            e.preventDefault();
            handleNavigate('clients');
            break;
          case 'p': // Payments
            e.preventDefault();
            handleNavigate('payments');
            break;
          case 'e': // Estimator
            e.preventDefault();
            handleNavigate('estimator');
            break;
          case 's': // Settings
            e.preventDefault();
            handleNavigate('settings');
            break;
          case 'k': // Kanban 
            e.preventDefault();
            handleNavigate('kanban');
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  // Global Key Stats for Home View
  // SAFETY FIX: Ensure 'data' is an array before reducing
  const homeStats = useMemo(() => {
    const safeData = Array.isArray(data) ? data : [];
    const totalRevenue = safeData.reduce((acc, curr) => acc + curr.amount, 0);
    const totalTransactions = safeData.length;
    const averageValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    const completedCount = safeData.filter(d => d.status === 'Completed').length;
    const completionRate = totalTransactions > 0 ? (completedCount / totalTransactions) * 100 : 0;
    return { totalRevenue, totalTransactions, averageValue, completionRate };
  }, [data]);

  const handleGenerateData = async () => {
    setGenerating(true);
    try {
      const safeData = Array.isArray(data) ? data : [];
      const newData = await generateMoreData(safeData.length);
      if (newData && newData.length > 0) {
        setData(prev => [...(Array.isArray(prev) ? prev : []), ...newData]);
      }
    } catch (e) {
      console.error("Error generating data:", e);
    } finally {
      setGenerating(false);
    }
  };

  // Updated to accept optional ID from UI generator
  const handleAddClient = (clientData: Omit<Client, 'id' | 'joinedDate'> & { id?: string }) => {
    const newClient: Client = {
      ...clientData,
      id: clientData.id || `C-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      joinedDate: new Date().toISOString().split('T')[0]
    };
    setClients(prev => [newClient, ...(Array.isArray(prev) ? prev : [])]);
  };

  const handleUpdateClient = (updatedClient: Client) => {
    setClients(prev => (Array.isArray(prev) ? prev : []).map(c => c.id === updatedClient.id ? updatedClient : c));
  };

  const handleDeleteClient = (clientId: string) => {
    if (window.confirm("PERMANENT ACTION: Are you sure you want to delete this client? \n\nThis will also delete ALL associated work records and payment history.")) {
      // 1. Delete the client
      setClients(prev => (Array.isArray(prev) ? prev : []).filter(c => c.id !== clientId));
      
      // 2. Cascade delete all transactions for this client
      setData(prev => (Array.isArray(prev) ? prev : []).filter(t => t.clientId !== clientId));
    }
  };

  // Updated to accept optional ID from UI generator
  const handleRecordPayment = (paymentData: Omit<Transaction, 'id'> & { id?: string }) => {
    const newTransaction: Transaction = {
      ...paymentData,
      id: paymentData.id || `TRX-${Date.now()}`
    };
    setData(prev => [newTransaction, ...(Array.isArray(prev) ? prev : [])]);
  };

  const handleUpdateTransaction = (updatedTx: Transaction) => {
    setData(prev => (Array.isArray(prev) ? prev : []).map(t => t.id === updatedTx.id ? updatedTx : t));
  };

  const handleDeleteTransaction = (id: string) => {
    if (window.confirm("Are you sure you want to delete this record permanently?")) {
      setData(prev => (Array.isArray(prev) ? prev : []).filter(t => t.id !== id));
    }
  };

  // Employed Worker Payment Handlers (Outcome Disbursements)
  const handleAddWorkerPayment = (paymentData: Omit<WorkerPayment, 'id'>, id?: string) => {
    if (id) {
      setWorkerPayments(prev => (Array.isArray(prev) ? prev : []).map(wp => wp.id === id ? { ...paymentData, id } : wp));
    } else {
      const newId = `EXP-${Date.now().toString().slice(-4)}`;
      setWorkerPayments(prev => [{ ...paymentData, id: newId }, ...(Array.isArray(prev) ? prev : [])]);
    }
  };

  const handleDeleteWorkerPayment = (id: string) => {
    if (window.confirm("Are you sure you want to remove this employee disbursement record?")) {
      setWorkerPayments(prev => (Array.isArray(prev) ? prev : []).filter(wp => wp.id !== id));
    }
  };

  const handleResetData = () => {
    if(window.confirm("This will reset all data to the initial demo state. Any custom changes will be lost. Continue?")) {
      setData(generateSampleData()); 
      setClients(INITIAL_CLIENTS);
      setWorkerPayments(INITIAL_WORKER_PAYMENTS);
      setWorkTypes(INITIAL_WORK_TYPES);
    }
  };

  const handleClearData = () => {
    if(window.confirm("WARNING: This will delete ALL clients and transactions. This cannot be undone.")) {
      setData([]);
      setClients([]);
      setWorkerPayments([]);
    }
  };

  const handleRestoreData = (backupData: any) => {
    try {
      if (backupData.clients && Array.isArray(backupData.clients)) setClients(backupData.clients);
      if (backupData.transactions && Array.isArray(backupData.transactions)) setData(backupData.transactions);
      if (backupData.workerPayments && Array.isArray(backupData.workerPayments)) setWorkerPayments(backupData.workerPayments);
      if (backupData.workTypes && Array.isArray(backupData.workTypes)) setWorkTypes(backupData.workTypes);
      if (backupData.user) setUser(backupData.user);
      if (backupData.theme) setTheme(backupData.theme);
      alert('System restored successfully.');
    } catch (e) {
      console.error("Restore failed", e);
      alert("Failed to restore data. Invalid file format.");
    }
  };

  // Login Flow
  if (!isLoggedIn) {
    return <LoginView onLogin={handleLogin} onRegister={handleRegister} theme={theme} registeredUsers={registeredUsers} />;
  }

  // Home / Landing Hub Flow
  if (currentView === 'home') {
    return (
      <HomeView 
        user={user} 
        stats={homeStats} 
        theme={theme} 
        onNavigate={handleNavigate} 
      />
    );
  }

  // --- Main Dashboard Layout ---

  const isFuturistic = theme === 'futuristic';

  return (
    <div className={`min-h-screen flex font-sans transition-colors duration-300
      ${isFuturistic ? 'bg-[#020617] text-cyan-50' : 'bg-slate-100 text-slate-900'}`}
    >
      {/* Sidebar Navigation */}
      <Sidebar 
        currentView={currentView} 
        onChangeView={handleNavigate} 
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        showInstall={!!deferredPrompt}
        onInstall={handleInstallClick}
        onLogout={handleLogout}
        theme={theme}
      />

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 md:ml-64 ml-0 pb-20 md:pb-0`}>
        
        {/* Header */}
        <header className={`h-16 border-b sticky top-0 z-40 px-4 sm:px-8 flex items-center justify-between shadow-sm transition-colors
          ${isFuturistic 
            ? 'bg-[#0B1221] border-cyan-900/30 text-cyan-50' 
            : 'bg-white border-slate-200 text-slate-800'}`}
        >
          <div className="flex items-center gap-3">
            {/* Visual Back Button */}
             <button 
               onClick={handleBack} 
               className={`p-2 rounded-full hover:bg-slate-100/10 transition-colors mr-1
                 ${isFuturistic ? 'text-cyan-400 hover:text-cyan-300' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
               title="Go Back"
             >
               <ArrowLeft className="w-5 h-5" />
             </button>

            <div className="flex items-center gap-2 text-sm">
               <button 
                 onClick={() => handleNavigate('home')} 
                 className={`p-1 rounded hover:bg-slate-100/10 ${isFuturistic ? 'text-cyan-400' : 'text-slate-500'}`}
                 title="Go Home (Alt+H)"
               >
                 <Home className="w-4 h-4" />
               </button>
              <span className={`text-slate-300 hidden sm:inline`}>/</span>
              <span className={`capitalize font-medium ${isFuturistic ? 'text-cyan-100 font-futuristic tracking-wider' : 'text-slate-900'}`}>
                {currentView.replace('-', ' ')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <div className={`hidden md:flex items-center gap-2 px-3 py-1 rounded text-[10px] font-mono border
                ${isFuturistic ? 'border-cyan-900/50 text-cyan-500 bg-[#020617]' : 'border-slate-200 text-slate-400 bg-slate-50'}`}>
               <Command className="w-3 h-3" />
               <span>ALT + KEY</span>
             </div>

             <div className="flex items-center gap-1">
               <button 
                 onClick={handleRefresh}
                 className={`relative p-2 transition-colors ${isFuturistic ? 'text-cyan-400/70 hover:text-cyan-400' : 'text-slate-400 hover:text-slate-600'}`}
                 title="Refresh System"
               >
                 <RotateCw className="w-5 h-5" />
               </button>

               <button className={`relative p-2 transition-colors ${isFuturistic ? 'text-cyan-400/70 hover:text-cyan-400' : 'text-slate-400 hover:text-slate-600'}`}>
                 <Bell className="w-5 h-5" />
                 <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-transparent"></span>
               </button>
             </div>
             
             <div className={`flex items-center gap-3 pl-4 border-l ${isFuturistic ? 'border-cyan-900/30' : 'border-slate-200'}`}>
               <div className="text-right hidden sm:block">
                 <p className={`text-sm font-medium ${isFuturistic ? 'text-cyan-50' : 'text-slate-800'}`}>{user.name}</p>
                 <p className={`text-xs ${isFuturistic ? 'text-cyan-400/60' : 'text-slate-500'}`}>{user.role}</p>
               </div>
               <div className={`w-8 h-8 rounded flex items-center justify-center font-bold text-xs cursor-default
                 ${isFuturistic ? 'bg-cyan-900 text-cyan-400 border border-cyan-500/50' : 'bg-slate-900 text-white'}`}>
                 {user.initials}
               </div>
             </div>
          </div>
        </header>

        {/* View Content */}
        <main className="flex-1 p-4 sm:p-8 overflow-x-hidden">
          {(() => {
             switch (currentView) {
               case 'dashboard':
                 return (
                   <DashboardView 
                     data={data} 
                     clients={clients}
                     workerPayments={workerPayments}
                     onGenerateData={handleGenerateData} 
                     generating={generating}
                     onNavigate={handleNavigate}
                   />
                 );
               case 'clients':
                 return (
                   <ClientView 
                     clients={clients} 
                     transactions={data}
                     availableWorkTypes={workTypes}
                     workerPayments={workerPayments}
                     onAddWorkerPayment={handleAddWorkerPayment}
                     onDeleteWorkerPayment={handleDeleteWorkerPayment}
                     onAddClient={handleAddClient}
                     onUpdateClient={handleUpdateClient}
                     onDeleteClient={handleDeleteClient}
                     onRecordPayment={handleRecordPayment}
                     onUpdateTransaction={handleUpdateTransaction}
                     onDeleteTransaction={handleDeleteTransaction}
                     autoSelectedClientId={navParams?.clientId}
                     onNavigate={handleNavigate}
                   />
                 );
               case 'payments':
                 return (
                   <PaymentView 
                     data={data} 
                     workerPayments={workerPayments}
                     onAddWorkerPayment={handleAddWorkerPayment}
                     onDeleteWorkerPayment={handleDeleteWorkerPayment}
                     onUpdateTransaction={handleUpdateTransaction}
                     initialFilter={navParams?.filter}
                     onNavigate={handleNavigate}
                   />
                 );
               case 'income-statement':
                 return (
                   <IncomeStatementView
                     transactions={data}
                     workerPayments={workerPayments}
                     onAddWorkerPayment={handleAddWorkerPayment}
                     onDeleteWorkerPayment={handleDeleteWorkerPayment}
                     theme={theme}
                     onNavigate={handleNavigate}
                   />
                 );
               case 'kanban':
                 return (
                    <KanbanView 
                      data={data} 
                      workTypes={workTypes}
                      clients={clients}
                      onUpdateTransaction={handleUpdateTransaction} 
                      onRecordPayment={handleRecordPayment}
                      onDeleteTransaction={handleDeleteTransaction}
                      onNavigate={handleNavigate}
                    />
                 );
               case 'calendar':
                 return (
                   <CalendarView 
                     data={data} 
                     onRecordPayment={handleRecordPayment} 
                     onNavigate={handleNavigate}
                   />
                 );
                case 'estimator':
                  return (
                    <EstimatorView 
                      workTypes={workTypes}
                      clients={clients}
                      initialParams={navParams}
                      onConvert={(tx) => {
                        handleRecordPayment(tx);
                      }}
                      onNavigate={handleNavigate}
                    />
                  );
                case 'reports':
                  return (
                    <ReportStatementView
                      transactions={data}
                      workerPayments={workerPayments}
                      clients={clients}
                      initialParams={navParams}
                      theme={theme}
                      onNavigate={handleNavigate}
                    />
                  );
               case 'settings':
                 return (
                   <SettingsView 
                     user={user}
                     onUpdateUser={setUser}
                     workTypes={workTypes}
                     onUpdateWorkTypes={setWorkTypes}
                     onResetData={handleResetData}
                     onClearData={handleClearData}
                     theme={theme}
                     onUpdateTheme={setTheme}
                     onLogout={handleLogout}
                     onUpdatePassword={handleUpdatePassword}
                     showInstall={!!deferredPrompt}
                     onInstall={handleInstallClick}
                     fullData={{ clients, transactions: data, workerPayments }}
                     onRestore={handleRestoreData}
                     onAddClient={handleAddClient}
                   />
                 );
               default:
                 return <div>View not found</div>;
             }
          })()}
        </main>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <BottomNav 
        currentView={currentView}
        onChangeView={handleNavigate}
        onOpenMenu={() => setIsMobileMenuOpen(true)}
        theme={theme}
        showInstall={!!deferredPrompt}
        onInstall={handleInstallClick}
      />
    </div>
  );
};

export default App;
