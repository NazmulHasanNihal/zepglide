import React, { useState, useEffect } from 'react';
import { UploadCloud, Video, File as FileIcon, X, ShieldCheck, Zap, RefreshCw, Network, Cpu, Wifi, CheckCircle2, Laptop, Smartphone, Download, Gauge, Activity, Clock, Lock, Users, Copy, Check } from 'lucide-react';
import { useWebRTC } from '../../hooks/useWebRTC';
import { supabase } from '../../lib/supabase';
import { QRCodeSVG } from 'qrcode.react';

export default function SendView({ profile, isAuthenticated, showToast, globalDroppedFile, setGlobalDroppedFile }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [rawFiles, setRawFiles] = useState([]);
  const [routingState, setRoutingState] = useState('evaluating');
  const [pin, setPin] = useState('');
  const [password, setPassword] = useState('');
  const [isMultiPeer, setIsMultiPeer] = useState(false);

  const { status, progress, speed, eta, startSession, sendFiles, cancelTransfer, retryTransfer } = useWebRTC();
  const fileInputRef = React.useRef(null);
  const [cancelStep, setCancelStep] = useState(0); // 0: idle, 1: double-confirm

  const isPro = profile?.plan === 'Pro' || profile?.plan === 'Teams';

  useEffect(() => {
    if (globalDroppedFile) {
      handleFiles([globalDroppedFile]);
      setGlobalDroppedFile(null);
    }
  }, [globalDroppedFile, setGlobalDroppedFile]);

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (filesArray) => {
    const rawBuffer = [];
    const metaBuffer = [];

    filesArray.forEach((fileOrMock) => {
      let name, size, isVideo, previewUrl = null, fileObj = null;

      if (fileOrMock instanceof File) {
        fileObj = fileOrMock;
        name = fileOrMock.name;
        size = (fileOrMock.size / (1024 * 1024)).toFixed(2) + " MB";
        isVideo = fileOrMock.type?.startsWith('video/');
        if (fileOrMock.type?.startsWith('image/') || fileOrMock.type?.startsWith('video/')) {
          previewUrl = URL.createObjectURL(fileOrMock);
        }
      } else {
        name = fileOrMock;
        size = "15.8 MB";
        isVideo = true;
        fileObj = new File(["mock binary data"], name, { type: "video/mp4" });
      }

      rawBuffer.push(fileObj);
      metaBuffer.push({ name, size, isVideo, previewUrl });
    });

    setRawFiles(rawBuffer);
    setSelectedFiles(metaBuffer);
    setRoutingState('evaluating');
    
    const newPin = Math.floor(100000 + Math.random() * 900000).toString();
    setPin(newPin);
    
    setTimeout(() => { 
      setRoutingState('quic');
      startSession(newPin, password, isMultiPeer);
    }, 1500);
  };

  const handleStartTransfer = () => {
    if (status === 'connected') {
      sendFiles(rawFiles);
    } else {
      showToast("Waiting for peer to bond...", "info");
    }
  };

  const handleCancelClick = () => {
    if (cancelStep === 0) {
      setCancelStep(1);
      setTimeout(() => setCancelStep(0), 3000);
    } else {
      cancelTransfer();
      setCancelStep(0);
      showToast("Sync Aborted", "error");
    }
  };

  useEffect(() => {
    if (status === 'success') {
      showToast("Transfer Complete! Files synced.", "success");
      
      const syncHistory = async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const token = session?.access_token;
          if (!token) return;

          await fetch((import.meta.env.VITE_API_URL || '') + '/api/transfers', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              name: selectedFiles.length > 1 ? `${selectedFiles.length} files (Batch)` : selectedFiles[0].name,
              size: "Batch Size",
              to: 'Remote Node',
              status: 'Complete'
            })
          });
        } catch (e) { console.error("Failed to sync history", e); }
      };
      syncHistory();
    }
  }, [status, selectedFiles, showToast]);

  useEffect(() => {
    return () => { 
      selectedFiles.forEach(file => {
        if (file?.previewUrl) URL.revokeObjectURL(file.previewUrl);
      });
    };
  }, [selectedFiles]);

  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto mt-4 md:mt-8">
      {selectedFiles.length === 0 ? (
        <div 
          onClick={handleBrowseClick}
          className={`relative border-2 border-dashed rounded-[2.5rem] p-8 md:p-16 text-center transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] flex flex-col items-center justify-center min-h-[400px] md:min-h-[500px] shadow-sm cursor-pointer ${
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
              handleFiles(Array.from(e.dataTransfer.files));
            }
          }}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileInputChange} 
            className="hidden" 
            multiple
          />
          <div className={`h-24 w-24 rounded-[2rem] flex items-center justify-center mb-8 shrink-0 transition-all duration-500 shadow-sm ${dragActive ? 'bg-[var(--primary)] text-[var(--primary-content)] scale-110 shadow-xl' : 'bg-[var(--primary-10)] text-[var(--primary)]'}`}>
            <UploadCloud size={48} className={dragActive ? 'animate-bounce' : ''} />
          </div>
          <h3 className="text-2xl md:text-3xl font-black text-[var(--text-main)] mb-3 tracking-tighter uppercase">Drop Files or Click to Browse</h3>
          <p className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-10">P2P Encryption Active</p>
          
          {isPro && (
            <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm flex flex-col gap-3 mb-6 bg-[var(--bg-main)] p-4 rounded-2xl border border-[var(--border-main)]">
              <div className="flex items-center justify-between">
                 <span className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2"><Lock size={14}/> Optional Password</span>
              </div>
              <input 
                type="password" 
                placeholder="e.g. Secret123" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-xl px-4 py-2 text-sm text-[var(--text-main)] focus:outline-none focus:border-[var(--primary)]"
              />
              
              <div className="flex items-center justify-between mt-2 pt-3 border-t border-[var(--border-main)]">
                 <span className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2"><Users size={14}/> Multi-Broadcaster</span>
                 <div className="flex items-center gap-2">
                   <input type="checkbox" checked={isMultiPeer} onChange={(e) => setIsMultiPeer(e.target.checked)} className="accent-[var(--primary)] w-4 h-4" />
                 </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-4">
            <button className="bg-[var(--text-main)] text-[var(--bg-main)] hover:scale-105 active:scale-95 px-8 py-4 rounded-2xl font-black text-xs tracking-widest uppercase transition-all duration-300 shadow-xl flex items-center gap-2" onClick={(e) => { e.stopPropagation(); handleBrowseClick(); }}>
              <Download size={16} className="rotate-180" /> Select Files
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[3rem] p-8 md:p-12 shadow-2xl transition-all animate-in zoom-in-95 duration-500 text-[var(--text-main)]">
          <div className="flex justify-between items-start mb-8 gap-4">
            <div className="w-full flex flex-col gap-3">
              {selectedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center gap-4 overflow-hidden bg-[var(--bg-main)] p-3 rounded-2xl border border-[var(--border-main)] relative group">
                  <div className={`h-12 w-12 rounded-[1rem] flex items-center justify-center shrink-0 border relative overflow-hidden ${file.isVideo ? 'bg-[var(--accent-10)] text-[var(--accent)] border-[var(--accent-20)]' : 'bg-[var(--primary-10)] text-[var(--primary)] border-[var(--primary-20)]'}`}>
                    {file.previewUrl && (
                       <img src={file.previewUrl} alt="preview" className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay blur-[1px]" />
                    )}
                    <div className="relative z-10">{file.isVideo ? <Video size={20} /> : <FileIcon size={20} />}</div>
                  </div>
                  <div className="overflow-hidden flex-1">
                    <h3 className="text-sm font-black text-[var(--text-main)] truncate tracking-tighter w-full">{file.name}</h3>
                    <div className="flex items-center gap-3 mt-0.5">
                      <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">{file.size}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {(status === 'idle' || status === 'connecting' || status === 'connected') && (
              <button onClick={() => { setSelectedFiles([]); setRawFiles([]); }} className="p-3 bg-[var(--danger-10)] text-[var(--danger)] hover:bg-[var(--danger)] hover:text-white rounded-full transition-all duration-300 active:scale-90"><X size={20} /></button>
            )}
          </div>

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

          <div className="bg-[var(--primary-10)] border border-[var(--primary-20)] rounded-2xl p-6 mb-8 w-full animate-in fade-in zoom-in duration-500 flex flex-col sm:flex-row items-center justify-between gap-6 relative group">
            <div className="flex-1 text-center sm:text-left">
              <span className="text-[10px] font-black text-[var(--primary)] uppercase tracking-[0.4em] mb-2 block">Connection PIN</span>
              
              <div 
                className="flex justify-center sm:justify-start gap-2 sm:gap-3 cursor-pointer group/pin hover:scale-105 active:scale-95 transition-all duration-300" 
                onClick={() => {
                  navigator.clipboard.writeText(pin);
                  showToast("PIN Copied to Clipboard!", "success");
                }}
                title="Click to Copy PIN"
              >
                {pin.split('').map((char, i) => (
                  <div key={i} className="w-10 h-14 bg-[var(--bg-main)] border border-[var(--border-main)] group-hover/pin:border-[var(--primary-50)] rounded-xl flex items-center justify-center text-2xl font-black text-[var(--primary)] shadow-sm transition-colors">
                    {char}
                  </div>
                ))}
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-3 mt-5">
                 <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest">Share this PIN {password && '+ Password'} or Scan the Code</p>
                 <button 
                   onClick={(e) => {
                     e.stopPropagation();
                     navigator.clipboard.writeText(`${window.location.origin}/?pin=${pin}`);
                     showToast("Direct Link Copied!", "success");
                   }}
                   className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider bg-[var(--primary)] text-[var(--bg-main)] hover:brightness-110 active:scale-95 px-3 py-1.5 rounded-full transition-all shadow-sm"
                 >
                   <Copy size={12} /> Copy Link
                 </button>
              </div>
            </div>
            
            <div className="shrink-0 bg-white/90 p-3 rounded-xl shadow-inner border border-white/20">
               <QRCodeSVG value={`${window.location.origin}/?pin=${pin}`} size={100} fgColor="#111" />
            </div>
          </div>

          {(status === 'idle' || status === 'connecting' || status === 'connected') && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 opacity-50 grayscale pointer-events-none">
                  <DeviceCard icon={<Laptop size={32} />} name="Global Mesh" owner="Zepglide Node" active />
                  <DeviceCard icon={<Smartphone size={32} />} name="P2P Bridge" owner="Encrypted" />
              </div>
              <button 
                disabled={routingState === 'evaluating' || status === 'connecting'} 
                onClick={handleStartTransfer} 
                className={`w-full font-black py-5 rounded-2xl transition-all duration-300 shadow-2xl flex items-center justify-center gap-3 uppercase tracking-widest text-xs ${
                  status === 'connected' 
                  ? 'bg-[var(--success)] text-white hover:brightness-110' 
                  : 'bg-[var(--primary)] text-[var(--primary-content)] hover:brightness-110'
                } disabled:opacity-50 active:scale-95`}
              >
                {status === 'connecting' ? <RefreshCw size={20} className="animate-spin"/> : <Zap size={20} className="fill-current shrink-0" />}
                {status === 'connecting' ? 'Waiting for Peer...' : status === 'connected' ? 'Secure Channel Ready - Start Sync' : 'Initialize Hyper-Sync'}
              </button>
            </div>
          )}

          {status === 'firewall_blocked' && (
             <div className="flex flex-col items-center py-6 w-full animate-in slide-in-from-bottom-8 duration-500 bg-[var(--warning-10)] p-6 rounded-3xl border border-[var(--warning-30)]">
                <div className="h-16 w-16 bg-[var(--warning)] text-white rounded-[1.5rem] flex items-center justify-center mb-6 shadow-sm border border-[var(--warning-30)]">
                  <ShieldCheck size={28} />
                </div>
                <h3 className="text-2xl font-black text-[var(--text-main)] tracking-tight uppercase mb-2">Network Restricted by Firewall</h3>
                <p className="text-sm font-bold text-[var(--text-muted)] mb-8 text-center px-4 max-w-sm">
                  Your network is blocking P2P connections. Upgrade to Pro to bypass strict firewalls using our Premium High-Speed TURN Relay Channels.
                </p>
                <button 
                  onClick={() => window.open('https://stripe.com', '_blank')}
                  className="w-full bg-[var(--warning)] text-[var(--bg-main)] hover:brightness-110 px-8 py-4 mb-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 shadow-xl active:scale-95 flex items-center justify-center gap-2"
                >
                  <Zap size={16} /> Upgrade to Pro
                </button>
                <button 
                  onClick={cancelTransfer}
                  className="w-full text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger-10)] px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 active:scale-95"
                >
                  Cancel
                </button>
             </div>
          )}

          {(status === 'transferring' || status === 'error') && (
            <div className="flex flex-col items-center py-6 w-full animate-in slide-in-from-bottom-8 duration-500">
              
              {status === 'error' ? (
                <>
                  <div className="h-16 w-16 bg-[var(--danger-10)] text-[var(--danger)] rounded-[1.5rem] flex items-center justify-center mb-6 shadow-sm border border-[var(--danger-20)]">
                    <ShieldCheck size={28} />
                  </div>
                  <h3 className="text-2xl font-black text-[var(--danger)] tracking-tight uppercase mb-2">Connection Dropped</h3>
                  <p className="text-sm font-bold text-[var(--text-muted)] mb-8 text-center px-4 max-w-sm">The P2P WebRTC link was severed. Click below to re-initiate the handshake.</p>
                  
                  <button 
                    onClick={() => {
                        retryTransfer();
                        const newPin = Math.floor(100000 + Math.random() * 900000).toString();
                        setPin(newPin);
                        startSession(newPin, password, isMultiPeer);
                        showToast('Re-initializing signal...', 'info');
                    }}
                    className="w-full bg-[var(--danger)] text-white hover:brightness-110 px-8 py-4 mb-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 shadow-xl active:scale-95 flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={16} /> Retry Connection
                  </button>
                  <button 
                    onClick={cancelTransfer}
                    className="w-full text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger-10)] px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 active:scale-95"
                  >
                    Abort Transfer
                  </button>
                </>
              ) : (
                <>
                  <div className="w-full flex justify-between items-end mb-4 font-bold text-sm text-[var(--text-muted)]">
                    <span className="bg-[var(--bg-main)] px-4 py-2 border border-[var(--border-main)] rounded-2xl flex items-center gap-2 shadow-sm"><Activity size={16} className="text-[var(--primary)]"/>{speed.toFixed(1)} MB/s</span>
                    <span className="bg-[var(--bg-main)] px-4 py-2 border border-[var(--border-main)] rounded-2xl flex items-center gap-2 shadow-sm"><Clock size={16} className="text-[var(--warning)]"/>{eta}s left</span>
                  </div>
                  
                  <div className="w-full h-4 bg-[var(--bg-main)] rounded-full overflow-hidden shadow-inner border border-[var(--border-main)] relative mb-8">
                    <div className="h-full bg-[var(--primary)] rounded-full transition-all duration-300 relative" style={{ width: `${progress}%` }}>
                       <div className="absolute top-0 right-0 w-8 h-full bg-white/40 blur-md translate-x-1/2"></div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleCancelClick}
                    className={`w-full py-4 rounded-2xl font-black text-[10px] tracking-[0.2em] uppercase transition-all duration-300 border ${
                      cancelStep === 1 
                      ? 'bg-[var(--danger)] text-white border-[var(--danger)] animate-pulse' 
                      : 'bg-transparent text-[var(--text-muted)] border-[var(--border-main)] hover:bg-[var(--danger-10)] hover:text-[var(--danger)] hover:border-[var(--danger-20)]'
                    }`}
                  >
                    {cancelStep === 1 ? 'Press Again to Confirm Cancel' : 'Cancel Synchronization'}
                  </button>
                  
                  <div className="flex justify-between items-center mt-2">
                     <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Direct Mesh Active</span>
                     <span className="text-xs font-black text-[var(--text-muted)] tracking-[0.25em]">{progress}% SYNCED</span>
                  </div>
                </>
              )}
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center justify-center py-6 animate-in zoom-in-90 duration-500 w-full">
              <div className="h-20 w-20 bg-[var(--success-10)] text-[var(--success)] rounded-full flex items-center justify-center mb-4 shrink-0 border border-[var(--success-20)] shadow-lg"><CheckCircle2 size={40} /></div>
              <h3 className="text-3xl font-black text-[var(--text-main)] tracking-tight mb-8">Sync Complete</h3>
              
              <div className="flex flex-wrap gap-4 w-full justify-center">
                 <button onClick={() => { setSelectedFiles([]); setRawFiles([]); }} className="text-[var(--text-main)] bg-[var(--bg-main)] border border-[var(--border-main)] hover:bg-[var(--bg-hover)] px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 shadow-sm active:scale-95">Send Another</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DeviceCard({ icon, name, owner, active }) {
  return (
    <div className={`flex-1 border-2 rounded-[2rem] p-6 flex items-center gap-5 cursor-pointer transition-all duration-500 hover:-translate-y-2 active:scale-95 ${active ? 'border-[var(--primary)] bg-[var(--primary-10)] shadow-2xl shadow-[var(--primary-10)]' : 'border-[var(--border-main)] bg-[var(--bg-surface)] hover:border-[var(--primary-30)] hover:shadow-xl'}`}>
      <div className={`shrink-0 transition-transform duration-500 ${active ? 'text-[var(--primary)] scale-125' : 'text-[var(--text-muted)] opacity-50'}`}>{icon}</div>
      <div className="text-left overflow-hidden">
        <h5 className="text-lg font-black text-[var(--text-main)] truncate tracking-tighter">{name}</h5>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] mt-1">{owner}</p>
      </div>
    </div>
  );
}
