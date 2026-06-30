import React, { useState, useEffect } from 'react';
import { Download, Radar, CheckCircle2, FileText, Smartphone, Gauge, Activity, Clock, ShieldAlert, RefreshCw, File as FileIcon, ShieldCheck, Zap, Lock, ScanLine, X } from 'lucide-react';
import { useWebRTC } from '../../hooks/useWebRTC';
import { Scanner } from '@yudiel/react-qr-scanner';

export default function ReceiveView({ showToast }) {
  const [pin, setPin] = useState('');
  const [password, setPassword] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const { status, progress, speed, eta, metadata, receivedFile, errorMsg, joinSession, acceptTransfer, cancelTransfer, retryTransfer, isSocketConnected, fingerprint, branding, requestWakeLock, releaseWakeLock } = useWebRTC();
  
  const facts = ["Bypassing Symmetric NAT...", "Establishing Quantum-Safe Keys...", "Securing P2P WebRTC Layer...", "Discovering Mesh Route..."];
  const [factIndex, setFactIndex] = useState(0);

  useEffect(() => {
     if (status !== 'connecting') return;
     const interval = setInterval(() => setFactIndex(i => (i + 1) % facts.length), 2000);
     return () => clearInterval(interval);
  }, [status]);

  // Auto-download when transfer completes
  useEffect(() => {
    if (status === 'success' && receivedFile) {
      const files = Array.isArray(receivedFile) ? receivedFile : [receivedFile];
      let delay = 0;
      files.forEach((f) => {
          if (!f.savedToDisk) {
              setTimeout(() => {
                  const a = document.createElement('a');
                  a.href = f.url;
                  a.download = f.name;
                  a.style.display = 'none';
                  document.body.appendChild(a);
                  a.click();
                  setTimeout(() => {
                      document.body.removeChild(a);
                  }, 100);
              }, delay);
              delay += 500; // Stagger downloads to prevent browser blocking
          }
      });
    }
  }, [status, receivedFile]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let pinParam = params.get('pin');
    let keyParam = null;
    
    if (window.location.hash.startsWith('#receive=')) {
       const hashParts = window.location.hash.substring(1).split('&');
       for (const part of hashParts) {
         if (part.startsWith('receive=')) pinParam = part.split('=')[1];
         if (part.startsWith('key=')) keyParam = part.split('=')[1];
       }
    }
    
    if (pinParam && pinParam.length === 6 && status === 'idle' && isSocketConnected) {
      setPin(pinParam);
      joinSession(pinParam, password, keyParam);
    }
  }, [joinSession, status, isSocketConnected, password]);

  const lastErrorRef = React.useRef({ msg: '', time: 0 });
  useEffect(() => {
    if (errorMsg) {
      const now = Date.now();
      // Deduplicate: only show if it's a new message or 3+ seconds since last toast
      if (errorMsg !== lastErrorRef.current.msg || now - lastErrorRef.current.time > 3000) {
        showToast(errorMsg, "error");
        lastErrorRef.current = { msg: errorMsg, time: now };
      }
    }
  }, [errorMsg, showToast]);

  const handleJoin = () => {
    const cleanPin = pin.replace(/\s/g, '');
    if (cleanPin.length === 6) {
      requestWakeLock();
      joinSession(cleanPin, password);
    } else {
      showToast("Please enter a 6-digit PIN", "info");
    }
  };

  const handlePinChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    
    // Create an array of 6 elements, defaulting to empty space
    const paddedPin = pin.padEnd(6, ' ');
    const newPinArr = paddedPin.split('');
    
    // Set the specific index to the new value (or space if deleted)
    newPinArr[index] = value.slice(-1) || ' ';
    
    const newPin = newPinArr.join('');
    setPin(newPin);
    
    // Auto-focus next input if typing a digit
    if (value && index < 5) {
      const nextInput = document.querySelector(`input[data-index="${index + 1}"]`);
      if (nextInput) nextInput.focus();
    }
    
    // Auto-focus previous input on backspace (if value is empty)
    if (!value && index > 0) {
      const prevInput = document.querySelector(`input[data-index="${index - 1}"]`);
      if (prevInput) prevInput.focus();
    }
  };

  const handlePinPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length > 0) {
      setPin(pastedData.padEnd(6, ''));
      const focusIndex = Math.min(pastedData.length, 5);
      const nextInput = document.querySelector(`input[data-index="${focusIndex}"]`);
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
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto mt-8 md:mt-24 animate-in fade-in zoom-in duration-300" style={branding ? { '--primary': branding.primary, '--bg-main': branding.bg, '--bg-surface': branding.bg } : {}}>
      <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] p-8 md:p-12 rounded-[2.5rem] shadow-2xl w-full text-center relative overflow-hidden">
        
        {branding?.logoUrl && status !== 'idle' && (
           <img src={branding.logoUrl} alt="Sender Brand" className="h-12 max-w-[200px] object-contain mx-auto mb-8 animate-in fade-in" />
        )}

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

              {fingerprint && (
               <div className="mt-6 p-3 bg-[var(--success-10)] border border-[var(--success-20)] rounded-xl flex items-start gap-3 w-full text-left">
                 <Lock size={16} className="text-[var(--success)] shrink-0 mt-0.5" />
                 <div className="flex flex-col overflow-hidden">
                   <span className="text-[10px] font-black uppercase tracking-widest text-[var(--success)] mb-1">E2EE Verified</span>
                   <span className="text-[9px] font-mono text-[var(--text-muted)] truncate">{fingerprint}</span>
                 </div>
               </div>
              )}
           </div>
        ) : status === 'firewall_blocked' ? (
           <div className="flex flex-col items-center py-6 w-full animate-in slide-in-from-bottom-8 duration-500 bg-[var(--warning-10)] p-6 rounded-3xl border border-[var(--warning-30)] text-center">
              <div className="h-16 w-16 bg-[var(--warning)] text-white rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-sm border border-[var(--warning-30)]">
                <ShieldCheck size={28} />
              </div>
              <h3 className="text-2xl font-black text-[var(--text-main)] tracking-tight uppercase mb-2">Network Restricted by Firewall</h3>
              <p className="text-sm font-bold text-[var(--text-muted)] mb-8 px-4 max-w-sm">
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
         ) : status === 'reconnecting' ? (
           <div className="flex flex-col items-center py-6 w-full animate-in slide-in-from-bottom-8 duration-500 bg-[var(--warning-10)] p-6 rounded-3xl border border-[var(--warning-30)] text-center">
              <div className="h-16 w-16 bg-[var(--warning)] text-white rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-sm border border-[var(--warning-30)] animate-pulse">
                <RefreshCw size={28} className="animate-spin" />
              </div>
              <h3 className="text-2xl font-black text-[var(--text-main)] tracking-tight uppercase mb-2">Reconnecting...</h3>
              <p className="text-sm font-bold text-[var(--text-muted)] mb-4 px-4 max-w-sm">
                Connection dropped momentarily. Zepglide is automatically recovering the transfer. Please wait...
              </p>
              <div className="w-full bg-[var(--bg-main)] rounded-full h-2 overflow-hidden">
                <div className="h-full bg-[var(--warning)] rounded-full animate-pulse" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-xs text-[var(--text-muted)] mt-2 font-bold">{progress}% transferred before interruption</span>
           </div>
         ) : status === 'awaiting_approval' ? (
           <div className="flex flex-col items-center py-6 w-full animate-in slide-in-from-bottom-8 duration-500 bg-[var(--bg-main)] p-6 rounded-3xl border border-[var(--border-main)] text-center shadow-inner">
              <div className="h-16 w-16 bg-[var(--primary-10)] text-[var(--primary)] rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-sm border border-[var(--primary-20)]">
                <FileText size={28} />
              </div>
              <h3 className="text-2xl font-black text-[var(--text-main)] tracking-tight uppercase mb-2">Incoming File</h3>
              <p className="text-sm font-bold text-[var(--primary)] mb-2 px-4">
                {metadata?.name}
              </p>
              <p className="text-xs font-bold text-[var(--text-muted)] mb-8 uppercase tracking-widest">
                {metadata ? formatBytes(metadata.size) : 'Unknown Size'}
              </p>
              
              <button 
                onClick={() => { requestWakeLock(); acceptTransfer(); }}
                className="w-full bg-[var(--primary)] text-white hover:brightness-110 px-8 py-4 mb-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 shadow-xl active:scale-95 flex items-center justify-center gap-2"
              >
                <Download size={16} /> Accept & Save
              </button>
              <button 
                onClick={() => { releaseWakeLock(); cancelTransfer(); }}
                className="w-full text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger-10)] px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 active:scale-95"
              >
                Decline
              </button>
           </div>
        ) : (status === 'transferring' || status === 'error') ? (
            <div className="flex flex-col w-full animate-in slide-in-from-bottom-8 duration-500">
               
               {status === 'error' ? (
                 <div className="flex flex-col items-center">
                    <div className="h-16 w-16 bg-[var(--danger-10)] text-[var(--danger)] rounded-[1.5rem] flex items-center justify-center mb-6 shadow-sm border border-[var(--danger-20)]">
                      <ShieldAlert size={28} />
                    </div>
                    <h3 className="text-2xl font-black text-[var(--danger)] tracking-tight uppercase mb-2">Connection Dropped</h3>
                    <p className="text-sm font-bold text-[var(--text-muted)] mb-8 text-center px-4 max-w-sm">
                      {errorMsg || 'The P2P WebRTC link was severed.'}
                    </p>
                    
                    <button 
                      disabled={!isSocketConnected}
                      onClick={() => {
                          requestWakeLock();
                          retryTransfer();
                          if (pin.length === 6) joinSession(pin, password);
                      }}
                      className={`w-full hover:brightness-110 px-8 py-4 mb-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 shadow-xl active:scale-95 flex items-center justify-center gap-2 ${!isSocketConnected ? 'bg-[var(--bg-main)] text-[var(--text-muted)] border border-[var(--border-main)] cursor-not-allowed opacity-70' : 'bg-[var(--danger)] text-white'}`}
                    >
                      {isSocketConnected ? <><RefreshCw size={16} /> Re-Join Connection</> : <><RefreshCw size={16} className="animate-spin" /> Reconnecting...</>}
                    </button>
                    <button 
                      onClick={() => { setPin(''); cancelTransfer(); }}
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
              <h2 className="text-2xl font-black text-[var(--text-main)] mb-1 tracking-tighter uppercase">Transfer Complete</h2>
              <p className="text-xs font-bold text-[var(--text-muted)] mb-6">Files have been safely received.</p>
              
              <div className="w-full max-h-[300px] overflow-y-auto mb-6 flex flex-col gap-3 custom-scrollbar px-2">
                {(Array.isArray(receivedFile) ? receivedFile : [receivedFile]).map((file, idx) => (
                  <div key={idx} className="bg-[var(--bg-main)] border border-[var(--border-main)] p-4 rounded-2xl w-full flex items-center justify-between gap-4 overflow-hidden text-left shadow-sm">
                      <div className="flex items-center gap-4 overflow-hidden">
                        <div className="h-10 w-10 bg-[var(--primary-10)] text-[var(--primary)] rounded-lg flex items-center justify-center shrink-0">
                          <FileText size={20} />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-black text-[var(--text-main)] truncate tracking-tight">{file.name}</p>
                          <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-wider">{file.savedToDisk ? 'Saved to Disk' : 'P2P Verified'}</p>
                        </div>
                      </div>
                      {!file.savedToDisk && (
                        <a 
                          href={file.url} 
                          download={file.name}
                          className="p-2 bg-[var(--primary-10)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white rounded-xl transition-all duration-300 shadow-sm shrink-0"
                        >
                          <Download size={16} />
                        </a>
                      )}
                  </div>
                ))}
              </div>

              <div className="flex w-full gap-3 mt-4">
                {Array.isArray(receivedFile) && receivedFile.length > 1 && receivedFile.some(f => !f.savedToDisk) && (
                  <button 
                    onClick={() => {
                        let delay = 500;
                        const filesToSave = receivedFile.filter(f => !f.savedToDisk);
                        filesToSave.forEach((f, index) => {
                            if (index === 0) {
                                // MUST be completely synchronous for iOS Safari popup blocker
                                const a = document.createElement('a');
                                a.href = f.url;
                                a.download = f.name;
                                a.style.display = 'none';
                                document.body.appendChild(a);
                                a.click();
                                setTimeout(() => document.body.removeChild(a), 100);
                            } else {
                                setTimeout(() => {
                                    const a = document.createElement('a');
                                    a.href = f.url;
                                    a.download = f.name;
                                    a.style.display = 'none';
                                    document.body.appendChild(a);
                                    a.click();
                                    setTimeout(() => document.body.removeChild(a), 100);
                                }, delay);
                                delay += 500;
                            }
                        });
                    }}
                    className="flex-1 bg-[var(--primary)] text-white hover:brightness-110 active:scale-95 font-black py-4 rounded-2xl transition-all duration-300 uppercase tracking-widest text-[10px] shadow-xl flex items-center justify-center gap-2"
                  >
                    <Download size={16} /> Download All
                  </button>
                )}
                <button onClick={() => window.location.href = '/'} className="flex-1 text-[10px] font-black text-[var(--text-muted)] border border-[var(--border-main)] hover:bg-[var(--bg-main)] hover:text-[var(--primary)] rounded-2xl transition-colors uppercase tracking-[0.2em] py-4">Close</button>
              </div>
          </div>
        ) : (
           <div className="animate-in fade-in duration-500 text-[var(--text-main)] w-full">
              <div className="h-20 w-20 bg-[var(--primary-10)] text-[var(--primary)] rounded-[1.5rem] flex items-center justify-center mx-auto mb-8 shrink-0 shadow-inner border border-[var(--primary-10)]">
                <Download size={36} />
              </div>
              <h2 className="text-2xl font-black text-[var(--text-main)] mb-3 tracking-tighter uppercase">Enter Node PIN</h2>
              <p className="text-[var(--text-muted)] text-sm mb-10 font-bold tracking-tight">Identify the incoming handshake.</p>
              
              <div className="flex justify-center gap-2 mb-6">
                {[...Array(6)].map((_, i) => (
                  <input 
                    key={i} data-index={i} type="tel" inputMode="numeric" pattern="[0-9]*" maxLength="1" 
                    className="w-10 h-14 md:w-12 md:h-16 bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl text-center text-2xl font-black text-[var(--text-main)] focus:border-[var(--primary)] outline-none transition-all duration-300 shadow-sm focus:ring-2 focus:ring-[var(--primary-20)]" 
                    placeholder="-" 
                    value={pin[i] === ' ' ? '' : (pin[i] || '')}
                    onChange={(e) => handlePinChange(i, e.target.value)}
                    onPaste={handlePinPaste}
                  />
                ))}
              </div>
              


              {isScanning ? (
                 <div className="w-full max-w-xs mx-auto mb-6 bg-black rounded-2xl overflow-hidden shadow-xl border-2 border-[var(--primary)] relative group">
                    <Scanner 
                       onScan={(result) => {
                          if (result && result.length > 0) {
                             const text = result[0].rawValue;
                             try {
                                const url = new URL(text);
                                const scannedPin = url.searchParams.get('pin');
                                if (scannedPin && scannedPin.length === 6) {
                                   setPin(scannedPin);
                                   setIsScanning(false);
                                   showToast("QR Code Scanned Successfully!", "success");
                                   // Auto join
                                   joinSession(scannedPin, password);
                                }
                             } catch (e) {
                                if (text.length === 6 && /^\d+$/.test(text)) {
                                   setPin(text);
                                   setIsScanning(false);
                                   showToast("PIN Scanned Successfully!", "success");
                                   joinSession(text, password);
                                }
                             }
                          }
                       }}
                       onError={(err) => {
                          console.error('Scanner Error:', err);
                          if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
                             showToast("Camera requires HTTPS or localhost.", "error");
                          } else {
                             showToast("Camera access denied or unavailable.", "error");
                          }
                          setIsScanning(false);
                       }}
                       constraints={{ facingMode: 'environment' }}
                       components={{ audio: false, finder: true }}
                    />
                    <button onClick={() => setIsScanning(false)} className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full hover:bg-red-500 transition-colors">
                       <X size={16} />
                   </button>
                 </div>
              ) : (
                <button 
                  onClick={() => setIsScanning(true)} 
                  className="w-full max-w-xs mx-auto mb-6 bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] hover:bg-[var(--primary-10)] hover:text-[var(--primary)] hover:border-[var(--primary-30)] font-black py-3 rounded-2xl transition-all duration-300 uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                >
                  <ScanLine size={16} /> Scan QR Code
                </button>
              )}

              <button 
                disabled={!isSocketConnected}
                onClick={handleJoin} 
                className={`w-full hover:scale-[1.02] active:scale-95 font-black py-4 rounded-2xl transition-all duration-300 uppercase tracking-widest text-xs shadow-xl ${!isSocketConnected ? 'bg-[var(--bg-main)] text-[var(--text-muted)] border border-[var(--border-main)] cursor-not-allowed opacity-70' : 'bg-[var(--text-main)] text-[var(--bg-main)]'}`}
              >
                {isSocketConnected ? 'Join Sync' : 'Connecting to Relay...'}
              </button>
           </div>
        )}
      </div>
    </div>
  );
}
