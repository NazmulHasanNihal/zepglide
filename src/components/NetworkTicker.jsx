import React, { useEffect, useState } from 'react';
import { Activity, Globe, ShieldCheck, Zap } from 'lucide-react';

const NetworkTicker = () => {
  const [events, setEvents] = useState([]);
  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const res = await fetch('/api/telemetry');
        const data = await res.json();
        if (data && data.length > 0) {
          setEvents(data);
        } else {
          // Fallback message if db is empty
          setEvents([{ id: 'init', type: 'System', msg: 'Zepglide Grid Initialized', time: new Date().toLocaleTimeString() }]);
        }
      } catch (err) {
        console.error('Failed to fetch telemetry', err);
      }
    };
    
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-8 bg-[var(--bg-surface)]/40 backdrop-blur-md border-t border-[var(--border-main)] flex items-center px-6 overflow-hidden select-none fixed bottom-0 w-full z-[100]">
      <div className="flex items-center gap-2 mr-8 shrink-0">
        <div className="h-2 w-2 rounded-full bg-[var(--success)] animate-pulse"></div>
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-main)]">Live Network Telemetry</span>
      </div>
      
      <div className="flex gap-12 animate-marquee whitespace-nowrap items-center">
        {events.map((e) => (
          <div key={e.id} className="flex items-center gap-2 text-[var(--text-muted)] text-[9px] font-bold uppercase transition-all">
            <span className="text-[var(--primary)]">[{e.type}]</span>
            <span className="opacity-80">{e.msg}</span>
            {e.time && <span className="text-[var(--success)] px-1.5 py-0.5 bg-[var(--success-10)] rounded font-mono">{e.time}</span>}
          </div>
        ))}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}} />
    </div>
  );
};

export default NetworkTicker;
