import React, { useState, useEffect } from 'react';
import { 
  BadgeCheck, ShieldAlert, Mail, MapPin, Globe, HardDrive, Shield, Lock, 
  Settings, LogOut, Activity, ArrowUpRight, ArrowDownLeft, Copy, CheckCircle2, 
  ChevronRight, Crown, Trophy, Key 
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const MetricItem = ({ icon, label, val }) => (
  <div className="flex items-center justify-between group cursor-default">
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-lg bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-main)] group-hover:text-[var(--primary)] group-hover:border-[var(--primary-20)] transition-all">
        {icon}
      </div>
      <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition-colors">{label}</span>
    </div>
    <span className="font-mono text-xs font-bold text-[var(--text-main)]">{val}</span>
  </div>
);

const TrustMeter = ({ score }) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center h-28 w-28 group">
      <svg className="h-full w-full -rotate-90">
        <circle cx="56" cy="56" r={radius} fill="transparent" stroke="var(--bg-main)" strokeWidth="8" />
        <circle 
          cx="56" cy="56" r={radius} fill="transparent" stroke="var(--primary)" strokeWidth="8" 
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-1000 ease-out shadow-[0_0_15px_var(--primary-30)]"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-xl font-black text-[var(--text-main)]">{score}%</span>
        <span className="text-[7px] font-black uppercase tracking-widest text-[var(--text-muted)]">Trust</span>
      </div>
    </div>
  );
};

const ActivityItem = ({ time, action, target, icon }) => (
  <div className="flex gap-4 group">
    <div className="flex flex-col items-center">
      <div className="p-1.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-muted)] group-hover:text-[var(--primary)] group-hover:border-[var(--primary-30)] transition-all">
        {icon}
      </div>
      <div className="w-0.5 flex-1 bg-[var(--border-main)] my-1"></div>
    </div>
    <div className="flex-1 pb-6">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] font-black text-[var(--text-main)] uppercase tracking-tight">{action}</span>
        <span className="text-[8px] font-mono text-[var(--text-muted)]">{time}</span>
      </div>
      <p className="text-[9px] text-[var(--text-muted)] italic">Target: {target}</p>
    </div>
  </div>
);

function getInitials(name) {
  if (!name || name === 'Loading...') return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

export default function ProfileView({ onLogout, profile, isAdmin, onEditClick, showToast }) {
  const [copiedField, setCopiedField] = useState(null);
  const [stats, setStats] = useState({
    totalHandshakes: 0,
    totalSent: '0 MB',
    totalReceived: '0 MB',
    trustScore: 50,
    storageUsed: '0',
    storageLimit: 50,
    recentActivity: []
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;

        const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/profile/stats', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        const data = await res.json();
        if (!data.error) setStats(data);
      } catch (err) {
        console.error("Failed to fetch profile stats", err);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleCopy = (text, field) => {
    try { 
      navigator.clipboard.writeText(text); 
      setCopiedField(field);
      showToast(`Copied ${field} to clipboard!`, 'success');
      setTimeout(() => setCopiedField(null), 2000);
    } catch (e) {
      console.error("Clipboard copy failed", e);
    }
  };

  const initials = getInitials(profile.name);

  return (
    <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto mt-2 pb-12 animate-in fade-in duration-500">
      <div className="bg-[var(--bg-surface)] border-2 border-[var(--border-main)] hover:shadow-[0_40px_80px_rgba(0,0,0,0.2)] rounded-[3rem] p-8 md:p-12 shadow-2xl relative overflow-hidden transition-all duration-700">
        <div className="absolute top-0 right-0 p-32 bg-[var(--primary-10)] rounded-full blur-[100px] pointer-events-none"></div>
        <div className="flex flex-col lg:flex-row gap-12 w-full relative z-10">
          <div className="flex-1 flex flex-col gap-10">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-10">
               <div className="relative shrink-0 group/avatar">
                 <div className="h-32 w-32 md:h-40 md:w-40 rounded-[2.5rem] md:rounded-[3rem] bg-[var(--bg-main)] flex items-center justify-center shadow-2xl border-4 border-[var(--bg-surface)] z-10 relative transition-all duration-500 -rotate-3 group-hover/avatar:rotate-0 group-hover/avatar:scale-105 overflow-hidden">
                   {profile.avatar_url ? (
                     <img src={profile.avatar_url} alt={profile.name} className="h-full w-full object-cover" />
                   ) : (
                     <span className="text-4xl md:text-6xl font-black text-[var(--text-main)] drop-shadow-2xl">{initials}</span>
                   )}
                   <div className="absolute inset-0 rounded-[2.5rem] md:rounded-[3rem] bg-gradient-to-tr from-[var(--primary-20)] to-transparent opacity-0 group-hover/avatar:opacity-100 transition-opacity"></div>
                 </div>
                 <div className="absolute -bottom-2 -right-2 h-8 w-8 md:h-10 md:w-10 bg-[var(--success)] rounded-full border-4 border-[var(--bg-surface)] z-20 shadow-xl flex items-center justify-center text-white"><Shield size={16} /></div>
               </div>

               <div className="flex flex-col gap-5 text-center md:text-left flex-1">
                 <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                   <h2 className="text-3xl md:text-5xl font-black text-[var(--text-main)] uppercase tracking-tighter drop-shadow-sm">{profile.name}</h2>
                   <BadgeCheck size={28} className="text-[var(--primary)] drop-shadow-[0_0_8px_var(--primary-30)]" />
                 </div>
                 
                 <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 md:gap-3">
                   {(profile.plan === 'Pro' || profile.plan === 'Teams' || profile.plan === 'Enterprise') && (
                     <span className="px-3 md:px-4 py-1 bg-[var(--warning-10)] text-[var(--warning)] border border-[var(--warning-20)] text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm flex items-center gap-1.5"><Crown size={12} /> {profile.plan}</span>
                   )}
                   {stats.totalHandshakes >= 10 && (
                     <span className="px-3 md:px-4 py-1 bg-[var(--accent-10)] text-[var(--accent)] border border-[var(--accent-20)] text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm flex items-center gap-1.5"><Trophy size={12} /> Power User</span>
                   )}
                   <span className="px-3 md:px-4 py-1 bg-[var(--primary-10)] text-[var(--primary)] border border-[var(--primary-20)] text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm flex items-center gap-1.5"><Shield size={12} /> Secure</span>
                 </div>

                 <p className="text-sm md:text-base font-bold text-[var(--text-muted)] italic max-w-md leading-relaxed opacity-80 decoration-[var(--primary-30)] underline decoration-2 underline-offset-4">"{profile.bio || 'No bio set yet.'}"</p>

                 <div className="flex flex-col gap-3 mt-4 text-sm font-bold text-[var(--text-muted)] items-center md:items-start">
                    <div className="flex items-center gap-4 group cursor-pointer" onClick={() => handleCopy(profile.email, 'email')}>
                       <div className="p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--primary)] shadow-sm group-hover:border-[var(--primary-30)] transition-all"><Mail size={18} /></div>
                       <div className="flex flex-col">
                          <span className="text-[9px] uppercase tracking-[0.2em] opacity-60">Communication Protocol</span>
                          <span className="group-hover:text-[var(--text-main)] transition-colors">{profile.email}</span>
                       </div>
                    </div>

                    <div className="flex items-center gap-4 group">
                       <div className="p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--success)] shadow-sm group-hover:border-[var(--success-30)] transition-all"><MapPin size={18} /></div>
                       <div className="flex flex-col">
                          <span className="text-[9px] uppercase tracking-[0.2em] opacity-60">Physical Cluster</span>
                          <span className="group-hover:text-[var(--text-main)] transition-colors">
                            {profile.location || 'Not set'} ({ {
                              'US': 'United States', 'BD': 'Bangladesh', 'GB': 'United Kingdom',
                              'DE': 'Germany', 'JP': 'Japan', 'BR': 'Brazil',
                              'AU': 'Australia', 'IN': 'India', 'FR': 'France'
                            }[profile.countryCode] || profile.countryCode || 'Global' })
                          </span>
                       </div>
                    </div>
                 </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-[var(--border-main)]">
               <div className="flex flex-col gap-8">
                  <div className="flex items-center gap-8 bg-[var(--bg-main)] p-6 rounded-[2.5rem] border border-[var(--border-main)] shadow-inner">
                     <TrustMeter score={stats.trustScore} />
                     <div className="flex-1 flex flex-col gap-2">
                        <h4 className="text-sm font-black text-[var(--text-main)] uppercase tracking-tighter">Identity Maturity</h4>
                        <p className="text-[10px] font-bold text-[var(--text-muted)] leading-relaxed">
                          {stats.trustScore >= 75 ? 'Your node integrity is high.' : 'Complete more transfers and verify email to increase trust.'}
                        </p>
                        <div className="flex gap-2 mt-1">
                           <span className={`px-2 py-0.5 text-[7px] font-black rounded uppercase border ${stats.trustScore >= 75 ? 'bg-[var(--success-10)] text-[var(--success)] border-[var(--success-20)]' : 'bg-[var(--warning-10)] text-[var(--warning)] border-[var(--warning-20)]'}`}>Email {stats.trustScore >= 75 ? 'Verified' : 'Pending'}</span>
                        </div>
                     </div>
                  </div>

                  <div className="flex flex-col gap-2">
                     <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">
                        <span>Cluster Storage Usage</span>
                        <span className="text-[var(--primary)]">{stats.storageUsed} / {stats.storageLimit} GB</span>
                     </div>
                     <div className="w-full h-3 bg-[var(--bg-main)] rounded-xl overflow-hidden border border-[var(--border-main)] shadow-inner p-0.5">
                        <div className="h-full bg-gradient-to-r from-[var(--primary)] via-[var(--accent)] to-[var(--primary)] rounded-lg relative animate-in fade-in duration-1000 slide-in-from-left-8" style={{ width: `${Math.min(100, (parseFloat(stats.storageUsed) / stats.storageLimit) * 100)}%` }}>
                           <div className="absolute top-0 right-0 w-8 h-full bg-white/30 blur-md"></div>
                        </div>
                     </div>
                  </div>

                  <div className="flex gap-4">
                     <button onClick={onEditClick} className="flex-1 bg-[var(--bg-main)] text-[var(--text-main)] hover:bg-[var(--bg-hover)] active:scale-95 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all border border-[var(--border-main)] shadow-sm flex items-center justify-center gap-2">
                       <Settings size={16} /> Identity Core
                     </button>
                     <button onClick={onLogout} className="text-[var(--danger)] hover:bg-[var(--danger-10)] border border-[var(--danger-20)] px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95">
                       <LogOut size={16} /> Sever Node
                     </button>
                  </div>
               </div>

               <div className="bg-[var(--bg-main)] p-8 rounded-[3rem] border border-[var(--border-main)] shadow-inner flex flex-col gap-6 overflow-hidden">
                  <div className="flex items-center justify-between border-b border-[var(--border-main)] pb-4">
                    <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[var(--text-muted)]">Recent Pulse Activity</span>
                    <Activity size={14} className="text-[var(--primary)] animate-pulse" />
                  </div>
                  <div className="flex flex-col">
                    {stats.recentActivity.length > 0 ? (
                      stats.recentActivity.map((act, i) => (
                        <ActivityItem key={i} icon={<ArrowUpRight size={14}/>} action={act.action} target={act.target} time={act.time} />
                      ))
                    ) : (
                      <div className="py-8 text-center text-[var(--text-muted)]">
                        <Activity size={24} className="mx-auto mb-3 opacity-20" />
                        <p className="text-[10px] font-black uppercase tracking-widest">No activity yet</p>
                        <p className="text-[9px] mt-1 opacity-60">Send your first file to see activity here</p>
                      </div>
                    )}
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <ProfileStat icon={<Activity size={24} />} val={stats.totalHandshakes.toLocaleString()} label="Total Handshakes" color="text-[var(--success)]" delay="100ms" />
        <ProfileStat icon={<ArrowUpRight size={24} />} val={stats.totalSent} label="Mirrored" color="text-[var(--primary)]" delay="200ms" />
        <ProfileStat icon={<ArrowDownLeft size={24} />} val={stats.totalReceived} label="Received" color="text-[var(--accent)]" delay="300ms" />
        <ProfileStat icon={<Lock size={24} />} val={`${stats.trustScore}%`} label="Node Trust" color="text-[var(--success)]" delay="400ms" />
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
