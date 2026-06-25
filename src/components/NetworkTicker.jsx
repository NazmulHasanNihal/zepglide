import React, { useEffect, useState } from 'react';

const SYSTEM_MESSAGES = [
  { id: 1, type: 'SYSTEM', msg: 'GLOBAL ROUTING OPTIMAL' },
  { id: 2, type: 'SECURITY', msg: 'END-TO-END ENCRYPTION ACTIVE' },
  { id: 3, type: 'NETWORK', msg: 'LATENCY < 15MS (GLOBAL AVERAGE)' },
  { id: 4, type: 'CAPACITY', msg: 'BANDWIDTH RESERVES AT 98%' },
  { id: 5, type: 'NODES', msg: 'PEER-TO-PEER MESH STABLE' },
  { id: 6, type: 'STATUS', msg: 'ALL RELAYS OPERATIONAL' },
  { id: 7, type: 'INTEGRITY', msg: 'ZERO-KNOWLEDGE PROTOCOL ENFORCED' }
];

const NetworkTicker = () => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const generateEvents = () => {
      const now = new Date();
      return SYSTEM_MESSAGES.map((msg, idx) => ({
        ...msg,
        id: `${msg.id}-${Date.now()}`,
        time: new Date(now.getTime() - (idx * 5000)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      }));
    };
    
    // Duplicate the array to create a seamless scrolling loop
    setEvents([...generateEvents(), ...generateEvents()]);
    
    const interval = setInterval(() => {
       setEvents([...generateEvents(), ...generateEvents()]);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-8 bg-[var(--bg-surface)]/80 backdrop-blur-md border-t border-[var(--border-main)] flex items-center px-6 overflow-hidden select-none fixed bottom-0 w-full z-[100] shadow-xl">
      <div className="flex items-center gap-2 mr-8 shrink-0">
        <div className="h-2 w-2 rounded-full bg-[var(--success)] animate-pulse shadow-[0_0_8px_var(--success)]"></div>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-main)] mt-[1px]">System Status</span>
      </div>
      
      <div className="flex gap-16 animate-marquee w-max items-center">
        {events.map((e, index) => (
          <div key={`${e.id}-${index}`} className="flex items-center gap-2 text-[var(--text-muted)] text-[10px] font-bold uppercase transition-all">
            <span className="text-[var(--primary)]">[{e.type}]</span>
            <span className="opacity-90 tracking-wide text-[var(--text-main)]">{e.msg}</span>
            <span className="text-[var(--success)] px-1.5 py-0.5 bg-[var(--success-10)] rounded border border-[var(--success-20)] font-mono ml-1">{e.time}</span>
          </div>
        ))}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
      `}} />
    </div>
  );
};

export default NetworkTicker;
