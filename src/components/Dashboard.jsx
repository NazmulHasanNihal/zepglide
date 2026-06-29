import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { 
  UploadCloud, Download, History, Settings, Zap, Shield, Laptop2, CreditCard, 
  Menu, Sun, Moon, ChevronDown, User, ShieldAlert, LogOut, Command, Search, 
  Info, CheckCircle2, UserCircle, Crown, X, Video, MonitorDown, Network
} from 'lucide-react';

import SendView from './views/SendView';
import ReceiveView from './views/ReceiveView';
import DevicesView from './views/DevicesView';
import HistoryView from './views/HistoryView';
import ProfileView from './views/ProfileView';
import PricingView from './views/PricingView';
import AdminDashboardView from './views/AdminDashboardView';
import SettingsView from './views/SettingsView';
import GlobalMapView from './views/GlobalMapView';
import { useSound } from '../hooks/useSound';

const Dashboard = React.memo(({ isAuthenticated, onLoginClick, onLogout, isDarkMode, setIsDarkMode, activeTheme, setActiveTheme, themes, customTheme, setCustomTheme }) => {
  const [activeTab, setActiveTab] = useState('send');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  
  const [toasts, setToasts] = useState([]);
  const [isCmdMenuOpen, setIsCmdMenuOpen] = useState(false);
  const { playSfx } = useSound();
  const [dragCounter, setDragCounter] = useState(0);
  const [globalDroppedFile, setGlobalDroppedFile] = useState(null);

  const [profile, setProfile] = useState({
    name: 'Loading...', bio: '', website: '',
    email: '', location: '', countryCode: '', role: '', plan: ''
  });

  const [preferences, setPreferences] = useState({
    publicDiscovery: true, autoAccept: false, strictE2EE: true, useWebTransport: true, useWebGPU: true, cloudBridgeFallback: true
  });

  const isAdmin = profile?.role === 'admin' || profile?.email === 'nazmulhas36@gmail.com' || profile?.email === import.meta.env.VITE_ADMIN_EMAIL;

  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const res = await fetch((import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'production' ? 'https://zepglide.onrender.com' : '')) + '/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.profile) setProfile(data.profile);
      if (data.preferences) {
          setPreferences(data.preferences);
          if (data.preferences.customTheme) {
              setCustomTheme(data.preferences.customTheme);
          }
      }
      
      // Register Device
      fetch((import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'production' ? 'https://zepglide.onrender.com' : '')) + '/api/devices/register', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: navigator.platform || 'Unknown Device',
          type: /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
          os: navigator.userAgent,
          location: data.profile?.location || 'Unknown',
          userAgent: navigator.userAgent
        })
      }).catch(err => console.error("Failed to register device", err));

    } catch (e) {
      console.error("Failed to fetch profile from backend", e);
    } finally {
      setIsLoading(false);
    }
  }, [setCustomTheme]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, fetchProfile]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const handleTabClick = (tab) => {
    const restrictedTabs = ['history', 'devices', 'settings', 'profile', 'admin'];
    if (!isAuthenticated && restrictedTabs.includes(tab)) { onLoginClick(); return; }
    if (tab !== activeTab) playSfx('click');
    setActiveTab(tab); setIsMobileMenuOpen(false); setIsCmdMenuOpen(false);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let hashReceive = null;
    if (window.location.hash.startsWith('#receive=')) {
      hashReceive = window.location.hash.split('&')[0].replace('#receive=', '');
    }
    if (params.get('pin') || hashReceive) {
      setActiveTab('receive');
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsCmdMenuOpen(prev => {
          if (!prev) playSfx('ping');
          return !prev;
        });
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [playSfx]);

  const handleDragEnter = (e) => { e.preventDefault(); setDragCounter(prev => prev + 1); };
  const handleDragLeave = (e) => { e.preventDefault(); setDragCounter(prev => prev - 1); };
  const handleDragOver = (e) => { e.preventDefault(); };
  const handleDrop = (e) => {
    e.preventDefault(); setDragCounter(0);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setGlobalDroppedFile(e.dataTransfer.files[0]);
      setActiveTab('send');
    }
  };

  return (
    <div 
      className="flex flex-col h-screen overflow-hidden font-sans bg-[var(--bg-main)] text-[var(--text-main)] transition-colors duration-500 ease-out relative"
      onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}
    >
      {/* DRAG OVERLAY */}
      {dragCounter > 0 && (
        <div className="absolute inset-0 z-[200] bg-[var(--bg-main)]/60 backdrop-blur-md flex items-center justify-center border-4 border-dashed border-[var(--primary)] m-4 rounded-[3rem] animate-in fade-in">
           <div className="flex flex-col items-center gap-6 pointer-events-none scale-110 animate-pulse">
              <div className="h-32 w-32 bg-[var(--primary-10)] rounded-full flex items-center justify-center text-[var(--primary)] shadow-[0_0_50px_var(--primary-20)]"><UploadCloud size={64} /></div>
              <h2 className="text-4xl font-black uppercase tracking-tighter drop-shadow-md">Drop Anywhere</h2>
              <p className="text-sm font-bold text-[var(--primary)] uppercase tracking-widest bg-[var(--primary-10)] px-6 py-2 rounded-full border border-[var(--primary-30)]">Secure Zepglide Routing</p>
           </div>
        </div>
      )}

      {/* COMMAND MENU */}
      {isCmdMenuOpen && <CommandMenu onClose={() => setIsCmdMenuOpen(false)} handleTabClick={handleTabClick} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} showToast={showToast} setActiveTheme={setActiveTheme} themes={themes} playSfx={playSfx} />}

      {/* TOASTS */}
      <div className="fixed bottom-6 right-6 z-[300] flex flex-col gap-3 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className="bg-[var(--bg-surface)] border border-[var(--border-main)] shadow-2xl p-4 rounded-2xl flex items-center gap-4 animate-in slide-in-from-right-8 pointer-events-auto relative overflow-hidden w-80">
             <div className={`absolute left-0 top-0 bottom-0 w-1 ${toast.type === 'success' ? 'bg-[var(--success)]' : 'bg-[var(--primary)]'}`}></div>
             {toast.type === 'success' ? <CheckCircle2 size={20} className="text-[var(--success)] shrink-0" /> : <Info size={20} className="text-[var(--primary)] shrink-0" />}
             <span className="text-sm font-bold">{toast.message}</span>
          </div>
        ))}
      </div>

      <header className="h-20 shrink-0 flex items-center justify-between px-4 md:px-8 border-b border-[var(--border-main)] bg-[var(--bg-surface)]/80 backdrop-blur-md z-50 transition-all duration-500 shadow-sm">
        <div onClick={() => handleTabClick('send')} className="flex items-center gap-2 text-[var(--primary)] hover:scale-105 transition-transform duration-300 cursor-pointer shrink-0 mr-6">
          {activeTheme === 'custom' && customTheme?.logoUrl ? (
            <img src={customTheme.logoUrl} alt="Brand Logo" className="h-8 max-w-[150px] object-contain" />
          ) : (
            <>
              <Zap size={28} className="fill-current" />
              <span className="text-xl font-bold tracking-tight text-[var(--text-main)] hidden sm:block">Zepglide</span>
            </>
          )}
        </div>

        <nav className="hidden lg:flex flex-1 items-center justify-center gap-2">
          <HeaderNavItem icon={<UploadCloud size={18} />} label="Send" active={activeTab === 'send'} onClick={() => handleTabClick('send')} />
          <HeaderNavItem icon={<Download size={18} />} label="Receive" active={activeTab === 'receive'} onClick={() => handleTabClick('receive')} />
          <HeaderNavItem icon={<Network size={18} />} label="Global Hub" active={activeTab === 'global'} onClick={() => handleTabClick('global')} />
          {isAuthenticated && (
            <>
              <HeaderNavItem icon={<Laptop2 size={18} />} label="Devices" active={activeTab === 'devices'} onClick={() => handleTabClick('devices')} />
              <HeaderNavItem icon={<History size={18} />} label="History" active={activeTab === 'history'} onClick={() => handleTabClick('history')} />
            </>
          )}
          <HeaderNavItem icon={<CreditCard size={18} />} label="Pricing" active={activeTab === 'pricing'} onClick={() => handleTabClick('pricing')} />
        </nav>
        
        <div className="flex items-center gap-4 shrink-0">
          <button onClick={() => setIsCmdMenuOpen(true)} className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-main)] border border-[var(--border-main)] hover:border-[var(--primary-30)] text-[var(--text-muted)] rounded-xl text-xs font-bold transition-all"><Command size={14}/> <span className="opacity-70">Cmd + K</span></button>
          <button title="Toggle Dark/Light Mode" onClick={() => setIsDarkMode(!isDarkMode)} className="p-2.5 rounded-full transition-all duration-300 text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--bg-main)] active:scale-90">{isDarkMode ? <Sun size={20} /> : <Moon size={20} />}</button>

          {isAuthenticated ? (
            <div className="relative">
              <button onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)} className={`flex items-center gap-2 px-2 py-1.5 rounded-full border-2 transition-all duration-300 bg-[var(--bg-main)] hover:border-[var(--primary)] active:scale-95 ${isProfileDropdownOpen ? 'border-[var(--primary)]' : 'border-[var(--border-main)]'}`}>
                <div className="h-7 w-7 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-xs font-bold shadow-sm overflow-hidden border border-[var(--primary-30)]">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    profile.name ? profile.name.split(/\s+/).map(w => w[0]).join('').toUpperCase().substring(0,2) : '??'
                  )}
                </div>
                <ChevronDown size={14} className={`text-[var(--text-muted)] mr-1 transition-transform duration-300 ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isProfileDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileDropdownOpen(false)}></div>
                  <div className="absolute right-0 mt-3 w-64 bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl shadow-xl z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 origin-top-right">
                    <div className="px-4 py-4 border-b border-[var(--border-main)] bg-[var(--bg-main)]/30">
                       <p className="text-sm font-bold text-[var(--text-main)] truncate">{profile.name}</p>
                       {(profile.plan && profile.plan.toLowerCase() !== 'free' && profile.plan.toLowerCase() !== 'default') || isAdmin ? (
                          <p className="text-xs text-[var(--text-muted)] truncate mt-0.5 font-medium flex items-center gap-1"><Crown size={12} className="text-[var(--warning)]" /> {isAdmin ? 'Admin' : profile.plan + ' Member'}</p>
                       ) : null}
                    </div>
                    <div className="py-1">
                      <DropdownItem icon={<User size={16} />} label="My Profile" onClick={() => { handleTabClick('profile'); setIsProfileDropdownOpen(false); }} />
                      <DropdownItem icon={<Settings size={16} />} label="Settings" onClick={() => { handleTabClick('settings'); setIsProfileDropdownOpen(false); }} />
                      {isAdmin && <DropdownItem icon={<ShieldAlert size={16} />} label="Admin Dashboard" color="text-[var(--warning)]" onClick={() => { handleTabClick('admin'); setIsProfileDropdownOpen(false); }} />}
                    </div>
                    <div className="border-t border-[var(--border-main)] py-1"><DropdownItem icon={<LogOut size={16} />} label="Sign Out" color="text-[var(--danger)]" onClick={() => { onLogout(); setIsProfileDropdownOpen(false); setActiveTab('send'); }} /></div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button onClick={onLoginClick} className="hidden sm:flex items-center gap-2 bg-[var(--primary)] text-white px-6 py-2.5 rounded-full font-bold text-sm hover:brightness-110 active:scale-95 transition-all duration-300 shadow-lg"><UserCircle size={18} /><span>Sign In</span></button>
          )}

          <button className="lg:hidden p-2 rounded-xl bg-[var(--bg-main)] text-[var(--text-main)] hover:bg-[var(--bg-hover)] transition-all active:scale-90 ml-1" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>{isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}</button>
        </div>
      </header>

      {isMobileMenuOpen && (
        <>
          <div className="lg:hidden fixed inset-0 top-20 bg-[var(--bg-main)]/90 backdrop-blur-lg z-40 animate-in fade-in" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="lg:hidden absolute top-20 left-0 w-full bg-[var(--bg-surface)] border-b border-[var(--border-main)] shadow-2xl z-50 p-6 flex flex-col gap-3 animate-in slide-in-from-top-4 duration-300">
            <HeaderNavItem icon={<UploadCloud size={20} />} label="Send Files" active={activeTab === 'send'} onClick={() => handleTabClick('send')} />
            <HeaderNavItem icon={<Download size={20} />} label="Receive" active={activeTab === 'receive'} onClick={() => handleTabClick('receive')} />
            <HeaderNavItem icon={<Network size={20} />} label="Global Hub" active={activeTab === 'global'} onClick={() => handleTabClick('global')} />
            {isAuthenticated && (
              <>
                <HeaderNavItem icon={<Laptop2 size={20} />} label="Trusted Devices" active={activeTab === 'devices'} onClick={() => handleTabClick('devices')} />
                <HeaderNavItem icon={<History size={20} />} label="History" active={activeTab === 'history'} onClick={() => handleTabClick('history')} />
                {isAdmin && <HeaderNavItem icon={<ShieldAlert size={20} />} label="Admin Console" active={activeTab === 'admin'} color="text-[var(--warning)]" onClick={() => handleTabClick('admin')} />}
              </>
            )}
            <HeaderNavItem icon={<CreditCard size={20} />} label="Pricing" active={activeTab === 'pricing'} onClick={() => handleTabClick('pricing')} />
            {!isAuthenticated && (
               <button onClick={onLoginClick} className="flex items-center justify-center gap-2 bg-[var(--primary)] text-white p-4 rounded-xl font-bold text-sm shadow-lg mt-4 animate-in slide-in-from-bottom-4"><UserCircle size={20} /><span>Sign In</span></button>
            )}
          </div>
        </>
      )}

      <main className="flex-1 overflow-y-auto w-full relative z-0">
        {activeTab === 'global' ? (
          <div key={activeTab} className="w-full h-full animate-in fade-in duration-700">
            <GlobalMapView userCountry={profile.countryCode} isDarkMode={isDarkMode} activeTheme={activeTheme} />
          </div>
        ) : (
          <div className="max-w-[1440px] mx-auto p-4 md:p-8 flex justify-center pb-24 md:pb-24">
            <div key={activeTab} className="w-full animate-in fade-in slide-in-from-bottom-8 duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] fill-mode-both">
              {activeTab === 'send' && <SendView profile={profile} isAuthenticated={isAuthenticated} showToast={showToast} globalDroppedFile={globalDroppedFile} setGlobalDroppedFile={setGlobalDroppedFile} preferences={preferences} />}
              {activeTab === 'receive' && <ReceiveView showToast={showToast} />}
              {activeTab === 'devices' && <DevicesView />}
              {activeTab === 'history' && <HistoryView />}
              {activeTab === 'profile' && <ProfileView onLogout={() => { onLogout(); setActiveTab('send'); }} profile={profile} isAdmin={isAdmin} onEditClick={() => handleTabClick('settings')} showToast={showToast} />}
              {activeTab === 'pricing' && <PricingView isAuthenticated={isAuthenticated} showToast={showToast} profile={profile} setProfile={setProfile} onLoginClick={onLoginClick} />}
              {activeTab === 'admin' && isAdmin && <AdminDashboardView showToast={showToast}/>}
              {activeTab === 'settings' && <SettingsView isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} activeTheme={activeTheme} setActiveTheme={setActiveTheme} themes={themes} profile={profile} setProfile={setProfile} preferences={preferences} setPreferences={setPreferences} showToast={showToast} customTheme={customTheme} setCustomTheme={setCustomTheme} />}
            </div>
          </div>
        )}
      </main>
    </div>
  );
});

function HeaderNavItem({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2.5 px-4 py-2 rounded-xl font-bold text-sm transition-all duration-300 outline-none active:scale-95 ${active ? 'bg-[var(--primary-10)] text-[var(--primary)] shadow-sm' : 'text-[var(--text-muted)] hover:bg-[var(--bg-main)] hover:text-[var(--text-main)]'}`}>
      <div className={`transition-transform duration-300 ${active ? 'scale-110' : ''}`}>{icon}</div><span>{label}</span>
    </button>
  );
}

function DropdownItem({ icon, label, onClick, color = "text-[var(--text-main)]" }) {
  return (
    <button onClick={onClick} className={`w-full text-left px-4 py-3 text-sm ${color} hover:bg-[var(--bg-hover)] transition-all duration-300 flex items-center gap-3 group`}>
      <div className="opacity-70 group-hover:opacity-100 transition-all">{icon}</div><span className="font-bold tracking-tight">{label}</span>
    </button>
  );
}

function CommandMenu({ onClose, handleTabClick, isDarkMode, setIsDarkMode, showToast, setActiveTheme, themes, playSfx }) {
  const [search, setSearch] = useState('');
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const themeActions = Object.entries(themes).map(([id, t]) => ({
    id: `theme-${id}`,
    title: `Switch Theme: ${t.name}`,
    icon: <Sun size={16} style={{ color: t.primary }} />,
    action: () => { 
      setActiveTheme(id); 
      showToast(`Interface set to ${t.name}`, 'primary');
      playSfx('success');
      onClose(); 
    },
    category: 'Themes'
  }));

  const coreActions = [
    { id: 'send', title: 'Send Files', icon: <UploadCloud size={16}/>, action: () => handleTabClick('send'), category: 'Navigation' },
    { id: 'receive', title: 'Receive Files', icon: <Download size={16}/>, action: () => handleTabClick('receive'), category: 'Navigation' },
    { id: 'global', title: 'Global Hub Visualizer', icon: <Network size={16}/>, action: () => handleTabClick('global'), category: 'Navigation' },
    { id: 'profile', title: 'My Profile', icon: <User size={16}/>, action: () => handleTabClick('profile'), category: 'Navigation' },
    { id: 'admin', title: 'Admin Command Center', icon: <ShieldAlert size={16}/>, action: () => handleTabClick('admin'), badge: 'Root', category: 'Security' },
    { id: 'dark-toggle', title: `Toggle ${isDarkMode ? 'Light' : 'Dark'} Mode`, icon: isDarkMode ? <Sun size={16}/> : <Moon size={16}/>, action: () => { setIsDarkMode(!isDarkMode); playSfx('ping'); onClose(); }, category: 'Preferences' },
    { id: 'pwa', title: 'Install Zepglide (PWA)', icon: <MonitorDown size={16}/>, action: () => { showToast("Installing Progressive Web App...", "primary"); playSfx('success'); onClose(); }, category: 'System' },
  ];

  const actions = [...coreActions, ...themeActions];
  const filtered = actions.filter(a => a.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[250] flex items-start pt-32 justify-center px-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="w-full max-w-2xl bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl shadow-2xl relative z-10 overflow-hidden flex flex-col animate-in slide-in-from-top-8 zoom-in-95 duration-200 max-h-[70vh]">
         <div className="flex items-center px-4 py-4 border-b border-[var(--border-main)] bg-[var(--bg-main)]/50">
            <Search size={20} className="text-[var(--text-muted)] mr-3" />
            <input ref={inputRef} value={search} onChange={e => setSearch(e.target.value)} placeholder="Type a command or theme name..." className="flex-1 bg-transparent text-lg font-bold text-[var(--text-main)] focus:outline-none placeholder-[var(--text-muted)]" />
            <span className="text-[10px] font-black uppercase text-[var(--text-muted)] bg-[var(--bg-main)] px-2 py-1 rounded border border-[var(--border-main)]">ESC</span>
         </div>
         <div className="overflow-y-auto p-2 text-[var(--text-main)] custom-scrollbar">
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-[var(--text-muted)] flex flex-col items-center gap-2">
                <Search size={32} className="opacity-20" />
                <p className="text-sm font-bold uppercase tracking-widest">No results found</p>
              </div>
            ) : (
              filtered.map((action, idx) => {
                const showCategory = idx === 0 || filtered[idx-1].category !== action.category;
                return (
                  <React.Fragment key={action.id}>
                    {showCategory && (
                      <div className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] mt-2 mb-1">{action.category}</div>
                    )}
                    <button onClick={action.action} className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl hover:bg-[var(--primary-10)] text-current hover:text-[var(--primary)] transition-all group text-left active:scale-[0.99]">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-[var(--bg-main)] border border-[var(--border-main)] flex items-center justify-center text-[var(--text-muted)] group-hover:text-[var(--primary)] group-hover:border-[var(--primary-30)] transition-all">
                          {action.icon}
                        </div>
                        <span className="font-bold text-sm tracking-tight">{action.title}</span>
                      </div>
                      {action.badge && <span className="text-[9px] uppercase tracking-widest font-black bg-[var(--danger-10)] text-[var(--danger)] px-2 py-1 rounded border border-[var(--danger-20)]">{action.badge}</span>}
                    </button>
                  </React.Fragment>
                );
              })
            )}
         </div>
         <div className="px-4 py-3 bg-[var(--bg-main)]/50 border-t border-[var(--border-main)] flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5"><span className="text-[10px] font-black bg-[var(--bg-surface)] border border-[var(--border-main)] px-1.5 py-0.5 rounded text-[var(--text-muted)]">↑↓</span><span className="text-[10px] font-bold text-[var(--text-muted)]">Navigate</span></div>
              <div className="flex items-center gap-1.5"><span className="text-[10px] font-black bg-[var(--bg-surface)] border border-[var(--border-main)] px-1.5 py-0.5 rounded text-[var(--text-muted)]">ENTER</span><span className="text-[10px] font-bold text-[var(--text-muted)]">Select</span></div>
            </div>
            <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest opacity-50">Zepglide Command Center v1.2</div>
         </div>
      </div>
    </div>
  );
}

export default Dashboard;

