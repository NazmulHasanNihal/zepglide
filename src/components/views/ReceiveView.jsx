import React, { useState, useEffect } from 'react';
import { Download, Radar, CheckCircle2, FileText, Smartphone, Gauge, Activity, Clock, ShieldAlert, RefreshCw, File as FileIcon } from 'lucide-react';
import { useWebRTC } from '../../hooks/useWebRTC';

export default function ReceiveView({ showToast, playSfx }) {
  const [pin, setPin] = useState('');
  const { status, progress, speed, eta, metadata, receivedFile, joinSession, cancelTransfer, retryTransfer } = useWebRTC();
  
  const facts = ["Bypassing Symmetric NAT...", "Establishing Quantum-Safe Keys...", "Securing P2P WebRTC Layer...", "Discovering Mesh Route..."];
  const [factIndex, setFactIndex] = useState(0);

  useEffect(() => {
     if (status !== 'connecting') return;
     const interval = setInterval(() => setFactIndex(i => (i + 1) % facts.length), 2000);
     return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    // Check URL for pin
    const params = new URLSearchParams(window.location.search);
    const pinParam = params.get('pin');
    if (pinParam && pinParam.length === 6 && status === 'idle') {
      setPin(pinParam);
      joinSession(pinParam);
    }
  }, [joinSession, status]);

  const handleJoin = () => {
    if (pin.length === 6) {
      joinSession(pin);
    } else {
      showToast("Please enter a 6-digit PIN", "info");
    }
  };

  const handlePinChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newPinArr = pin.split('');
    newPinArr[index] = value.slice(-1);
    const newPin = newPinArr.join('');
    setPin(newPin);
    
    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.querySelector(`input[data-index="${index + 1}"]`);
      if (nextInput) nextInput.focus();
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto mt-8 md:mt-24 animate-in fade-in zoom-in duration-300">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] p-8 md:p-12 rounded-[2.5rem] shadow-2xl w-full text-center relative overflow-hidden">
        
        {status === 'connecting' || status === 'connected' ? (
           <div className="flex flex-col items-center py-6 animate-in fade-in duration-500">
              <div className="relative w-48 h-48 flex items-center justify-center mb-12">
                 <div className="absolute inset-0 border-2 border-[var(--primary-20)] rounded-full"></div>
                 <div className="absolute inset-8 border border-[var(--primary-10)] rounded-full"></div>
                 <div className="absolute inset-0 border-r-2 border-[var(--primary)] rounded-full animate-radar origin-center opacity-50 shadow-[0_0_15px_var(--primary)]"></div>
                 
                 <div className="relative z-10 h-16 w-16 bg-[var(--bg-main)] rounded-full flex items-center justify-center border border-[var(--border-main)] shadow-xl">
                    <Radar size={32} className="text-[var(--primary)] animate-pulse" />
                 </div>
              </div>
              
              <h2 className="text-2xl font-black text-[var(--text-main)] mb-3 tracking-tighter uppercase">{status === 'connecting' ? 'Scanning Swarm' : 'Sync Established'}</h2>
              <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] mb-10 animate-pulse">{status === 'connecting' ? 'Node Discovery Active' : 'Waiting for Transmission'}</p>
              
              <div className="h-10 flex items-center justify-center">
                 <p key={status === 'connecting' ? factIndex : 'connected'} className="text-[10px] font-black text-[var(--primary)] uppercase tracking-widest bg-[var(--primary-10)] px-6 py-2.5 rounded-full border border-[var(--primary-20)] animate-in slide-in-from-bottom-4 fade-in duration-300 shadow-sm">
                   {status === 'connecting' ? facts[factIndex] : 'Secure Channel Bonded'}
                 </p>
              </div>
           </div>
        ) : (status === 'transferring' || status === 'error') ? (
            <div className="flex flex-col w-full animate-in slide-in-from-bottom-8 duration-500">
               
               {status === 'error' ? (
                 <div className="flex flex-col items-center">
                    <div className="h-16 w-16 bg-[var(--danger-10)] text-[var(--danger)] rounded-[1.5rem] flex items-center justify-center mb-6 shadow-sm border border-[var(--danger-20)]">
                      <ShieldAlert size={28} />
                    </div>
                    <h3 className="text-2xl font-black text-[var(--danger)] tracking-tight uppercase mb-2">Connection Dropped</h3>
                    <p className="text-sm font-bold text-[var(--text-muted)] mb-8 text-center px-4 max-w-sm">The P2P WebRTC link was severed.</p>
                    
                    <button 
                      onClick={() => {
                          retryTransfer();
                          const joinedPin = pin.join('');
                          if (joinedPin.length === 6) joinSession(joinedPin);
                      }}
                      className="w-full bg-[var(--danger)] text-white hover:brightness-110 px-8 py-4 mb-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 shadow-xl active:scale-95 flex items-center justify-center gap-2"
                    >
                      <RefreshCw size={16} /> Re-Join Connection
                    </button>
                    <button 
                      onClick={() => { setPin([]); cancelTransfer(); }}
                      className="w-full text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger-10)] px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 active:scale-95"
                    >
                      Abort
                    </button>
                 </div>
               ) : (
                 <>
                   <div className="flex flex-col items-center py-6 animate-in fade-in duration-500 w-full mb-4">
                      <div className="grid grid-cols-2 gap-3 w-full mb-8">
                        <div className="bg-[var(--bg-main)] border border-[var(--border-main)] rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-inner">
                          <Gauge size={16} className="text-[var(--primary)] mb-1 opacity-60" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Speed</span>
                          <div className="text-lg font-black text-[var(--text-main)] mt-1 flex items-baseline gap-1">
                            {speed.toFixed(2)} <span className="text-[10px] font-bold text-[var(--primary)]">MB/s</span>
                          </div>
                        </div>
                        <div className="bg-[var(--bg-main)] border border-[var(--border-main)] rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-inner">
                          <Clock size={16} className="text-[var(--accent)] mb-1 opacity-60" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">ETA</span>
                          <div className="text-lg font-black text-[var(--text-main)] mt-1">
                            {eta}s
                          </div>
                        </div>
                      </div>
                   </div>
                 
                   <div className="flex flex-col items-center mb-8 pb-8 border-b border-[var(--border-main)]">
                      <div className="h-16 w-16 bg-[var(--primary-10)] text-[var(--primary)] rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shrink-0 shadow-inner border border-[var(--primary-10)]">
                        <Download size={32} className="animate-bounce" />
                      </div>
                      <h2 className="text-xl font-black text-[var(--text-main)] mb-1 tracking-tighter uppercase whitespace-nowrap overflow-hidden text-ellipsis w-full px-4">
                        {metadata?.name || 'Incoming Sync'}
                      </h2>
                      <p className="text-[10px] font-black text-[var(--primary)] uppercase tracking-widest mb-6">
                        {metadata ? formatBytes(metadata.size) : 'Unknown'} • P2P Handshake
                      </p>
                   </div>

                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] mb-4 text-center">Receiving Payload</p>
                   
                   <div className="w-full h-6 bg-[var(--bg-main)] rounded-full overflow-hidden shadow-inner border-[3px] border-[var(--bg-surface)] relative mb-8">
                     <div className="h-full bg-[var(--accent)] rounded-full transition-all duration-300 relative font-bold text-[9px] text-white flex items-center justify-center overflow-hidden" style={{ width: `${progress}%` }}>
                        <span className="absolute mix-blend-difference">{progress}%</span>
                     </div>
                   </div>

                   <button 
                     onClick={cancelTransfer}
                     className="w-full py-4 text-[var(--danger)] bg-[var(--danger-10)] border border-[var(--danger-20)] hover:bg-[var(--danger)] hover:text-white rounded-2xl transition-all duration-300 font-black text-xs uppercase tracking-widest shadow-sm active:scale-95"
                   >
                     Sever Link
                   </button>
                 </>
               )}
            </div>
        ) : status === 'success' && receivedFile ? (
          <div className="flex flex-col items-center py-6 animate-in zoom-in duration-500 w-full">
              <div className="h-20 w-20 bg-[var(--success-10)] text-[var(--success)] rounded-full flex items-center justify-center mx-auto mb-8 shrink-0 shadow-lg border border-[var(--success-20)]">
                <CheckCircle2 size={40} />
              </div>
              <h2 className="text-2xl font-black text-[var(--text-main)] mb-3 tracking-tighter uppercase">Transfer Complete</h2>
              
              <div className="w-full max-h-[300px] overflow-y-auto mb-6 flex flex-col gap-3 custom-scrollbar px-2">
                {(Array.isArray(receivedFile) ? receivedFile : [receivedFile]).map((file, idx) => (
                  <div key={idx} className="bg-[var(--bg-main)] border border-[var(--border-main)] p-4 rounded-2xl w-full flex items-center justify-between gap-4 overflow-hidden text-left shadow-sm">
                      <div className="flex items-center gap-4 overflow-hidden">
                        <div className="h-10 w-10 bg-[var(--primary-10)] text-[var(--primary)] rounded-lg flex items-center justify-center shrink-0">
                          <FileText size={20} />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-black text-[var(--text-main)] truncate tracking-tight">{file.name}</p>
                          <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-wider">P2P Verified</p>
                        </div>
                      </div>
                      <a 
                        href={file.url} 
                        download={file.name}
                        className="p-2 bg-[var(--primary-10)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white rounded-xl transition-all duration-300 shadow-sm shrink-0"
                      >
                        <Download size={16} />
                      </a>
                  </div>
                ))}
              </div>

              <div className="flex w-full gap-3 mt-4">
                {Array.isArray(receivedFile) && receivedFile.length > 1 && (
                  <button 
                    onClick={() => {
                        receivedFile.forEach(f => {
                            const a = document.createElement('a');
                            a.href = f.url;
                            a.download = f.name;
                            a.click();
                        });
                    }}
                    className="flex-1 bg-[var(--primary)] text-white hover:brightness-110 active:scale-95 font-black py-4 rounded-2xl transition-all duration-300 uppercase tracking-widest text-[10px] shadow-xl flex items-center justify-center gap-2"
                  >
                    <Download size={16} /> Download All
                  </button>
                )}
                <button onClick={() => window.location.href = '/'} className="flex-[0.5] text-[10px] font-black text-[var(--text-muted)] border border-[var(--border-main)] hover:bg-[var(--bg-main)] hover:text-[var(--primary)] rounded-2xl transition-colors uppercase tracking-[0.2em]">Close</button>
              </div>
          </div>
        ) : (
           <div className="animate-in fade-in duration-500 text-[var(--text-main)]">
              <div className="h-20 w-20 bg-[var(--primary-10)] text-[var(--primary)] rounded-[1.5rem] flex items-center justify-center mx-auto mb-8 shrink-0 shadow-inner border border-[var(--primary-10)]">
                <Download size={36} />
              </div>
              <h2 className="text-2xl font-black text-[var(--text-main)] mb-3 tracking-tighter uppercase">Enter Node PIN</h2>
              <p className="text-[var(--text-muted)] text-sm mb-10 font-bold tracking-tight">Identify the incoming handshake.</p>
              <div className="flex justify-center gap-2 mb-12">
                {[...Array(6)].map((_, i) => (
                  <input 
                    key={i} data-index={i} type="text" maxLength="6" 
                    className="w-10 h-14 md:w-12 md:h-16 bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl text-center text-2xl font-black text-[var(--text-main)] focus:border-[var(--primary)] outline-none transition-all duration-300 shadow-sm focus:ring-2 focus:ring-[var(--primary-20)]" 
                    placeholder="-" 
                    value={pin[i] || ''}
                    onChange={(e) => handlePinChange(i, e.target.value)}
                  />
                ))}
              </div>
              <button 
                onClick={handleJoin} 
                className="w-full bg-[var(--text-main)] text-[var(--bg-main)] hover:scale-[1.02] active:scale-95 font-black py-4 rounded-2xl transition-all duration-300 uppercase tracking-widest text-xs shadow-xl"
              >
                Join Sync
              </button>
           </div>
        )}
      </div>
    </div>
  );
}
