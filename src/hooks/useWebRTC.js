import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

const SIGNAL_URL = import.meta.env.VITE_SIGNAL_URL || import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'production' ? 'https://zepglide.onrender.com' : 'http://localhost:3001');

export function useWebRTC() {
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('idle');
    const [receivedFile, setReceivedFile] = useState(null);
    const [speed, setSpeed] = useState(0);
    const [eta, setEta] = useState(0);
    const [metadata, setMetadata] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [isSocketConnected, setIsSocketConnected] = useState(false);

    // Use refs for mutable state that needs to be current inside callbacks
    const socketRef = useRef(null);
    const peerConnectionsRef = useRef({});
    const dataChannelsRef = useRef({});
    const fileBufferRef = useRef([]);
    const transferredBytesRef = useRef(0);
    const totalSizeRef = useRef(0);
    const lastBytesRef = useRef(0);
    const lastTimeRef = useRef(0);
    const metadataRef = useRef(null);
    const statusRef = useRef('idle');
    const receivedFileRef = useRef(null);

    // Keep statusRef in sync
    useEffect(() => { statusRef.current = status; }, [status]);

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
            if (deltaSeconds > 0) {
                const currentSpeed = (deltaBytes / (1024 * 1024)) / deltaSeconds;
                setSpeed(currentSpeed);
                const remainingBytes = totalSizeRef.current - transferredBytesRef.current;
                if (currentSpeed > 0) setEta(Math.round(remainingBytes / (currentSpeed * 1024 * 1024)));
            }
            lastBytesRef.current = transferredBytesRef.current;
            lastTimeRef.current = now;
        }, 500);
        return () => clearInterval(interval);
    }, [status]);

    // --- Incoming data handler (uses refs so it's always current) ---
    const handleIncomingData = useCallback((data) => {
        if (typeof data === 'string') {
            try {
                const msg = JSON.parse(data);
                if (msg.type === 'batch_info') {
                    setStatus('transferring');
                    setReceivedFile([]);
                    receivedFileRef.current = [];
                } else if (msg.type === 'metadata') {
                    metadataRef.current = msg;
                    setMetadata(msg);
                    totalSizeRef.current = msg.size;
                    fileBufferRef.current = [];
                    transferredBytesRef.current = 0;
                    setProgress(0);
                } else if (msg.type === 'cancel') {
                    doCancel();
                }
            } catch (e) {
                console.error('[WebRTC] Failed to parse message:', e);
            }
            return;
        }

        fileBufferRef.current.push(data);
        transferredBytesRef.current += data.byteLength;
        const currentMeta = metadataRef.current;
        if (currentMeta && totalSizeRef.current > 0) {
            setProgress(Math.round((transferredBytesRef.current / totalSizeRef.current) * 100));
        }

        if (transferredBytesRef.current >= totalSizeRef.current && currentMeta) {
            const blob = new Blob(fileBufferRef.current, { type: currentMeta.mime });
            const fileObj = { blob, name: currentMeta.name, url: URL.createObjectURL(blob), index: currentMeta.index };

            const prevFiles = receivedFileRef.current || [];
            const updatedFiles = [...prevFiles, fileObj];
            receivedFileRef.current = updatedFiles;
            setReceivedFile(updatedFiles);

            if (currentMeta.index === currentMeta.totalCount - 1) {
                setStatus('success');
            }
            // Reset for next file in batch
            fileBufferRef.current = [];
            transferredBytesRef.current = 0;
            metadataRef.current = null;
        }
    }, []);

    // Stable ref for handleIncomingData so setupDataChannel always uses latest
    const handleIncomingDataRef = useRef(handleIncomingData);
    useEffect(() => { handleIncomingDataRef.current = handleIncomingData; }, [handleIncomingData]);

    // --- Data channel setup ---
    const setupDataChannel = useCallback((dc, targetId) => {
        dc.binaryType = 'arraybuffer';
        dc.bufferedAmountLowThreshold = 2 * 1024 * 1024;
        dc.onopen = () => {
            setStatus('connected');
            console.log('[WebRTC] Data Channel Open for', targetId);
        };
        dc.onmessage = (event) => handleIncomingDataRef.current(event.data);
        dc.onclose = () => {
            console.log('[WebRTC] Data Channel Closed for', targetId);
        };
        dataChannelsRef.current = { ...dataChannelsRef.current, [targetId]: dc };
    }, []);

    // --- Peer connection setup ---
    const setupPeerConnection = useCallback((socket, pin, targetId, isInitiator) => {
        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        });

        pc.oniceconnectionstatechange = () => {
            const state = pc.iceConnectionState;
            console.log('[WebRTC] ICE state:', state);
            if (state === 'failed') {
                setStatus('firewall_blocked');
            } else if (state === 'disconnected') {
                // Give it a moment to recover before declaring error
                setTimeout(() => {
                    if (pc.iceConnectionState === 'disconnected') {
                        setStatus('error');
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
            const dc = pc.createDataChannel('zepglide-transfer');
            setupDataChannel(dc, targetId);
        } else {
            pc.ondatachannel = (event) => {
                setupDataChannel(event.channel, targetId);
            };
        }

        peerConnectionsRef.current = { ...peerConnectionsRef.current, [targetId]: pc };
        return pc;
    }, [setupDataChannel]);

    // --- Connect socket on mount ---
    useEffect(() => {
        const newSocket = io(SIGNAL_URL, {
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 5,
            timeout: 10000
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
    const startSession = useCallback((pin, password = '', isMultiPeer = false) => {
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

        socket.emit('create-room', { pin, password, isMultiPeer });

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
                }
                if (signalData.candidate) {
                    await pc.addIceCandidate(new RTCIceCandidate(signalData.candidate));
                }
            } catch (err) {
                console.error('[WebRTC] Signal handling error:', err);
            }
        });
    }, [setupPeerConnection]);

    // --- Send files ---
    const sendFiles = useCallback(async (filesArray) => {
        const channels = Object.values(dataChannelsRef.current).filter(dc => dc.readyState === 'open');
        if (channels.length === 0) {
            console.error('[WebRTC] No open data channels to send files');
            return;
        }

        setStatus('transferring');

        // Send batch info
        const totalBatchSize = filesArray.reduce((acc, f) => acc + f.size, 0);
        const batchInfoStr = JSON.stringify({
            type: 'batch_info', count: filesArray.length, totalSize: totalBatchSize
        });
        channels.forEach(dc => dc.send(batchInfoStr));

        for (let i = 0; i < filesArray.length; i++) {
            const file = filesArray[i];
            transferredBytesRef.current = 0;
            totalSizeRef.current = file.size;
            setProgress(0);

            // Send metadata for this file
            const metadataStr = JSON.stringify({
                type: 'metadata', index: i, totalCount: filesArray.length,
                name: file.name, size: file.size, mime: file.type
            });
            channels.forEach(dc => dc.send(metadataStr));

            // Small delay to let receiver process metadata
            await new Promise(resolve => setTimeout(resolve, 100));

            // Stream file using ReadableStream
            const stream = file.stream();
            const reader = stream.getReader();
            const CHUNK_SIZE = 64 * 1024; // 64KB is optimal for WebRTC

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                let offset = 0;
                while (offset < value.byteLength) {
                    const end = Math.min(offset + CHUNK_SIZE, value.byteLength);
                    const chunk = value.slice(offset, end);
                    
                    for (const dc of channels) {
                        if (dc.readyState !== 'open') continue;

                        // Bulletproof backpressure polling
                        while (dc.bufferedAmount > dc.bufferedAmountLowThreshold) {
                            await new Promise(resolve => {
                                const checkBuffer = () => resolve();
                                dc.addEventListener('bufferedamountlow', checkBuffer);
                                setTimeout(() => {
                                    dc.removeEventListener('bufferedamountlow', checkBuffer);
                                    resolve();
                                }, 50); // Poll every 50ms just in case event is missed
                            });
                        }
                        
                        try {
                            dc.send(chunk.buffer || chunk);
                        } catch (err) {
                            console.error('[WebRTC] Send error:', err);
                        }
                    }

                    transferredBytesRef.current += chunk.byteLength;
                    setProgress(Math.round((transferredBytesRef.current / file.size) * 100));
                    offset = end;
                }
            }

            // Delay between files so receiver can finalize
            if (i < filesArray.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }
        setStatus('success');
    }, []);

    // --- Join session (receiver) ---
    const joinSession = useCallback((pin, password = '') => {
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

        socket.on('signal', async ({ senderId, signalData }) => {
            try {
                let pc = peerConnectionsRef.current[senderId];
                if (!pc) {
                    pc = setupPeerConnection(socket, pin, senderId, false);
                }

                if (signalData.sdp) {
                    await pc.setRemoteDescription(new RTCSessionDescription(signalData.sdp));
                    if (signalData.sdp.type === 'offer') {
                        const answer = await pc.createAnswer();
                        await pc.setLocalDescription(answer);
                        socket.emit('signal', { pin, targetId: senderId, signalData: { sdp: pc.localDescription } });
                    }
                }
                if (signalData.candidate) {
                    await pc.addIceCandidate(new RTCIceCandidate(signalData.candidate));
                }
            } catch (err) {
                console.error('[WebRTC] Signal handling error:', err);
            }
        });
    }, [setupPeerConnection]);

    // --- Cancel / cleanup ---
    const doCancel = useCallback(() => {
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
        fileBufferRef.current = [];
        transferredBytesRef.current = 0;
        totalSizeRef.current = 0;

        setStatus('idle');
        setProgress(0);
        setSpeed(0);
        setEta(0);
        setMetadata(null);
        setReceivedFile(null);

        // Clean up socket listeners
        const socket = socketRef.current;
        if (socket) {
            socket.off('peer-joined');
            socket.off('signal');
        }
    }, []);

    const cancelTransfer = useCallback(() => {
        doCancel();
    }, [doCancel]);

    const retryTransfer = useCallback(() => {
        doCancel();
    }, [doCancel]);

    return {
        status, progress, speed, eta, metadata, receivedFile, errorMsg, isSocketConnected,
        startSession, joinSession, sendFiles, cancelTransfer, retryTransfer
    };
}
