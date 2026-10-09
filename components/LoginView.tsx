import React, { useState, useEffect } from 'react';
import { 
  Lock, ArrowRight, Activity, User, Fingerprint, Scan, 
  CheckCircle, UserPlus, Key, AlertTriangle, Eye, EyeOff, 
  Clock, Trash2, HelpCircle, ShieldCheck, Sparkles, Check 
} from 'lucide-react';
import { Theme, RegisteredUser } from '../types';
import { SpartanLogo } from './SpartanLogo';

interface LoginViewProps {
  onLogin: (username: string, password?: string) => boolean;
  onRegister: (user: RegisteredUser) => boolean;
  theme: Theme;
  registeredUsers?: RegisteredUser[];
}

interface SavedCredential {
  username: string;
  password?: string;
  savedAt?: string;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, onRegister, theme, registeredUsers = [] }) => {
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  
  // Saved credentials & Reminder state
  const [savedAccount, setSavedAccount] = useState<SavedCredential | null>(null);
  const [rememberMe, setRememberMe] = useState(true);
  const [showReminder, setShowReminder] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Register State
  const [regName, setRegName] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [showRegPass, setShowRegPass] = useState(false);
  const [regRole, setRegRole] = useState('');
  const [regInitials, setRegInitials] = useState('');
  const [regRemember, setRegRemember] = useState(true);
  const [regSuccess, setRegSuccess] = useState(false);
  const [regError, setRegError] = useState('');

  const [biometricScanning, setBiometricScanning] = useState(false);

  // Load saved credentials on mount to save the user's time
  useEffect(() => {
    try {
      const rememberFlag = localStorage.getItem('spartan_remember_me');
      const isRemember = rememberFlag !== null ? rememberFlag === 'true' : true;
      setRememberMe(isRemember);

      const savedRaw = localStorage.getItem('spartan_saved_credentials');
      if (savedRaw) {
        const parsed: SavedCredential = JSON.parse(savedRaw);
        if (parsed && parsed.username) {
          setSavedAccount(parsed);
          if (isRemember) {
            setUsername(parsed.username);
            setPassword(parsed.password || '');
          }
        }
      } else {
        // Fallback default admin profile ready for instant time-saving login
        const defaultCred: SavedCredential = {
          username: 'Commander',
          password: 'admin123',
          savedAt: 'System Default'
        };
        setSavedAccount(defaultCred);
        setUsername(defaultCred.username);
        setPassword(defaultCred.password || '');
      }
    } catch (e) {
      console.warn("Could not retrieve saved credentials:", e);
    }
  }, []);

  const handleClearSaved = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      localStorage.removeItem('spartan_saved_credentials');
      localStorage.setItem('spartan_remember_me', 'false');
      setSavedAccount(null);
      setUsername('');
      setPassword('');
      setRememberMe(false);
    } catch (e) {
      console.warn("Error clearing saved credentials:", e);
    }
  };

  const handleQuickLogin = (userToLogin?: SavedCredential) => {
    const targetUser = userToLogin || savedAccount;
    if (!targetUser || !targetUser.username) return;

    setLoading(true);
    setError(false);
    setUsername(targetUser.username);
    setPassword(targetUser.password || '');

    setTimeout(() => {
      const success = onLogin(targetUser.username, targetUser.password || '');
      if (success) {
        try {
          localStorage.setItem('spartan_saved_credentials', JSON.stringify({
            username: targetUser.username,
            password: targetUser.password,
            savedAt: new Date().toLocaleDateString()
          }));
          localStorage.setItem('spartan_remember_me', 'true');
        } catch (storageErr) {
          console.warn("Could not persist login credentials:", storageErr);
        }
      } else {
        setError(true);
        setLoading(false);
      }
    }, 800);
  };

  const handleSubmitLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    
    // Simulate network delay
    setTimeout(() => {
      const success = onLogin(username, password);
      if (success) {
        try {
          if (rememberMe) {
            localStorage.setItem('spartan_saved_credentials', JSON.stringify({
              username,
              password,
              savedAt: new Date().toLocaleDateString()
            }));
            localStorage.setItem('spartan_remember_me', 'true');
          } else {
            localStorage.removeItem('spartan_saved_credentials');
            localStorage.setItem('spartan_remember_me', 'false');
          }
        } catch (storageErr) {
          console.warn("Could not update saved credentials in storage:", storageErr);
        }
      } else {
        setError(true);
        setLoading(false);
      }
    }, 1000);
  };

  const handleAutofill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(false);
    setRememberMe(true);
    setCopyFeedback(`Autofilled credentials for ${u}!`);
    setTimeout(() => setCopyFeedback(null), 2500);
  };

  const handleSubmitRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (regPass !== regConfirm) {
      setRegError("Passwords do not match.");
      return;
    }
    if (regName.length < 3 || regPass.length < 4) {
      setRegError("Username (3+) and Password (4+) must be longer.");
      return;
    }

    setLoading(true);
    setRegError('');

    setTimeout(() => {
      const newUser: RegisteredUser = {
        username: regName,
        password: regPass,
        role: regRole || 'Standard Operator',
        initials: regInitials || regName.substring(0, 2).toUpperCase()
      };
      
      const success = onRegister(newUser);
      
      if (success) {
        // Automatically save new account if requested to save the user's time
        if (regRemember) {
          try {
            const savedData: SavedCredential = {
              username: regName,
              password: regPass,
              savedAt: new Date().toLocaleDateString()
            };
            localStorage.setItem('spartan_saved_credentials', JSON.stringify(savedData));
            localStorage.setItem('spartan_remember_me', 'true');
            setSavedAccount(savedData);
            setRememberMe(true);
          } catch (e) {
            console.warn("Could not save new user credentials:", e);
          }
        }

        setRegSuccess(true);
        setTimeout(() => {
          setIsRegistering(false); // Switch back to login
          setRegSuccess(false);
          setUsername(regName); // Pre-fill login
          setPassword(regPass); // Pre-fill password to save time
          setLoading(false);
          // Reset Form
          setRegName(''); setRegPass(''); setRegConfirm(''); setRegRole(''); setRegInitials('');
        }, 1200);
      } else {
        setRegError("Username already exists in registry.");
        setLoading(false);
      }
    }, 1000);
  };

  const handleBiometricLogin = () => {
    setBiometricScanning(true);
    setTimeout(() => {
      const u = savedAccount?.username || 'Commander';
      const p = savedAccount?.password || 'admin123';
      const success = onLogin(u, p);
      if (!success) {
        setBiometricScanning(false);
        setError(true);
      }
    }, 1800);
  };

  const isFuturistic = theme === 'futuristic';

  // Available accounts list for quick reminders & autofill
  const availableAccounts: { name: string; pass: string; role: string }[] = [
    { name: 'Commander', pass: 'admin123', role: 'Default Administrator' },
    ...registeredUsers
      .filter(u => u.username.toLowerCase() !== 'commander')
      .map(u => ({ name: u.username, pass: u.password, role: u.role }))
  ];

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-500
      ${isFuturistic 
        ? 'bg-[#020617] text-cyan-50 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#0f172a] via-[#050914] to-black' 
        : 'bg-gradient-to-br from-blue-900 to-slate-900 text-white'
      }`}
    >
      <div className={`w-full max-w-md p-6 sm:p-8 rounded-2xl shadow-2xl transition-all duration-500 relative overflow-hidden
        ${isFuturistic 
          ? 'bg-[#0B1221]/80 border border-cyan-500/30 backdrop-blur-xl shadow-[0_0_40px_rgba(6,182,212,0.2)]' 
          : 'bg-white/95 text-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/20'
        }`}
      >
        {/* Decorative Grid for Futuristic Mode */}
        {isFuturistic && (
          <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" 
               style={{ backgroundImage: 'linear-gradient(#00f3ff 1px, transparent 1px), linear-gradient(90deg, #00f3ff 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
          </div>
        )}

        {biometricScanning ? (
           <div className="flex flex-col items-center justify-center py-20 animate-fadeIn relative z-10">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full animate-pulse"></div>
                <Scan className="w-24 h-24 text-cyan-400 animate-pulse" />
              </div>
              <h2 className="text-xl font-futuristic text-cyan-300 tracking-widest mb-2">SCANNING...</h2>
              <p className="text-cyan-600 text-xs font-mono">BIOMETRIC DATA VERIFICATION</p>
              <div className="w-48 h-1 bg-cyan-900 rounded-full mt-6 overflow-hidden">
                <div className="h-full bg-cyan-400 animate-progress"></div>
              </div>
           </div>
        ) : (
          <div className="relative z-10">
            <div className="text-center mb-6">
              <div className={`inline-flex p-3 rounded-2xl mb-3 transition-colors duration-500 shadow-md ${
                isFuturistic 
                  ? 'bg-cyan-950/50 border border-cyan-500/50 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]' 
                  : 'bg-white border border-slate-200 text-slate-800'}`}
              >
                {isRegistering ? <UserPlus className="w-10 h-10 text-blue-600" /> : <SpartanLogo className="w-14 h-11" theme={theme} />}
              </div>
              <h1 className={`text-2xl sm:text-3xl font-black tracking-tight mb-1 ${isFuturistic ? 'font-futuristic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500' : 'font-sans text-slate-900'}`}>
                AJ <span className={isFuturistic ? 'text-white' : 'text-blue-600'}>ARCHITECTS</span>
              </h1>
              <p className={`text-xs font-semibold ${isFuturistic ? 'text-cyan-400/70 font-mono tracking-widest uppercase' : 'text-slate-500'}`}>
                {isRegistering ? 'New Account Registration' : 'Engineers Consulting • Financial Terminal'}
              </p>
            </div>

            {/* --- QUICK ONE-CLICK SIGN IN: SAVES USER TIME --- */}
            {!isRegistering && savedAccount && savedAccount.username && (
              <div className={`mb-5 p-3.5 rounded-xl border transition-all animate-fadeIn ${
                isFuturistic 
                  ? 'bg-cyan-950/40 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.2)]' 
                  : 'bg-gradient-to-r from-blue-50 to-indigo-50/70 border-blue-200 shadow-xs'
              }`}>
                <div className="flex items-center justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase shadow-xs shrink-0 ${
                      isFuturistic ? 'bg-cyan-500 text-black' : 'bg-blue-600 text-white'
                    }`}>
                      {savedAccount.username.slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold truncate text-slate-800">{savedAccount.username}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium flex items-center gap-1 ${
                          isFuturistic ? 'bg-cyan-900/60 text-cyan-300 border border-cyan-700/50' : 'bg-blue-100 text-blue-700'
                        }`}>
                          <ShieldCheck className="w-2.5 h-2.5" /> Saved
                        </span>
                      </div>
                      <p className={`text-[11px] truncate ${isFuturistic ? 'text-cyan-400/70' : 'text-slate-500'}`}>
                        1-Click login ready • Saves your time
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearSaved}
                    title="Remove saved credentials"
                    className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleQuickLogin()}
                  disabled={loading}
                  className={`w-full py-2.5 px-3 rounded-lg font-bold text-xs tracking-wide transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                    isFuturistic 
                      ? 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                      : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md'
                  }`}
                >
                  {loading ? (
                    <><Activity className="w-3.5 h-3.5 animate-spin" /> SIGNING IN...</>
                  ) : (
                    <>
                      <Clock className="w-3.5 h-3.5" />
                      <span>Fast Sign In as {savedAccount.username} (Save Time)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            )}

            {!isRegistering ? (
              // --- LOGIN FORM ---
              <form onSubmit={handleSubmitLogin} className="space-y-4 animate-fadeIn">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className={`block text-xs font-bold uppercase tracking-wider ${isFuturistic ? 'text-cyan-400' : 'text-slate-600'}`}>
                      Username
                    </label>
                    {savedAccount?.username === username && username && (
                      <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5">
                        <Check className="w-3 h-3" /> Saved on device
                      </span>
                    )}
                  </div>
                  <div className="relative group">
                    <User className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isFuturistic ? 'text-cyan-600 group-focus-within:text-cyan-400' : 'text-slate-400 group-focus-within:text-slate-800'}`} />
                    <input 
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter Username"
                      autoComplete="username"
                      className={`w-full pl-9 pr-4 py-2.5 rounded-lg border outline-none text-sm transition-all duration-300
                        ${isFuturistic ? 'bg-slate-100 border-slate-300 text-slate-800 focus:bg-white focus:border-cyan-500' : 'bg-slate-100 border-slate-200 text-slate-800 focus:ring-2 focus:ring-blue-600 focus:bg-white'}`}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className={`block text-xs font-bold uppercase tracking-wider ${isFuturistic ? 'text-cyan-400' : 'text-slate-600'}`}>
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`text-[11px] font-medium flex items-center gap-1 hover:underline cursor-pointer ${isFuturistic ? 'text-cyan-400' : 'text-blue-600'}`}
                    >
                      {showPassword ? <><EyeOff className="w-3 h-3" /> Hide</> : <><Eye className="w-3 h-3" /> Peek</>}
                    </button>
                  </div>
                  <div className="relative group">
                    <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isFuturistic ? 'text-cyan-600 group-focus-within:text-cyan-400' : 'text-slate-400 group-focus-within:text-slate-800'}`} />
                    <input 
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter Password"
                      autoComplete="current-password"
                      className={`w-full pl-9 pr-10 py-2.5 rounded-lg border outline-none text-sm transition-all duration-300
                        ${isFuturistic ? 'bg-slate-100 border-slate-300 text-slate-800 focus:bg-white focus:border-cyan-500' : 'bg-slate-100 border-slate-200 text-slate-800 focus:ring-2 focus:ring-blue-600 focus:bg-white'}
                        ${error ? 'border-red-500 focus:border-red-500' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {error && (
                    <p className="text-red-500 text-xs mt-2 font-medium animate-pulse flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Access Denied. Check username & password.
                    </p>
                  )}
                </div>

                {/* REMEMBER ME AND SAVE CREDENTIALS TOGGLE */}
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
                  <input 
                    type="checkbox" 
                    id="remember-me-checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4" 
                  />
                  <label htmlFor="remember-me-checkbox" className="text-xs text-slate-700 cursor-pointer select-none leading-snug">
                    <span className="font-semibold block">Remember & Save Credentials</span>
                    <span className="text-[11px] text-slate-500 block">Saves your time by remembering username & password on this device.</span>
                  </label>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button 
                    type="button" 
                    onClick={() => setShowReminder(!showReminder)}
                    className="flex items-center gap-1 text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
                    <span>{showReminder ? 'Hide credential reminder' : 'Credential reminder'}</span>
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setIsRegistering(true)} 
                    className={`hover:underline font-semibold ${isFuturistic ? 'text-cyan-400' : 'text-blue-600'}`}
                  >
                    Create Account
                  </button>
                </div>

                {/* CREDENTIAL REMINDER & QUICK AUTOFILL DRAWER */}
                {showReminder && (
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700 flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-blue-500" /> Quick Account Reminders
                      </span>
                      <span className="text-[10px] text-slate-400">Click to autofill</span>
                    </div>

                    <div className="space-y-1.5">
                      {availableAccounts.map((acc) => (
                        <div 
                          key={acc.name}
                          className="flex items-center justify-between p-2 rounded bg-white border border-slate-200 hover:border-blue-300 transition-all text-xs"
                        >
                          <div>
                            <div className="font-semibold text-slate-800">{acc.name}</div>
                            <div className="text-[10px] text-slate-500">{acc.role} • Pass: {acc.pass}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAutofill(acc.name, acc.pass)}
                            className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded font-medium text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Sparkles className="w-3 h-3" /> Fill
                          </button>
                        </div>
                      ))}
                    </div>

                    {copyFeedback && (
                      <p className="text-[11px] text-emerald-600 font-medium animate-fadeIn text-center">
                        ✓ {copyFeedback}
                      </p>
                    )}
                  </div>
                )}

                <div className="pt-2 space-y-2.5">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-3 rounded-lg font-bold text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer
                      ${isFuturistic
                        ? 'bg-cyan-600 hover:bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)]'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
                      } ${loading ? 'opacity-80 cursor-wait' : ''}`}
                  >
                    {loading ? (
                      <><Activity className="w-4 h-4 animate-spin" /> LOGGING IN...</>
                    ) : (
                      <><ArrowRight className="w-4 h-4" /> LOGIN</>
                    )}
                  </button>

                  {isFuturistic && (
                     <button
                       type="button"
                       onClick={handleBiometricLogin}
                       className="w-full py-2.5 rounded-lg font-mono text-xs tracking-wide transition-all duration-300 flex items-center justify-center gap-2 border border-cyan-900/50 text-cyan-500 hover:bg-cyan-950/30 hover:border-cyan-500/50 cursor-pointer"
                     >
                        <Fingerprint className="w-4 h-4" /> BIOMETRIC SCAN
                     </button>
                  )}
                </div>
              </form>
            ) : (
              // --- REGISTER FORM ---
              <form onSubmit={handleSubmitRegister} className="space-y-3.5 animate-slideUp">
                 <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${isFuturistic ? 'text-cyan-400' : 'text-slate-600'}`}>Username</label>
                      <input 
                        required
                        type="text"
                        value={regName}
                        onChange={e => setRegName(e.target.value)}
                        className="w-full px-3 py-2 rounded bg-slate-100 border outline-none text-sm focus:bg-white focus:border-blue-500 transition-all text-slate-800"
                        placeholder="e.g. Spartan01"
                      />
                    </div>
                    <div>
                      <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${isFuturistic ? 'text-cyan-400' : 'text-slate-600'}`}>Initials</label>
                      <input 
                        required
                        maxLength={2}
                        type="text"
                        value={regInitials}
                        onChange={e => setRegInitials(e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 rounded bg-slate-100 border outline-none text-sm focus:bg-white focus:border-blue-500 transition-all text-slate-800"
                        placeholder="e.g. SP"
                      />
                    </div>
                 </div>

                 <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${isFuturistic ? 'text-cyan-400' : 'text-slate-600'}`}>Role Title</label>
                    <input 
                      type="text"
                      value={regRole}
                      onChange={e => setRegRole(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-slate-100 border outline-none text-sm focus:bg-white focus:border-blue-500 transition-all text-slate-800"
                      placeholder="e.g. Financial Controller"
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className={`block text-[10px] font-bold uppercase tracking-wider ${isFuturistic ? 'text-cyan-400' : 'text-slate-600'}`}>Password</label>
                        <button
                          type="button"
                          onClick={() => setShowRegPass(!showRegPass)}
                          className="text-[10px] text-blue-600 hover:underline"
                        >
                          {showRegPass ? 'Hide' : 'Peek'}
                        </button>
                      </div>
                      <input 
                        required
                        type={showRegPass ? "text" : "password"}
                        value={regPass}
                        onChange={e => setRegPass(e.target.value)}
                        className="w-full px-3 py-2 rounded bg-slate-100 border outline-none text-sm focus:bg-white focus:border-blue-500 transition-all text-slate-800"
                      />
                    </div>
                    <div>
                      <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${isFuturistic ? 'text-cyan-400' : 'text-slate-600'}`}>Confirm</label>
                      <input 
                        required
                        type={showRegPass ? "text" : "password"}
                        value={regConfirm}
                        onChange={e => setRegConfirm(e.target.value)}
                        className="w-full px-3 py-2 rounded bg-slate-100 border outline-none text-sm focus:bg-white focus:border-blue-500 transition-all text-slate-800"
                      />
                    </div>
                 </div>

                 {/* SAVE NEW CREDENTIALS CHECKBOX */}
                 <div className="p-2 rounded bg-slate-50 border border-slate-200/80 flex items-start gap-2">
                   <input 
                     type="checkbox" 
                     id="reg-remember-checkbox"
                     checked={regRemember}
                     onChange={e => setRegRemember(e.target.checked)}
                     className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer w-3.5 h-3.5" 
                   />
                   <label htmlFor="reg-remember-checkbox" className="text-[11px] text-slate-700 cursor-pointer select-none">
                     <span className="font-semibold">Remember & save credentials for instant 1-click access</span>
                   </label>
                 </div>

                 {regError && (
                    <p className="text-red-500 text-xs font-medium flex items-center gap-1 animate-pulse">
                      <AlertTriangle className="w-3 h-3" /> {regError}
                    </p>
                 )}
                 {regSuccess && (
                    <p className="text-emerald-500 text-xs font-medium flex items-center gap-1 animate-fadeIn">
                      <CheckCircle className="w-3 h-3" /> Account Created & Saved! Redirecting...
                    </p>
                 )}

                 <div className="pt-2 space-y-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className={`w-full py-2.5 rounded-lg font-bold text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer
                        ${isFuturistic
                          ? 'bg-cyan-600 hover:bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
                        }`}
                    >
                      {loading ? <Activity className="w-4 h-4 animate-spin" /> : <><Key className="w-4 h-4" /> CREATE & SAVE ACCOUNT</>}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsRegistering(false)}
                      className="w-full py-1.5 text-xs font-medium hover:underline text-slate-500 cursor-pointer"
                    >
                      Cancel & Return to Login
                    </button>
                 </div>
              </form>
            )}

            <div className="mt-6 text-center">
              <p className={`text-[10px] ${isFuturistic ? 'text-cyan-900' : 'text-slate-400'}`}>
                {isRegistering ? 'ACCOUNT CREATION PROTOCOL' : 'RESTRICTED AREA • CREDENTIAL PROTECTION ACTIVE'}
                <br />SYSTEM VERSION 2.8.5
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
