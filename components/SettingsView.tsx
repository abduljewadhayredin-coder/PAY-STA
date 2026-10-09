

import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Trash2, Plus, X, User, Briefcase, AlertTriangle, CheckCircle, Moon, Sun, Monitor, LogOut, Smartphone, Download, Upload, HardDrive, Keyboard, Key, Lock, UserPlus, QrCode, Camera, Image as ImageIcon } from 'lucide-react';
import { Theme, Client, Transaction, WorkerPayment } from '../types';
import { SpartanLogo } from './SpartanLogo';

interface UserProfile {
  name: string;
  role: string;
  initials: string;
  avatar?: string;
}

interface SettingsViewProps {
  user: UserProfile;
  onUpdateUser: (user: UserProfile) => void;
  workTypes: string[];
  onUpdateWorkTypes: (types: string[]) => void;
  onResetData: () => void;
  onClearData: () => void;
  theme: Theme;
  onUpdateTheme: (theme: Theme) => void;
  onLogout: () => void;
  onUpdatePassword: (oldPass: string, newPass: string) => boolean;
  showInstall: boolean;
  onInstall: () => void;
  // Backup Props
  fullData: { clients: Client[], transactions: Transaction[], workerPayments?: WorkerPayment[] };
  onRestore: (data: any) => void;
  onAddClient: (client: Omit<Client, 'id' | 'joinedDate'> & { id?: string }) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ 
  user, 
  onUpdateUser, 
  workTypes, 
  onUpdateWorkTypes,
  onResetData,
  onClearData,
  theme,
  onUpdateTheme,
  onLogout,
  onUpdatePassword,
  showInstall,
  onInstall,
  fullData,
  onRestore,
  onAddClient
}) => {
  const [userForm, setUserForm] = useState<UserProfile>(user);
  const [newWorkType, setNewWorkType] = useState('');
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [configSuccess, setConfigSuccess] = useState(false);

  // Client Form State
  const [clientForm, setClientForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    status: 'Prospect' as 'Active' | 'Inactive' | 'Prospect'
  });
  const [clientSuccess, setClientSuccess] = useState(false);

  // Password State
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passMessage, setPassMessage] = useState({ text: '', type: '' });

  // Sync form with props if they change externally
  useEffect(() => {
    setUserForm(user);
  }, [user]);

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser(userForm);
    setProfileSuccess(true);
    setTimeout(() => setProfileSuccess(false), 3000);
  };

  const handleAvatarChange = () => {
    const url = window.prompt("Enter Image URL for Profile Photo:", userForm.avatar || "");
    if (url !== null) {
      const updatedUser = { ...userForm, avatar: url };
      setUserForm(updatedUser);
      onUpdateUser(updatedUser); // Auto-save avatar changes
    }
  };

  const handleAddWorkType = (e: React.FormEvent) => {
    e.preventDefault();
    if (newWorkType && !workTypes.includes(newWorkType)) {
      onUpdateWorkTypes([...workTypes, newWorkType]);
      setNewWorkType('');
      setConfigSuccess(true);
      setTimeout(() => setConfigSuccess(false), 3000);
    }
  };

  const handleRemoveWorkType = (typeToRemove: string) => {
    if (window.confirm(`Remove "${typeToRemove}" from work types?`)) {
      onUpdateWorkTypes(workTypes.filter(t => t !== typeToRemove));
    }
  };

  const handleAddNewClient = (e: React.FormEvent) => {
    e.preventDefault();
    onAddClient(clientForm);
    setClientForm({
      name: '',
      company: '',
      email: '',
      phone: '',
      status: 'Prospect'
    });
    setClientSuccess(true);
    setTimeout(() => setClientSuccess(false), 3000);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      setPassMessage({ text: "New passwords do not match.", type: 'error' });
      return;
    }
    if (newPass.length < 4) {
      setPassMessage({ text: "Password is too short.", type: 'error' });
      return;
    }

    const success = onUpdatePassword(oldPass, newPass);
    if (success) {
      try {
        const savedRaw = localStorage.getItem('spartan_saved_credentials');
        if (savedRaw) {
          const parsed = JSON.parse(savedRaw);
          if (parsed && parsed.username === user.name) {
            parsed.password = newPass;
            localStorage.setItem('spartan_saved_credentials', JSON.stringify(parsed));
          }
        }
      } catch (err) {
        console.warn("Could not sync saved password:", err);
      }

      setPassMessage({ text: "Password updated successfully and synced with saved credentials.", type: 'success' });
      setOldPass('');
      setNewPass('');
      setConfirmPass('');
      setTimeout(() => setPassMessage({ text: '', type: '' }), 3000);
    } else {
      setPassMessage({ text: "Incorrect current password.", type: 'error' });
    }
  };

  const handleBackup = () => {
    const backup = {
      version: '2.6',
      timestamp: new Date().toISOString(),
      user,
      theme,
      workTypes,
      clients: fullData.clients,
      transactions: fullData.transactions
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Spartan_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        onRestore(parsed);
      } catch(err) { 
        alert('Invalid backup file. Restoration cancelled.'); 
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const isFuturistic = theme === 'futuristic';

  // Generate QR Code URL (using a free API for demo purposes, pointing to current URL)
  const currentUrl = window.location.href;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(currentUrl)}`;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-12">
      
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={`text-xl font-bold ${isFuturistic ? 'text-white' : 'text-slate-800'}`}>System Configuration</h2>
          <p className={`text-sm mt-1 ${isFuturistic ? 'text-slate-400' : 'text-slate-500'}`}>Manage global application settings and preferences.</p>
        </div>
      </div>

      {/* Admin Identity Banner (Logo/Photo) */}
      <div className={`rounded-lg shadow-sm border p-6 flex flex-col sm:flex-row items-center gap-6 
        ${isFuturistic ? 'bg-slate-900 border-cyan-900/50' : 'bg-white border-slate-200'}`}>
        
        <div className="relative group cursor-pointer" onClick={handleAvatarChange}>
           <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold overflow-hidden border-4 shadow-sm transition-transform group-hover:scale-105 
             ${isFuturistic 
               ? 'bg-slate-800 text-cyan-400 border-cyan-500/30' 
               : 'bg-slate-100 text-slate-400 border-white shadow-md'}`}>
              {userForm.avatar ? (
                <img src={userForm.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span>{userForm.initials}</span>
              )}
           </div>
           <div className={`absolute bottom-0 right-0 p-2 rounded-full border-2 transition-colors 
             ${isFuturistic 
               ? 'bg-cyan-600 border-slate-900 text-black group-hover:bg-cyan-400' 
               : 'bg-white border-slate-100 text-slate-600 shadow-sm group-hover:text-blue-600'}`}>
             <Camera className="w-4 h-4" />
           </div>
        </div>

        <div className="text-center sm:text-left">
           <h2 className={`text-2xl font-bold mb-1 ${isFuturistic ? 'text-white' : 'text-slate-800'}`}>
             {userForm.name}
           </h2>
           <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border 
             ${isFuturistic ? 'bg-cyan-950/30 border-cyan-900/50 text-cyan-400' : 'bg-blue-50 border-blue-100 text-blue-700'}`}>
             <SpartanLogo className="w-3 h-3" theme={theme} />
             {userForm.role}
           </div>
        </div>

        <div className="sm:ml-auto">
           <button 
             type="button"
             onClick={handleAvatarChange}
             className={`px-4 py-2 text-sm font-medium rounded border transition-colors flex items-center gap-2 
               ${isFuturistic 
                 ? 'border-slate-700 hover:bg-slate-800 text-slate-300' 
                 : 'border-slate-300 hover:bg-slate-50 text-slate-600'}`}
           >
             <ImageIcon className="w-4 h-4" /> Change Photo
           </button>
        </div>
      </div>

      {/* Interface Theme */}
      <div className={`rounded-lg shadow-sm border overflow-hidden
        ${isFuturistic ? 'bg-slate-900 border-cyan-900/50' : 'bg-white border-slate-200'}`}>
         <div className={`p-4 border-b flex items-center justify-between
           ${isFuturistic ? 'bg-slate-950 border-cyan-900/30' : 'bg-slate-50 border-slate-200'}`}>
           <div className="flex items-center gap-2">
             <Monitor className={`w-5 h-5 ${isFuturistic ? 'text-cyan-400' : 'text-slate-500'}`} />
             <h3 className={`font-semibold ${isFuturistic ? 'text-white' : 'text-slate-700'}`}>Interface Theme</h3>
           </div>
         </div>
         <div className="p-6">
           <div className="flex gap-4">
              <button 
                onClick={() => onUpdateTheme('professional')}
                className={`flex-1 p-4 border-2 rounded-lg flex items-center justify-center gap-3 transition-all
                  ${theme === 'professional' 
                    ? 'border-blue-600 bg-blue-50 text-blue-700' 
                    : 'border-slate-200 hover:border-slate-300'
                  } ${isFuturistic ? 'bg-slate-800 border-slate-700 text-slate-300' : ''}`}
              >
                <Sun className="w-5 h-5" />
                <span className="font-semibold">Professional</span>
              </button>
              <button 
                onClick={() => onUpdateTheme('futuristic')}
                className={`flex-1 p-4 border-2 rounded-lg flex items-center justify-center gap-3 transition-all
                  ${theme === 'futuristic' 
                    ? 'border-cyan-400 bg-cyan-950/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]' 
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
              >
                <Moon className="w-5 h-5" />
                <span className="font-semibold font-futuristic">Futuristic</span>
              </button>
           </div>
         </div>
      </div>

      {/* Security & Access (Password Only) */}
      <div className={`rounded-lg shadow-sm border overflow-hidden
        ${isFuturistic ? 'bg-slate-900 border-cyan-900/50' : 'bg-white border-slate-200'}`}>
        <div className={`p-4 border-b flex items-center justify-between
           ${isFuturistic ? 'bg-slate-950 border-cyan-900/30' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center gap-2">
            <Lock className={`w-5 h-5 ${isFuturistic ? 'text-cyan-400' : 'text-slate-500'}`} />
            <h3 className={`font-semibold ${isFuturistic ? 'text-white' : 'text-slate-700'}`}>Security & Access</h3>
          </div>
        </div>
        <div className="p-6">
           {/* Change Password Form */}
           <div>
              <h4 className={`font-medium mb-4 ${isFuturistic ? 'text-white' : 'text-slate-800'}`}>Change Password</h4>
              <form onSubmit={handleChangePassword} className="space-y-3 max-w-sm">
                 <div>
                   <input 
                     type="password" 
                     placeholder="Current Password"
                     value={oldPass}
                     onChange={e => setOldPass(e.target.value)}
                     className={`w-full px-3 py-2 border rounded outline-none text-sm bg-slate-100 transition-colors
                       ${isFuturistic 
                         ? 'bg-slate-950 border-slate-700 text-white focus:border-cyan-500' 
                         : 'border-slate-300 focus:ring-2 focus:ring-blue-500'}`}
                   />
                 </div>
                 <div className="grid grid-cols-2 gap-2">
                   <input 
                     type="password" 
                     placeholder="New Password"
                     value={newPass}
                     onChange={e => setNewPass(e.target.value)}
                     className={`w-full px-3 py-2 border rounded outline-none text-sm bg-slate-100 transition-colors
                       ${isFuturistic 
                         ? 'bg-slate-950 border-slate-700 text-white focus:border-cyan-500' 
                         : 'border-slate-300 focus:ring-2 focus:ring-blue-500'}`}
                   />
                   <input 
                     type="password" 
                     placeholder="Confirm New"
                     value={confirmPass}
                     onChange={e => setConfirmPass(e.target.value)}
                     className={`w-full px-3 py-2 border rounded outline-none text-sm bg-slate-100 transition-colors
                       ${isFuturistic 
                         ? 'bg-slate-950 border-slate-700 text-white focus:border-cyan-500' 
                         : 'border-slate-300 focus:ring-2 focus:ring-blue-500'}`}
                   />
                 </div>
                 
                 {passMessage.text && (
                   <div className={`text-xs font-medium flex items-center gap-1 ${passMessage.type === 'error' ? 'text-red-500' : 'text-emerald-500'}`}>
                     {passMessage.type === 'error' ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                     {passMessage.text}
                   </div>
                 )}

                 <button 
                   type="submit" 
                   className={`px-4 py-2 text-sm font-medium rounded transition-colors w-full
                     ${isFuturistic ? 'bg-cyan-900/50 text-cyan-400 hover:bg-cyan-900/70 border border-cyan-800' : 'bg-slate-800 text-white hover:bg-slate-900'}`}
                 >
                   Update Credentials
                 </button>
              </form>
           </div>
        </div>
      </div>

      {/* User Profile Section */}
      <div className={`rounded-lg shadow-sm border overflow-hidden
        ${isFuturistic ? 'bg-slate-900 border-cyan-900/50' : 'bg-white border-slate-200'}`}>
        <div className={`p-4 border-b flex items-center justify-between
           ${isFuturistic ? 'bg-slate-950 border-cyan-900/30' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center gap-2">
            <User className={`w-5 h-5 ${isFuturistic ? 'text-cyan-400' : 'text-slate-500'}`} />
            <h3 className={`font-semibold ${isFuturistic ? 'text-white' : 'text-slate-700'}`}>Admin Profile</h3>
          </div>
          {profileSuccess && (
            <div className="flex items-center gap-1 text-emerald-600 text-xs font-medium animate-fadeIn">
              <CheckCircle className="w-4 h-4" /> Saved
            </div>
          )}
        </div>
        <div className="p-6">
          <form onSubmit={handleSaveUser} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={`block text-xs font-medium mb-1.5 uppercase ${isFuturistic ? 'text-slate-400' : 'text-slate-600'}`}>Display Name</label>
              <input 
                type="text" 
                value={userForm.name}
                onChange={e => setUserForm({...userForm, name: e.target.value})}
                className={`w-full px-3 py-2 border rounded outline-none text-sm bg-slate-100 transition-colors
                  ${isFuturistic 
                    ? 'bg-slate-950 border-slate-700 text-white focus:border-cyan-500' 
                    : 'border-slate-300 focus:ring-2 focus:ring-blue-500'}`}
              />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1.5 uppercase ${isFuturistic ? 'text-slate-400' : 'text-slate-600'}`}>Role Title</label>
              <input 
                type="text" 
                value={userForm.role}
                onChange={e => setUserForm({...userForm, role: e.target.value})}
                className={`w-full px-3 py-2 border rounded outline-none text-sm bg-slate-100 transition-colors
                  ${isFuturistic 
                    ? 'bg-slate-950 border-slate-700 text-white focus:border-cyan-500' 
                    : 'border-slate-300 focus:ring-2 focus:ring-blue-500'}`}
              />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1.5 uppercase ${isFuturistic ? 'text-slate-400' : 'text-slate-600'}`}>Initials (Avatar)</label>
              <input 
                type="text" 
                maxLength={2}
                value={userForm.initials}
                onChange={e => setUserForm({...userForm, initials: e.target.value.toUpperCase()})}
                className={`w-full px-3 py-2 border rounded outline-none text-sm font-mono bg-slate-100 transition-colors
                  ${isFuturistic 
                    ? 'bg-slate-950 border-slate-700 text-white focus:border-cyan-500' 
                    : 'border-slate-300 focus:ring-2 focus:ring-blue-500'}`}
              />
            </div>
            <div className="flex items-end">
              <button type="submit" className={`px-4 py-2 text-sm font-medium rounded transition-colors flex items-center gap-2
                ${isFuturistic ? 'bg-cyan-600 hover:bg-cyan-500 text-black' : 'bg-slate-800 text-white hover:bg-slate-900'}`}>
                <Save className="w-4 h-4" /> Save Profile
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Client Management */}
      <div className={`rounded-lg shadow-sm border overflow-hidden
        ${isFuturistic ? 'bg-slate-900 border-cyan-900/50' : 'bg-white border-slate-200'}`}>
        <div className={`p-4 border-b flex items-center justify-between
           ${isFuturistic ? 'bg-slate-950 border-cyan-900/30' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center gap-2">
            <UserPlus className={`w-5 h-5 ${isFuturistic ? 'text-cyan-400' : 'text-slate-500'}`} />
            <h3 className={`font-semibold ${isFuturistic ? 'text-white' : 'text-slate-700'}`}>Client Management</h3>
          </div>
          {clientSuccess && (
            <div className="flex items-center gap-1 text-emerald-600 text-xs font-medium animate-fadeIn">
              <CheckCircle className="w-4 h-4" /> Client Added
            </div>
          )}
        </div>
        <div className="p-6">
          <form onSubmit={handleAddNewClient} className="space-y-4">
            <h4 className={`font-medium mb-2 ${isFuturistic ? 'text-white' : 'text-slate-800'}`}>Add New Client</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-xs font-medium mb-1.5 uppercase ${isFuturistic ? 'text-slate-400' : 'text-slate-600'}`}>Company Name</label>
                <input 
                  required
                  type="text" 
                  value={clientForm.company}
                  onChange={e => setClientForm({...clientForm, company: e.target.value})}
                  className={`w-full px-3 py-2 border rounded outline-none text-sm bg-slate-100 transition-colors
                    ${isFuturistic 
                      ? 'bg-slate-950 border-slate-700 text-white focus:border-cyan-500' 
                      : 'border-slate-300 focus:ring-2 focus:ring-blue-500'}`}
                  placeholder="e.g. Spartan Tech"
                />
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1.5 uppercase ${isFuturistic ? 'text-slate-400' : 'text-slate-600'}`}>Contact Person</label>
                <input 
                  required
                  type="text" 
                  value={clientForm.name}
                  onChange={e => setClientForm({...clientForm, name: e.target.value})}
                  className={`w-full px-3 py-2 border rounded outline-none text-sm bg-slate-100 transition-colors
                    ${isFuturistic 
                      ? 'bg-slate-950 border-slate-700 text-white focus:border-cyan-500' 
                      : 'border-slate-300 focus:ring-2 focus:ring-blue-500'}`}
                  placeholder="e.g. John Doe"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={`block text-xs font-medium mb-1.5 uppercase ${isFuturistic ? 'text-slate-400' : 'text-slate-600'}`}>Email</label>
                <input 
                  required
                  type="email" 
                  value={clientForm.email}
                  onChange={e => setClientForm({...clientForm, email: e.target.value})}
                  className={`w-full px-3 py-2 border rounded outline-none text-sm bg-slate-100 transition-colors
                    ${isFuturistic 
                      ? 'bg-slate-950 border-slate-700 text-white focus:border-cyan-500' 
                      : 'border-slate-300 focus:ring-2 focus:ring-blue-500'}`}
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1.5 uppercase ${isFuturistic ? 'text-slate-400' : 'text-slate-600'}`}>Phone</label>
                <input 
                  type="text" 
                  value={clientForm.phone}
                  onChange={e => setClientForm({...clientForm, phone: e.target.value})}
                  className={`w-full px-3 py-2 border rounded outline-none text-sm bg-slate-100 transition-colors
                    ${isFuturistic 
                      ? 'bg-slate-950 border-slate-700 text-white focus:border-cyan-500' 
                      : 'border-slate-300 focus:ring-2 focus:ring-blue-500'}`}
                  placeholder="+1 555-0000"
                />
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1.5 uppercase ${isFuturistic ? 'text-slate-400' : 'text-slate-600'}`}>Status</label>
                <select 
                  value={clientForm.status}
                  onChange={e => setClientForm({...clientForm, status: e.target.value as any})}
                  className={`w-full px-3 py-2 border rounded outline-none text-sm bg-slate-100 transition-colors
                    ${isFuturistic 
                      ? 'bg-slate-950 border-slate-700 text-white focus:border-cyan-500' 
                      : 'border-slate-300 focus:ring-2 focus:ring-blue-500'}`}
                >
                  <option value="Active">Active</option>
                  <option value="Prospect">Prospect</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <button 
                type="submit" 
                className={`px-4 py-2 text-sm font-medium rounded transition-colors flex items-center gap-2
                  ${isFuturistic ? 'bg-cyan-600 hover:bg-cyan-500 text-black' : 'bg-slate-800 text-white hover:bg-slate-900'}`}
              >
                <Plus className="w-4 h-4" /> Add Client
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Work Types Configuration */}
      <div className={`rounded-lg shadow-sm border overflow-hidden
        ${isFuturistic ? 'bg-slate-900 border-cyan-900/50' : 'bg-white border-slate-200'}`}>
        <div className={`p-4 border-b flex items-center justify-between
           ${isFuturistic ? 'bg-slate-950 border-cyan-900/30' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center gap-2">
            <Briefcase className={`w-5 h-5 ${isFuturistic ? 'text-cyan-400' : 'text-slate-500'}`} />
            <h3 className={`font-semibold ${isFuturistic ? 'text-white' : 'text-slate-700'}`}>Engineering Work Types</h3>
          </div>
          {configSuccess && (
            <div className="flex items-center gap-1 text-emerald-600 text-xs font-medium animate-fadeIn">
              <CheckCircle className="w-4 h-4" /> Added
            </div>
          )}
        </div>
        <div className="p-6">
          <p className={`text-sm mb-4 ${isFuturistic ? 'text-slate-400' : 'text-slate-500'}`}>
            Define the standard categories available for payment records.
          </p>
          
          <div className="flex flex-wrap gap-2 mb-6">
            {workTypes.map(type => (
              <span key={type} className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm border group
                ${isFuturistic 
                  ? 'bg-slate-800 text-cyan-200 border-slate-700' 
                  : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                {type}
                <button 
                  onClick={() => handleRemoveWorkType(type)} 
                  className="p-0.5 text-slate-400 group-hover:text-red-500 rounded-full transition-colors"
                  title="Remove"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          <form onSubmit={handleAddWorkType} className="flex gap-2 max-w-md">
            <input 
              type="text" 
              placeholder="Add new work type..." 
              value={newWorkType}
              onChange={e => setNewWorkType(e.target.value)}
              className={`flex-1 px-3 py-2 border rounded outline-none text-sm bg-slate-100
                ${isFuturistic 
                  ? 'bg-slate-950 border-slate-700 text-white focus:border-cyan-500' 
                  : 'border-slate-300 focus:ring-2 focus:ring-blue-500'}`}
            />
            <button 
              type="submit"
              disabled={!newWorkType}
              className={`px-3 py-2 rounded disabled:opacity-50 transition-colors
                ${isFuturistic ? 'bg-cyan-600 hover:bg-cyan-500 text-black' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              <Plus className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>

      {/* Backup & Recovery */}
      <div className={`rounded-lg shadow-sm border overflow-hidden
        ${isFuturistic ? 'bg-slate-900 border-cyan-900/50' : 'bg-white border-slate-200'}`}>
         <div className={`p-4 border-b flex items-center justify-between
           ${isFuturistic ? 'bg-slate-950 border-cyan-900/30' : 'bg-slate-50 border-slate-200'}`}>
           <div className="flex items-center gap-2">
             <HardDrive className={`w-5 h-5 ${isFuturistic ? 'text-cyan-400' : 'text-slate-500'}`} />
             <h3 className={`font-semibold ${isFuturistic ? 'text-white' : 'text-slate-700'}`}>Backup & Recovery</h3>
           </div>
         </div>
         <div className="p-6 flex flex-col sm:flex-row gap-6">
           <div className="flex-1">
             <h4 className={`font-medium mb-1 ${isFuturistic ? 'text-white' : 'text-slate-800'}`}>Export Database</h4>
             <p className={`text-sm mb-4 ${isFuturistic ? 'text-slate-400' : 'text-slate-500'}`}>
               Save a complete copy of your clients and transactions to a local JSON file.
             </p>
             <button 
                onClick={handleBackup}
                className={`w-full px-4 py-2 rounded font-medium flex items-center justify-center gap-2 transition-colors border
                  ${isFuturistic 
                    ? 'bg-slate-800 border-slate-700 text-cyan-400 hover:bg-slate-700' 
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}
             >
               <Download className="w-4 h-4" /> Download Backup
             </button>
           </div>
           
           <div className={`w-px hidden sm:block ${isFuturistic ? 'bg-slate-800' : 'bg-slate-200'}`}></div>

           <div className="flex-1">
             <h4 className={`font-medium mb-1 ${isFuturistic ? 'text-white' : 'text-slate-800'}`}>Import Database</h4>
             <p className={`text-sm mb-4 ${isFuturistic ? 'text-slate-400' : 'text-slate-500'}`}>
               Restore your system from a previously saved backup file.
             </p>
             <label className={`w-full px-4 py-2 rounded font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer border
                  ${isFuturistic 
                    ? 'bg-slate-800 border-slate-700 text-cyan-400 hover:bg-slate-700' 
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}
             >
               <Upload className="w-4 h-4" /> Select Backup File
               <input type="file" accept=".json" onChange={handleRestoreFile} className="hidden" />
             </label>
           </div>
         </div>
      </div>

      {/* App Installation & Android Link */}
      <div className={`rounded-lg shadow-sm border overflow-hidden
        ${isFuturistic ? 'bg-slate-900 border-cyan-900/50' : 'bg-white border-slate-200'}`}>
         <div className={`p-4 border-b flex items-center justify-between
           ${isFuturistic ? 'bg-slate-950 border-cyan-900/30' : 'bg-slate-50 border-slate-200'}`}>
           <div className="flex items-center gap-2">
             <Smartphone className={`w-5 h-5 ${isFuturistic ? 'text-cyan-400' : 'text-slate-500'}`} />
             <h3 className={`font-semibold ${isFuturistic ? 'text-white' : 'text-slate-700'}`}>Mobile App Link</h3>
           </div>
         </div>
         <div className="p-6">
           <div className="flex flex-col md:flex-row gap-8 items-center">
             
             {/* QR Code Section */}
             <div className="flex-shrink-0 flex flex-col items-center">
               <div className={`p-2 bg-white rounded-lg shadow-sm mb-2 ${isFuturistic ? 'border-2 border-cyan-500/50' : 'border border-slate-200'}`}>
                  {/* Generated QR Code for Current URL */}
                  <img src={qrUrl} alt="Scan to Open on Mobile" className="w-32 h-32" />
               </div>
               <span className={`text-[10px] font-mono uppercase tracking-widest ${isFuturistic ? 'text-cyan-400' : 'text-slate-500'}`}>Scan to Connect</span>
             </div>

             <div className="flex-1 space-y-4">
                <div>
                   <h4 className={`font-medium mb-1 ${isFuturistic ? 'text-white' : 'text-slate-800'}`}>Link Android Device</h4>
                   <p className={`text-sm leading-relaxed ${isFuturistic ? 'text-slate-400' : 'text-slate-500'}`}>
                     Scan the QR code with your Android phone's camera to instantly open the SPARTAN Dashboard on your mobile device.
                   </p>
                </div>
                
                {showInstall ? (
                   <div>
                     <button 
                        onClick={onInstall}
                        className={`w-full sm:w-auto px-6 py-3 rounded font-bold flex items-center justify-center gap-2 transition-all shrink-0
                          ${isFuturistic 
                            ? 'bg-cyan-600 text-black hover:bg-cyan-500 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]' 
                            : 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg'}`}
                     >
                       <Download className="w-5 h-5" /> Install App to Desktop
                     </button>
                   </div>
                ) : (
                  <div className={`text-xs p-3 rounded border ${isFuturistic ? 'bg-slate-950/50 border-slate-800 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                    <div className="font-semibold flex items-center gap-2 mb-1">
                      <CheckCircle className="w-3 h-3" /> App Status: Active
                    </div>
                    To install on Android after scanning: Tap the Chrome Menu (⋮) and select "Install App" or "Add to Home Screen".
                  </div>
                )}
             </div>
           </div>
         </div>
      </div>

       {/* Keyboard Shortcuts */}
       <div className={`rounded-lg shadow-sm border overflow-hidden
        ${isFuturistic ? 'bg-slate-900 border-cyan-900/50' : 'bg-white border-slate-200'}`}>
         <div className={`p-4 border-b flex items-center justify-between
           ${isFuturistic ? 'bg-slate-950 border-cyan-900/30' : 'bg-slate-50 border-slate-200'}`}>
           <div className="flex items-center gap-2">
             <Keyboard className={`w-5 h-5 ${isFuturistic ? 'text-cyan-400' : 'text-slate-500'}`} />
             <h3 className={`font-semibold ${isFuturistic ? 'text-white' : 'text-slate-700'}`}>Keyboard Shortcuts</h3>
           </div>
         </div>
         <div className="p-6">
           <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="flex items-center justify-between text-sm p-2 rounded bg-slate-50/50 border border-slate-100">
                <span className="text-slate-600">Dashboard</span>
                <kbd className="px-2 py-0.5 bg-white border border-slate-300 rounded font-mono text-xs text-slate-500">Alt + D</kbd>
              </div>
              <div className="flex items-center justify-between text-sm p-2 rounded bg-slate-50/50 border border-slate-100">
                <span className="text-slate-600">Client Register</span>
                <kbd className="px-2 py-0.5 bg-white border border-slate-300 rounded font-mono text-xs text-slate-500">Alt + C</kbd>
              </div>
              <div className="flex items-center justify-between text-sm p-2 rounded bg-slate-50/50 border border-slate-100">
                <span className="text-slate-600">Payments</span>
                <kbd className="px-2 py-0.5 bg-white border border-slate-300 rounded font-mono text-xs text-slate-500">Alt + P</kbd>
              </div>
              <div className="flex items-center justify-between text-sm p-2 rounded bg-slate-50/50 border border-slate-100">
                <span className="text-slate-600">Quote Engine</span>
                <kbd className="px-2 py-0.5 bg-white border border-slate-300 rounded font-mono text-xs text-slate-500">Alt + E</kbd>
              </div>
              <div className="flex items-center justify-between text-sm p-2 rounded bg-slate-50/50 border border-slate-100">
                <span className="text-slate-600">Settings</span>
                <kbd className="px-2 py-0.5 bg-white border border-slate-300 rounded font-mono text-xs text-slate-500">Alt + S</kbd>
              </div>
              <div className="flex items-center justify-between text-sm p-2 rounded bg-slate-50/50 border border-slate-100">
                <span className="text-slate-600">Home Hub</span>
                <kbd className="px-2 py-0.5 bg-white border border-slate-300 rounded font-mono text-xs text-slate-500">Alt + H</kbd>
              </div>
           </div>
         </div>
      </div>

      {/* Data Management (Danger Zone) */}
      <div className={`rounded-lg shadow-sm border overflow-hidden
        ${isFuturistic ? 'bg-slate-900 border-red-900/50' : 'bg-white border-red-200'}`}>
        <div className={`p-4 border-b flex items-center gap-2
           ${isFuturistic ? 'bg-red-950/20 border-red-900/30' : 'bg-red-50 border-red-100'}`}>
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <h3 className="font-semibold text-red-800">Data Management</h3>
        </div>
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <h4 className={`font-medium mb-1 ${isFuturistic ? 'text-white' : 'text-slate-800'}`}>Reset to Defaults</h4>
              <p className={`text-sm mb-3 ${isFuturistic ? 'text-slate-400' : 'text-slate-500'}`}>
                Reloads the initial sample dataset and work types.
              </p>
              <button 
                onClick={onResetData}
                className={`px-4 py-2 border font-medium text-sm rounded flex items-center gap-2 transition-colors
                  ${isFuturistic 
                    ? 'border-slate-700 text-slate-300 hover:bg-slate-800' 
                    : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}
              >
                <RefreshCw className="w-4 h-4" /> Reset Application Data
              </button>
            </div>
            
            <div className={`w-px hidden sm:block ${isFuturistic ? 'bg-slate-800' : 'bg-slate-200'}`}></div>

            <div className="flex-1">
              <h4 className={`font-medium mb-1 ${isFuturistic ? 'text-white' : 'text-slate-800'}`}>Clear All Records</h4>
              <p className={`text-sm mb-3 ${isFuturistic ? 'text-slate-400' : 'text-slate-500'}`}>
                Permanently deletes all clients and transaction history.
              </p>
              <button 
                onClick={onClearData}
                className={`px-4 py-2 border font-medium text-sm rounded flex items-center gap-2 transition-colors
                   ${isFuturistic 
                    ? 'bg-red-950/20 border-red-900/50 text-red-400 hover:bg-red-950/40' 
                    : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'}`}
              >
                <Trash2 className="w-4 h-4" /> Wipe All Data
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Log Out (Session Control) */}
      <div className={`rounded-lg shadow-sm border overflow-hidden
        ${isFuturistic ? 'bg-slate-900 border-red-900/50' : 'bg-white border-red-200'}`}>
        <div className={`p-4 border-b flex items-center gap-2
           ${isFuturistic ? 'bg-red-950/20 border-red-900/30' : 'bg-red-50 border-red-100'}`}>
          <LogOut className="w-5 h-5 text-red-500" />
          <h3 className="font-semibold text-red-800">Sign Out</h3>
        </div>
        <div className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className={`font-medium mb-1 ${isFuturistic ? 'text-white' : 'text-slate-800'}`}>End Current Session</h4>
            <p className={`text-sm ${isFuturistic ? 'text-slate-400' : 'text-slate-500'}`}>
              Securely log out of your account. You will need to re-authenticate to access the system.
            </p>
          </div>
          <button 
            onClick={onLogout}
            className={`px-6 py-3 border font-bold text-sm rounded flex items-center gap-2 transition-colors w-full sm:w-auto justify-center
               ${isFuturistic 
                ? 'bg-red-950/20 border-red-900/50 text-red-400 hover:bg-red-950/40' 
                : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'}`}
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};