import React, { useState, useRef } from 'react';
import { User, UploadCloud, Edit3, Mail, FileText, MapPin, Globe, HardDrive, Shield, Lock, Save, Palette, Cpu, Network, Zap, RefreshCw } from 'lucide-react';

import { supabase } from '../../lib/supabase';

export default function SettingsView({ isDarkMode, setIsDarkMode, activeTheme, setActiveTheme, themes, profile, setProfile, preferences, setPreferences, showToast, customTheme, setCustomTheme }) {
  const handleProfileChange = (key, value) => setProfile(prev => ({ ...prev, [key]: value }));
  const handlePrefChange = (key, value) => setPreferences(prev => ({ ...prev, [key]: value }));

  const fileInputRef = useRef(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const isPro = profile?.plan === 'Pro' || profile?.plan === 'Teams';

  const handleCustomThemeChange = (key, value) => {
    const updatedCustom = { ...customTheme, [key]: value };
    setCustomTheme(updatedCustom);
    handlePrefChange('customTheme', updatedCustom);
  };

  const handleAvatarSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('Avatar must be under 2MB', 'error');
      return;
    }

    setUploadingAvatar(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      showToast('Uploading avatar...', 'info');

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', session.user.id);

      if (updateError) throw updateError;

      handleProfileChange('avatar_url', publicUrl);
      showToast('Avatar updated successfully', 'success');

    } catch (err) {
      console.error('Avatar upload error:', err);
      showToast(err.message || 'Failed to upload avatar', 'error');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const saveSettings = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch((import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'production' ? 'https://zepglide.onrender.com' : '')) + '/api/profile', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ profile, preferences })
      });
      if (res.ok) {
        showToast("Identity settings saved successfully!", "success");
      }
    } catch (e) {
      showToast("Offline mode: settings saved locally.", "warning");
      console.error(e);
    }
  };

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
                 <input type="file" ref={fileInputRef} className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleAvatarSelect} />
                 <div onClick={() => !uploadingAvatar && fileInputRef.current?.click()} className={`h-36 w-36 rounded-[2.5rem] bg-[var(--bg-main)] flex items-center justify-center shadow-xl border-4 border-[var(--bg-surface)] cursor-pointer group/upload relative overflow-hidden transition-transform ${uploadingAvatar ? 'opacity-70' : 'hover:scale-105'}`}>
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-5xl font-black text-[var(--text-main)] drop-shadow-md">{profile.name ? profile.name.split(/\s+/).map(w => w[0]).join('').toUpperCase().substring(0,2) : '??'}</span>
                    )}
                    
                    <div className={`absolute inset-0 bg-[var(--bg-main)]/90 backdrop-blur-sm flex flex-col items-center justify-center ${uploadingAvatar ? 'opacity-100' : 'opacity-0 group-hover/upload:opacity-100'} transition-opacity`}>
                       {uploadingAvatar ? (
                         <RefreshCw size={28} className="text-[var(--primary)] mb-2 animate-spin" />
                       ) : (
                         <UploadCloud size={28} className="text-[var(--primary)] mb-2" />
                       )}
                       <span className="text-[10px] font-black uppercase text-[var(--primary)] tracking-widest">{uploadingAvatar ? 'Uploading' : 'Update'}</span>
                    </div>
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 text-[var(--text-main)]">
                  <SettingInput label="Full Name" value={profile.name} onChange={v => handleProfileChange('name', v)} icon={<Edit3 size={16} className="text-[var(--primary)]"/>} />
                  <SettingInput label="Email Address" value={profile.email} onChange={v => handleProfileChange('email', v)} icon={<Mail size={16} className="text-[var(--primary)]"/>} />
                  <div className="md:col-span-2">
                    <SettingInput label="Short Bio" value={profile.bio} onChange={v => handleProfileChange('bio', v)} icon={<FileText size={16} className="text-[var(--primary)]"/>} />
                  </div>
                  <SettingInput label="Location" value={profile.location} onChange={v => handleProfileChange('location', v)} icon={<MapPin size={16} className="text-[var(--success)]"/>} />
                  <div className="flex flex-col gap-2 w-full">
                      <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest pl-1">Network Cluster (Country)</label>
                      <div className="flex items-center w-full bg-[var(--bg-main)] px-4 py-3 rounded-xl border border-[var(--border-main)] focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--primary-10)] transition-all">
                        <div className="mr-3 shrink-0"><Globe size={16} className="text-[var(--primary)]"/></div>
                        <select 
                          value={profile.countryCode} 
                          onChange={e => handleProfileChange('countryCode', e.target.value)}
                          className="bg-transparent w-full focus:outline-none text-[var(--text-main)] font-bold text-sm appearance-none cursor-pointer"
                        >
                          <option value="US">United States (US-West)</option>
                          <option value="BD">Bangladesh (AS-South)</option>
                          <option value="GB">United Kingdom (EU-West)</option>
                          <option value="DE">Germany (EU-Central)</option>
                          <option value="JP">Japan (AS-North)</option>
                          <option value="BR">Brazil (SA-East)</option>
                          <option value="AU">Australia (OC-South)</option>
                          <option value="IN">India (AS-Central)</option>
                          <option value="FR">France (EU-South)</option>
                        </select>
                      </div>
                  </div>
                  <SettingInput label="Website URL" value={profile.website} onChange={v => handleProfileChange('website', v)} icon={<Globe size={16} className="text-[var(--accent)]"/>} />
               </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-[var(--border-main)] flex flex-col md:flex-row items-center justify-between gap-6">
               <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm font-bold text-[var(--text-muted)] w-full">
                  <div className="flex items-center gap-2 bg-[var(--bg-main)] px-4 py-2.5 rounded-xl border border-[var(--border-main)] shadow-sm"><HardDrive size={16} className="text-[var(--primary)]"/><span>Cloud Storage</span></div>
                  <div className="flex items-center gap-2 bg-[var(--bg-main)] px-4 py-2.5 rounded-xl border border-[var(--border-main)] shadow-sm"><Shield size={16} className="text-[var(--success)]"/><span>{profile.role}</span></div>
                  <div className="flex items-center gap-2 bg-[var(--bg-main)] px-4 py-2.5 rounded-xl border border-[var(--border-main)] shadow-sm"><Lock size={16} className="text-[var(--warning)]"/><span className="text-[var(--success)]">Hardware Key (2FA)</span></div>
               </div>
               <button onClick={saveSettings} className="bg-[var(--primary)] text-[var(--primary-content)] hover:brightness-110 active:scale-95 px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-[var(--primary-20)] whitespace-nowrap w-full md:w-auto">
                  <Save size={16} /> Save Changes
               </button>
            </div>
          </div>
        </div>

        <div className="bg-[var(--bg-surface)] border-2 border-[var(--primary-30)] rounded-[3rem] p-8 md:p-10 shadow-2xl relative overflow-hidden transition-all duration-500">
           <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[var(--primary)] via-[var(--accent)] to-[var(--success)]"></div>
           <h3 className="text-2xl font-black text-[var(--text-main)] flex items-center gap-3 uppercase tracking-tighter mb-8"><Cpu size={28} className="text-[var(--primary)]" /> Advanced Engine Protocols</h3>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ProtocolCard 
                title="WebTransport (QUIC)" 
                desc="Prioritize HTTP/3 QUIC connections over standard WebRTC to eliminate head-of-line blocking." 
                icon={<Network size={20}/>} 
                enabled={preferences.useWebTransport} 
                onChange={v => handlePrefChange('useWebTransport', v)} 
                color="text-[var(--primary)]"
              />
              <ProtocolCard 
                title="WebGPU Compression" 
                desc="Offload Zstd stream compression to the Graphics Card for exponential speed increases." 
                icon={<Zap size={20}/>} 
                enabled={preferences.useWebGPU} 
                onChange={v => handlePrefChange('useWebGPU', v)} 
                color="text-[var(--accent)]"
              />
              <ProtocolCard 
                title="Cloud Bridge" 
                desc="Automatically upload encrypted chunks to Zepglide Vaults if P2P fails." 
                icon={<UploadCloud size={20}/>} 
                enabled={preferences.cloudBridgeFallback} 
                onChange={v => handlePrefChange('cloudBridgeFallback', v)} 
                color="text-[var(--warning)]"
                locked={!isPro}
              />
           </div>
        </div>

        <div className="bg-[var(--bg-surface)] border-2 border-[var(--border-main)] rounded-[3rem] p-8 md:p-12 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-12 gap-6">
            <h3 className="text-2xl font-black text-[var(--text-main)] flex items-center gap-4 uppercase tracking-tighter"><Palette size={32} className="text-[var(--primary)]" /> Visual Profiles</h3>
            <div className="flex items-center gap-5 bg-[var(--bg-main)] px-6 py-4 rounded-[1.5rem] border border-[var(--border-main)] shadow-inner">
              <span className="text-[10px] font-black text-[var(--text-main)] uppercase tracking-[0.3em]">Dark Mode Protocol</span>
              <ToggleSwitch enabled={isDarkMode} onChange={v => setIsDarkMode(v)} />
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-6">
            {Object.entries(themes).map(([key, themeData]) => (
              <button 
                key={key} 
                onClick={() => setActiveTheme(key)} 
                className={`p-6 rounded-[2.5rem] border-2 flex flex-col items-center gap-5 transition-all duration-500 active:scale-95 ${activeTheme === key ? 'border-[var(--primary)] bg-[var(--primary-10)] shadow-2xl scale-105' : 'border-[var(--border-main)] bg-[var(--bg-main)] hover:border-[var(--primary-30)]'}`}
              >
                <div className="flex w-full h-14 rounded-[1.25rem] overflow-hidden border-2 border-[var(--border-main)] shadow-lg">
                   <div className="flex-1" style={{backgroundColor: themeData.dark.bgMain}}></div>
                   <div className="flex-1" style={{backgroundColor: themeData.primary}}></div>
                </div>
                <span className="text-[10px] font-black text-[var(--text-main)] uppercase tracking-[0.2em] truncate w-full text-center">{themeData.name.split(' ')[0]}</span>
              </button>
            ))}
            
            {/* Custom Brand Option */}
            <button 
              onClick={() => {
                if (isPro) setActiveTheme('custom');
                else showToast("Custom branding requires a Pro plan.", "warning");
              }} 
              className={`p-6 rounded-[2.5rem] border-2 flex flex-col items-center gap-5 transition-all duration-500 relative ${activeTheme === 'custom' ? 'border-[var(--primary)] bg-[var(--primary-10)] shadow-2xl scale-105' : 'border-[var(--border-main)] bg-[var(--bg-main)] hover:border-[var(--primary-30)]'}`}
            >
              {!isPro && <div className="absolute inset-0 bg-[var(--bg-main)]/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-[2.5rem]"><Lock size={20} className="text-[var(--warning)] mb-1"/><span className="text-[10px] font-black uppercase text-[var(--text-main)] tracking-widest">Pro</span></div>}
              <div className="flex w-full h-14 rounded-[1.25rem] overflow-hidden border-2 border-[var(--border-main)] shadow-lg bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500">
              </div>
              <span className="text-[10px] font-black text-[var(--text-main)] uppercase tracking-[0.2em] truncate w-full text-center">Custom</span>
            </button>
          </div>

          {activeTheme === 'custom' && (
            <div className="mt-8 pt-8 border-t border-[var(--border-main)] animate-in fade-in slide-in-from-top-4 duration-300">
              <h4 className="text-sm font-black uppercase tracking-widest text-[var(--text-main)] mb-6 flex items-center gap-2"><Palette size={16} className="text-[var(--primary)]"/> Custom Brand Configuration</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                 <div className="flex flex-col gap-2">
                   <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Primary Color</label>
                   <input type="color" value={customTheme?.primary || '#10B981'} onChange={e => handleCustomThemeChange('primary', e.target.value)} className="w-full h-12 rounded-xl cursor-pointer bg-[var(--bg-main)] border border-[var(--border-main)] p-1" />
                 </div>
                 <div className="flex flex-col gap-2">
                   <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Background Main</label>
                   <input type="color" value={customTheme?.bgMain || '#000000'} onChange={e => handleCustomThemeChange('bgMain', e.target.value)} className="w-full h-12 rounded-xl cursor-pointer bg-[var(--bg-main)] border border-[var(--border-main)] p-1" />
                 </div>
                 <div className="flex flex-col gap-2">
                   <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Background Surface</label>
                   <input type="color" value={customTheme?.bgSurface || '#111111'} onChange={e => handleCustomThemeChange('bgSurface', e.target.value)} className="w-full h-12 rounded-xl cursor-pointer bg-[var(--bg-main)] border border-[var(--border-main)] p-1" />
                 </div>
                 <div className="flex flex-col gap-2 sm:col-span-3">
                   <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Brand Logo URL</label>
                   <input type="text" placeholder="https://..." value={customTheme?.logoUrl || ''} onChange={e => handleCustomThemeChange('logoUrl', e.target.value)} className="w-full bg-[var(--bg-main)] px-4 py-3 rounded-xl border border-[var(--border-main)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-10)] text-[var(--text-main)] font-bold text-sm focus:outline-none transition-all" />
                 </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function SettingInput({ label, value, onChange, icon }) {
  return (
    <div className="flex flex-col gap-2 w-full">
       <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest pl-1">{label}</label>
       <div className="flex items-center w-full bg-[var(--bg-main)] px-4 py-3 rounded-xl border border-[var(--border-main)] focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--primary-10)] transition-all">
          <div className="mr-3 shrink-0">{icon}</div>
          <input value={value} onChange={e => onChange(e.target.value)} className="bg-transparent w-full focus:outline-none text-[var(--text-main)] font-bold text-sm" />
       </div>
    </div>
  );
}

function ProtocolCard({ title, desc, icon, enabled, onChange, color, locked }) {
  return (
    <div className="flex flex-col justify-between w-full bg-[var(--bg-main)] border border-[var(--border-main)] px-6 py-6 rounded-[2rem] shadow-sm hover:border-[var(--primary-30)] transition-colors relative overflow-hidden">
       {locked && <div className="absolute inset-0 bg-[var(--bg-main)]/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center p-4"><Lock size={20} className="text-[var(--warning)] mb-2"/><span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-main)]">Pro Feature</span></div>}
       <div>
          <div className={`flex items-center gap-2 ${color} mb-3`}>{icon} <span className="font-black uppercase tracking-widest text-xs">{title}</span></div>
          <p className="text-[10px] font-bold text-[var(--text-muted)] mb-6 leading-relaxed">{desc}</p>
       </div>
       <ToggleSwitch enabled={enabled} onChange={onChange} />
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

