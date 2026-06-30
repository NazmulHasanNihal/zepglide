import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import localforage from 'localforage';

localforage.config({
    name: 'Zepglide',
    storeName: 'file_chunks'
});

// --- Crypto Utils ---
const hexToArrayBuffer = (hex) => {
    if (!hex) return new ArrayBuffer(0);
    const bytes = new Uint8Array(Math.ceil(hex.length / 2));
    for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    return bytes.buffer;
};

const importKey = async (hexKey) => {
    if (!hexKey) return null;
    try {
        const keyBuffer = hexToArrayBuffer(hexKey);
        return await window.crypto.subtle.importKey('raw', keyBuffer, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
    } catch(e) {
        console.error("Crypto import error", e);
        return null;
    }
};

// --- High-Performance Transfer Constants ---
const SEND_CHUNK_SIZE = 65536;            // 64KB — optimal CPU efficiency for WebCrypto
const HIGH_WATER_MARK = 4 * 1024 * 1024;  // 4MB — lightweight SCTP buffer
const LOW_WATER_MARK = 1 * 1024 * 1024;   // 1MB — resume threshold
const UI_THROTTLE_MS = 150;               // Update progress bar ~7x/sec (less React overhead)
const MAX_ICE_RESTARTS = 3;               // Max ICE restart attempts before giving up
const ICE_RESTART_DELAY_MS = 1500;        // Wait before attempting ICE restart
const SIGNAL_URL = import.meta.env.VITE_SIGNAL_URL || import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'production' ? 'https://zepglide.onrender.com' : `http://${window.location.hostname}:3001`);

// --- ICE Servers: STUN + TURN for universal connectivity ---
const ICE_SERVERS = [
    // Cloudflare STUN (extremely reliable)
    { urls: 'stun:stun.cloudflare.com:3478' },
    // Google STUN (fast, free, reliable)
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    // Metered.ca free TURN servers — enables relay when direct P2P fails
    // (symmetric NAT, mobile LTE, corporate firewalls, double-NAT)
    {
        urls: 'turn:a.relay.metered.ca:80',
        username: 'e8dd65b92f27a4cebf721845',
        credential: '2D7JvfXYZJHjNgy3'
    },
    {
        urls: 'turn:a.relay.metered.ca:80?transport=tcp',
        username: 'e8dd65b92f27a4cebf721845',
        credential: '2D7JvfXYZJHjNgy3'
    },
    {
        urls: 'turn:a.relay.metered.ca:443',
        username: 'e8dd65b92f27a4cebf721845',
        credential: '2D7JvfXYZJHjNgy3'
    },
    {
        urls: 'turns:a.relay.metered.ca:443?transport=tcp',
        username: 'e8dd65b92f27a4cebf721845',
        credential: '2D7JvfXYZJHjNgy3'
    }
];

export function useWebRTC() {
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('idle');
    const [receivedFile, setReceivedFile] = useState(null);
    const [speed, setSpeed] = useState(0);
    const [eta, setEta] = useState(0);
    const [metadata, setMetadata] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [isSocketConnected, setIsSocketConnected] = useState(false);
    const [fingerprint, setFingerprint] = useState(null);
    const [branding, setBranding] = useState(null);

    // Use refs for mutable state that needs to be current inside callbacks
    const cryptoKeyRef = useRef(null);
    const socketRef = useRef(null);
    const peerConnectionsRef = useRef({});
    const dataChannelsRef = useRef({});
    const fileBufferRef = useRef([]);
    const transferredBytesRef = useRef(0);
    const receiverAckedBytesRef = useRef(0);
    const totalSizeRef = useRef(0);
    const lastBytesRef = useRef(0);
    const lastTimeRef = useRef(0);
    const metadataRef = useRef(null);
    const statusRef = useRef('idle');
    const receivedFileRef = useRef(null);
    const isPausedRef = useRef(false);
    const isCancelledRef = useRef(false);
    const lastProgressTimeRef = useRef(0);
    const candidateQueueRef = useRef({});
    const fileStreamRef = useRef(null);
    const useFileSystemApiRef = useRef(false);
    const writePromiseRef = useRef(Promise.resolve());
    const iceRestartCountRef = useRef({});   // targetId -> restart count
    const iceRestartingRef = useRef({});     // targetId -> boolean (prevent duplicate restarts)
    const sessionPinRef = useRef(null);      // Store the active session PIN for ICE restarts
    const isInitiatorRef = useRef(false);    // Whether this peer is the initiator
    const countryCodeRef = useRef('US');     // Fallback to US, fetched dynamically below
    const wakeLockRef = useRef(null);

    // --- Screen Wake Lock API ---
    const requestWakeLock = useCallback(async () => {
        if ('wakeLock' in navigator) {
            try {
                wakeLockRef.current = await navigator.wakeLock.request('screen');
                wakeLockRef.current.addEventListener('release', () => {
                    console.log('[Wake Lock] Screen Wake Lock released');
                });
                console.log('[Wake Lock] Screen Wake Lock acquired');
            } catch (err) {
                console.error(`[Wake Lock] Error: ${err.name}, ${err.message}`);
            }
        }
    }, []);

    const releaseWakeLock = useCallback(async () => {
        if (wakeLockRef.current !== null) {
            try {
                await wakeLockRef.current.release();
                wakeLockRef.current = null;
            } catch (err) {
                console.error(`[Wake Lock] Release Error: ${err.message}`);
            }
        }
    }, []);

    // Re-acquire wake lock if user switches tabs and comes back
    useEffect(() => {
        const handleVisibilityChange = async () => {
            if (wakeLockRef.current !== null && document.visibilityState === 'visible') {
                await requestWakeLock();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [requestWakeLock]);

    // Keep statusRef in sync
    useEffect(() => { statusRef.current = status; }, [status]);

    // Fetch Geo-location once for the Global Map
    useEffect(() => {
        fetch('https://get.geojs.io/v1/ip/country.json')
            .then(res => res.json())
            .then(data => {
                if (data.country) countryCodeRef.current = data.country;
            }).catch(e => console.warn('[Geo] Failed to fetch country', e));
    }, []);

    // Speed & ETA Monitoring
    useEffect(() => {
        if (status !== 'transferring') {
            setSpeed(0);
            setEta(0);
            return;
        }
        lastBytesRef.current = transferredBytesRef.current;
        lastTimeRef.current = Date.now();
        const interval = setInterval(() => {
            const now = Date.now();
            const deltaBytes = transferredBytesRef.current - lastBytesRef.current;
            const deltaSeconds = (now - lastTimeRef.current) / 1000;
            let currentSpeed = 0;
            if (deltaSeconds > 0) {
                currentSpeed = (deltaBytes / (1024 * 1024)) / deltaSeconds;
                setSpeed(currentSpeed);
                const remainingBytes = totalSizeRef.current - transferredBytesRef.current;
                if (currentSpeed > 0) setEta(Math.round(remainingBytes / (currentSpeed * 1024 * 1024)));
            }
            lastBytesRef.current = transferredBytesRef.current;
            lastTimeRef.current = now;

            if (socketRef.current && socketRef.current.connected) {
                socketRef.current.emit('telemetry', {
                    speed: currentSpeed,
                    progress: totalSizeRef.current > 0 ? (transferredBytesRef.current / totalSizeRef.current) * 100 : 0,
                    country: countryCodeRef.current
                });
            }
        }, 500);
        return () => clearInterval(interval);
    }, [status]);

    // --- Incoming data handler (uses refs so it's always current) ---
    const handleIncomingData = useCallback(async (data) => {
        if (typeof data === 'string') {
            try {
                const msg = JSON.parse(data);
                if (msg.type === 'batch_info') {
                    setReceivedFile([]);
                    receivedFileRef.current = [];
                } else if (msg.type === 'metadata') {
                    metadataRef.current = msg;
                    setMetadata(msg);
                    totalSizeRef.current = msg.size;
                    fileBufferRef.current = [];
                    transferredBytesRef.current = 0;
                    setProgress(0);
                    setStatus('awaiting_approval');
                    // CLEAR OLD GARBAGE TO PREVENT CORRUPTION AND FREEZES
                    try {
                        localforage.clear();
                    } catch(e) {}
                } else if (msg.type === 'cancel') {
                    doCancel();
                } else if (msg.type === 'ack') {
                    receiverAckedBytesRef.current = msg.bytes;
                } else if (msg.type === 'eof') {
                    // Force file completion in the data pipeline
                    handleIncomingData({ eof: true, index: msg.index });
                }
            } catch (e) {
                console.error('[WebRTC] Failed to parse message:', e);
            }
            return;
        }

        let chunkData = data;
        if (cryptoKeyRef.current && data.eof !== true) {
            try {
                const iv = new Uint8Array(data.slice(0, 12));
                const ciphertext = data.slice(12);
                chunkData = await window.crypto.subtle.decrypt(
                    { name: 'AES-GCM', iv }, 
                    cryptoKeyRef.current, 
                    ciphertext
                );
            } catch (e) {
                console.error("Decryption failed", e);
                return; // drop corrupted chunk
            }
        }

        // Sequence disk writes to prevent concurrent stream crashes and ensure perfect ordering
        writePromiseRef.current = writePromiseRef.current.then(async () => {
            // Accumulate decrypted chunk inside the synchronized promise chain
            if (data.eof !== true) {
                fileBufferRef.current.push(chunkData);
                transferredBytesRef.current += chunkData.byteLength;
            }
            
            // Calculate current buffer size
            const currentBufferSize = fileBufferRef.current.reduce((acc, c) => acc + c.byteLength, 0);
            
            // Only write to disk if buffer is > 4MB (to reduce write overhead) OR if this is the very last chunk
            const isLastChunk = (transferredBytesRef.current >= totalSizeRef.current) || data.eof === true;
            
            if (currentBufferSize >= 4 * 1024 * 1024 || isLastChunk) {
                const chunksToWrite = [...fileBufferRef.current];
                fileBufferRef.current = []; // clear buffer immediately
                
                if (chunksToWrite.length > 0) {
                    if (useFileSystemApiRef.current && fileStreamRef.current) {
                        try {
                            // Combine chunks into one large Blob for a single efficient disk write
                            await fileStreamRef.current.write(new Blob(chunksToWrite));
                        } catch (e) {
                            console.error("Stream write failed:", e);
                        }
                    } else {
                        // localforage fallback
                        const batchSize = chunksToWrite.reduce((acc, c) => acc + c.byteLength, 0);
                        const startOffset = transferredBytesRef.current - batchSize;
                        try {
                            await localforage.setItem(`chunk_${startOffset}`, new Blob(chunksToWrite));
                        } catch (e) {
                            console.error("IDB save error", e);
                        }
                    }
                }
            }

            const currentMeta = metadataRef.current;
            if (currentMeta && totalSizeRef.current > 0) {
                const now = Date.now();
                if (now - lastProgressTimeRef.current > UI_THROTTLE_MS || isLastChunk) {
                    setProgress(Math.round((transferredBytesRef.current / totalSizeRef.current) * 100));
                    lastProgressTimeRef.current = now;
                }
            }

            // Send software ACK for backpressure pacing
            if (!isInitiatorRef.current) {
                const ackStr = JSON.stringify({ type: 'ack', bytes: transferredBytesRef.current });
                Object.values(dataChannelsRef.current).forEach(dc => {
                    if (dc.readyState === 'open') {
                        try { dc.send(ackStr); } catch (e) {}
                    }
                });
            }

            // Only execute completion once (metadataRef.current will be set to null)
            if (isLastChunk && metadataRef.current) {
                let fileObj;
                if (useFileSystemApiRef.current && fileStreamRef.current) {
                    await fileStreamRef.current.close();
                    fileStreamRef.current = null;
                    fileObj = { name: currentMeta.name, savedToDisk: true, index: currentMeta.index };
                } else {
                    // Gather chunks from localforage
                    const keys = await localforage.keys();
                    keys.sort((a, b) => parseInt(a.split('_')[1]) - parseInt(b.split('_')[1]));
                    
                    const blobParts = [];
                    for (const k of keys) {
                        const savedBlob = await localforage.getItem(k);
                        if (savedBlob) blobParts.push(savedBlob);
                    }
                    
                    // Add remaining in buffer
                    if (fileBufferRef.current.length > 0) {
                        blobParts.push(new Blob(fileBufferRef.current));
                    }
                    
                    const finalBlob = new Blob(blobParts, { type: currentMeta.mime });
                    fileObj = { blob: finalBlob, name: currentMeta.name, url: URL.createObjectURL(finalBlob), index: currentMeta.index };
                    
                    // Cleanup
                    await localforage.clear();
                }

                const prevFiles = receivedFileRef.current || [];
                const updatedFiles = [...prevFiles, fileObj];
                receivedFileRef.current = updatedFiles;
                setReceivedFile(updatedFiles);

                if (currentMeta.index === currentMeta.totalCount - 1) {
                    setStatus('success');
                    releaseWakeLock();
                }
                
                writePromiseRef.current = Promise.resolve();
                fileBufferRef.current = [];
                transferredBytesRef.current = 0;
                metadataRef.current = null;
            }
        }).catch(err => {
            console.error('[WebRTC] Receiver promise chain crashed (likely Out of Quota). Attempting to recover:', err);
            // Must return resolved promise to un-brick the promise chain for future chunks
            return Promise.resolve();
        });
    }, [releaseWakeLock]);

    // Stable ref for handleIncomingData so setupDataChannel always uses latest
    const handleIncomingDataRef = useRef(handleIncomingData);
    useEffect(() => { handleIncomingDataRef.current = handleIncomingData; }, [handleIncomingData]);

    const acceptTransfer = useCallback(async () => {
        if (!metadataRef.current) return;
        
        try {
            // Always use localforage + Blob approach for traditional browser download UX
            useFileSystemApiRef.current = false;
            
            setStatus('transferring');
            requestWakeLock();
            
            // Tell the sender we are ready
            let resumeOffset = 0;
            if (!useFileSystemApiRef.current) {
                const keys = await localforage.keys();
                if (keys.length > 0 && metadataRef.current) {
                     const lastKey = keys.sort((a, b) => parseInt(b.split('_')[1]) - parseInt(a.split('_')[1]))[0];
                     const lastBlob = await localforage.getItem(lastKey);
                     if (lastBlob) {
                         resumeOffset = parseInt(lastKey.split('_')[1]) + lastBlob.size;
                         transferredBytesRef.current = resumeOffset;
                         fileBufferRef.current = [];
                     }
                }
            }

            const readyStr = JSON.stringify({ type: 'ready', resumeOffset });
            Object.values(dataChannelsRef.current).forEach(dc => {
                if (dc.readyState === 'open') dc.send(readyStr);
            });
            
        } catch (e) {
            console.error("User cancelled or API failed", e);
            if (e.name === 'AbortError') return; // User closed the save dialog
            
            // Fallback to memory
            useFileSystemApiRef.current = false;
            setStatus('transferring');
            requestWakeLock();
            
            let resumeOffset = 0;
            const keys = await localforage.keys();
            if (keys.length > 0 && metadataRef.current) {
                 const lastKey = keys.sort((a, b) => parseInt(b.split('_')[1]) - parseInt(a.split('_')[1]))[0];
                 const lastBlob = await localforage.getItem(lastKey);
                 if (lastBlob) {
                     resumeOffset = parseInt(lastKey.split('_')[1]) + lastBlob.size;
                     transferredBytesRef.current = resumeOffset;
                     fileBufferRef.current = [];
                 }
            }
            
            const readyStr = JSON.stringify({ type: 'ready', resumeOffset });
            Object.values(dataChannelsRef.current).forEach(dc => {
                if (dc.readyState === 'open') dc.send(readyStr);
            });
        }
    }, [requestWakeLock]);

    // --- Data channel setup ---
    const setupDataChannel = useCallback((dc, targetId) => {
        dc.binaryType = 'arraybuffer';
        dc.bufferedAmountLowThreshold = LOW_WATER_MARK;
        dc.onopen = () => {
            setStatus('connected');
            // Reset ICE restart counter on successful connection
            iceRestartCountRef.current[targetId] = 0;
            iceRestartingRef.current[targetId] = false;
            console.log('[WebRTC] Data Channel Open for', targetId);
        };
        dc.onmessage = (event) => handleIncomingDataRef.current(event.data);
        dc.onclose = () => {
            console.log('[WebRTC] Data Channel Closed for', targetId);
            // If we were mid-transfer, attempt recovery
            const currentStatus = statusRef.current;
            if (currentStatus === 'transferring' || currentStatus === 'connected' || currentStatus === 'awaiting_approval') {
                console.log('[WebRTC] Data channel closed during active session, attempting ICE restart...');
                attemptIceRestart(targetId);
            }
        };
        dc.onerror = (err) => {
            console.error('[WebRTC] Data Channel Error for', targetId, err);
            const currentStatus = statusRef.current;
            if (currentStatus === 'transferring' || currentStatus === 'connected') {
                attemptIceRestart(targetId);
            }
        };
        dataChannelsRef.current = { ...dataChannelsRef.current, [targetId]: dc };
    }, []);

    // --- ICE Restart Logic ---
    const attemptIceRestart = useCallback(async (targetId) => {
        const pc = peerConnectionsRef.current[targetId];
        const socket = socketRef.current;
        const pin = sessionPinRef.current;
        
        if (!pc || !socket || !pin) return;
        if (iceRestartingRef.current[targetId]) return; // Already restarting
        
        const restartCount = iceRestartCountRef.current[targetId] || 0;
        if (restartCount >= MAX_ICE_RESTARTS) {
            console.error(`[WebRTC] Max ICE restart attempts (${MAX_ICE_RESTARTS}) reached for ${targetId}`);
            setStatus('error');
            setErrorMsg('Connection lost after multiple recovery attempts. Please try again.');
            return;
        }
        
        iceRestartingRef.current[targetId] = true;
        iceRestartCountRef.current[targetId] = restartCount + 1;
        setStatus('reconnecting');
        console.log(`[WebRTC] ICE restart attempt ${restartCount + 1}/${MAX_ICE_RESTARTS} for ${targetId}`);
        
        try {
            // Wait briefly before restarting to let network stabilize
            await new Promise(r => setTimeout(r, ICE_RESTART_DELAY_MS));
            
            if (isInitiatorRef.current) {
                // Initiator creates a new offer with iceRestart: true
                const offer = await pc.createOffer({ iceRestart: true });
                await pc.setLocalDescription(offer);
                socket.emit('signal', { pin, targetId, signalData: { sdp: pc.localDescription } });
            } else {
                // Non-initiator triggers restartIce() and waits for new offer
                pc.restartIce();
            }
        } catch (err) {
            console.error('[WebRTC] ICE restart failed:', err);
            iceRestartingRef.current[targetId] = false;
            setStatus('error');
            setErrorMsg('Connection recovery failed. Please try again.');
        }
    }, []);

    // --- Peer connection setup ---
    const setupPeerConnection = useCallback((socket, pin, targetId, isInitiator) => {
        sessionPinRef.current = pin;
        isInitiatorRef.current = isInitiator;
        
        const pc = new RTCPeerConnection({
            iceServers: ICE_SERVERS,
            iceTransportPolicy: 'all',        // Try direct first, fallback to relay
            bundlePolicy: 'max-bundle',       // Bundle all media/data into one transport
            rtcpMuxPolicy: 'require',         // Reduce port usage
            iceCandidatePoolSize: 5            // Pre-gather candidates for faster connection
        });

        pc.oniceconnectionstatechange = () => {
            const state = pc.iceConnectionState;
            console.log('[WebRTC] ICE state:', state);
            if (state === 'connected' || state === 'completed') {
                // Connection successful — reset restart tracking
                iceRestartCountRef.current[targetId] = 0;
                iceRestartingRef.current[targetId] = false;
                if (statusRef.current === 'reconnecting') {
                    setStatus('connected');
                }
            } else if (state === 'failed') {
                // Attempt ICE restart before declaring failure
                console.log('[WebRTC] ICE failed, attempting restart...');
                attemptIceRestart(targetId);
            } else if (state === 'disconnected') {
                // Give the connection a moment to recover naturally
                setTimeout(() => {
                    if (pc.iceConnectionState === 'disconnected') {
                        console.log('[WebRTC] ICE still disconnected, attempting restart...');
                        attemptIceRestart(targetId);
                    }
                }, 3000);
            }
        };

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('signal', { pin, targetId, signalData: { candidate: event.candidate } });
            }
        };

        if (isInitiator) {
            const dc = pc.createDataChannel('zepglide-transfer', {
                ordered: true
            });
            setupDataChannel(dc, targetId);
        } else {
            pc.ondatachannel = (event) => {
                setupDataChannel(event.channel, targetId);
            };
        }

        peerConnectionsRef.current = { ...peerConnectionsRef.current, [targetId]: pc };
        return pc;
    }, [setupDataChannel, attemptIceRestart]);

    // --- Connect socket on mount ---
    useEffect(() => {
        const newSocket = io(SIGNAL_URL, {
            transports: ['websocket', 'polling'],
            reconnectionAttempts: Infinity,   // Never stop trying to reconnect
            reconnectionDelay: 1000,          // Start with 1s delay
            reconnectionDelayMax: 10000,      // Max 10s between retries
            timeout: 15000                    // 15s connection timeout
        });
        socketRef.current = newSocket;

        newSocket.on('connect', () => {
            console.log('[Signal] Connected to signaling server:', newSocket.id);
            setIsSocketConnected(true);
        });

        newSocket.on('disconnect', () => {
            setIsSocketConnected(false);
        });

        newSocket.on('connect_error', (err) => {
            console.error('[Signal] Connection error:', err.message);
            setIsSocketConnected(false);
        });

        newSocket.on('room-error', (data) => {
            setErrorMsg(data.message);
            setStatus('error');
        });

        return () => {
            newSocket.removeAllListeners();
            newSocket.close();
        };
    }, []);

    // --- Start session (sender) ---
    const startSession = useCallback(async (pin, password = '', isMultiPeer = false, keyHex = '', brandingData = null) => {
        if (keyHex) {
            cryptoKeyRef.current = await importKey(keyHex);
        }
        const socket = socketRef.current;
        if (!socket || !socket.connected) {
            setErrorMsg('Not connected to signaling server. Please wait...');
            setStatus('error');
            return;
        }
        setStatus('connecting');
        setErrorMsg('');

        // Clean up any previous listeners to prevent stacking
        socket.off('peer-joined');
        socket.off('signal');

        socket.emit('create-room', { pin, password, isMultiPeer, branding: brandingData });

        socket.on('peer-joined', async ({ receiverId }) => {
            try {
                console.log('[Signal] Peer joined:', receiverId);
                const pc = setupPeerConnection(socket, pin, receiverId, true);
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                socket.emit('signal', { pin, targetId: receiverId, signalData: { sdp: pc.localDescription } });
            } catch (err) {
                console.error('[WebRTC] Error creating offer:', err);
                setStatus('error');
                setErrorMsg('Failed to create connection offer.');
            }
        });

        socket.on('signal', async ({ senderId, signalData }) => {
            try {
                const pc = peerConnectionsRef.current[senderId];
                if (!pc) return;
                if (signalData.sdp) {
                    await pc.setRemoteDescription(new RTCSessionDescription(signalData.sdp));
                    const fpMatch = signalData.sdp.sdp?.match(/a=fingerprint:sha-256\s+(.*)/i);
                    if (fpMatch) setFingerprint(fpMatch[1]);
                    
                    // Process any queued candidates now that remote description is set
                    if (candidateQueueRef.current[senderId]) {
                        for (const candidate of candidateQueueRef.current[senderId]) {
                            await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.warn(e));
                        }
                        candidateQueueRef.current[senderId] = [];
                    }
                }
                if (signalData.candidate) {
                    if (pc.remoteDescription && pc.remoteDescription.type) {
                        await pc.addIceCandidate(new RTCIceCandidate(signalData.candidate));
                    } else {
                        if (!candidateQueueRef.current[senderId]) candidateQueueRef.current[senderId] = [];
                        candidateQueueRef.current[senderId].push(signalData.candidate);
                    }
                }
            } catch (err) {
                console.error('[WebRTC] Signal handling error:', err);
            }
        });
    }, [setupPeerConnection]);

    // --- Send files (High-Performance Engine) ---
    const sendFiles = useCallback(async (filesArray) => {
        const channels = Object.values(dataChannelsRef.current).filter(dc => dc.readyState === 'open');
        if (channels.length === 0) {
            console.error('[WebRTC] No open data channels to send files');
            setErrorMsg('No peer connected. Please wait for the receiver to join.');
            setStatus('error');
            return;
        }

        setStatus('transferring');
        requestWakeLock();
        isCancelledRef.current = false;
        isPausedRef.current = false;

        // Send batch info
        const totalBatchSize = filesArray.reduce((acc, f) => acc + f.size, 0);
        const batchInfoStr = JSON.stringify({
            type: 'batch_info', count: filesArray.length, totalSize: totalBatchSize
        });
        channels.filter(dc => dc.readyState === 'open').forEach(dc => {
            try { dc.send(batchInfoStr); } catch(e) { console.warn('[WebRTC] Failed to send batch_info:', e); }
        });

        // Pure event-driven drain wait with safety polling fallback
        const waitForDrain = (dc) => {
            if (dc.bufferedAmount <= dc.bufferedAmountLowThreshold) {
                return Promise.resolve();
            }
            return new Promise(resolve => {
                let resolved = false;
                const handleDrain = () => {
                    if (resolved) return;
                    resolved = true;
                    resolve();
                };
                dc.addEventListener('bufferedamountlow', handleDrain, { once: true });
                // Safety polling fallback to prevent race conditions or missed events
                const timer = setInterval(() => {
                    if (dc.bufferedAmount <= dc.bufferedAmountLowThreshold || dc.readyState !== 'open') {
                        clearInterval(timer);
                        if (!resolved) {
                            resolved = true;
                            dc.removeEventListener('bufferedamountlow', handleDrain);
                            resolve();
                        }
                    }
                }, 30);
            });
        };

        for (let i = 0; i < filesArray.length; i++) {
            if (isCancelledRef.current) break;

            const file = filesArray[i];
            transferredBytesRef.current = 0;
            receiverAckedBytesRef.current = 0;
            totalSizeRef.current = file.size;
            setProgress(0);

            // Send metadata for this file
            const metadataStr = JSON.stringify({
                type: 'metadata', index: i, totalCount: filesArray.length,
                name: file.name, size: file.size, mime: file.type
            });
            channels.filter(dc => dc.readyState === 'open').forEach(dc => {
                try { dc.send(metadataStr); } catch(e) { console.warn('[WebRTC] Failed to send metadata:', e); }
            });

            // Wait for receiver to be ready (they must accept the file or choose save location)
            setStatus('awaiting_approval');
            let resumeOffset = 0;
            await new Promise(resolve => {
                const checkReady = (event) => {
                    if (typeof event.data === 'string') {
                        try {
                            const msg = JSON.parse(event.data);
                            if (msg.type === 'ready') {
                                if (msg.resumeOffset) resumeOffset = msg.resumeOffset;
                                channels.forEach(dc => dc.removeEventListener('message', checkReady));
                                resolve();
                            }
                        } catch(e) {}
                    }
                };
                channels.forEach(dc => dc.addEventListener('message', checkReady));
            });
            setStatus('transferring');
            requestWakeLock();

            // Stream the file — read chunks directly from the browser's file stream, with fallback for older browsers
            let reader;
            if (typeof file.stream === 'function' && resumeOffset === 0) {
                reader = file.stream().getReader();
            } else {
                const makeStreamReader = (f, start) => {
                    let offset = start;
                    return {
                        read: async () => {
                            if (offset >= f.size) return { done: true };
                            const chunkSlice = f.slice(offset, offset + 1024 * 1024); // 1MB reading blocks
                            offset += chunkSlice.size;
                            const buffer = await chunkSlice.arrayBuffer();
                            return { done: false, value: new Uint8Array(buffer) };
                        }
                    };
                };
                reader = makeStreamReader(file, resumeOffset);
                transferredBytesRef.current = resumeOffset;
            }

            let yieldCounter = 0;

            try {
                while (true) {
                    if (isCancelledRef.current) break;

                    // Handle pause
                    while (isPausedRef.current) {
                        if (isCancelledRef.current) break;
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                    if (isCancelledRef.current) break;

                    const { done, value } = await reader.read();
                    if (done) break;

                    // Send the stream chunk in SEND_CHUNK_SIZE pieces
                    let offset = 0;
                    while (offset < value.byteLength) {
                        if (isCancelledRef.current) break;

                        const end = Math.min(offset + SEND_CHUNK_SIZE, value.byteLength);
                        
                        // Yield event loop every ~4MB to allow GC and UI updates (prevents freeze)
                        yieldCounter += (end - offset);
                        if (yieldCounter > 4 * 1024 * 1024) {
                            await new Promise(r => setTimeout(r, 0));
                            yieldCounter = 0;
                        }

                        // Create an ArrayBuffer slice directly for 100% browser/mobile compatibility
                        let chunkBuffer = value.buffer.slice(value.byteOffset + offset, value.byteOffset + end);
                        const originalChunkSize = chunkBuffer.byteLength;

                        if (cryptoKeyRef.current) {
                            const iv = window.crypto.getRandomValues(new Uint8Array(12));
                            const ciphertext = await window.crypto.subtle.encrypt(
                                { name: 'AES-GCM', iv }, 
                                cryptoKeyRef.current, 
                                chunkBuffer
                            );
                            const payload = new Uint8Array(iv.length + ciphertext.byteLength);
                            payload.set(iv, 0);
                            payload.set(new Uint8Array(ciphertext), iv.length);
                            chunkBuffer = payload.buffer;
                        }

                        // Get all open channels, skip dead ones
                        let openChannels = channels.filter(dc => dc.readyState === 'open');
                        if (openChannels.length === 0) {
                            // All channels closed — wait briefly for reconnection
                            console.warn('[WebRTC] No open channels, waiting for reconnection...');
                            let waitCount = 0;
                            while (waitCount < 100) { // Wait up to ~10 seconds
                                await new Promise(r => setTimeout(r, 100));
                                const recovered = Object.values(dataChannelsRef.current).filter(dc => dc.readyState === 'open');
                                if (recovered.length > 0) {
                                    channels.length = 0;
                                    channels.push(...recovered);
                                    openChannels = recovered; // Use recovered channels for THIS chunk
                                    break;
                                }
                                if (isCancelledRef.current) break;
                                waitCount++;
                            }
                            if (isCancelledRef.current || openChannels.length === 0) break;
                        }

                        for (const dc of openChannels) {
                            if (dc.readyState !== 'open') continue;
                            
                            // Software ACK backpressure - pause if Receiver is too far behind
                            while (transferredBytesRef.current - receiverAckedBytesRef.current > HIGH_WATER_MARK) {
                                if (isCancelledRef.current) break;
                                await new Promise(r => setTimeout(r, 10));
                            }

                            // HIGH WATER MARK backpressure — pure event-driven
                            if (dc.bufferedAmount > HIGH_WATER_MARK) {
                                await waitForDrain(dc);
                            }

                            try {
                                dc.send(chunkBuffer);
                            } catch (sendErr) {
                                console.error('[WebRTC] dc.send() failed:', sendErr);
                                // Channel died mid-send — will be caught on next iteration
                            }
                        }

                        offset = end;
                        transferredBytesRef.current += originalChunkSize;
                    }

                    // Throttle UI updates to avoid React re-renders choking the send loop
                    const now = Date.now();
                    if (now - lastProgressTimeRef.current > UI_THROTTLE_MS) {
                        setProgress(Math.round((transferredBytesRef.current / file.size) * 100));
                        lastProgressTimeRef.current = now;
                    }
                }
            } catch (err) {
                console.error('[WebRTC] Error during send stream loop:', err);
                setStatus('error');
                setErrorMsg('Error reading or encrypting file chunk: ' + err.message);
                releaseWakeLock();
                return;
            }

            if (isCancelledRef.current) {
                releaseWakeLock();
                return;
            }

            // Ensure final 100% is displayed
            setProgress(100);

            // Force an EOF marker to guarantee the receiver finishes the file even if bytes mismatch
            const eofStr = JSON.stringify({ type: 'eof', index: i });
            channels.filter(dc => dc.readyState === 'open').forEach(dc => {
                try { dc.send(eofStr); } catch (e) {}
            });

            // Brief gap between files for receiver to finalize
            if (i < filesArray.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 5));
            }
        }
        
        // Final telemetry emit to ensure 100% and 0 speed is sent
        if (socketRef.current && socketRef.current.connected) {
            socketRef.current.emit('telemetry', { speed: 0, progress: 100 });
        }
        
        setStatus('success');
        releaseWakeLock();
    }, [requestWakeLock, releaseWakeLock]);

    // --- Join session (receiver) ---
    const joinSession = useCallback(async (pin, password = '', keyHex = '') => {
        if (keyHex) {
            cryptoKeyRef.current = await importKey(keyHex);
        }
        const socket = socketRef.current;
        if (!socket || !socket.connected) {
            setErrorMsg('Not connected to signaling server. Please wait...');
            setStatus('error');
            return;
        }
        setStatus('connecting');
        setErrorMsg('');

        // Clean up any previous listeners
        socket.off('signal');

        socket.emit('join-room', { pin, password });

        socket.on('room-joined', (data) => {
            if (data.branding) {
                setBranding(data.branding);
            }
        });

        socket.on('signal', async ({ senderId, signalData }) => {
            try {
                let pc = peerConnectionsRef.current[senderId];
                if (!pc) {
                    pc = setupPeerConnection(socket, pin, senderId, false);
                }

                if (signalData.sdp) {
                    await pc.setRemoteDescription(new RTCSessionDescription(signalData.sdp));
                    const fpMatch = signalData.sdp.sdp?.match(/a=fingerprint:sha-256\s+(.*)/i);
                    if (fpMatch) setFingerprint(fpMatch[1]);
                    
                    if (signalData.sdp.type === 'offer') {
                        const answer = await pc.createAnswer();
                        await pc.setLocalDescription(answer);
                        socket.emit('signal', { pin, targetId: senderId, signalData: { sdp: pc.localDescription } });
                    }
                    
                    // Process queued candidates
                    if (candidateQueueRef.current[senderId]) {
                        for (const candidate of candidateQueueRef.current[senderId]) {
                            await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.warn(e));
                        }
                        candidateQueueRef.current[senderId] = [];
                    }
                }
                if (signalData.candidate) {
                    if (pc.remoteDescription && pc.remoteDescription.type) {
                        await pc.addIceCandidate(new RTCIceCandidate(signalData.candidate));
                    } else {
                        if (!candidateQueueRef.current[senderId]) candidateQueueRef.current[senderId] = [];
                        candidateQueueRef.current[senderId].push(signalData.candidate);
                    }
                }
            } catch (err) {
                console.error('[WebRTC] Signal handling error:', err);
            }
        });
    }, [setupPeerConnection]);

    // --- Cancel / cleanup ---
    const doCancel = useCallback(() => {
        isCancelledRef.current = true;
        isPausedRef.current = false;
        releaseWakeLock();
        
        Object.values(dataChannelsRef.current).forEach(dc => {
            try { dc.close(); } catch (e) { /* ignore */ }
        });
        Object.values(peerConnectionsRef.current).forEach(pc => {
            try { pc.close(); } catch (e) { /* ignore */ }
        });
        dataChannelsRef.current = {};
        peerConnectionsRef.current = {};
        metadataRef.current = null;
        receivedFileRef.current = null;
        writePromiseRef.current = Promise.resolve();
        fileBufferRef.current = [];
        transferredBytesRef.current = 0;
        totalSizeRef.current = 0;
        iceRestartCountRef.current = {};
        iceRestartingRef.current = {};
        sessionPinRef.current = null;

        setStatus('idle');
        setProgress(0);
        setSpeed(0);
        setEta(0);
        setMetadata(null);
        setReceivedFile(null);
        setBranding(null);

        // Clean up socket listeners
        const socket = socketRef.current;
        if (socket) {
            socket.off('peer-joined');
            socket.off('signal');
        }
    }, []);

    const cancelTransfer = useCallback(() => {
        isCancelledRef.current = true;
        doCancel();
    }, [doCancel]);

    const pauseTransfer = useCallback(() => {
        if (statusRef.current === 'transferring') {
            isPausedRef.current = true;
            setStatus('paused');
        }
    }, []);

    const resumeTransfer = useCallback(() => {
        if (statusRef.current === 'paused') {
            isPausedRef.current = false;
            setStatus('transferring');
        }
    }, []);

    const retryTransfer = useCallback(() => {
        doCancel();
    }, [doCancel]);

    return {
        status, progress, speed, eta, metadata, receivedFile, errorMsg, isSocketConnected, fingerprint, branding,
        startSession, joinSession, acceptTransfer, sendFiles, cancelTransfer, pauseTransfer, resumeTransfer, retryTransfer
    };
}
