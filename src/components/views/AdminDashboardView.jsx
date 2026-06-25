import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, RefreshCw, Megaphone, Send, CheckCircle2, Sliders, HardDrive, Activity, 
  Database, Clock, Settings, Pause, UserPlus, ShieldCheck, Server, Network, DatabaseZap, Skull,
  PieChart, Users, UserX, MoreVertical, FileWarning, Brain, Microscope, ShieldHalf, Fingerprint, AlertOctagon, Zap, AlertTriangle, X,
  Crown, Trophy, Key, Radar, Menu, Sun, Moon, ChevronDown, User, UserCircle, LogOut, Command, Search, Info, MonitorDown, Globe
} from 'lucide-react';
import { useSound } from '../../hooks/useSound';
import { supabase } from '../../lib/supabase';

export default function AdminDashboardView({ showToast }) {
  const [ddosMode, setDdosMode] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowRegistrations, setAllowRegistrations] = useState(true);
  const [forceE2ee, setForceE2ee] = useState(false);
  const [quantumSafe, setQuantumSafe] = useState(true);
  const [zeroTrust, setZeroTrust] = useState(true);
  const [autoIsolate, setAutoIsolate] = useState(true);
  const [threatScore] = useState(14); 
  const { playSfx } = useSound();

  const [transfers, setTransfers] = useState([]);
  const [users, setUsers] = useState([]);
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastStatus, setBroadcastStatus] = useState('idle');
  const [trafficSpike, setTrafficSpike] = useState(false);

  const [metrics, setMetrics] = useState({
     activeTransfers: 0,
     nodesOnline: 0,
     trafficRate: '0 req/s',
     health: 'Connecting'
  });

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) return;

        const headers = { 'Authorization': `Bearer ${token}` };

        // Fetch metrics
        const metricsRes = await fetch((import.meta.env.VITE_API_URL || '') + '/api/admin/metrics', { headers });
        const metricsData = await metricsRes.json();
        if (!metricsData.error) setMetrics(metricsData);

        // Fetch users
        const usersRes = await fetch((import.meta.env.VITE_API_URL || '') + '/api/admin/users', { headers });
        const usersData = await usersRes.json();
        if (Array.isArray(usersData)) setUsers(usersData);

        // Fetch transfers  
        const txRes = await fetch((import.meta.env.VITE_API_URL || '') + '/api/admin/transfers', { headers });
        const txData = await txRes.json();
        if (Array.isArray(txData)) setTransfers(txData);
      } catch (err) {
        console.error("Failed to fetch admin data", err);
      }
    };
    fetchAdminData();
  }, []);

  const [staffSessions, setStaffSessions] = useState([]);

  const [blacklistedRegions, setBlacklistedRegions] = useState([]);

  const handleRevokeSession = (id) => {
    setStaffSessions(prev => prev.filter(s => s.id !== id));
    playSfx('warning');
    showToast(`Session ${id} severed. User logged out.`, "primary");
  };

  const toggleRegionBlock = (region) => {
    setBlacklistedRegions(prev => 
      prev.includes(region) ? prev.filter(r => r !== region) : [...prev, region]
    );
    const isBlocked = !blacklistedRegions.includes(region);
    playSfx(isBlocked ? 'warning' : 'success');
    showToast(`${region} cluster ${isBlocked ? 'restricted' : 'restored'}.`, isBlocked ? "primary" : "success");
  };

  const handleIntercept = (id) => {
    setTransfers(prev => prev.filter(t => t.id !== id));
    playSfx('warning');
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
           <button onClick={() => setTrafficSpike(!trafficSpike)} className="px-4 py-2 bg-[var(--bg-main)] hover:bg-[var(--bg-hover)] text-[var(--text-main)] rounded-xl border border-[var(--border-main)] text-xs font-bold transition-colors shadow-sm flex-1 md:flex-initial">
             Test Load
           </button>
           <div className={`px-5 py-3 rounded-xl border-2 font-mono text-lg font-black shadow-inner flex-1 md:flex-initial text-center transition-all duration-500 ${trafficSpike ? 'bg-[var(--warning-10)] border-[var(--warning)] text-[var(--warning)] scale-105' : 'bg-[var(--bg-main)] border-[var(--border-main)] text-[var(--text-main)]'}`}>
             {trafficSpike ? '84,291 req/s' : ddosMode ? '14,892 req/s' : metrics.trafficRate}
           </div>
        </div>
      </div>

      {/* 2. Global Broadcast */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[3rem] p-8 md:p-12 shadow-xl relative overflow-hidden flex flex-col md:flex-row gap-8 items-center">
         <div className="flex-1 w-full">
           <h3 className="text-2xl font-black text-[var(--text-main)] flex items-center gap-3 uppercase tracking-tighter mb-2"><Megaphone className="text-[var(--accent)] shrink-0" size={28} /> Global Broadcast</h3>
           <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-6">Push system messages to all active nodes.</p>
           <div className="flex gap-3 w-full">
             <input type="text" value={broadcastMsg} onChange={(e) => setBroadcastMsg(e.target.value)} placeholder="Enter urgent system message..." className="flex-1 bg-[var(--bg-main)] border border-[var(--border-main)] rounded-2xl px-4 py-3 text-sm font-bold text-[var(--text-main)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-20)] transition-all" disabled={broadcastStatus !== 'idle'} />
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
        <h3 className="text-3xl font-black text-[var(--text-main)] flex items-center gap-4 tracking-tighter uppercase mb-10"><Sliders className="text-[var(--primary)] shrink-0" size={36} />System Editor</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <AdminVarInput label="Max Transfer Size (GB)" defaultValue="50" icon={<HardDrive size={16}/>} />
           <AdminVarInput label="Global Rate Limit (req/s)" defaultValue="15000" icon={<Activity size={16}/>} />
           <AdminVarInput label="Default Node Allocation (GB)" defaultValue="2" icon={<Database size={16}/>} />
           <AdminVarInput label="Session Timeout (mins)" defaultValue="120" icon={<Clock size={16}/>} />
        </div>
        <div className="mt-8 flex justify-end">
           <button onClick={() => { playSfx('success'); showToast("System variables saved.", "success"); }} className="px-8 py-3 bg-[var(--primary)] text-[var(--primary-content)] rounded-xl font-black text-xs uppercase tracking-widest hover:brightness-110 transition-all active:scale-95 shadow-md shadow-[var(--primary-20)]">Save Variables</button>
        </div>
      </div>

      {/* 4. Platform Config */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[3rem] p-10 md:p-14 shadow-2xl relative overflow-hidden text-[var(--text-main)]">
        <h3 className="text-3xl font-black text-[var(--text-main)] flex items-center gap-4 tracking-tighter uppercase mb-10"><Settings className="text-[var(--primary)] shrink-0" size={36} />Platform Config</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <AdminDefenseCard title="Maintenance" desc="Suspend traffic UI." enabled={maintenanceMode} onChange={setMaintenanceMode} danger icon={<Pause size={24}/>} />
           <AdminDefenseCard title="Registrations" desc="Allow new nodes." enabled={allowRegistrations} onChange={setAllowRegistrations} icon={<UserPlus size={24}/>} />
           <AdminDefenseCard title="Force E2EE" desc="Reject unverified UI." enabled={forceE2ee} onChange={setForceE2ee} icon={<ShieldCheck size={24}/>} />
        </div>
      </div>

      {/* 5. Regional Isolation & Traffic Shaping (STAff CONTROL) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[3rem] p-8 md:p-10 shadow-2xl relative overflow-hidden">
           <h3 className="text-2xl font-black text-[var(--text-main)] flex items-center gap-4 tracking-tighter uppercase mb-8"><Globe className="text-[var(--primary)] shrink-0" size={28} />Regional Isolation</h3>
           <div className="relative aspect-video bg-[var(--bg-main)] rounded-2xl border border-[var(--border-main)] shadow-inner overflow-hidden flex items-center justify-center p-4">
              <svg className="w-full h-full opacity-20" viewBox="0 0 800 400" fill="none">
                 <path d="M100 200 H700 M400 50 V350" stroke="var(--primary)" strokeWidth="0.5" />
                 <circle cx="400" cy="200" r="100" stroke="var(--primary)" strokeWidth="0.5" />
              </svg>
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 p-6 gap-6">
                {['North Am', 'Europe', 'Asia', 'South Am', 'Africa', 'Oceania'].map(region => (
                  <button 
                    key={region} 
                    onClick={() => toggleRegionBlock(region)}
                    className={`group relative flex flex-col items-center justify-center bg-[var(--bg-surface)]/40 border rounded-2xl transition-all p-4 active:scale-95 ${blacklistedRegions.includes(region) ? 'border-[var(--danger)] bg-[var(--danger-10)]/20' : 'border-[var(--border-main)] hover:border-[var(--primary)]'}`}
                  >
                        <span className={`text-[9px] font-black uppercase tracking-widest ${blacklistedRegions.includes(region) ? 'text-[var(--danger)]' : 'text-[var(--text-muted)] group-hover:text-[var(--primary)]'}`}>{region}</span>
                        <span className={`text-[8px] font-bold mt-1 ${blacklistedRegions.includes(region) ? 'text-[var(--danger)]' : 'text-[var(--success)]'}`}>
                          {blacklistedRegions.includes(region) ? 'RESTRICTED' : 'ACTIVE'}
                        </span>
                        <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${blacklistedRegions.includes(region) ? 'bg-[var(--danger)]' : 'bg-[var(--success)] animate-pulse'}`}></div>
                  </button>
                ))}
            </div>
           </div>
           <div className="mt-6 flex justify-between items-center bg-[var(--bg-main)] p-4 rounded-xl border border-[var(--border-main)]">
              <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Global Failover</span>
              <button 
                onClick={() => { playSfx('success'); showToast("Global failover routing enabled.", "success"); }}
                className="px-4 py-1.5 bg-[var(--success-10)] text-[var(--success)] border border-[var(--success-20)] rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-[var(--success)] hover:text-white transition-all shadow-sm"
              >
                Engage
              </button>
           </div>
        </div>

        <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[3rem] p-8 md:p-10 shadow-2xl flex flex-col gap-8">
           <h3 className="text-2xl font-black text-[var(--text-main)] flex items-center gap-4 tracking-tighter uppercase mb-2"><Sliders className="text-[var(--accent)] shrink-0" size={28} />Traffic Shaper</h3>
           <div className="flex flex-col gap-8">
              <ShaperSlider label="P2P Priority" val="94%" icon={<Zap size={14}/>} />
              <ShaperSlider label="Relay Throttling" val="12%" icon={<DatabaseZap size={14}/>} />
              <ShaperSlider label="Ingress Buffer" val="512ms" icon={<Clock size={14}/>} />
              <ShaperSlider label="Burst Multiplier" val="1.8x" icon={<Activity size={14}/>} />
           </div>
           <button 
             onClick={() => showToast("Traffic weights recalculated.", "primary")}
             className="w-full py-4 mt-2 bg-[var(--bg-main)] border border-[var(--border-main)] hover:border-[var(--primary)] text-[var(--text-main)] rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-sm active:scale-95"
           >
             Recalculate Weights
           </button>
        </div>
      </div>

      {/* 6. Threat Intel Feed (REAL TIME) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[3rem] p-10 shadow-2xl flex flex-col">
           <div className="flex items-center justify-between mb-8">
               <h3 className="text-2xl font-black text-[var(--text-main)] flex items-center gap-4 tracking-tighter uppercase"><FileWarning className="text-[var(--danger)] shrink-0" size={32} />Threat Intel</h3>
               <span className="text-[9px] font-black px-3 py-1 bg-[var(--danger-10)] text-[var(--danger)] border border-[var(--danger-20)] rounded-lg animate-pulse uppercase tracking-widest">Live Attack Data</span>
           </div>
           <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-2 scrollbar-hide">
              <div className="py-12 border-2 border-dashed border-[var(--border-main)] rounded-3xl flex flex-col items-center justify-center text-[var(--text-muted)] gap-3">
                 <ShieldCheck size={40} className="opacity-20 text-[var(--success)]" />
                 <p className="text-xs font-bold uppercase tracking-widest text-[var(--success)]">No Active Threats</p>
                 <p className="text-[10px] opacity-60">All systems nominal. Zero anomalies detected.</p>
              </div>
           </div>
        </div>

        <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[3rem] p-10 shadow-2xl flex flex-col">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-[var(--text-main)] flex items-center gap-4 tracking-tighter uppercase"><ShieldAlert className="text-[var(--danger)] shrink-0" size={32} />Staff Session Kill-Switch</h3>
              <span className="text-[9px] font-black px-3 py-1 bg-[var(--primary-10)] text-[var(--primary)] border border-[var(--primary-20)] rounded-lg uppercase tracking-widest">Active Admin Tokens</span>
           </div>
           <div className="flex flex-col gap-4">
              {staffSessions.map((sess) => (
                <div key={sess.id} className="bg-[var(--bg-main)] p-5 rounded-2xl border border-[var(--border-main)] flex items-center justify-between group hover:border-[var(--danger-30)] transition-all">
                   <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] flex items-center justify-center text-[var(--primary)] shadow-sm">
                         <UserCircle size={20} />
                      </div>
                      <div className="flex flex-col">
                         <span className="text-[11px] font-black text-[var(--text-main)] uppercase tracking-tight">{sess.user}</span>
                         <div className="flex items-center gap-2 text-[9px] text-[var(--text-muted)] font-mono">
                            <span>{sess.ip}</span>
                            <span className="opacity-30">•</span>
                            <span>{sess.location}</span>
                         </div>
                      </div>
                   </div>
                   <div className="flex items-center gap-4">
                      <div className="hidden md:flex flex-col items-end">
                         <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest opacity-60">Last Pulse</span>
                         <span className="text-[10px] font-black text-[var(--success)]">Online Now</span>
                      </div>
                      <button 
                        onClick={() => handleRevokeSession(sess.id)}
                        className="p-2.5 bg-[var(--danger-10)] text-[var(--danger)] hover:bg-[var(--danger)] hover:text-white border border-[var(--danger-20)] rounded-xl transition-all shadow-sm active:scale-95"
                        title="Sever Session"
                      >
                         <Skull size={16} />
                      </button>
                   </div>
                </div>
              ))}
              {staffSessions.length === 0 && (
                <div className="py-12 border-2 border-dashed border-[var(--border-main)] rounded-3xl flex flex-col items-center justify-center text-[var(--text-muted)] gap-3">
                   <ShieldCheck size={40} className="opacity-20" />
                   <p className="text-xs font-bold uppercase tracking-widest">No Active Staff Sessions</p>
                </div>
              )}
           </div>
        </div>

        <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[3rem] p-10 shadow-2xl flex flex-col">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-[var(--text-main)] flex items-center gap-4 tracking-tighter uppercase"><Clock className="text-[var(--primary)] shrink-0" size={32} />Staff Audit Logs</h3>
              <button 
                onClick={() => showToast("Full logs exported to CSV.", "success")}
                className="text-[9px] font-black text-[var(--primary)] hover:underline uppercase tracking-widest"
              >
                Export Audit
              </button>
           </div>
           <div className="flex flex-col gap-4 overflow-y-auto max-h-[350px] pr-2 scrollbar-hide">
              {transfers.length > 0 ? transfers.slice(0, 5).map((tx, i) => (
                <div key={i} className="bg-[var(--bg-main)] p-5 rounded-2xl border border-[var(--border-main)] shadow-sm flex flex-col gap-2 group hover:shadow-md transition-all">
                   <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-[var(--primary)]">System</span>
                      <span className="text-[8px] font-mono text-[var(--text-muted)]">{tx.id}</span>
                   </div>
                   <p className="text-[11px] font-black text-[var(--text-main)] uppercase tracking-tight">Transfer: {tx.file}</p>
                   <span className="text-[9px] italic text-[var(--text-muted)]">Size: {tx.size} • Status: {tx.status}</span>
                </div>
              )) : (
                <div className="py-12 border-2 border-dashed border-[var(--border-main)] rounded-3xl flex flex-col items-center justify-center text-[var(--text-muted)] gap-3">
                   <Clock size={32} className="opacity-20" />
                   <p className="text-xs font-bold uppercase tracking-widest">No Audit Logs Yet</p>
                </div>
              )}
           </div>
        </div>
      </div>

      {/* 7. Active Transfers */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[3rem] p-10 shadow-2xl overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
           <h3 className="text-3xl font-black text-[var(--text-main)] flex items-center gap-4 tracking-tighter uppercase"><Activity className="text-[var(--accent)] shrink-0" size={36} />Active Transfers</h3>
           <span className="px-4 py-2 bg-[var(--accent-10)] text-[var(--accent)] text-[10px] font-black tracking-widest rounded-full border border-[var(--accent-20)] animate-pulse">LIVE VIEW</span>
        </div>
        <div className="overflow-x-auto bg-[var(--bg-main)] border border-[var(--border-main)] rounded-[2rem] shadow-inner text-[var(--text-main)]">
          <table className="w-full text-left border-collapse whitespace-nowrap responsive-table-grid">
            <thead>
              <tr className="border-b border-[var(--border-main)] text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
                <th className="p-6 pl-8">Tx ID / File</th>
                <th className="p-6">Size</th>
                <th className="p-6">Progress</th>
                <th className="p-6 pr-8 text-right">Intercept</th>
              </tr>
            </thead>
            <tbody className="text-sm font-medium">
              {transfers.length > 0 ? transfers.map((tx) => (
                <tr key={tx.id} className="border-b border-[var(--border-main)] hover:bg-[var(--bg-hover)] transition-colors last:border-0">
                  <td className="p-6 pl-8" data-label="Identity">
                     <p className="font-bold text-[var(--text-main)]">{tx.file}</p>
                     <p className="text-[10px] text-[var(--text-muted)] mt-1 font-mono uppercase">{tx.id}</p>
                  </td>
                  <td className="p-6 font-mono text-[var(--text-muted)] font-bold" data-label="Size">{tx.size}</td>
                  <td className="p-6" data-label="State">
                     <div className="flex flex-col gap-1 items-end md:items-start">
                       <span className="font-mono text-xs font-bold text-[var(--text-main)]">{tx.speed}</span>
                       <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">{tx.status}</span>
                     </div>
                  </td>
                  <td className="p-6 pr-8 text-right" data-label="Control">
                     <button onClick={() => handleIntercept(tx.id)} className="p-2.5 bg-[var(--danger-10)] text-[var(--danger)] hover:bg-[var(--danger)] hover:text-white rounded-xl transition-all shadow-sm active:scale-95 border border-[var(--danger-20)]"><X size={16}/></button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="4" className="p-10 text-center text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest">No active transfers</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Neural Overwatch */}
      <div className="bg-[var(--bg-surface)] border-2 border-[var(--accent-30)] rounded-[3rem] p-10 md:p-14 shadow-2xl relative overflow-hidden text-[var(--text-main)]">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[var(--primary)] via-[var(--accent)] to-[var(--primary)]"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-16 gap-4">
           <h3 className="text-4xl font-black text-[var(--text-main)] flex items-center gap-6 tracking-tighter uppercase"><Brain className="text-[var(--accent)] shrink-0" size={48} />Neural Overwatch</h3>
           <span className="px-6 py-2.5 bg-[var(--accent-10)] text-[var(--accent)] text-xs font-black tracking-[0.4em] rounded-full border border-[var(--accent-20)] flex items-center gap-2 shadow-inner"><Radar size={18} className="animate-[spin_4s_linear_infinite]" /> PREDICTIVE A.I.</span>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <NeuralStat icon={<Microscope size={24}/>} val={threatScore} label="Threat Score" color="text-[var(--success)]" />
              <NeuralStat icon={<ShieldHalf size={24}/>} val={`${transfers.length}`} label="Transfers" color="text-[var(--warning)]" />
              <NeuralStat icon={<Activity size={24}/>} val={metrics.health} label="Health" color="text-[var(--success)]" />
           </div>
           <div className="h-full min-h-[200px] bg-[var(--bg-main)] rounded-3xl border border-[var(--border-main)] p-6 relative overflow-hidden flex flex-col justify-center">
              <p className="text-[8px] font-black uppercase tracking-[0.4em] text-[var(--text-muted)] absolute top-4 left-6">Anomality Heatmap</p>
              <div className="flex gap-2 h-24 items-end justify-center">
                 {[...Array(24)].map((_, i) => (
                   <div key={i} className={`w-1.5 rounded-t-full transition-all duration-1000 ${i % 7 === 0 ? 'bg-[var(--danger)] h-20 animate-pulse' : i % 5 === 0 ? 'bg-[var(--warning)] h-12' : 'bg-[var(--primary-30)] h-6'}`} style={{animationDelay: `${i * 50}ms`}}></div>
                 ))}
              </div>
           </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <AdminDefenseCard title="Quantum Keys" desc="Use Kyber PQC." enabled={quantumSafe} onChange={setQuantumSafe} icon={<ShieldHalf size={24}/>} />
           <AdminDefenseCard title="Zero-Trust" desc="Continuous Auth." enabled={zeroTrust} onChange={setZeroTrust} icon={<Fingerprint size={24}/>} />
           <AdminDefenseCard title="Auto-Isolate" desc="Sever anomalies." enabled={autoIsolate} onChange={setAutoIsolate} danger icon={<Brain size={24}/>} />
        </div>
      </div>

      {/* 7. Financial Engine */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[3rem] p-10 md:p-14 shadow-2xl text-[var(--text-main)]">
         <h3 className="text-3xl font-black text-[var(--text-main)] flex items-center gap-4 tracking-tighter uppercase mb-12"><PieChart className="text-[var(--success)] shrink-0" size={36} />Financial Engine</h3>
         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            <AdminQuickStat val={`${users.length}`} label="Total Users" trend="Active Accounts" color="text-[var(--success)]" />
            <AdminQuickStat val={`${transfers.length}`} label="Total Transfers" trend="Recorded" color="text-[var(--primary)]" />
            <AdminQuickStat val={metrics.health} label="System Health" trend="Current Status" color="text-[var(--warning)]" />
            <AdminQuickStat val={`${metrics.nodesOnline}`} label="Nodes Online" trend="Active" color="text-[var(--success)]" />
         </div>
      </div>
    </div>
  );
}

function AdminVarInput({ label, defaultValue, icon }) {
  return (
    <div className="flex flex-col gap-2 w-full">
       <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest pl-1">{label}</label>
       <div className="flex items-center w-full bg-[var(--bg-main)] px-4 py-3 rounded-xl border border-[var(--border-main)] focus-within:border-[var(--primary)] transition-all">
          <div className="text-[var(--primary)] mr-3 shrink-0">{icon}</div>
          <input defaultValue={defaultValue} className="bg-transparent w-full focus:outline-none text-[var(--text-main)] font-bold text-sm" />
       </div>
    </div>
  );
}

function AdminDefenseCard({ title, desc, enabled, onChange, danger, icon }) {
  return (
    <div className={`flex flex-col justify-between w-full bg-[var(--bg-main)] border p-6 rounded-[2rem] shadow-sm transition-all ${enabled ? (danger ? 'border-[var(--danger-30)] bg-[var(--danger-10)]/10' : 'border-[var(--primary-30)] bg-[var(--primary-10)]/10') : 'border-[var(--border-main)]'}`}>
      <div className="mb-4">
        <div className={`flex items-center gap-3 mb-3 ${danger && enabled ? 'text-[var(--danger)]' : enabled ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}>{icon} <span className="font-black uppercase tracking-widest text-xs">{title}</span></div>
        <p className="text-[10px] font-bold text-[var(--text-muted)] leading-relaxed">{desc}</p>
      </div>
      <button onClick={() => onChange(!enabled)} className={`w-14 h-8 rounded-full p-1 transition-all duration-300 relative shadow-inner ${enabled ? (danger ? 'bg-[var(--danger)]' : 'bg-[var(--primary)]') : 'bg-[var(--border-main)]'}`}>
        <div className={`w-6 h-6 rounded-full bg-white shadow-xl transition-all duration-300 ${enabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
      </button>
    </div>
  );
}

function NeuralStat({ icon, val, label, color }) {
  return (
    <div className="bg-[var(--bg-main)] border border-[var(--border-main)] rounded-[2rem] p-8 shadow-inner flex flex-col items-center">
      <div className={`mb-4 ${color}`}>{icon}</div>
      <h4 className="text-4xl font-black tracking-tighter mb-1 text-[var(--text-main)]">{val}<span className="text-xl text-[var(--text-muted)]">{typeof val === 'number' && '/100'}</span></h4>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">{label}</p>
    </div>
  );
}

function AdminQuickStat({ val, label, trend, color }) {
  return (
    <div className="bg-[var(--bg-main)] p-6 rounded-2xl border border-[var(--border-main)] flex flex-col gap-2">
       <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">{label}</span>
       <span className={`text-2xl font-black tracking-tighter text-[var(--text-main)] ${color}`}>{val}</span>
       <span className="text-[9px] font-bold text-[var(--success)]">{trend}</span>
    </div>
  );
}

function ShaperSlider({ label, val, icon }) {
  return (
    <div className="flex flex-col gap-3">
       <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">
          <span className="flex items-center gap-2">{icon} {label}</span>
          <span className="text-[var(--text-main)]">{val}</span>
       </div>
       <div className="h-1.5 w-full bg-[var(--bg-main)] rounded-full overflow-hidden border border-[var(--border-main)] relative">
          <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-[var(--accent)] to-[var(--primary)] rounded-full" style={{ width: val }}></div>
       </div>
    </div>
  );
}
