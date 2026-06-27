import React, { useEffect, useState } from 'react';
import { Laptop, Smartphone, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function DevicesView() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;

        const res = await fetch((import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'production' ? 'https://zepglide.onrender.com' : '')) + '/api/devices', {
           headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        const data = await res.json();
        setDevices(data);
      } catch (err) {
        console.error('Failed to fetch devices', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDevices();
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto py-4 animate-in fade-in duration-500">
      <header className="mb-10 text-center md:text-left">
        <h2 className="text-3xl font-black text-[var(--text-main)] tracking-tighter uppercase">Authorized Nodes</h2>
      </header>
      
      {loading ? (
        <div className="flex justify-center p-12">
           <div className="h-8 w-8 rounded-full border-4 border-[var(--primary-20)] border-t-[var(--primary)] animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {devices.map((dev) => (
            <div key={dev.id} className={`group border rounded-[2rem] p-8 relative shadow-sm hover:shadow-xl transition-all duration-500 ${dev.isCurrent ? 'bg-[var(--primary-10)] border-[var(--primary-30)]' : 'bg-[var(--bg-surface)] border-[var(--border-main)] hover:border-[var(--primary-30)]'}`}>
              <div className={`absolute top-6 right-6 flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${dev.isCurrent ? 'bg-[var(--bg-surface)] text-[var(--primary)] shadow-sm' : 'bg-[var(--bg-main)] text-[var(--text-muted)]'}`}>
                {dev.isCurrent && <div className="h-1.5 w-1.5 rounded-full bg-[var(--success)] animate-pulse"></div>}
                {dev.status}
              </div>
              {dev.type === 'Mobile' ? (
                <Smartphone size={40} className={`mb-6 transition-all ${dev.isCurrent ? 'text-[var(--primary)] group-hover:scale-110' : 'text-[var(--text-muted)] opacity-30 group-hover:text-[var(--primary)] group-hover:opacity-100'}`} />
              ) : (
                <Laptop size={40} className={`mb-6 transition-all ${dev.isCurrent ? 'text-[var(--primary)] group-hover:scale-110' : 'text-[var(--text-muted)] opacity-30 group-hover:text-[var(--primary)] group-hover:opacity-100'}`} />
              )}
              <h3 className="text-xl font-black text-[var(--text-main)] tracking-tight truncate">{dev.name}</h3>
              <p className="text-sm text-[var(--text-muted)] font-medium uppercase tracking-widest mb-1">{dev.location}</p>
              {!dev.isCurrent && dev.lastSeen && <p className="text-xs text-[var(--text-muted)] opacity-70">Last seen: {new Date(dev.lastSeen).toLocaleString()}</p>}
            </div>
          ))}
        </div>
      )}
      <div className="mt-10 border-2 border-dashed border-[var(--border-main)] text-[var(--text-muted)] w-full rounded-[2rem] p-10 font-black uppercase flex items-center justify-center gap-3 tracking-widest text-xs">
         <Plus size={20} /> New devices are paired automatically when you log in.
      </div>
    </div>
  );
}

