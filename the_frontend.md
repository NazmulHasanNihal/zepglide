import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  UploadCloud, Download, History, Settings, Zap, Shield, File, X, Wifi, Server, 
  Smartphone, Laptop, CheckCircle2, Crown, Activity, ArrowUpRight, ArrowDownLeft, 
  LogOut, ShieldAlert, Users, Terminal, DatabaseZap, Power, Trash2, DollarSign, 
  TrendingUp, Globe, Radio, MapPin, Check, CreditCard, Menu, Sun, Moon, Laptop2, 
  HardDrive, Lock, Folder, Palette, User, BarChart3, LineChart, AlertTriangle, 
  Ban, MonitorSmartphone, Cpu, Network, Key, Skull, AlertOctagon, ShieldX, Eye, 
  EyeOff, Mail, UserCircle, ChevronDown, Github, Fingerprint, MoreVertical, UserX, 
  PieChart, TrendingDown, Play, Pause, UserPlus, ListX, ShieldCheck, FileWarning, 
  Volume2, Globe2, BellRing, Sliders, Image as ImageIcon, Archive, Clock, Megaphone, 
  Database, RefreshCw, Send, BadgeCheck, Trophy, Calendar, Save, XCircle, Edit3, 
  Brain, Radar, ShieldHalf, Microscope, Copy, Link as LinkIcon, ToggleRight, FileText,
  PlayCircle, ZapOff, Workflow, Layers, Video, Command, Search, MonitorDown, Info
} from 'lucide-react';

// --- DYNAMIC THEME CONFIGURATION ---
const THEMES = {
  ocean: {
    name: 'Ocean (Default)',
    primary: '#00ADB5', primaryContent: '#FFFFFF', success: '#00ADB5', danger: '#F43F5E', warning: '#F59E0B', accent: '#8B5CF6',
    light: { bgMain: '#F8FAFC', bgSurface: '#FFFFFF', textMain: '#0F172A', textMuted: '#475569', borderMain: 'rgba(15, 23, 42, 0.08)', bgHover: '#F1F5F9' },
    dark: { bgMain: '#1E293B', bgSurface: '#334155', textMain: '#F8FAFC', textMuted: '#94A3B8', borderMain: 'rgba(255, 255, 255, 0.1)', bgHover: '#475569' }
  },
  deepBlue: {
    name: 'Deep Blue',
    primary: '#3282B8', primaryContent: '#FFFFFF', success: '#3282B8', danger: '#E62727', warning: '#FF9F00', accent: '#0F4C75',
    light: { bgMain: '#F0F4F8', bgSurface: '#FFFFFF', textMain: '#102A43', textMuted: '#334E68', borderMain: 'rgba(16, 42, 67, 0.1)', bgHover: '#D9E2EC' },
    dark: { bgMain: '#102A43', bgSurface: '#243B53', textMain: '#F0F4F8', textMuted: '#9FB3C8', borderMain: 'rgba(255, 255, 255, 0.1)', bgHover: '#334E68' }
  },
  retro: {
    name: 'Retro Classic',
    primary: '#E62727', primaryContent: '#FFFFFF', success: '#1E93AB', danger: '#E62727', warning: '#F4631E', accent: '#1E93AB',
    light: { bgMain: '#F4F1EA', bgSurface: '#FFFFFF', textMain: '#2A2A2A', textMuted: '#595959', borderMain: 'rgba(42, 42, 42, 0.1)', bgHover: '#EAE6DB' },
    dark: { bgMain: '#2D2A26', bgSurface: '#3D3935', textMain: '#F4F1EA', textMuted: '#AFA9A0', borderMain: 'rgba(244, 241, 234, 0.1)', bgHover: '#4D4843' }
  },
  neonPurple: {
    name: 'Neon Cyber',
    primary: '#B13BFF', primaryContent: '#FFFFFF', success: '#1DCD9F', danger: '#F43F5E', warning: '#FFCC00', accent: '#FFCC00',
    light: { bgMain: '#F5F3FF', bgSurface: '#FFFFFF', textMain: '#1E1B4B', textMuted: '#4C1D95', borderMain: 'rgba(30, 27, 75, 0.1)', bgHover: '#EDE9FE' },
    dark: { bgMain: '#1E1B4B', bgSurface: '#2E1065', textMain: '#F5F3FF', textMuted: '#C4B5FD', borderMain: 'rgba(245, 243, 255, 0.1)', bgHover: '#4C1D95' }
  }
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeTheme, setActiveTheme] = useState('ocean');

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://cdn.jsdelivr.net/npm/@fontsource/cascadia-code@4.2.1/index.min.css';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    const style = document.createElement('style');
    style.innerHTML = `* { font-family: 'Cascadia Code', Consolas, Monaco, monospace !important; }`;
    document.head.appendChild(style);
    return () => { document.head.removeChild(link); document.head.removeChild(style); };
  }, []);

  const themeData = THEMES[activeTheme];
  const modeData = isDarkMode ? themeData.dark : themeData.light;

  const hexToRgb = useCallback((hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '0,0,0';
  }, []);

  const buildColorVars = useCallback((name, hex) => {
    const rgb = hexToRgb(hex);
    return {
      [`--${name}`]: hex,
      [`--${name}-10`]: `rgba(${rgb}, 0.1)`,
      [`--${name}-20`]: `rgba(${rgb}, 0.2)`,
      [`--${name}-30`]: `rgba(${rgb}, 0.3)`,
      [`--${name}-50`]: `rgba(${rgb}, 0.5)`,
    };
  }, [hexToRgb]);

  const customStyles = useMemo(() => ({
    '--bg-main': modeData.bgMain,
    '--bg-surface': modeData.bgSurface,
    '--text-main': modeData.textMain,
    '--text-muted': modeData.textMuted,
    '--border-main': modeData.borderMain,
    '--bg-hover': modeData.bgHover,
    '--primary-content': themeData.primaryContent,
    ...buildColorVars('primary', themeData.primary),
    ...buildColorVars('success', themeData.success),
    ...buildColorVars('danger', themeData.danger),
    ...buildColorVars('warning', themeData.warning),
    ...buildColorVars('accent', themeData.accent),
  }), [modeData, themeData, buildColorVars]);

  return (
    <div className={isDarkMode ? 'dark' : ''} style={customStyles}>
      <Dashboard 
        isAuthenticated={isAuthenticated}
        onLoginClick={() => setShowAuthModal(true)}
        onLogout={() => setIsAuthenticated(false)}
        isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} 
        activeTheme={activeTheme} setActiveTheme={setActiveTheme} themes={THEMES}
      />
      {showAuthModal && <AuthModal onLogin={() => { setIsAuthenticated(true); setShowAuthModal(false); }} onClose={() => setShowAuthModal(false)} />}
    </div>
  );
}

const Dashboard = React.memo(({ isAuthenticated, onLoginClick, onLogout, isDarkMode, setIsDarkMode, activeTheme, setActiveTheme, themes }) => {
  const [activeTab, setActiveTab] = useState('send');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  
  // --- Global UX States ---
  const [toasts, setToasts] = useState([]);
  const [isCmdMenuOpen, setIsCmdMenuOpen] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const [globalDroppedFile, setGlobalDroppedFile] = useState(null);

  const isAdmin = true;

  const [profile, setProfile] = useState({
    name: 'Nihal Hasan', bio: 'Senior Network Architect & Protocol Engineer.', website: 'glide.io/nihal',
    email: 'nihal.zepglide@example.id', location: 'Dhaka, Bangladesh', countryCode: 'BD', role: 'Relay Manager', plan: 'Pro'
  });

  const [preferences, setPreferences] = useState({
    publicDiscovery: true, autoAccept: false, strictE2EE: true, useWebTransport: true, useWebGPU: true, cloudBridgeFallback: true
  });

  // --- Global Toast Function ---
  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const handleTabClick = (tab) => {
    const restrictedTabs = ['history', 'devices', 'settings', 'profile', 'admin'];
    if (!isAuthenticated && restrictedTabs.includes(tab)) { onLoginClick(); return; }
    setActiveTab(tab); setIsMobileMenuOpen(false); setIsCmdMenuOpen(false);
  };

  // --- Global Command Menu (Cmd+K) ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsCmdMenuOpen(prev => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --- Global Drag & Drop Overlay ---
  const handleDragEnter = (e) => { e.preventDefault(); setDragCounter(prev => prev + 1); };
  const handleDragLeave = (e) => { e.preventDefault(); setDragCounter(prev => prev - 1); };
  const handleDragOver = (e) => { e.preventDefault(); };
  const handleDrop = (e) => {
    e.preventDefault();
    setDragCounter(0);
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
      
      {/* GLOBAL DRAG OVERLAY */}
      {dragCounter > 0 && (
        <div className="absolute inset-0 z-[200] bg-[var(--bg-main)]/60 backdrop-blur-md flex items-center justify-center border-4 border-dashed border-[var(--primary)] m-4 rounded-[3rem] animate-in fade-in duration-200">
           <div className="flex flex-col items-center gap-6 pointer-events-none scale-110 animate-pulse">
              <div className="h-32 w-32 bg-[var(--primary-10)] rounded-full flex items-center justify-center text-[var(--primary)] shadow-[0_0_50px_var(--primary-20)]">
                <UploadCloud size={64} />
              </div>
              <h2 className="text-4xl font-black uppercase tracking-tighter text-[var(--text-main)] drop-shadow-md">Drop Anywhere</h2>
              <p className="text-sm font-bold text-[var(--primary)] uppercase tracking-widest bg-[var(--primary-10)] px-6 py-2 rounded-full border border-[var(--primary-30)]">Secure Zepglide Routing</p>
           </div>
        </div>
      )}

      {/* COMMAND MENU (Cmd+K) */}
      {isCmdMenuOpen && (
        <CommandMenu 
          onClose={() => setIsCmdMenuOpen(false)} 
          handleTabClick={handleTabClick} 
          isDarkMode={isDarkMode} 
          setIsDarkMode={setIsDarkMode}
          showToast={showToast}
        />
      )}

      {/* TOAST NOTIFICATIONS */}
      <div className="fixed bottom-6 right-6 z-[300] flex flex-col gap-3 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className="bg-[var(--bg-surface)] border border-[var(--border-main)] shadow-2xl p-4 rounded-2xl flex items-center gap-4 animate-in slide-in-from-right-8 fade-in duration-300 w-80 pointer-events-auto relative overflow-hidden">
             <div className={`absolute left-0 top-0 bottom-0 w-1 ${toast.type === 'success' ? 'bg-[var(--success)]' : 'bg-[var(--primary)]'}`}></div>
             {toast.type === 'success' ? <CheckCircle2 size={20} className="text-[var(--success)] shrink-0" /> : <Info size={20} className="text-[var(--primary)] shrink-0" />}
             <span className="text-sm font-bold text-[var(--text-main)]">{toast.message}</span>
          </div>
        ))}
      </div>

      <header className="h-20 shrink-0 flex items-center justify-between px-4 md:px-8 border-b backdrop-blur-md z-50 border-[var(--border-main)] bg-[var(--bg-surface)] transition-all duration-500 shadow-sm">
        <div onClick={() => handleTabClick('send')} className="flex items-center gap-2 text-[var(--primary)] hover:scale-105 transition-transform duration-300 cursor-pointer shrink-0 mr-6">
          <Zap size={28} className="fill-current" />
          <span className="text-xl font-bold tracking-tight text-[var(--text-main)] hidden sm:block">Zepglide</span>
        </div>

        <nav className="hidden lg:flex flex-1 items-center justify-center gap-2">
          <HeaderNavItem icon={<UploadCloud size={18} />} label="Send" active={activeTab === 'send'} onClick={() => handleTabClick('send')} />
          <HeaderNavItem icon={<Download size={18} />} label="Receive" active={activeTab === 'receive'} onClick={() => handleTabClick('receive')} />
          {isAuthenticated && (
            <>
              <HeaderNavItem icon={<Laptop2 size={18} />} label="Devices" active={activeTab === 'devices'} onClick={() => handleTabClick('devices')} />
              <HeaderNavItem icon={<History size={18} />} label="History" active={activeTab === 'history'} onClick={() => handleTabClick('history')} />
            </>
          )}
          <HeaderNavItem icon={<CreditCard size={18} />} label="Pricing" active={activeTab === 'pricing'} onClick={() => handleTabClick('pricing')} />
        </nav>
        
        <div className="flex items-center gap-4 shrink-0">
          
          <button onClick={() => setIsCmdMenuOpen(true)} className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-main)] border border-[var(--border-main)] hover:border-[var(--primary-30)] text-[var(--text-muted)] rounded-xl text-xs font-bold transition-all">
             <Command size={14}/> <span className="opacity-70">Cmd + K</span>
          </button>

          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2.5 rounded-full transition-all duration-300 text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--bg-main)] active:scale-90">
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {isAuthenticated ? (
            <div className="relative">
              <button onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)} className={`flex items-center gap-2 px-2 py-1.5 rounded-full border-2 transition-all duration-300 focus:ring-2 focus:ring-[var(--primary)] outline-none bg-[var(--bg-main)] hover:border-[var(--primary)] active:scale-95 ${isProfileDropdownOpen ? 'border-[var(--primary)]' : 'border-[var(--border-main)]'}`}>
                <div className="h-7 w-7 rounded-full bg-[var(--primary)] text-[var(--primary-content)] flex items-center justify-center text-xs font-bold shadow-sm">NH</div>
                <ChevronDown size={14} className={`text-[var(--text-muted)] mr-1 transition-transform duration-300 ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isProfileDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileDropdownOpen(false)}></div>
                  <div className="absolute right-0 mt-3 w-64 bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl shadow-xl z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 zoom-in-95 duration-200 origin-top-right">
                    <div className="px-4 py-4 border-b border-[var(--border-main)] bg-[var(--bg-main)]/30">
                       <p className="text-sm font-bold text-[var(--text-main)] truncate">{profile.name}</p>
                       <p className="text-xs text-[var(--text-muted)] truncate mt-0.5 font-medium flex items-center gap-1"><Crown size={12} className="text-[var(--warning)]" /> {profile.plan} Member</p>
                    </div>
                    <div className="py-1">
                      <DropdownItem icon={<User size={16} />} label="My Profile" onClick={() => { handleTabClick('profile'); setIsProfileDropdownOpen(false); }} />
                      <DropdownItem icon={<Settings size={16} />} label="Settings" onClick={() => { handleTabClick('settings'); setIsProfileDropdownOpen(false); }} />
                      {isAdmin && <DropdownItem icon={<ShieldAlert size={16} />} label="Admin Dashboard" color="text-[var(--warning)]" onClick={() => { handleTabClick('admin'); setIsProfileDropdownOpen(false); }} />}
                    </div>
                    <div className="border-t border-[var(--border-main)] py-1">
                      <DropdownItem icon={<LogOut size={16} />} label="Sign Out" color="text-[var(--danger)]" onClick={() => { onLogout(); setIsProfileDropdownOpen(false); setActiveTab('send'); }} />
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button onClick={onLoginClick} className="flex items-center gap-2 bg-[var(--primary)] text-[var(--primary-content)] px-6 py-2.5 rounded-full font-bold text-sm hover:brightness-110 active:scale-95 transition-all duration-300 shadow-lg">
              <UserCircle size={18} /><span>Sign In</span>
            </button>
          )}

          <button className="lg:hidden p-2 rounded-xl bg-[var(--bg-main)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all active:scale-90 ml-1" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {isMobileMenuOpen && (
        <>
          <div className="lg:hidden fixed inset-0 top-20 bg-[var(--bg-main)]/90 backdrop-blur-lg z-40 animate-in fade-in duration-300" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="lg:hidden absolute top-20 left-0 w-full bg-[var(--bg-surface)] border-b border-[var(--border-main)] shadow-2xl z-50 p-6 flex flex-col gap-3 animate-in slide-in-from-top-4 duration-300 ease-out">
            <HeaderNavItem icon={<UploadCloud size={20} />} label="Send Files" active={activeTab === 'send'} onClick={() => handleTabClick('send')} />
            <HeaderNavItem icon={<Download size={20} />} label="Receive" active={activeTab === 'receive'} onClick={() => handleTabClick('receive')} />
            {isAuthenticated && (
              <>
                <HeaderNavItem icon={<Laptop2 size={20} />} label="Trusted Devices" active={activeTab === 'devices'} onClick={() => handleTabClick('devices')} />
                <HeaderNavItem icon={<History size={20} />} label="History" active={activeTab === 'history'} onClick={() => handleTabClick('history')} />
              </>
            )}
            <HeaderNavItem icon={<CreditCard size={20} />} label="Pricing" active={activeTab === 'pricing'} onClick={() => handleTabClick('pricing')} />
          </div>
        </>
      )}

      <main className="flex-1 overflow-y-auto w-full relative z-0">
        <div className="max-w-[1440px] mx-auto p-4 md:p-8 flex justify-center">
          <div key={activeTab} className="w-full animate-in fade-in slide-in-from-bottom-8 duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] fill-mode-both">
            {activeTab === 'send' && <SendView profile={profile} isAuthenticated={isAuthenticated} showToast={showToast} globalDroppedFile={globalDroppedFile} setGlobalDroppedFile={setGlobalDroppedFile} />}
            {activeTab === 'receive' && <ReceiveView />}
            {activeTab === 'devices' && <DevicesView />}
            {activeTab === 'history' && <HistoryView />}
            {activeTab === 'profile' && <ProfileView onLogout={() => { onLogout(); setActiveTab('send'); }} profile={profile} isAdmin={isAdmin} onEditClick={() => handleTabClick('settings')} showToast={showToast} />}
            {activeTab === 'pricing' && <PricingView />}
            {activeTab === 'admin' && isAdmin && <AdminDashboardView showToast={showToast}/>}
            {activeTab === 'settings' && <SettingsView isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} activeTheme={activeTheme} setActiveTheme={setActiveTheme} themes={themes} profile={profile} setProfile={setProfile} preferences={preferences} setPreferences={setPreferences} showToast={showToast} />}
          </div>
        </div>
      </main>
    </div>
  );
});

// --- COMMAND MENU (Cmd+K) ---
function CommandMenu({ onClose, handleTabClick, isDarkMode, setIsDarkMode, showToast }) {
  const [search, setSearch] = useState('');
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const actions = [
    { id: 'send', title: 'Send Files', icon: <UploadCloud size={16}/>, action: () => handleTabClick('send') },
    { id: 'receive', title: 'Receive Files', icon: <Download size={16}/>, action: () => handleTabClick('receive') },
    { id: 'profile', title: 'My Profile', icon: <User size={16}/>, action: () => handleTabClick('profile') },
    { id: 'admin', title: 'Admin Command Center', icon: <Terminal size={16}/>, action: () => handleTabClick('admin'), badge: 'Root' },
    { id: 'theme', title: `Toggle ${isDarkMode ? 'Light' : 'Dark'} Mode`, icon: isDarkMode ? <Sun size={16}/> : <Moon size={16}/>, action: () => { setIsDarkMode(!isDarkMode); onClose(); } },
    { id: 'pwa', title: 'Install Zepglide (PWA)', icon: <MonitorDown size={16}/>, action: () => { showToast("Installing Progressive Web App...", "primary"); onClose(); } },
  ];

  const filtered = actions.filter(a => a.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[250] flex items-start pt-32 justify-center px-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      <div className="w-full max-w-2xl bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] relative z-10 overflow-hidden flex flex-col animate-in slide-in-from-top-8 zoom-in-95 duration-200">
         <div className="flex items-center px-4 py-4 border-b border-[var(--border-main)]">
            <Search size={20} className="text-[var(--text-muted)] mr-3" />
            <input 
              ref={inputRef}
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Type a command or search..." 
              className="flex-1 bg-transparent text-lg font-bold text-[var(--text-main)] focus:outline-none placeholder-[var(--text-muted)]"
            />
            <span className="text-[10px] font-black uppercase text-[var(--text-muted)] bg-[var(--bg-main)] px-2 py-1 rounded border border-[var(--border-main)]">ESC</span>
         </div>
         <div className="max-h-[60vh] overflow-y-auto p-2">
            {filtered.map((action, i) => (
              <button 
                key={action.id} 
                onClick={action.action}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-[var(--primary-10)] text-[var(--text-main)] hover:text-[var(--primary)] transition-colors group text-left"
              >
                <div className="flex items-center gap-3">
                   <div className="text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors">{action.icon}</div>
                   <span className="font-bold text-sm">{action.title}</span>
                </div>
                {action.badge && <span className="text-[9px] uppercase tracking-widest font-black bg-[var(--danger-10)] text-[var(--danger)] px-2 py-1 rounded border border-[var(--danger-20)]">{action.badge}</span>}
              </button>
            ))}
            {filtered.length === 0 && <div className="p-8 text-center text-[var(--text-muted)] font-bold text-sm">No commands found.</div>}
         </div>
      </div>
    </div>
  );
}

// --- CORE UI COMPONENTS ---
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

// --- SEND VIEW WITH FILE PREVIEWS & NATIVE ADS ---
function SendView({ profile, isAuthenticated, showToast, globalDroppedFile, setGlobalDroppedFile }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [transferState, setTransferState] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [routingState, setRoutingState] = useState('evaluating');

  // Handle Global Drop
  useEffect(() => {
    if (globalDroppedFile) {
      const size = (globalDroppedFile.size / (1024 * 1024)).toFixed(2) + " MB";
      const isVideo = globalDroppedFile.type.startsWith('video/');
      handleFile(globalDroppedFile.name, size, isVideo, globalDroppedFile);
      setGlobalDroppedFile(null); // Reset
    }
  }, [globalDroppedFile, setGlobalDroppedFile]);

  const handleFile = (fileName, fileSize, isVideo = false, fileObj = null) => {
    let previewUrl = null;
    if (fileObj && (fileObj.type.startsWith('image/') || fileObj.type.startsWith('video/'))) {
      previewUrl = URL.createObjectURL(fileObj);
    }

    setSelectedFile({ name: fileName, size: fileSize, isVideo, previewUrl });
    setTransferState('idle');
    setProgress(0);
    setRoutingState('evaluating');
    
    setTimeout(() => { setRoutingState('quic'); }, 1500);
  };

  const simulateTransfer = () => {
    setTransferState('transferring');
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.random() * 15;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        setTransferState('success');
        showToast("Transfer Complete! File encrypted and synced.", "success");
      }
      setProgress(currentProgress);
    }, 300);
  };

  // Cleanup object URLs to prevent memory leaks
  useEffect(() => {
    return () => { if (selectedFile?.previewUrl) URL.revokeObjectURL(selectedFile.previewUrl); };
  }, [selectedFile]);

  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto mt-4 md:mt-8">
      {!selectedFile ? (
        <div 
          className={`relative border-2 border-dashed rounded-[2.5rem] p-8 md:p-16 text-center transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] flex flex-col items-center justify-center min-h-[400px] md:min-h-[500px] shadow-sm ${
            dragActive 
              ? 'border-[var(--primary)] bg-[var(--primary-10)] scale-[1.03] shadow-[0_20px_50px_var(--primary-20)]' 
              : 'border-[var(--border-main)] bg-[var(--bg-surface)] hover:border-[var(--primary-50)] hover:bg-[var(--bg-main)] hover:-translate-y-1.5'
          }`}
          onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDrop={(e) => { 
            e.preventDefault(); setDragActive(false); 
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              const file = e.dataTransfer.files[0];
              handleFile(file.name, (file.size / (1024*1024)).toFixed(2) + " MB", file.type.startsWith('video/'), file);
            }
          }}
        >
          <div className={`h-24 w-24 rounded-[2rem] flex items-center justify-center mb-8 shrink-0 transition-all duration-500 shadow-sm ${dragActive ? 'bg-[var(--primary)] text-[var(--primary-content)] scale-110 shadow-xl' : 'bg-[var(--primary-10)] text-[var(--primary)]'}`}>
            <UploadCloud size={48} className={dragActive ? 'animate-bounce' : ''} />
          </div>
          <h3 className="text-2xl md:text-3xl font-black text-[var(--text-main)] mb-3 tracking-tighter uppercase">Drop Files</h3>
          <p className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-10">P2P Encryption Active</p>
          <div className="flex flex-wrap justify-center gap-4">
            <button className="bg-[var(--text-main)] text-[var(--bg-main)] hover:scale-105 active:scale-95 px-8 py-4 rounded-2xl font-black text-xs tracking-widest uppercase transition-all duration-300 shadow-xl" onClick={() => handleFile("Handshake_Assets.zip", "1.2 GB", false)}>Select Mock File</button>
            <button className="bg-[var(--primary-10)] text-[var(--primary)] border border-[var(--primary-30)] hover:scale-105 active:scale-95 px-8 py-4 rounded-2xl font-black text-xs tracking-widest uppercase transition-all duration-300 shadow-sm flex items-center gap-2" onClick={() => handleFile("Master_Cut_v2.mp4", "15.8 GB", true)}><Video size={16}/> Media Mock</button>
          </div>
        </div>
      ) : (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[3rem] p-8 md:p-12 shadow-2xl transition-all animate-in zoom-in-95 duration-500">
          
          <div className="flex justify-between items-start mb-8 gap-4">
            <div className="flex items-center gap-6 overflow-hidden">
              <div className={`h-16 w-16 rounded-[1.5rem] flex items-center justify-center shrink-0 border shadow-inner relative overflow-hidden ${selectedFile.isVideo ? 'bg-[var(--accent-10)] text-[var(--accent)] border-[var(--accent-20)]' : 'bg-[var(--primary-10)] text-[var(--primary)] border-[var(--primary-20)]'}`}>
                {/* REAL THUMBNAIL PREVIEW */}
                {selectedFile.previewUrl && (
                   <img src={selectedFile.previewUrl} alt="preview" className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay blur-[2px] hover:blur-none hover:opacity-100 transition-all duration-300" />
                )}
                <div className="relative z-10">{selectedFile.isVideo ? <Video size={32} /> : <File size={32} />}</div>
              </div>
              <div className="overflow-hidden">
                <h3 className="text-xl md:text-2xl font-black text-[var(--text-main)] truncate tracking-tighter">{selectedFile.name}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-xs font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">{selectedFile.size}</p>
                  {selectedFile.isVideo && <span className="text-[9px] font-black uppercase tracking-widest text-[var(--accent)] bg-[var(--accent-10)] px-2 py-0.5 rounded border border-[var(--accent-20)] flex items-center gap-1"><PlayCircle size={10}/> Streamable</span>}
                </div>
              </div>
            </div>
            {transferState === 'idle' && (
              <button onClick={() => setSelectedFile(null)} className="p-3 text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger-10)] rounded-full transition-all duration-300 active:scale-90"><X size={24} /></button>
            )}
          </div>

          {/* HYBRID ROUTING STATUS BAR */}
          <div className="bg-[var(--bg-main)] rounded-2xl p-4 mb-8 border border-[var(--border-main)] flex flex-col gap-3">
             <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                <span>Routing Engine Evaluation</span>
                {routingState === 'evaluating' && <span className="flex items-center gap-2"><RefreshCw size={12} className="animate-spin text-[var(--primary)]"/> Probing Paths</span>}
                {routingState === 'quic' && <span className="text-[var(--success)] flex items-center gap-1.5"><ShieldCheck size={14}/> QUIC Path Locked</span>}
             </div>
             
             {routingState === 'quic' && (
               <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                 <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--bg-surface)] bg-[var(--text-main)] px-2 py-1 rounded flex items-center gap-1"><Network size={12}/> WebTransport Active</span>
                 <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--primary)] bg-[var(--primary-10)] border border-[var(--primary-30)] px-2 py-1 rounded flex items-center gap-1"><Cpu size={12}/> WebGPU Compression: ON</span>
                 <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--accent)] bg-[var(--accent-10)] border border-[var(--accent-30)] px-2 py-1 rounded flex items-center gap-1"><Wifi size={12}/> Multi-Path Aggregation</span>
               </div>
             )}
          </div>

          {transferState === 'idle' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DeviceCard icon={<Laptop size={32} />} name="Studio Mac" owner="Nihal" active />
                  <DeviceCard icon={<Smartphone size={32} />} name="Pixel Phone" owner="Nihal" />
              </div>
              <button disabled={routingState === 'evaluating'} onClick={simulateTransfer} className="w-full bg-[var(--primary)] text-[var(--primary-content)] hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:active:scale-100 font-black py-5 rounded-2xl transition-all duration-300 shadow-2xl flex items-center justify-center gap-3 uppercase tracking-widest text-xs">
                {routingState === 'evaluating' ? <RefreshCw size={20} className="animate-spin"/> : <Zap size={20} className="fill-current shrink-0" />}
                {routingState === 'evaluating' ? 'Negotiating Keys...' : 'Initialize Hyper-Sync'}
              </button>
            </div>
          )}

          {transferState === 'transferring' && (
            <div className="space-y-6 py-4 animate-in fade-in duration-500">
              <div className="flex justify-between text-xs mb-2 font-black uppercase tracking-widest text-[var(--primary)]">
                <span className="flex items-center gap-2"><Shield size={14} /> E2EE Kyber-768</span>
                <span className="font-mono text-[var(--success)] text-sm">1.2 GB/s</span>
              </div>
              <div className="w-full bg-[var(--bg-hover)] rounded-full h-4 overflow-hidden relative border border-[var(--border-main)] shadow-inner">
                <div className="bg-gradient-to-r from-[var(--primary)] via-[var(--accent)] to-[var(--success)] h-full rounded-full transition-all duration-300 ease-out relative" style={{ width: `${progress}%` }}>
                  <div className="absolute top-0 right-0 w-4 h-full bg-white/50 blur-[2px]"></div>
                </div>
              </div>
              <div className="flex justify-between items-center mt-2">
                 <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Multi-Path Swarm Active</span>
                 <span className="text-xs font-black text-[var(--text-muted)] tracking-[0.25em]">{Math.round(progress)}% CHUNKED</span>
              </div>
            </div>
          )}

          {transferState === 'success' && (
            <div className="flex flex-col items-center justify-center py-6 animate-in zoom-in-90 duration-500 w-full">
              <div className="h-20 w-20 bg-[var(--success-10)] text-[var(--success)] rounded-full flex items-center justify-center mb-4 shrink-0 border border-[var(--success-20)] shadow-lg"><CheckCircle2 size={40} /></div>
              <h3 className="text-3xl font-black text-[var(--text-main)] tracking-tight mb-8">Sync Complete</h3>
              
              {/* NATIVE AD PLACEHOLDER (For Free Users) */}
              {(!isAuthenticated || (profile.plan !== 'Pro' && profile.plan !== 'Teams')) && (
                <div className="w-full max-w-md bg-[var(--bg-main)] border border-[var(--border-main)] hover:border-[var(--primary-30)] p-4 rounded-2xl flex items-center gap-4 transition-all cursor-pointer group mb-8 relative overflow-hidden shadow-sm">
                   <div className="absolute top-0 right-0 bg-[var(--bg-surface)] text-[var(--text-muted)] text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-bl-lg border-b border-l border-[var(--border-main)] z-10">Sponsored</div>
                   <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-gray-800 to-black flex items-center justify-center shrink-0 shadow-inner border border-gray-700">
                     <span className="text-white font-black text-xl">V</span>
                   </div>
                   <div className="flex flex-col items-start text-left flex-1">
                      <span className="text-sm font-bold text-[var(--text-main)] group-hover:text-[var(--primary)] transition-colors">Vercel: Ship. Iterate.</span>
                      <span className="text-xs font-medium text-[var(--text-muted)] mt-0.5">Deploy Next.js apps instantly.</span>
                   </div>
                </div>
              )}

              <div className="flex flex-wrap gap-4 w-full justify-center">
                 <button onClick={() => setSelectedFile(null)} className="text-[var(--text-main)] bg-[var(--bg-main)] border border-[var(--border-main)] hover:bg-[var(--bg-hover)] px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 shadow-sm active:scale-95">Send Another</button>
                 {isAuthenticated && <button className="bg-[var(--primary)] text-[var(--primary-content)] hover:brightness-110 px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 shadow-lg shadow-[var(--primary-20)] active:scale-95 flex items-center gap-2"><History size={16}/> View Log</button>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- RECEIVE VIEW WITH DYNAMIC WAITING RADAR ---
function ReceiveView() {
  const [pin, setPin] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // Rotating Security Facts
  const facts = ["E2EE Kyber-768 Negotiating...", "Bypassing Symmetric NAT...", "Establishing Quantum-Safe Keys...", "Securing P2P WebTransport..."];
  const [factIndex, setFactIndex] = useState(0);

  useEffect(() => {
     if (!isSearching) return;
     const interval = setInterval(() => setFactIndex(i => (i + 1) % facts.length), 2500);
     return () => clearInterval(interval);
  }, [isSearching]);

  const handleJoin = () => {
    setIsSearching(true);
    // Simulate finding a node after some time
    setTimeout(() => { setIsSearching(false); setPin(''); }, 8000); 
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto mt-8 md:mt-24 animate-in fade-in zoom-in duration-300">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] p-8 md:p-12 rounded-[2.5rem] shadow-2xl w-full text-center relative overflow-hidden">
        
        {isSearching ? (
           <div className="flex flex-col items-center py-6 animate-in fade-in duration-500">
              {/* RADAR ANIMATION */}
              <div className="relative w-32 h-32 flex items-center justify-center mb-8">
                 <div className="absolute inset-0 border-2 border-[var(--primary-30)] rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                 <div className="absolute inset-4 border-2 border-[var(--primary-50)] rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] animation-delay-500"></div>
                 <div className="absolute inset-8 bg-[var(--primary-10)] rounded-full"></div>
                 <Radar size={40} className="text-[var(--primary)] relative z-10" />
              </div>
              <h2 className="text-2xl font-black text-[var(--text-main)] mb-3 tracking-tighter uppercase animate-pulse">Scanning Swarm</h2>
              
              {/* ROTATING FACT */}
              <div className="h-6 overflow-hidden">
                 <p key={factIndex} className="text-[10px] font-black text-[var(--primary)] uppercase tracking-widest bg-[var(--primary-10)] px-4 py-1.5 rounded-full border border-[var(--primary-20)] animate-in slide-in-from-bottom-4 fade-in duration-300">
                   {facts[factIndex]}
                 </p>
              </div>
              <button onClick={() => setIsSearching(false)} className="mt-10 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest hover:text-[var(--danger)] transition-colors border border-[var(--border-main)] px-4 py-2 rounded-xl bg-[var(--bg-main)]">Cancel Scan</button>
           </div>
        ) : (
           <div className="animate-in fade-in duration-500">
              <div className="h-20 w-20 bg-[var(--primary-10)] text-[var(--primary)] rounded-[1.5rem] flex items-center justify-center mx-auto mb-8 shrink-0 shadow-inner border border-[var(--primary-10)]">
                <Download size={36} />
              </div>
              <h2 className="text-2xl font-black text-[var(--text-main)] mb-3 tracking-tighter uppercase">Enter Node PIN</h2>
              <p className="text-[var(--text-muted)] text-sm mb-10 font-bold tracking-tight">Identify the incoming handshake.</p>
              <div className="flex justify-center gap-2 mb-12">
                {[...Array(6)].map((_, i) => (
                  <input 
                    key={i} type="text" maxLength="1" 
                    className="w-10 h-14 md:w-12 md:h-16 bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl text-center text-2xl font-black text-[var(--text-main)] focus:border-[var(--primary)] outline-none transition-all duration-300 shadow-sm focus:ring-2 focus:ring-[var(--primary-20)]" 
                    placeholder="-" 
                    value={pin[i] || ''}
                    onChange={(e) => {
                       const newPin = pin.split('');
                       newPin[i] = e.target.value;
                       setPin(newPin.join(''));
                    }}
                  />
                ))}
              </div>
              <button onClick={handleJoin} className="w-full bg-[var(--text-main)] text-[var(--bg-main)] hover:scale-[1.02] active:scale-95 font-black py-4 rounded-2xl transition-all duration-300 uppercase tracking-widest text-xs shadow-xl">Join Sync</button>
           </div>
        )}
      </div>
    </div>
  );
}

function DevicesView() {
  return (
    <div className="w-full max-w-4xl mx-auto py-4">
      <header className="mb-10 text-center md:text-left">
        <h2 className="text-3xl font-black text-[var(--text-main)] tracking-tighter uppercase">Authorized Nodes</h2>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="group bg-[var(--primary-10)] border border-[var(--primary-30)] rounded-[2rem] p-8 relative shadow-sm hover:shadow-xl transition-all duration-500">
          <div className="absolute top-6 right-6 flex items-center gap-1 bg-[var(--bg-surface)] text-[var(--primary)] px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Linked</div>
          <Laptop size={40} className="text-[var(--primary)] mb-6 group-hover:scale-110 transition-transform" />
          <h3 className="text-xl font-black text-[var(--text-main)] tracking-tight">Studio Mac</h3>
          <p className="text-sm text-[var(--text-muted)] font-medium">Node ID: zep_881_mDNS</p>
        </div>
        <div className="group bg-[var(--bg-surface)] border border-[var(--border-main)] hover:border-[var(--primary-30)] rounded-[2rem] p-8 shadow-sm hover:shadow-xl transition-all duration-500">
          <Smartphone size={40} className="text-[var(--text-muted)] opacity-30 mb-6 group-hover:text-[var(--primary)] group-hover:opacity-100 transition-all" />
          <h3 className="text-xl font-black text-[var(--text-main)] tracking-tight">Pixel Phone</h3>
          <p className="text-sm text-[var(--text-muted)] font-medium">Offline Handshake</p>
        </div>
      </div>
      <button className="mt-10 border-2 border-dashed border-[var(--border-main)] text-[var(--text-muted)] hover:border-[var(--primary)] hover:text-[var(--primary)] bg-[var(--bg-surface)] hover:bg-[var(--primary-10)] w-full rounded-[2rem] p-10 font-black uppercase transition-all duration-500 flex items-center justify-center gap-3 active:scale-95 shadow-sm tracking-widest text-xs">Pair New Node</button>
    </div>
  );
}

function HistoryView() {
  const mockHistory = useMemo(() => [
    { id: 1, name: 'Project_Assets.zip', size: '2.4 GB', to: 'Studio Mac', status: 'Mirrored' },
    { id: 2, name: 'Brief_Final.mov', size: '12.8 GB', to: 'Cloud Relay', status: 'Available' },
    { id: 3, name: 'Pack_v2.rar', size: '142 MB', to: 'Pixel Pro', status: 'Complete' },
  ], []);

  return (
    <div className="w-full max-w-5xl mx-auto py-4">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[2.5rem] overflow-hidden shadow-2xl transition-all duration-700">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-[var(--bg-main)] border-b border-[var(--border-main)] text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]"><th className="p-6 pl-8">Identity</th><th className="p-6">Size</th><th className="p-6">Recipient</th><th className="p-6 pr-8 text-right">State</th></tr>
            </thead>
            <tbody className="text-sm font-medium">
              {mockHistory.map((item, idx) => (
                <tr key={item.id} className="group border-b border-[var(--border-main)] hover:bg-[var(--bg-hover)] transition-colors duration-300 cursor-pointer animate-in fade-in fill-mode-both" style={{ animationDelay: `${idx * 100}ms` }}>
                  <td className="p-6 pl-8 flex items-center gap-4">
                    <div className="h-10 w-10 bg-[var(--bg-main)] rounded-2xl flex items-center justify-center text-[var(--primary)] border border-[var(--border-main)] shadow-sm"><File size={20} /></div>
                    <span className="font-bold text-[var(--text-main)] text-base truncate">{item.name}</span>
                  </td>
                  <td className="p-6 text-[var(--text-muted)] font-bold">{item.size}</td>
                  <td className="p-6 text-[var(--text-muted)]">{item.to}</td>
                  <td className="p-6 pr-8 text-right font-black text-[var(--text-main)] group-hover:text-[var(--primary)] transition-colors">{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ProfileView({ onLogout, profile, isAdmin, onEditClick, showToast }) {
  const [copiedField, setCopiedField] = useState(null);

  const handleCopy = (text, field) => {
    try { navigator.clipboard.writeText(text); } 
    catch (e) {
      const el = document.createElement('textarea'); el.value = text;
      document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el);
    }
    setCopiedField(field);
    showToast(`Copied ${field} to clipboard!`, 'success');
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto mt-2 pb-12 animate-in fade-in duration-500">
      
      <div className="bg-[var(--bg-surface)] border-2 border-[var(--border-main)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-[3rem] p-8 md:p-12 shadow-2xl relative overflow-hidden transition-all duration-500">
        <div className="flex flex-col md:flex-row gap-10 w-full relative z-10">
          <div className="flex-1 flex flex-col gap-8 w-full">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
               <div className="relative shrink-0 flex justify-center md:block group/avatar">
                  <div className="h-32 w-32 md:h-36 md:w-36 rounded-[2.5rem] bg-[var(--bg-main)] flex items-center justify-center shadow-xl border-4 border-[var(--bg-surface)] z-10 relative transition-transform rotate-3 group-hover/avatar:rotate-6">
                    <span className="text-5xl font-black text-[var(--text-main)] drop-shadow-md">NH</span>
                  </div>
                  <div className="absolute -bottom-2 -right-2 h-8 w-8 bg-[var(--primary)] rounded-full border-4 border-[var(--bg-surface)] z-20 shadow-lg"></div>
               </div>

               <div className="flex flex-col gap-4 text-center md:text-left w-full">
                 <div className="flex items-center justify-center md:justify-start gap-2 mb-1 w-full">
                   <h2 className="text-3xl md:text-4xl font-black text-[var(--text-main)] uppercase tracking-tighter">{profile.name}</h2>
                   <BadgeCheck size={24} className="text-[var(--primary)] shrink-0" />
                 </div>
                 
                 <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                   {isAdmin && (
                     <div className="flex items-center gap-1.5 px-3 py-1 bg-[var(--danger-10)] border border-[var(--danger-20)] text-[var(--danger)] rounded-full shadow-sm">
                       <ShieldAlert size={14} />
                       <span className="text-[10px] font-black uppercase tracking-widest">Admin Node</span>
                     </div>
                   )}
                 </div>

                 <p className="text-sm font-medium text-[var(--text-muted)] italic max-w-[300px] leading-snug">"{profile.bio}"</p>

                 <div className="flex flex-col gap-2 mt-2 text-sm font-bold text-[var(--text-muted)] items-center md:items-start w-full">
                    <div className="flex items-center gap-3 group p-2 -ml-2 rounded-xl hover:bg-[var(--bg-main)] transition-all cursor-pointer border border-transparent hover:border-[var(--border-main)]" onClick={() => handleCopy(profile.email, 'email')}>
                       <div className="p-2 rounded-lg bg-[var(--primary-10)] text-[var(--primary)] group-hover:scale-110 transition-transform"><Mail size={16} /></div>
                       <span className="group-hover:text-[var(--text-main)] transition-colors">{profile.email}</span>
                       {copiedField === 'email' ? <CheckCircle2 size={14} className="text-[var(--success)] animate-in zoom-in duration-300" /> : <Copy size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--primary)]" />}
                    </div>

                    <div className="flex items-center gap-3 group p-2 -ml-2 rounded-xl hover:bg-[var(--bg-main)] transition-all border border-transparent hover:border-[var(--border-main)]">
                       <div className="p-2 rounded-lg bg-[var(--success-10)] text-[var(--success)] group-hover:scale-110 transition-transform"><MapPin size={16} /></div>
                       <span className="group-hover:text-[var(--text-main)] transition-colors">{profile.location}</span>
                       <span className="text-[10px] uppercase text-[var(--success)] ml-1 border border-[var(--success-20)] px-2 py-0.5 rounded-full bg-[var(--success-10)] shadow-sm">{profile.countryCode}</span>
                    </div>

                    <div className="flex items-center gap-3 group p-2 -ml-2 rounded-xl hover:bg-[var(--bg-main)] transition-all cursor-pointer border border-transparent hover:border-[var(--border-main)]" onClick={() => window.open(`https://${profile.website}`, '_blank')}>
                       <div className="p-2 rounded-lg bg-[var(--accent-10)] text-[var(--accent)] group-hover:scale-110 transition-transform"><Globe size={16} /></div>
                       <span className="group-hover:text-[var(--text-main)] transition-colors">{profile.website}</span>
                       <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--accent)]" />
                    </div>

                    <div className="flex items-center gap-3 group p-2 -ml-2 rounded-xl hover:bg-[var(--bg-main)] transition-all w-full max-w-[280px] border border-transparent hover:border-[var(--border-main)]">
                       <div className="p-2 rounded-lg bg-[var(--primary-10)] text-[var(--primary)] group-hover:scale-110 transition-transform shrink-0"><HardDrive size={16} /></div>
                       <div className="flex flex-col flex-1 gap-1.5 w-full">
                          <div className="flex justify-between items-center text-xs">
                             <span className="group-hover:text-[var(--text-main)] transition-colors">14.2 / 50 GB</span>
                             <span className="text-[8px] border border-[var(--primary-20)] bg-[var(--primary-10)] text-[var(--primary)] px-1.5 py-0.5 rounded uppercase font-black tracking-widest">PRO</span>
                          </div>
                          <div className="w-full h-1.5 bg-[var(--bg-surface)] rounded-full overflow-hidden border border-[var(--border-main)] shadow-inner">
                             <div className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] rounded-full w-[28.4%] group-hover:w-[30%] transition-all duration-700 relative">
                               <div className="absolute top-0 right-0 w-2 h-full bg-white/50 blur-[1px]"></div>
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="flex items-center gap-3 group p-2 -ml-2 rounded-xl hover:bg-[var(--bg-main)] transition-all border border-transparent hover:border-[var(--border-main)]">
                       <div className="p-2 rounded-lg bg-[var(--warning-10)] text-[var(--warning)] group-hover:scale-110 transition-transform"><Shield size={16} /></div>
                       <span className="group-hover:text-[var(--text-main)] transition-colors">Role: <span className="text-[var(--text-main)]">{profile.role}</span></span>
                       <span className="text-[9px] bg-[var(--warning)] text-[var(--bg-surface)] px-2 py-0.5 rounded-full font-black uppercase shadow-md shadow-[var(--warning-30)] tracking-widest group-hover:-translate-y-0.5 transition-transform ml-1">Lvl 42</span>
                    </div>

                    <div className="flex items-center gap-3 group p-2 -ml-2 rounded-xl hover:bg-[var(--bg-main)] transition-all cursor-help border border-transparent hover:border-[var(--border-main)]" title="Hardware key authenticated via WebAuthn">
                       <div className="p-2 rounded-lg bg-[var(--success-10)] text-[var(--success)] group-hover:scale-110 transition-transform relative overflow-hidden">
                         <div className="absolute inset-0 bg-white/30 translate-y-[150%] group-hover:-translate-y-[150%] transition-transform duration-700 ease-in-out"></div>
                         <Lock size={16} className="group-hover:animate-pulse" />
                       </div>
                       <span className="group-hover:text-[var(--text-main)] transition-colors">2FA Status: <span className="text-[var(--success)] group-hover:drop-shadow-[0_0_8px_var(--success-30)] transition-all">Hardware Key</span></span>
                    </div>

                 </div>
               </div>
            </div>

            <div className="flex flex-col gap-6 w-full mt-4">
               <div className="w-full bg-[var(--bg-main)] p-6 rounded-[1.5rem] border border-[var(--border-main)] shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex flex-wrap items-center justify-between mb-5 border-b border-[var(--border-main)] pb-4 gap-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--text-muted)]">Security & Network Metrics</span>
                    <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-[var(--success)] bg-[var(--success-10)] px-3 py-1.5 rounded-lg border border-[var(--success-20)] shadow-sm">
                      <ShieldCheck size={12} /> E2EE Secured Session
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8 text-xs font-bold text-[var(--text-muted)]">
                     <div className="flex flex-col gap-2">
                        <span className="uppercase tracking-widest text-[9px] opacity-70 flex items-center gap-1.5"><Key size={12} className="text-[var(--accent)]"/> Public Key Hash</span>
                        <span className="font-mono text-[var(--text-main)] flex items-center gap-2 group/copy cursor-pointer hover:text-[var(--primary)] transition-colors w-fit" onClick={() => handleCopy('0x8A4f...9B2c', 'pubkey')}>
                          0x8A4f...9B2c {copiedField === 'pubkey' ? <CheckCircle2 size={12} className="text-[var(--success)]" /> : <Copy size={12} className="opacity-0 group-hover/copy:opacity-100 transition-opacity" />}
                        </span>
                     </div>
                     <div className="flex flex-col gap-2">
                        <span className="uppercase tracking-widest text-[9px] opacity-70 flex items-center gap-1.5"><Globe2 size={12} className="text-[var(--primary)]"/> Routing Zone</span>
                        <span className="text-[var(--text-main)]">Asia-South1 (Optimized)</span>
                     </div>
                     <div className="flex flex-col gap-2">
                        <span className="uppercase tracking-widest text-[9px] opacity-70 flex items-center gap-1.5"><MonitorSmartphone size={12} className="text-[var(--warning)]"/> Last Access IP</span>
                        <span className="font-mono text-[var(--text-main)] flex items-center gap-2">
                          103.45.12.88 <span className="text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)] bg-[var(--bg-surface)] px-1.5 py-0.5 rounded border border-[var(--border-main)]">2m ago</span>
                        </span>
                     </div>
                     <div className="flex flex-col gap-2">
                        <span className="uppercase tracking-widest text-[9px] opacity-70 flex items-center gap-1.5"><Database size={12} className="text-[var(--success)]"/> Home Cluster</span>
                        <span className="text-[var(--text-main)]">AWS-SIN-04</span>
                     </div>
                  </div>
               </div>

               <div className="pt-6 border-t border-[var(--border-main)] flex flex-wrap items-center justify-center md:justify-start gap-4">
                  <button onClick={onEditClick} className="bg-[var(--bg-main)] text-[var(--text-main)] hover:bg-[var(--bg-hover)] active:scale-95 px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 border border-[var(--border-main)] shadow-sm flex items-center gap-2">
                    <Settings size={16} /> Edit in Settings
                  </button>
                  <button onClick={onLogout} className="text-[var(--danger)] hover:bg-[var(--danger-10)] border border-[var(--danger-20)] px-6 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 flex items-center gap-2 shadow-sm active:scale-95">
                    <LogOut size={16} /> Sign Out
                  </button>
               </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-8 lg:border-l lg:border-[var(--border-main)] lg:pl-10 w-full items-center lg:items-start text-center lg:text-left">
            <div className="flex flex-wrap gap-3 justify-center lg:justify-start w-full">
               <span className="px-4 py-2 bg-[var(--warning-10)] text-[var(--warning)] border border-[var(--warning-20)] text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm flex items-center gap-1.5"><Crown size={14} /> Pro Tier</span>
               <span className="px-4 py-2 bg-[var(--accent-10)] text-[var(--accent)] border border-[var(--accent-20)] text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm flex items-center gap-1.5"><Trophy size={14} /> Top 1% Node</span>
               <span className="px-4 py-2 bg-[var(--primary-10)] text-[var(--primary)] border border-[var(--primary-20)] text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm flex items-center gap-1.5"><Shield size={14} /> Authenticated</span>
            </div>

            <div className="flex flex-col gap-6 text-sm font-bold text-[var(--text-muted)] w-full mt-4">
               <div className="flex items-center gap-4 justify-center lg:justify-start">
                  <Fingerprint size={20} className="text-[var(--accent)] shrink-0"/>
                  <span>ID: <span className="text-[var(--text-main)] font-mono">glide_auth_901</span></span>
               </div>
               <div className="flex items-center gap-4 justify-center lg:justify-start">
                  <Calendar size={20} className="text-[var(--warning)] shrink-0"/>
                  <span>Joined Oct 2025</span>
               </div>
               <div className="flex items-center gap-4 justify-center lg:justify-start">
                  <Server size={20} className="text-[var(--accent)] shrink-0"/>
                  <span>3 Active Nodes Linked</span>
               </div>
               <div className="flex items-center gap-4 justify-center lg:justify-start">
                  <Activity size={20} className="text-[var(--warning)] shrink-0"/>
                  <span className="text-[var(--primary)] flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--primary)] animate-pulse shadow-[0_0_8px_var(--primary)]"></div> Online Now
                  </span>
               </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <ProfileStat icon={<Activity size={24} />} val="1,248" label="Total Handshakes" color="text-[var(--success)]" delay="100ms" />
        <ProfileStat icon={<ArrowUpRight size={24} />} val="84.2 GB" label="Mirrored" color="text-[var(--primary)]" delay="200ms" />
        <ProfileStat icon={<ArrowDownLeft size={24} />} val="12.5 GB" label="Received" color="text-[var(--accent)]" delay="300ms" />
        <ProfileStat icon={<Shield size={24} />} val="98.4%" label="Node Trust" color="text-[var(--success)]" delay="400ms" />
      </div>
    </div>
  );
}

const ProfileStat = ({ icon, val, label, color, delay }) => (
  <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[2rem] p-8 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 fill-mode-both" style={{ animationDelay: delay }}>
    <div className={`p-4 bg-[var(--bg-main)] rounded-2xl border border-[var(--border-main)] mb-6 w-fit ${color}`}>{icon}</div>
    <p className="text-3xl font-black text-[var(--text-main)] tracking-tighter">{val}</p>
    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--text-muted)] mt-2">{label}</p>
  </div>
);

function SettingsView({ isDarkMode, setIsDarkMode, activeTheme, setActiveTheme, themes, profile, setProfile, preferences, setPreferences, showToast }) {
  const handleProfileChange = (key, value) => setProfile(prev => ({ ...prev, [key]: value }));
  const handlePrefChange = (key, value) => setPreferences(prev => ({ ...prev, [key]: value }));

  return (
    <div className="w-full max-w-5xl mx-auto py-4 animate-in fade-in duration-500">
      <header className="mb-12"><h2 className="text-4xl font-black text-[var(--text-main)] tracking-tighter uppercase">Identity Settings</h2></header>
      
      <div className="flex flex-col gap-10">
        <div className="bg-[var(--bg-surface)] border-2 border-[var(--border-main)] rounded-[3rem] p-8 md:p-12 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-32 bg-[var(--primary-10)] rounded-full blur-[80px] pointer-events-none opacity-30 group-hover:opacity-50 transition-opacity"></div>
          <div className="relative z-10">
            <h3 className="text-2xl font-black text-[var(--text-main)] flex items-center gap-4 uppercase tracking-tighter mb-8"><User size={28} className="text-[var(--primary)]" /> Account Profile</h3>
            
            <div className="flex flex-col lg:flex-row gap-10">
               <div className="flex flex-col items-center gap-4">
                 <div className="h-36 w-36 rounded-[2.5rem] bg-[var(--bg-main)] flex items-center justify-center shadow-xl border-4 border-[var(--bg-surface)] cursor-pointer group/upload relative overflow-hidden transition-transform hover:scale-105">
                    <span className="text-5xl font-black text-[var(--text-main)] drop-shadow-md">NH</span>
                    <div className="absolute inset-0 bg-[var(--bg-main)]/90 backdrop-blur-sm flex flex-col items-center justify-center opacity-0 group-hover/upload:opacity-100 transition-opacity">
                       <UploadCloud size={28} className="text-[var(--primary)] mb-2" />
                       <span className="text-[10px] font-black uppercase text-[var(--primary)] tracking-widest">Update</span>
                    </div>
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                  <div className="flex flex-col gap-2 w-full">
                     <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest pl-1">Full Name</label>
                     <div className="flex items-center w-full bg-[var(--bg-main)] px-4 py-3 rounded-xl border border-[var(--border-main)] focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--primary-10)] transition-all">
                        <Edit3 size={16} className="text-[var(--primary)] mr-3 shrink-0"/>
                        <input value={profile.name} onChange={e => handleProfileChange('name', e.target.value)} className="bg-transparent w-full focus:outline-none text-[var(--text-main)] font-bold text-sm" />
                     </div>
                  </div>
                  <div className="flex flex-col gap-2 w-full">
                     <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest pl-1">Email Address</label>
                     <div className="flex items-center w-full bg-[var(--bg-main)] px-4 py-3 rounded-xl border border-[var(--border-main)] focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--primary-10)] transition-all">
                        <Mail size={16} className="text-[var(--primary)] mr-3 shrink-0"/>
                        <input value={profile.email} onChange={e => handleProfileChange('email', e.target.value)} className="bg-transparent w-full focus:outline-none text-[var(--text-main)] font-bold text-sm" />
                     </div>
                  </div>
                  <div className="flex flex-col gap-2 w-full md:col-span-2">
                     <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest pl-1">Short Bio</label>
                     <div className="flex items-center w-full bg-[var(--bg-main)] px-4 py-3 rounded-xl border border-[var(--border-main)] focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--primary-10)] transition-all">
                        <FileText size={16} className="text-[var(--primary)] mr-3 shrink-0"/>
                        <input value={profile.bio} onChange={e => handleProfileChange('bio', e.target.value)} className="bg-transparent w-full focus:outline-none text-[var(--text-main)] font-bold text-sm" />
                     </div>
                  </div>
                  <div className="flex flex-col gap-2 w-full">
                     <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest pl-1">Location</label>
                     <div className="flex items-center w-full bg-[var(--bg-main)] px-4 py-3 rounded-xl border border-[var(--border-main)] focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--primary-10)] transition-all">
                        <MapPin size={16} className="text-[var(--success)] mr-3 shrink-0"/>
                        <input value={profile.location} onChange={e => handleProfileChange('location', e.target.value)} className="bg-transparent w-full focus:outline-none text-[var(--text-main)] font-bold text-sm" />
                     </div>
                  </div>
                  <div className="flex flex-col gap-2 w-full">
                     <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest pl-1">Website URL</label>
                     <div className="flex items-center w-full bg-[var(--bg-main)] px-4 py-3 rounded-xl border border-[var(--border-main)] focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--primary-10)] transition-all">
                        <LinkIcon size={16} className="text-[var(--accent)] mr-3 shrink-0"/>
                        <input value={profile.website} onChange={e => handleProfileChange('website', e.target.value)} className="bg-transparent w-full focus:outline-none text-[var(--text-main)] font-bold text-sm" />
                     </div>
                  </div>
               </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-[var(--border-main)] flex flex-col md:flex-row items-center justify-between gap-6">
               <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm font-bold text-[var(--text-muted)] w-full">
                  <div className="flex items-center gap-2 bg-[var(--bg-main)] px-4 py-2.5 rounded-xl border border-[var(--border-main)] shadow-sm"><HardDrive size={16} className="text-[var(--primary)]"/><span>14.2 GB / 50 GB</span></div>
                  <div className="flex items-center gap-2 bg-[var(--bg-main)] px-4 py-2.5 rounded-xl border border-[var(--border-main)] shadow-sm"><Shield size={16} className="text-[var(--success)]"/><span>{profile.role}</span></div>
                  <div className="flex items-center gap-2 bg-[var(--bg-main)] px-4 py-2.5 rounded-xl border border-[var(--border-main)] shadow-sm"><Lock size={16} className="text-[var(--warning)]"/><span className="text-[var(--success)]">Hardware Key (2FA)</span></div>
               </div>
               <button onClick={() => showToast("Profile settings saved successfully!")} className="bg-[var(--primary)] text-[var(--primary-content)] hover:brightness-110 active:scale-95 px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-[var(--primary-20)] whitespace-nowrap w-full md:w-auto">
                  <Save size={16} /> Save Changes
               </button>
            </div>
          </div>
        </div>

        <div className="bg-[var(--bg-surface)] border-2 border-[var(--primary-30)] rounded-[3rem] p-8 md:p-10 shadow-2xl relative overflow-hidden transition-all duration-500">
           <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[var(--primary)] via-[var(--accent)] to-[var(--success)]"></div>
           <h3 className="text-2xl font-black text-[var(--text-main)] flex items-center gap-3 uppercase tracking-tighter mb-8"><Cpu size={28} className="text-[var(--primary)]" /> Advanced Engine Protocols</h3>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col justify-between w-full bg-[var(--bg-main)] border border-[var(--border-main)] px-6 py-6 rounded-[2rem] shadow-sm hover:border-[var(--primary-30)] transition-colors">
                 <div>
                    <div className="flex items-center gap-2 text-[var(--primary)] mb-3"><Network size={20}/> <span className="font-black uppercase tracking-widest text-xs">WebTransport (QUIC)</span></div>
                    <p className="text-[10px] font-bold text-[var(--text-muted)] mb-6 leading-relaxed">Prioritize HTTP/3 QUIC connections over standard WebRTC to eliminate head-of-line blocking and maximize throughput.</p>
                 </div>
                 <ToggleSwitch enabled={preferences.useWebTransport} onChange={val => handlePrefChange('useWebTransport', val)} />
              </div>

              <div className="flex flex-col justify-between w-full bg-[var(--bg-main)] border border-[var(--border-main)] px-6 py-6 rounded-[2rem] shadow-sm hover:border-[var(--primary-30)] transition-colors">
                 <div>
                    <div className="flex items-center gap-2 text-[var(--accent)] mb-3"><Zap size={20}/> <span className="font-black uppercase tracking-widest text-xs">WebGPU Compression</span></div>
                    <p className="text-[10px] font-bold text-[var(--text-muted)] mb-6 leading-relaxed">Offload Zstd stream compression to the Graphics Card. Exponentially increases transfer speeds for compressible data.</p>
                 </div>
                 <ToggleSwitch enabled={preferences.useWebGPU} onChange={val => handlePrefChange('useWebGPU', val)} />
              </div>

              <div className="flex flex-col justify-between w-full bg-[var(--bg-main)] border border-[var(--border-main)] px-6 py-6 rounded-[2rem] shadow-sm hover:border-[var(--primary-30)] transition-colors relative overflow-hidden">
                 {profile.plan !== 'Pro' && profile.plan !== 'Teams' && <div className="absolute inset-0 bg-[var(--bg-main)]/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center p-4"><Lock size={20} className="text-[var(--warning)] mb-2"/><span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-main)]">Pro Feature</span></div>}
                 <div>
                    <div className="flex items-center gap-2 text-[var(--warning)] mb-3"><UploadCloud size={20}/> <span className="font-black uppercase tracking-widest text-xs">Cloud Bridge Fallback</span></div>
                    <p className="text-[10px] font-bold text-[var(--text-muted)] mb-6 leading-relaxed">Automatically upload encrypted chunks to Zepglide Vaults if the P2P connection drops or receiver goes offline.</p>
                 </div>
                 <ToggleSwitch enabled={preferences.cloudBridgeFallback} onChange={val => handlePrefChange('cloudBridgeFallback', val)} />
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
           <div className="bg-[var(--bg-surface)] border-2 border-[var(--border-main)] rounded-[3rem] p-8 md:p-10 shadow-xl flex flex-col">
              <h3 className="text-2xl font-black text-[var(--text-main)] flex items-center gap-3 uppercase tracking-tighter mb-8"><ToggleRight size={28} className="text-[var(--warning)]" /> Network Preferences</h3>
              <div className="flex flex-col gap-4 flex-1">
                 <div className="flex items-center justify-between w-full bg-[var(--bg-main)] border border-[var(--border-main)] px-6 py-5 rounded-2xl shadow-sm hover:border-[var(--primary-30)] transition-colors">
                    <div className="flex flex-col items-start text-left">
                       <span className="text-sm font-black text-[var(--text-main)] uppercase tracking-wider mb-1">Public Node</span>
                       <span className="text-[10px] font-bold text-[var(--text-muted)]">Allow discovery by local peers.</span>
                    </div>
                    <ToggleSwitch enabled={preferences.publicDiscovery} onChange={val => handlePrefChange('publicDiscovery', val)} />
                 </div>
                 <div className="flex items-center justify-between w-full bg-[var(--bg-main)] border border-[var(--border-main)] px-6 py-5 rounded-2xl shadow-sm hover:border-[var(--primary-30)] transition-colors">
                    <div className="flex flex-col items-start text-left">
                       <span className="text-sm font-black text-[var(--text-main)] uppercase tracking-wider mb-1">Auto-Accept</span>
                       <span className="text-[10px] font-bold text-[var(--text-muted)]">Skip prompt for trusted nodes.</span>
                    </div>
                    <ToggleSwitch enabled={preferences.autoAccept} onChange={val => handlePrefChange('autoAccept', val)} />
                 </div>
                 <div className="flex items-center justify-between w-full bg-[var(--bg-main)] border border-[var(--border-main)] px-6 py-5 rounded-2xl shadow-sm hover:border-[var(--primary-30)] transition-colors">
                    <div className="flex flex-col items-start text-left">
                       <span className="text-sm font-black text-[var(--text-main)] uppercase tracking-wider mb-1">Strict E2EE</span>
                       <span className="text-[10px] font-bold text-[var(--text-muted)]">Drop unverified connection requests.</span>
                    </div>
                    <ToggleSwitch enabled={preferences.strictE2EE} onChange={val => handlePrefChange('strictE2EE', val)} />
                 </div>
              </div>
           </div>

           <div className="bg-[var(--bg-surface)] border-2 border-[var(--border-main)] rounded-[3rem] p-8 md:p-10 shadow-xl flex flex-col">
              <h3 className="text-2xl font-black text-[var(--text-main)] flex items-center gap-3 uppercase tracking-tighter mb-8"><Wifi size={28} className="text-[var(--accent)]" /> Connected Accounts</h3>
              <div className="flex flex-col gap-4 flex-1">
                 <div className="flex items-center justify-between w-full bg-[var(--bg-main)] border border-[var(--border-main)] px-6 py-5 rounded-2xl shadow-sm hover:border-[var(--primary-30)] transition-colors cursor-default">
                    <div className="flex items-center gap-4">
                       <div className="h-10 w-10 bg-[var(--bg-surface)] rounded-full flex items-center justify-center border border-[var(--border-main)] shadow-sm">
                         <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                       </div>
                       <div className="flex flex-col">
                          <span className="text-sm font-black text-[var(--text-main)] uppercase tracking-wider">Google</span>
                          <span className="text-[10px] font-bold text-[var(--text-muted)] mt-0.5">{profile.email}</span>
                       </div>
                    </div>
                    <CheckCircle2 size={20} className="text-[var(--success)]" />
                 </div>
                 <div className="flex items-center justify-between w-full bg-[var(--bg-main)] border border-[var(--border-main)] px-6 py-5 rounded-2xl shadow-sm hover:border-[var(--primary-30)] transition-colors cursor-default">
                    <div className="flex items-center gap-4">
                       <div className="h-10 w-10 bg-[var(--bg-surface)] rounded-full flex items-center justify-center border border-[var(--border-main)] shadow-sm">
                         <Github size={20} className="text-[var(--text-main)]"/>
                       </div>
                       <div className="flex flex-col">
                          <span className="text-sm font-black text-[var(--text-main)] uppercase tracking-wider">GitHub</span>
                          <span className="text-[10px] font-bold text-[var(--text-muted)] mt-0.5">github.com/nihal</span>
                       </div>
                    </div>
                    <CheckCircle2 size={20} className="text-[var(--success)]" />
                 </div>
                 <button className="w-full mt-2 py-4 border-2 border-dashed border-[var(--border-main)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)] hover:bg-[var(--primary-10)] rounded-2xl transition-all font-black text-xs uppercase tracking-widest flex justify-center items-center gap-2">
                    <LinkIcon size={16} /> Connect New Service
                 </button>
              </div>
           </div>
        </div>

        <div className="bg-[var(--bg-surface)] border-2 border-[var(--border-main)] rounded-[3rem] p-8 md:p-12 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-12 gap-6">
            <h3 className="text-2xl font-black text-[var(--text-main)] flex items-center gap-4 uppercase tracking-tighter"><Palette size={32} className="text-[var(--primary)]" /> Visual Profiles</h3>
            <div className="flex items-center gap-5 bg-[var(--bg-main)] px-6 py-4 rounded-[1.5rem] border border-[var(--border-main)] shadow-inner">
              <span className="text-[10px] font-black text-[var(--text-main)] uppercase tracking-[0.3em]">Dark Mode Protocol</span>
              <ToggleSwitch enabled={isDarkMode} onChange={(v) => { setIsDarkMode(v); showToast(`Protocol Set: ${v ? 'Dark Mode' : 'Light Mode'}`, "primary"); }} />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-6">
            {Object.entries(themes).map(([key, themeData]) => (
              <button 
                key={key} 
                onClick={() => { setActiveTheme(key); showToast(`Visual Profile Active: ${themeData.name}`, "primary"); }} 
                className={`p-6 rounded-[2.5rem] border-2 flex flex-col items-center gap-5 transition-all duration-500 active:scale-95 ${activeTheme === key ? 'border-[var(--primary)] bg-[var(--primary-10)] shadow-2xl scale-105' : 'border-[var(--border-main)] bg-[var(--bg-main)] hover:border-[var(--primary-30)]'}`}
              >
                <div className="flex w-full h-14 rounded-[1.25rem] overflow-hidden border-2 border-[var(--border-main)] shadow-lg">
                   <div className="flex-1" style={{backgroundColor: themeData.dark.bgMain}}></div>
                   <div className="flex-1" style={{backgroundColor: themeData.primary}}></div>
                </div>
                <span className="text-[10px] font-black text-[var(--text-main)] uppercase tracking-[0.2em] truncate w-full text-center">{themeData.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PricingView() {
  const [billingCycle, setBillingCycle] = useState('monthly');
  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto mt-4 md:mt-8 pb-12 animate-in fade-in duration-700">
      <header className="text-center mb-16 px-4 w-full">
        <h2 className="text-4xl md:text-5xl font-black text-[var(--text-main)] mb-6 tracking-tighter uppercase">Velocity Plans</h2>
        <div className="flex items-center justify-center gap-4 mt-8">
          <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${billingCycle === 'monthly' ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'}`}>Monthly</span>
          <button onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')} className="w-16 h-8 bg-[var(--bg-surface)] rounded-full relative focus:ring-2 focus:ring-[var(--primary)] border-2 border-[var(--border-main)] shadow-inner">
            <div className={`w-6 h-6 bg-[var(--primary)] rounded-full absolute top-0.5 transition-all duration-500 shadow-lg ${billingCycle === 'yearly' ? 'left-9' : 'left-0.5'}`}></div>
          </button>
          <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${billingCycle === 'yearly' ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'}`}>Yearly <span className="ml-2 bg-[var(--primary-10)] text-[var(--primary)] px-3 py-1 rounded-full border border-[var(--primary-20)] text-[9px]">-20%</span></span>
        </div>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full px-4 md:px-0 items-end">
        <PricingCard title="Base" price="$0" features={["Unlimited P2P Handshakes", "Standard Routing", "Ad-Supported Transfer", "Basic WebRTC"]} buttonText="Current Plan" />
        <PricingCard title="Pro" price={billingCycle === 'monthly' ? "$10" : "$8.00"} features={["50GB Cloud Bridge", "Priority TURN Relays", "WebGPU Compression", "Zero-Wait Media Streaming", "Ad-Free Experience"]} buttonText="Upgrade Now" primary />
        <PricingCard title="Enterprise" price={billingCycle === 'monthly' ? "$25" : "$20"} features={["1TB Cloud Bridge", "Delta-Patch Syncing", "Dedicated Relay Servers", "Custom Branded UI", "Full Audit Logs"]} buttonText="Contact Sales" />
      </div>
    </div>
  );
}

const PricingCard = ({ title, price, features, buttonText, primary }) => (
  <div className={`bg-[var(--bg-surface)] border-[3px] rounded-[2.5rem] p-10 flex flex-col shadow-2xl transition-all duration-500 hover:-translate-y-3 ${primary ? 'border-[var(--primary)] scale-105 relative z-10' : 'border-[var(--border-main)] h-[90%]'}`}>
    {primary && <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--primary)] text-[var(--primary-content)] text-[10px] font-black uppercase tracking-[0.3em] px-6 py-2 rounded-full shadow-xl">Most Popular</div>}
    <h3 className="text-2xl font-black text-[var(--text-main)] mb-2 tracking-tighter uppercase">{title}</h3>
    <div className="mb-10 flex items-baseline gap-1"><span className="text-5xl font-black text-[var(--text-main)] tracking-tighter">{price}</span><span className="text-sm font-black text-[var(--text-muted)] uppercase tracking-widest">/mo</span></div>
    <div className="flex flex-col gap-5 flex-1 mb-10">{features.map((f, i) => <PricingFeature key={i} text={f} included />)}</div>
    <button className={`w-full font-black py-4 rounded-2xl transition-all duration-300 shadow-xl uppercase tracking-widest text-[11px] ${primary ? 'bg-[var(--primary)] text-[var(--primary-content)] hover:brightness-110 active:scale-95' : 'bg-[var(--bg-main)] text-[var(--text-main)] hover:bg-[var(--bg-hover)]'}`}>{buttonText}</button>
  </div>
);

function PricingFeature({ text, included = false }) {
  return (
    <div className="flex items-center gap-4 animate-in fade-in slide-in-from-left-4 duration-500">
      <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 shadow-sm border-2 ${included ? 'bg-[var(--primary-10)] text-[var(--primary)] border-[var(--primary-20)]' : 'bg-[var(--bg-main)] text-[var(--text-muted)] border-[var(--border-main)]'}`}>{included ? <Check size={16} strokeWidth={4} /> : <X size={16} strokeWidth={4} />}</div>
      <span className="text-sm font-black text-[var(--text-main)] tracking-tight uppercase">{text}</span>
    </div>
  );
}

function ToggleSwitch({ enabled, onChange }) {
  return (
    <button onClick={() => onChange(!enabled)} className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-all duration-500 focus:ring-4 focus:ring-[var(--primary-10)] outline-none shrink-0 relative shadow-inner ${enabled ? 'bg-[var(--primary)]' : 'bg-[var(--border-main)]'}`}>
      <div className={`w-6 h-6 rounded-full shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${enabled ? 'translate-x-6 bg-white' : 'translate-x-0 bg-[var(--text-muted)]'}`}></div>
    </button>
  );
}

function DeviceCard({ icon, name, owner, active }) {
  return (
    <div className={`flex-1 border-2 rounded-[2rem] p-6 flex items-center gap-5 cursor-pointer transition-all duration-500 hover:-translate-y-2 active:scale-95 ${active ? 'border-[var(--primary)] bg-[var(--primary-10)] shadow-2xl shadow-[var(--primary-10)]' : 'border-[var(--border-main)] bg-[var(--bg-surface)] hover:border-[var(--primary-30)] hover:shadow-xl'}`}><div className={`shrink-0 transition-transform duration-500 ${active ? 'text-[var(--primary)] scale-125' : 'text-[var(--text-muted)] opacity-50'}`}>{icon}</div><div className="text-left overflow-hidden"><h5 className="text-lg font-black text-[var(--text-main)] truncate tracking-tighter">{name}</h5><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] mt-1">{owner}</p></div></div>
  );
}

function AuthModal({ onLogin, onClose }) {
  const [isLoginView, setIsLoginView] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const handleSubmit = (e) => { e.preventDefault(); setTimeout(() => onLogin(), 600); };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-500 font-sans">
      <div className="absolute inset-0 bg-[#353b48]/70 backdrop-blur-md" onClick={onClose}></div>
      <div className="w-full max-w-[420px] bg-[#434b58] border border-white/5 rounded-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.4)] relative z-10 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
        <div className="h-1 w-full bg-gradient-to-r from-[var(--primary)] via-[var(--accent)] to-[var(--primary)]"></div>
        <button onClick={onClose} className="absolute top-5 right-5 p-2 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all z-20 active:scale-90"><X size={18} strokeWidth={2.5} /></button>
        <div className="p-8 md:p-10 relative">
          <div className="flex flex-col items-center mb-10">
            <div className="h-16 w-16 bg-[var(--primary)] text-white rounded-[1.25rem] flex items-center justify-center mb-6 shadow-sm"><Zap size={32} strokeWidth={3} className="fill-current" /></div>
            <h2 className="text-[22px] font-black text-white mb-2 tracking-wide uppercase">{isLoginView ? 'Authenticator' : 'Register Node'}</h2>
            <p className="text-sm font-medium text-white/60 text-center leading-relaxed">{isLoginView ? 'Access your high-velocity file network.' : 'Initialize your unique node identity.'}</p>
          </div>
          <form key={isLoginView ? 'login' : 'signup'} onSubmit={handleSubmit} className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-500">
            {!isLoginView && (
              <div className="space-y-2"><label className="text-[10px] font-black text-white/60 uppercase tracking-[0.1em] ml-1">Alias Name</label><div className="relative group"><div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40 group-focus-within:text-[var(--primary)] transition-colors"><UserCircle size={18} strokeWidth={2.5} /></div><input type="text" required placeholder="User_Alpha" className="w-full bg-[#353b48] border border-white/5 text-white text-sm rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-all font-bold placeholder-white/30" /></div></div>
            )}
            <div className="space-y-2"><label className="text-[10px] font-black text-white/60 uppercase tracking-[0.1em] ml-1">Global ID</label><div className="relative group"><div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40 group-focus-within:text-[var(--primary)] transition-colors"><Mail size={18} strokeWidth={2.5} /></div><input type="email" required placeholder="name@glide.io" className="w-full bg-[#353b48] border border-white/5 text-white text-sm rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-all font-bold placeholder-white/30" /></div></div>
            <div className="space-y-2"><div className="flex justify-between items-center ml-1 mb-1"><label className="text-[10px] font-black text-white/60 uppercase tracking-[0.1em]">Secret Key</label>{isLoginView && <button type="button" className="text-[10px] font-black text-[var(--primary)] uppercase tracking-widest hover:underline">Reset</button>}</div><div className="relative group"><div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40 group-focus-within:text-[var(--primary)] transition-colors"><Fingerprint size={18} strokeWidth={2.5} /></div><input type={showPassword ? "text" : "password"} required placeholder="••••••••" className="w-full bg-[#353b48] border border-white/5 text-white text-sm rounded-xl pl-12 pr-12 py-3.5 focus:outline-none focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-all font-bold placeholder-white/30 tracking-widest" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/40 hover:text-white transition-colors active:scale-90">{showPassword ? <EyeOff size={18} strokeWidth={2.5} /> : <Eye size={18} strokeWidth={2.5} />}</button></div></div>
            <div className="mt-4 p-[2px] rounded-[14px] bg-gradient-to-r from-[var(--primary-30)] via-[var(--accent-50)] to-[var(--primary-30)] shadow-[0_0_15px_var(--primary-20)]"><button type="submit" className="w-full bg-[#434b58] hover:bg-[#3b4350] active:scale-[0.98] text-[var(--primary)] font-black py-4 rounded-xl transition-all duration-300 uppercase tracking-wider text-xs"><span className="bg-gradient-to-r from-[var(--primary)] to-[var(--primary)] bg-clip-text text-transparent px-8 py-2 bg-[var(--primary-10)] rounded-full">{isLoginView ? 'Authorize Node' : 'Initialize Node'}</span></button></div>
          </form>
        </div>
        <div className="pb-8 text-center bg-[#434b58]"><button onClick={() => setIsLoginView(!isLoginView)} className="text-[11px] font-black text-[var(--primary)] uppercase tracking-[0.1em] hover:brightness-125 transition-all">{isLoginView ? "Request Access Key" : "Already Initialized?"}</button></div>
      </div>
    </div>
  );
}

function AdminDashboardView({ showToast }) {
  const [ddosMode, setDdosMode] = useState(false);
  const [geoBlock, setGeoBlock] = useState(true);
  const [strictRateLimit, setStrictRateLimit] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowRegistrations, setAllowRegistrations] = useState(true);
  const [forceE2ee, setForceE2ee] = useState(false);
  const [quantumSafe, setQuantumSafe] = useState(true);
  const [zeroTrust, setZeroTrust] = useState(true);
  const [autoIsolate, setAutoIsolate] = useState(true);
  const [threatScore] = useState(14); 

  const [transfers, setTransfers] = useState([
    { id: 'tx_a1b2', file: 'ubuntu-24.04.iso', size: '3.4 GB', type: 'P2P (QUIC)', status: '84%', speed: '1.2 GB/s' },
    { id: 'tx_c3d4', file: 'client_assets_final.zip', size: '850 MB', type: 'Cloud Bridge', status: '45%', speed: '12 MB/s' },
  ]);
  const [users, setUsers] = useState([
    { id: 'usr_9x81', email: 'nihal@glide.io', plan: 'Pro', bw: '142 GB', status: 'Active', region: 'US' },
    { id: 'usr_2b4a', email: 'studio_beta@mac.local', plan: 'Teams', bw: '8.4 TB', status: 'Active', region: 'DE' },
  ]);
  const mockAuditLogs = [
    { id: 1, time: '10:42 AM', event: 'WebTransport Negotiation Failed', user: 'IP: 192.168.1.45', severity: 'Medium' },
  ];
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastStatus, setBroadcastStatus] = useState('idle');
  const [trafficSpike, setTrafficSpike] = useState(false);

  const handleIntercept = (id) => {
    setTransfers(prev => prev.filter(t => t.id !== id));
    showToast(`Transfer ${id} intercepted and killed.`, "primary");
  };
  const handleToggleUserStatus = (id) => {
    setUsers(prev => prev.map(u => {
       if (u.id === id) {
          const newStatus = u.status === 'Active' ? 'Suspended' : 'Active';
          showToast(`User ${id} status changed to ${newStatus}.`, newStatus === 'Active' ? "success" : "primary");
          return { ...u, status: newStatus };
       }
       return u;
    }));
  };
  const handleBroadcast = () => { 
    if (!broadcastMsg.trim()) return; 
    setBroadcastStatus('sending'); 
    setTimeout(() => { 
      setBroadcastStatus('sent'); 
      showToast("System broadcast dispatched globally.", "success");
      setBroadcastMsg(''); 
      setTimeout(() => setBroadcastStatus('idle'), 3000); 
    }, 1500); 
  };
  const triggerSpike = () => { 
    setTrafficSpike(true); 
    showToast("Simulating high-load traffic spike...", "primary");
    setTimeout(() => setTrafficSpike(false), 5000); 
  };

  return (
    <div className="flex flex-col gap-10 w-full max-w-5xl mx-auto mt-2 pb-12 animate-in fade-in duration-700">
      
      {/* 1. Status Bar */}
      <div className={`rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center justify-between shadow-2xl transition-all duration-700 border-2 gap-6 ${ddosMode || maintenanceMode ? 'bg-[var(--danger-10)] border-[var(--danger)]' : trafficSpike ? 'bg-[var(--warning-10)] border-[var(--warning)]' : 'bg-[var(--bg-surface)] border-[var(--border-main)]'}`}>
        <div className="flex items-center gap-6">
          <div className="relative flex h-8 w-8">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${ddosMode || maintenanceMode ? 'bg-[var(--danger)]' : trafficSpike ? 'bg-[var(--warning)] duration-75' : 'bg-[var(--success)]'}`}></span>
            <span className={`relative inline-flex rounded-full h-8 w-8 ${ddosMode || maintenanceMode ? 'bg-[var(--danger)]' : trafficSpike ? 'bg-[var(--warning)]' : 'bg-[var(--success)]'}`}></span>
          </div>
          <div>
            <h4 className={`text-2xl font-black tracking-tighter uppercase ${ddosMode || maintenanceMode ? 'text-[var(--danger)]' : trafficSpike ? 'text-[var(--warning)]' : 'text-[var(--text-main)]'}`}>
              System: {maintenanceMode ? 'MAINTENANCE' : ddosMode ? 'SHIELDED' : trafficSpike ? 'HIGH LOAD' : 'NOMINAL'}
            </h4>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] mt-2">Core routing clusters active.</p>
          </div>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
           <button onClick={triggerSpike} className="px-4 py-2 bg-[var(--bg-main)] hover:bg-[var(--bg-hover)] text-[var(--text-main)] rounded-xl border border-[var(--border-main)] text-xs font-bold transition-colors shadow-sm flex-1 md:flex-initial">
             Test Load
           </button>
           <div className={`px-5 py-3 rounded-xl border-2 font-mono text-lg font-black shadow-inner flex-1 md:flex-initial text-center transition-all duration-500 ${trafficSpike ? 'bg-[var(--warning-10)] border-[var(--warning)] text-[var(--warning)] scale-105' : 'bg-[var(--bg-main)] border-[var(--border-main)] text-[var(--text-main)]'}`}>
             {trafficSpike ? '84,291 req/s' : ddosMode ? '14,892 req/s' : '3,204 req/s'}
           </div>
        </div>
      </div>

      {/* 2. Global Broadcast */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[3rem] p-8 md:p-12 shadow-xl relative overflow-hidden flex flex-col md:flex-row gap-8 items-center">
         <div className="flex-1 w-full">
           <h3 className="text-2xl font-black text-[var(--text-main)] flex items-center gap-3 uppercase tracking-tighter mb-2"><Megaphone className="text-[var(--accent)] shrink-0" size={28} /> Global Broadcast</h3>
           <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-6">Push system messages to all active nodes.</p>
           <div className="flex gap-3 w-full">
             <input type="text" value={broadcastMsg} onChange={(e) => setBroadcastMsg(e.target.value)} placeholder="Enter urgent system message..." className="flex-1 bg-[var(--bg-main)] border border-[var(--border-main)] rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-20)] transition-all" disabled={broadcastStatus !== 'idle'} />
             <button onClick={handleBroadcast} disabled={!broadcastMsg.trim() || broadcastStatus !== 'idle'} className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${broadcastStatus === 'sent' ? 'bg-[var(--success)] text-white' : 'bg-[var(--accent)] text-white hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:active:scale-100'}`}>
               {broadcastStatus === 'idle' && <><Send size={16}/> Push</>}
               {broadcastStatus === 'sending' && <><RefreshCw size={16} className="animate-spin"/> Sending</>}
               {broadcastStatus === 'sent' && <><CheckCircle2 size={16}/> Sent</>}
             </button>
           </div>
         </div>
      </div>

      {/* 3. System Editor */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[3rem] p-10 md:p-14 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
           <h3 className="text-3xl font-black text-[var(--text-main)] flex items-center gap-4 tracking-tighter uppercase"><Sliders className="text-[var(--primary)] shrink-0" size={36} />System Editor</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <AdminVarInput label="Max Transfer Size (GB)" defaultValue="50" icon={<HardDrive size={16}/>} />
           <AdminVarInput label="Global Rate Limit (req/s)" defaultValue="15000" icon={<Activity size={16}/>} />
           <AdminVarInput label="Default Node Allocation (GB)" defaultValue="2" icon={<Database size={16}/>} />
           <AdminVarInput label="Session Timeout (mins)" defaultValue="120" icon={<Clock size={16}/>} />
        </div>
        <div className="mt-8 flex justify-end">
           <button onClick={() => showToast("System variables saved.", "success")} className="px-8 py-3 bg-[var(--primary)] text-[var(--primary-content)] rounded-xl font-black text-xs uppercase tracking-widest hover:brightness-110 transition-all active:scale-95 shadow-md shadow-[var(--primary-20)]">Save Variables</button>
        </div>
      </div>

      {/* 4. Platform Config */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[3rem] p-10 md:p-14 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
           <h3 className="text-3xl font-black text-[var(--text-main)] flex items-center gap-4 tracking-tighter uppercase"><Settings className="text-[var(--primary)] shrink-0" size={36} />Platform Config</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <AdminDefenseCard title="Maintenance" desc="Suspend traffic & show maintenance UI." enabled={maintenanceMode} onChange={(v) => {setMaintenanceMode(v); showToast(`Maintenance Mode ${v ? 'Enabled' : 'Disabled'}`, v ? 'primary' : 'success');}} danger icon={<Pause size={24}/>} />
           <AdminDefenseCard title="Registrations" desc="Allow new users to allocate nodes." enabled={allowRegistrations} onChange={(v) => {setAllowRegistrations(v); showToast(`Registrations ${v ? 'Enabled' : 'Disabled'}`, 'success');}} icon={<UserPlus size={24}/>} />
           <AdminDefenseCard title="Force E2EE" desc="Reject unverified handshakes instantly." enabled={forceE2ee} onChange={(v) => {setForceE2ee(v); showToast(`Force E2EE ${v ? 'Enabled' : 'Disabled'}`, 'success');}} icon={<ShieldCheck size={24}/>} />
        </div>
      </div>

      {/* 5. Compute Load & Cloud Vaults */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[3rem] p-8 md:p-10 shadow-xl flex flex-col justify-between">
           <h3 className="text-2xl font-black text-[var(--text-main)] flex items-center gap-3 uppercase tracking-tighter mb-8"><Activity className="text-[var(--warning)] shrink-0" size={28} /> Compute Load</h3>
           <div className="flex flex-col gap-6">
             <div className="group">
                <div className="flex justify-between items-center mb-2">
                   <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2"><Cpu size={14} className="text-[var(--primary)]"/> Main API Cluster</span>
                   <span className={`font-mono text-sm font-bold ${trafficSpike ? 'text-[var(--warning)]' : 'text-[var(--text-main)]'}`}>{trafficSpike ? '92%' : '42%'}</span>
                </div>
                <div className="w-full bg-[var(--bg-main)] rounded-full h-3 overflow-hidden border border-[var(--border-main)] shadow-inner">
                   <div className={`h-full rounded-full transition-all duration-500 ${trafficSpike ? 'bg-[var(--warning)]' : 'bg-[var(--primary)]'}`} style={{ width: trafficSpike ? '92%' : '42%' }}></div>
                </div>
             </div>
             <div className="group">
                <div className="flex justify-between items-center mb-2">
                   <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2"><Server size={14} className="text-[var(--success)]"/> Redis State</span>
                   <span className="font-mono text-sm font-bold text-[var(--text-main)]">30%</span>
                </div>
                <div className="w-full bg-[var(--bg-main)] rounded-full h-3 overflow-hidden border border-[var(--border-main)] shadow-inner">
                   <div className="bg-[var(--success)] h-full rounded-full transition-all duration-1000" style={{ width: '30%' }}></div>
                </div>
             </div>
             <div className="group">
                <div className="flex justify-between items-center mb-2">
                   <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2"><Network size={14} className="text-[var(--danger)]"/> Relay Bandwidth</span>
                   <span className="font-mono text-sm font-bold text-[var(--danger)]">88%</span>
                </div>
                <div className="w-full bg-[var(--bg-main)] rounded-full h-3 overflow-hidden border border-[var(--border-main)] shadow-inner">
                   <div className="bg-[var(--danger)] h-full rounded-full transition-all" style={{ width: '88%' }}></div>
                </div>
             </div>
           </div>
        </div>

        <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[3rem] p-8 md:p-10 shadow-xl flex flex-col">
           <div className="flex justify-between items-center mb-8">
             <h3 className="text-2xl font-black text-[var(--text-main)] flex items-center gap-3 uppercase tracking-tighter"><Database className="text-[var(--primary)] shrink-0" size={28} /> Cloud Vaults</h3>
             <button onClick={() => showToast("Vault statuses refreshed.", "success")} className="p-2 bg-[var(--bg-main)] hover:bg-[var(--primary-10)] text-[var(--primary)] rounded-lg transition-colors border border-[var(--border-main)]" title="Refresh">
               <RefreshCw size={16} />
             </button>
           </div>
           <div className="flex flex-col gap-4 flex-1">
              <div className="bg-[var(--bg-main)] p-4 rounded-2xl border border-[var(--border-main)] flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-[var(--text-main)]">US-East (Primary)</h4>
                  <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider mt-1">42 TB / 100 TB</p>
                </div>
                <button onClick={() => showToast("Purging US-East vault cache...", "primary")} className="px-4 py-2 bg-[var(--bg-surface)] hover:bg-[var(--danger-10)] text-[var(--danger)] border border-[var(--border-main)] hover:border-[var(--danger-20)] text-[10px] font-black uppercase tracking-widest rounded-xl transition-all">Purge</button>
              </div>
              <div className="bg-[var(--bg-main)] p-4 rounded-2xl border border-[var(--border-main)] flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-[var(--text-main)]">EU-Central (Mirror)</h4>
                  <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider mt-1">18 TB / 50 TB</p>
                </div>
                <button onClick={() => showToast("Purging EU-Central vault cache...", "primary")} className="px-4 py-2 bg-[var(--bg-surface)] hover:bg-[var(--danger-10)] text-[var(--danger)] border border-[var(--border-main)] hover:border-[var(--danger-20)] text-[10px] font-black uppercase tracking-widest rounded-xl transition-all">Purge</button>
              </div>
           </div>
        </div>
      </div>

      {/* 6. Financial Engine */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[3rem] p-10 md:p-14 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-4">
           <h3 className="text-3xl font-black text-[var(--text-main)] flex items-center gap-4 tracking-tighter uppercase"><PieChart className="text-[var(--success)] shrink-0" size={36} />Financial Engine</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-12">
           <AdminQuickStat val="$12,450" label="Gross MRR" trend="+12% Growth" color="text-[var(--success)]" />
           <AdminQuickStat val="$1,460" label="Total Opex" trend="-2% Efficiency" color="text-[var(--primary)]" />
           <AdminQuickStat val="88.2%" label="Net Margin" trend="Optimal" color="text-[var(--warning)]" />
           <AdminQuickStat val="$10,990" label="Net Profit" trend="All Time High" color="text-[var(--success)]" />
        </div>

        <h4 className="text-[10px] font-black text-[var(--text-muted)] mb-6 uppercase tracking-[0.5em]">Cost Distribution</h4>
        <div className="flex flex-col gap-5">
           <div className="flex items-center gap-4">
              <div className="w-32 text-xs font-bold text-[var(--text-main)]">AWS EC2 (Compute)</div>
              <div className="flex-1 bg-[var(--bg-main)] rounded-full h-4 overflow-hidden border border-[var(--border-main)] shadow-inner">
                 <div className="bg-[var(--primary)] h-full rounded-full" style={{ width: '45%' }}></div>
              </div>
              <div className="w-16 text-right font-mono text-xs font-bold text-[var(--text-muted)]">$650</div>
           </div>
           <div className="flex items-center gap-4">
              <div className="w-32 text-xs font-bold text-[var(--text-main)]">TURN Bandwidth</div>
              <div className="flex-1 bg-[var(--bg-main)] rounded-full h-4 overflow-hidden border border-[var(--border-main)] shadow-inner">
                 <div className="bg-[var(--danger)] h-full rounded-full" style={{ width: '60%' }}></div>
              </div>
              <div className="w-16 text-right font-mono text-xs font-bold text-[var(--text-muted)]">$890</div>
           </div>
        </div>
      </div>

      {/* 7. Active Transfers */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[3rem] p-10 md:p-14 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
           <h3 className="text-3xl font-black text-[var(--text-main)] flex items-center gap-4 tracking-tighter uppercase"><Activity className="text-[var(--accent)] shrink-0" size={36} />Active Transfers</h3>
           <div className="flex items-center gap-2">
              <span className="px-4 py-2 bg-[var(--accent-10)] text-[var(--accent)] text-[10px] font-black tracking-widest rounded-full border border-[var(--accent-20)] animate-pulse">LIVE VIEW</span>
           </div>
        </div>
        
        <div className="overflow-x-auto bg-[var(--bg-main)] border border-[var(--border-main)] rounded-[2rem] shadow-inner">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-[var(--border-main)] text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
                <th className="p-6 pl-8">Tx ID / File</th>
                <th className="p-6">Size</th>
                <th className="p-6">Network Type</th>
                <th className="p-6">Speed / Progress</th>
                <th className="p-6 pr-8 text-right">Intercept</th>
              </tr>
            </thead>
            <tbody className="text-sm font-medium">
              {transfers.length === 0 && (
                <tr><td colSpan="5" className="p-10 text-center text-[var(--text-muted)] font-bold">No active transfers.</td></tr>
              )}
              {transfers.map((tx) => (
                <tr key={tx.id} className="border-b border-[var(--border-main)] hover:bg-[var(--bg-hover)] transition-colors last:border-0 animate-in fade-in">
                  <td className="p-6 pl-8">
                     <p className="font-bold text-[var(--text-main)]">{tx.file}</p>
                     <p className="text-[10px] text-[var(--text-muted)] mt-1 font-mono uppercase">{tx.id}</p>
                  </td>
                  <td className="p-6 font-mono text-[var(--text-muted)] font-bold">{tx.size}</td>
                  <td className="p-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                      tx.type.includes('QUIC') ? 'bg-[var(--primary-10)] text-[var(--primary)] border-[var(--primary-20)]' : 
                      'bg-[var(--warning-10)] text-[var(--warning)] border-[var(--warning-20)]'
                    }`}>
                      {tx.type}
                    </span>
                  </td>
                  <td className="p-6">
                     <div className="flex flex-col gap-1">
                       <span className="font-mono text-xs font-bold text-[var(--text-main)]">{tx.speed}</span>
                       <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">{tx.status}</span>
                     </div>
                  </td>
                  <td className="p-6 pr-8 text-right">
                     <button onClick={() => handleIntercept(tx.id)} className="p-2.5 bg-[var(--danger-10)] text-[var(--danger)] hover:bg-[var(--danger)] hover:text-white rounded-xl transition-all shadow-sm active:scale-95 border border-[var(--danger-20)]" title="Kill Transfer">
                       <X size={16} strokeWidth={3} />
                     </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 8. Node Directory */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[3rem] p-10 md:p-14 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
           <h3 className="text-3xl font-black text-[var(--text-main)] flex items-center gap-4 tracking-tighter uppercase"><Users className="text-[var(--primary)] shrink-0" size={36} />Node Directory</h3>
           <div className="flex items-center gap-2">
              <span className="px-4 py-2 bg-[var(--primary-10)] text-[var(--primary)] text-[10px] font-black tracking-widest rounded-full border border-[var(--primary-20)]">4,812 TOTAL</span>
           </div>
        </div>
        
        <div className="overflow-x-auto bg-[var(--bg-main)] border border-[var(--border-main)] rounded-[2rem] shadow-inner">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-[var(--border-main)] text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
                <th className="p-6 pl-8">Global ID</th>
                <th className="p-6">Subscription</th>
                <th className="p-6">Bandwidth</th>
                <th className="p-6">Status</th>
                <th className="p-6 pr-8 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm font-medium">
              {users.map((user) => (
                <tr key={user.id} className={`border-b border-[var(--border-main)] transition-colors last:border-0 ${user.status === 'Suspended' ? 'bg-[var(--danger-10)]/30 opacity-75' : 'hover:bg-[var(--bg-hover)]'}`}>
                  <td className="p-6 pl-8">
                     <p className={`font-bold ${user.status === 'Suspended' ? 'text-[var(--danger)] line-through' : 'text-[var(--text-main)]'}`}>{user.email}</p>
                     <p className="text-[10px] text-[var(--text-muted)] mt-1 font-mono uppercase">{user.id} • {user.region}</p>
                  </td>
                  <td className="p-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                      user.plan === 'Pro' ? 'bg-[var(--primary-10)] text-[var(--primary)] border-[var(--primary-20)]' : 
                      user.plan === 'Teams' ? 'bg-[var(--accent-10)] text-[var(--accent)] border-[var(--accent-20)]' : 
                      'bg-[var(--border-main)] text-[var(--text-main)] border-[var(--border-main)]'
                    }`}>
                      {user.plan}
                    </span>
                  </td>
                  <td className="p-6 font-mono text-[var(--text-muted)] font-bold">{user.bw}</td>
                  <td className="p-6">
                     <span className={`flex items-center gap-2 text-xs font-bold ${user.status === 'Active' ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                        <div className={`w-2 h-2 rounded-full ${user.status === 'Active' ? 'bg-[var(--success)]' : 'bg-[var(--danger)]'}`}></div>
                        {user.status}
                     </span>
                  </td>
                  <td className="p-6 pr-8 text-right">
                     <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleToggleUserStatus(user.id)} className={`p-2 rounded-lg transition-colors ${user.status === 'Active' ? 'text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger-10)]' : 'text-[var(--danger)] hover:text-[var(--success)] hover:bg-[var(--success-10)]'}`} title={user.status === 'Active' ? 'Suspend User' : 'Restore User'}>
                          {user.status === 'Active' ? <UserX size={16}/> : <Check size={16}/>}
                        </button>
                        <button className="p-2 text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--primary-10)] rounded-lg transition-colors"><MoreVertical size={16}/></button>
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 9. Security Audit */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[3rem] p-10 md:p-14 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
           <h3 className="text-3xl font-black text-[var(--text-main)] flex items-center gap-4 tracking-tighter uppercase"><FileWarning className="text-[var(--warning)] shrink-0" size={36} />Security Audit</h3>
        </div>
        
        <div className="overflow-x-auto bg-[var(--bg-main)] border border-[var(--border-main)] rounded-[2rem] shadow-inner">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-[var(--border-main)] text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
                <th className="p-6 pl-8">Timestamp</th>
                <th className="p-6">Event</th>
                <th className="p-6">Target / Identity</th>
                <th className="p-6 pr-8 text-right">Severity</th>
              </tr>
            </thead>
            <tbody className="text-sm font-medium">
              {mockAuditLogs.map((log) => (
                <tr key={log.id} className="border-b border-[var(--border-main)] hover:bg-[var(--bg-hover)] transition-colors last:border-0">
                  <td className="p-6 pl-8 font-mono text-[var(--text-muted)] font-bold">{log.time}</td>
                  <td className="p-6">
                     <span className="font-bold text-[var(--text-main)]">{log.event}</span>
                  </td>
                  <td className="p-6 font-mono text-[var(--text-muted)] text-xs">{log.user}</td>
                  <td className="p-6 pr-8 text-right">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                      log.severity === 'High' ? 'bg-[var(--danger-10)] text-[var(--danger)] border-[var(--danger-20)]' : 
                      log.severity === 'Medium' ? 'bg-[var(--warning-10)] text-[var(--warning)] border-[var(--warning-20)]' : 
                      'bg-[var(--text-muted)] bg-opacity-10 text-[var(--text-muted)] border-[var(--border-main)]'
                    }`}>
                      {log.severity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 10. Neural Overwatch */}
      <div className="bg-[var(--bg-surface)] border-2 border-[var(--accent-30)] rounded-[3rem] p-10 md:p-14 shadow-2xl relative overflow-hidden transition-all duration-700">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[var(--primary)] via-[var(--accent)] to-[var(--primary)]"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-16 gap-4">
           <h3 className="text-4xl font-black text-[var(--text-main)] flex items-center gap-6 tracking-tighter uppercase"><Brain className="text-[var(--accent)] shrink-0" size={48} />Neural Overwatch</h3>
           <span className="px-6 py-2.5 bg-[var(--accent-10)] text-[var(--accent)] text-xs font-black tracking-[0.4em] rounded-full border border-[var(--accent-20)] flex items-center gap-2 shadow-inner"><Radar size={18} className="animate-[spin_4s_linear_infinite]" /> PREDICTIVE A.I.</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
           <div className="bg-[var(--bg-main)] border border-[var(--border-main)] rounded-[2rem] p-8 shadow-inner">
             <div className="flex items-center justify-between mb-4">
               <Microscope size={24} className="text-[var(--primary)]" />
               <span className="text-[10px] font-black uppercase tracking-widest text-[var(--success)] px-3 py-1 bg-[var(--success-10)] rounded-full border border-[var(--success-20)]">Nominal</span>
             </div>
             <h4 className="text-4xl font-black text-[var(--text-main)] tracking-tighter mb-1">{threatScore}<span className="text-xl text-[var(--text-muted)]">/100</span></h4>
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">Predictive Threat Score</p>
           </div>
           
           <div className="bg-[var(--bg-main)] border border-[var(--border-main)] rounded-[2rem] p-8 shadow-inner">
             <div className="flex items-center justify-between mb-4">
               <ShieldHalf size={24} className="text-[var(--warning)]" />
               <span className="text-[10px] font-black uppercase tracking-widest text-[var(--warning)] px-3 py-1 bg-[var(--warning-10)] rounded-full border border-[var(--warning-20)]">Active</span>
             </div>
             <h4 className="text-4xl font-black text-[var(--text-main)] tracking-tighter mb-1">1,204</h4>
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">Zero-Day Anomalies Blocked</p>
           </div>

           <div className="bg-[var(--bg-main)] border border-[var(--border-main)] rounded-[2rem] p-8 shadow-inner">
             <div className="flex items-center justify-between mb-4">
               <Activity size={24} className="text-[var(--success)]" />
               <span className="text-[10px] font-black uppercase tracking-widest text-[var(--success)] px-3 py-1 bg-[var(--success-10)] rounded-full border border-[var(--success-20)]">Validated</span>
             </div>
             <h4 className="text-4xl font-black text-[var(--text-main)] tracking-tighter mb-1">99.9%</h4>
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">Network Integrity Hash</p>
           </div>
        </div>

        <h4 className="text-[10px] font-black text-[var(--text-muted)] mb-8 uppercase tracking-[0.5em]">Next-Gen Security Protocols</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <AdminDefenseCard title="Quantum-Safe Keys" desc="Use post-quantum cryptography (Kyber) for handshake exchange." enabled={quantumSafe} onChange={(v) => {setQuantumSafe(v); showToast(`Quantum Keys ${v ? 'Enabled' : 'Disabled'}`, 'success');}} icon={<ShieldHalf size={24}/>} />
           <AdminDefenseCard title="Zero-Trust Architecture" desc="Require continuous cryptographic authentication per packet." enabled={zeroTrust} onChange={(v) => {setZeroTrust(v); showToast(`Zero-Trust ${v ? 'Enabled' : 'Disabled'}`, 'success');}} icon={<Fingerprint size={24}/>} />
           <AdminDefenseCard title="A.I. Auto-Isolation" desc="Instantly sever connections to nodes exhibiting anomaly patterns." enabled={autoIsolate} onChange={(v) => {setAutoIsolate(v); showToast(`Auto-Isolate ${v ? 'Enabled' : 'Disabled'}`, 'primary');}} danger icon={<Brain size={24}/>} />
        </div>
      </div>

      {/* 11. Security Core */}
      <div className="bg-[var(--bg-surface)] border-2 border-[var(--warning-30)] rounded-[3rem] p-10 md:p-14 shadow-2xl relative overflow-hidden transition-all duration-700">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[var(--danger)] via-[var(--warning)] to-[var(--danger)]"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-16 gap-4">
           <h3 className="text-4xl font-black text-[var(--text-main)] flex items-center gap-6 tracking-tighter uppercase"><ShieldAlert className="text-[var(--warning)] shrink-0" size={48} />Security Core</h3>
           <span className="px-6 py-2.5 bg-[var(--warning-10)] text-[var(--warning)] text-xs font-black tracking-[0.4em] rounded-full border border-[var(--warning-20)] flex items-center gap-2 shadow-inner"><Terminal size={18} /> ROOT</span>
        </div>
        <h4 className="text-[10px] font-black text-[var(--text-muted)] mb-8 uppercase tracking-[0.5em]">Active Defense Mitigations</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
           <AdminDefenseCard title="DDoS Scrubber" desc="Filter API traffic through intense JS challenges." enabled={ddosMode} onChange={(v) => {setDdosMode(v); showToast(`DDoS Scrubber ${v ? 'Activated' : 'Deactivated'}`, v ? 'primary' : 'success');}} danger icon={<ShieldX size={24}/>} />
           <AdminDefenseCard title="Geo-Blocker" desc="Drop packets from high-risk ASNs and sanctioned IPs." enabled={geoBlock} onChange={(v) => {setGeoBlock(v); showToast(`Geo-Blocker ${v ? 'Enabled' : 'Disabled'}`, 'success');}} icon={<Globe size={24}/>} />
           <AdminDefenseCard title="Rate Policing" desc="Limit handshakes to 5/min. Ban aggressive peers." enabled={strictRateLimit} onChange={(v) => {setStrictRateLimit(v); showToast(`Rate Policing ${v ? 'Enabled' : 'Disabled'}`, 'success');}} icon={<Activity size={24}/>} />
        </div>

        <h4 className="text-[10px] font-black text-[var(--danger)] mb-6 uppercase tracking-[0.5em] flex items-center gap-2 mt-8">
          <AlertOctagon size={16} /> Extreme Emergency Controls
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-[var(--danger-10)] p-6 rounded-[2.5rem] border border-[var(--danger-30)]">
          <button onClick={() => showToast("Rotating Master Keys...", "primary")} className="flex flex-col items-start gap-3 bg-[var(--bg-surface)] hover:bg-[var(--danger)] hover:text-white text-[var(--text-main)] border border-[var(--danger-30)] p-6 rounded-[1.5rem] transition-all duration-300 active:scale-95 group shadow-sm">
            <div className="flex items-center gap-3 font-black text-sm uppercase tracking-wider">
              <Key size={20} className="text-[var(--danger)] group-hover:text-white" /> Rotate Master Keys
            </div>
            <span className="text-xs text-[var(--text-muted)] group-hover:text-white/80 font-medium text-left">Forces all nodes to renegotiate E2EE handshakes immediately.</span>
          </button>
          
          <button onClick={() => showToast("Flushing Redis State...", "primary")} className="flex flex-col items-start gap-3 bg-[var(--bg-surface)] hover:bg-[var(--danger)] hover:text-white text-[var(--text-main)] border border-[var(--danger-30)] p-6 rounded-[1.5rem] transition-all duration-300 active:scale-95 group shadow-sm">
            <div className="flex items-center gap-3 font-black text-sm uppercase tracking-wider">
              <DatabaseZap size={20} className="text-[var(--danger)] group-hover:text-white" /> Flush Redis State
            </div>
            <span className="text-xs text-[var(--text-muted)] group-hover:text-white/80 font-medium text-left">Drops all active signaling sessions. Drops connections globally.</span>
          </button>
          
          <button onClick={() => showToast("WARNING: Full Lockdown Initiated.", "primary")} className="flex flex-col items-start gap-3 bg-[var(--danger)] hover:bg-[#991b1b] text-white border-2 border-red-600 p-6 rounded-[1.5rem] transition-all duration-300 active:scale-95 group shadow-2xl hover:shadow-[0_0_30px_var(--danger)]">
            <div className="flex items-center gap-3 font-black text-sm uppercase tracking-wider">
              <Skull size={20} className="animate-pulse" /> Full Lockdown
            </div>
            <span className="text-xs text-white/90 font-medium text-left">Shuts down public access. Only whitelisted Root IPs can access.</span>
          </button>
        </div>
      </div>
    </div>
  );
}

const AdminVarInput = ({ label, defaultValue, icon }) => (
  <div className="flex flex-col gap-2 bg-[var(--bg-main)] p-4 rounded-2xl border border-[var(--border-main)] hover:border-[var(--primary-30)] transition-colors focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--primary-10)]">
     <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
       {icon} {label}
     </label>
     <input type="text" defaultValue={defaultValue} className="bg-transparent border-none p-0 text-xl font-black text-[var(--text-main)] focus:outline-none focus:ring-0" />
  </div>
);

const AdminDefenseCard = ({ title, desc, enabled, onChange, danger, icon }) => (
  <div className={`p-8 rounded-[2rem] border-2 transition-all duration-500 group flex flex-col justify-between ${enabled ? (danger ? 'bg-[var(--danger-10)] border-[var(--danger)] shadow-[0_0_30px_var(--danger-10)]' : 'bg-[var(--primary-10)] border-[var(--primary)] shadow-[0_0_30px_var(--primary-10)]') : 'bg-[var(--bg-main)] border-[var(--border-main)] hover:border-[var(--primary-30)]'}`}>
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className={`p-4 rounded-[1.25rem] transition-all duration-500 ${enabled ? (danger ? 'bg-[var(--danger)] text-white shadow-xl shadow-[var(--danger-20)]' : 'bg-[var(--primary)] text-white shadow-xl shadow-[var(--primary-20)]') : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-main)]'}`}>{icon}</div>
        <ToggleSwitch enabled={enabled} onChange={onChange} />
      </div>
      <h5 className="font-black text-xl text-[var(--text-main)] mb-2 tracking-tighter uppercase">{title}</h5>
      <p className="text-xs font-medium text-[var(--text-muted)] leading-relaxed">{desc}</p>
    </div>
  </div>
);

const AdminQuickStat = ({ val, label, trend, color }) => (
  <div className="bg-[var(--bg-main)] border-2 border-[var(--border-main)] rounded-[2rem] p-8 hover:border-[var(--primary-30)] transition-all duration-300 shadow-inner">
    <p className="text-3xl font-black text-[var(--text-main)] tracking-tighter">{val}</p>
    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--text-muted)] mt-2">{label}</p>
    <p className={`text-[10px] font-black uppercase tracking-widest mt-4 ${color}`}>{trend}</p>
  </div>
);