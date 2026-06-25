import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

const SIGNAL_URL = import.meta.env.VITE_SIGNAL_URL || (import.meta.env.MODE === 'production' ? 'https://zepglide.onrender.com' : 'http://localhost:3002');
const CHUNK_SIZE = 262144; // 256KB per chunk

export function useWebRTC() {
    const [socket, setSocket] = useState(null);
    const [peerConnections, setPeerConnections] = useState({});
    const [dataChannels, setDataChannels] = useState({});
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('idle'); // idle, connecting, connected, transferring, success, error, firewall_blocked
    const [receivedFile, setReceivedFile] = useState(null);
    const [speed, setSpeed] = useState(0); 
    const [eta, setEta] = useState(0);
    const [metadata, setMetadata] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    
    const fileBuffer = useRef([]);
    const transferredBytes = useRef(0);
    const totalSize = useRef(0);
    const lastBytes = useRef(0);
    const lastTime = useRef(0);

    // Speed & ETA Monitoring
    useEffect(() => {
        if (status !== 'transferring') {
            setSpeed(0);
            setEta(0);
            return;
        }
        const interval = setInterval(() => {
            const now = Date.now();
            const deltaBytes = transferredBytes.current - lastBytes.current;
            const deltaSeconds = (now - lastTime.current) / 1000;
            if (deltaSeconds > 0) {
                const currentSpeed = (deltaBytes / (1024 * 1024)) / deltaSeconds;
                setSpeed(currentSpeed);
                const remainingBytes = totalSize.current - transferredBytes.current;
                if (currentSpeed > 0) setEta(Math.round(remainingBytes / (currentSpeed * 1024 * 1024)));
            }
            lastBytes.current = transferredBytes.current;
            lastTime.current = now;
        }, 500); // 500ms for ultra-responsive UI
        return () => clearInterval(interval);
    }, [status]);

    useEffect(() => {
        const newSocket = io(SIGNAL_URL);
        setSocket(newSocket);
        
        newSocket.on('room-error', (data) => {
            setErrorMsg(data.message);
            setStatus('error');
        });

        return () => newSocket.close();
    }, []);

    const setupPeerConnection = useCallback((pin, targetId, isInitiator) => {
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        pc.oniceconnectionstatechange = () => {
            if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
                console.warn('[WebRTC] Connection dropped/failed');
                // Check if STUN failed (firewall block)
                if (pc.iceConnectionState === 'failed') {
                    setStatus('firewall_blocked');
                } else {
                    setStatus('error');
                }
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

        setPeerConnections(prev => ({ ...prev, [targetId]: pc }));
        return pc;
    }, [socket]);

    const setupDataChannel = (dc, targetId) => {
        dc.binaryType = 'arraybuffer';
        dc.bufferedAmountLowThreshold = 2 * 1024 * 1024; // 2MB threshold for blazing fast continuous streaming
        dc.onopen = () => {
            setStatus('connected');
            console.log('P2P Data Channel Open for', targetId);
        };
        dc.onmessage = (event) => handleIncomingData(event.data);
        dc.onclose = () => {};
        setDataChannels(prev => ({ ...prev, [targetId]: dc }));
    };

    const startSession = useCallback((pin, password = '', isMultiPeer = false) => {
        if (!socket) return;
        setStatus('connecting');
        setErrorMsg('');
        socket.emit('create-room', { pin, password, isMultiPeer });

        // Note: multiple receivers can join if isMultiPeer is true
        socket.on('peer-joined', async ({ receiverId }) => {
            const pc = setupPeerConnection(pin, receiverId, true);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit('signal', { pin, targetId: receiverId, signalData: { sdp: pc.localDescription } });
        });

        socket.on('signal', async ({ senderId, signalData: { sdp, candidate } }) => {
            setPeerConnections(prev => {
                const pc = prev[senderId];
                if (!pc) return prev;
                (async () => {
                    if (sdp) await pc.setRemoteDescription(new RTCSessionDescription(sdp));
                    if (candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate));
                })();
                return prev;
            });
        });
    }, [socket, setupPeerConnection]);

    const sendFiles = async (filesArray) => {
        const channels = Object.values(dataChannels).filter(dc => dc.readyState === 'open');
        if (channels.length === 0) return;
        
        setStatus('transferring');
        const totalBatchSize = filesArray.reduce((acc, f) => acc + f.size, 0);
        
        const batchInfoStr = JSON.stringify({
            type: 'batch_info', count: filesArray.length, totalSize: totalBatchSize
        });
        channels.forEach(dc => dc.send(batchInfoStr));

        for (let i = 0; i < filesArray.length; i++) {
            const file = filesArray[i];
            transferredBytes.current = 0;
            totalSize.current = file.size;

            const metadataStr = JSON.stringify({
                type: 'metadata', index: i, totalCount: filesArray.length,
                name: file.name, size: file.size, mime: file.type
            });
            channels.forEach(dc => dc.send(metadataStr));

            // ReadableStream Implementation (0 RAM overhead)
            const stream = file.stream();
            const reader = stream.getReader();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                for (const dc of channels) {
                    if (dc.readyState !== 'open') continue;
                    
                    if (dc.bufferedAmount > dc.bufferedAmountLowThreshold) {
                        await new Promise(resolve => {
                            dc.onbufferedamountlow = () => {
                                dc.onbufferedamountlow = null;
                                resolve();
                            };
                        });
                    }
                    dc.send(value.buffer || value);
                }

                transferredBytes.current += value.byteLength;
                setProgress(Math.round((transferredBytes.current / file.size) * 100));
            }
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        setStatus('success');
    };

    const joinSession = useCallback((pin, password = '') => {
        if (!socket) return;
        setStatus('connecting');
        setErrorMsg('');
        
        socket.emit('join-room', { pin, password });

        socket.on('signal', async ({ senderId, signalData: { sdp, candidate } }) => {
            let pc;
            setPeerConnections(prev => {
                pc = prev[senderId];
                if (!pc) pc = setupPeerConnection(pin, senderId, false);
                return { ...prev, [senderId]: pc };
            });

            if (!pc) pc = setupPeerConnection(pin, senderId, false);

            if (sdp) {
                await pc.setRemoteDescription(new RTCSessionDescription(sdp));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.emit('signal', { pin, targetId: senderId, signalData: { sdp: pc.localDescription } });
            }
            if (candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate));
        });
    }, [socket, setupPeerConnection]);

    const handleIncomingData = (data) => {
        if (typeof data === 'string') {
            const msg = JSON.parse(data);
            if (msg.type === 'batch_info') {
                setStatus('transferring');
                setReceivedFile([]);
            } else if (msg.type === 'metadata') {
                setMetadata(msg);
                totalSize.current = msg.size;
                fileBuffer.current = [];
                transferredBytes.current = 0;
            } else if (msg.type === 'cancel') cancelTransfer();
            return;
        }

        fileBuffer.current.push(data);
        transferredBytes.current += data.byteLength;
        setProgress(Math.round((transferredBytes.current / totalSize.current) * 100));

        if (transferredBytes.current >= totalSize.current && metadata) {
            const blob = new Blob(fileBuffer.current, { type: metadata.mime });
            const fileObj = { blob, name: metadata.name, url: URL.createObjectURL(blob), index: metadata.index };
            
            setReceivedFile(prev => Array.isArray(prev) ? [...prev, fileObj] : [fileObj]);

            if (metadata.index === metadata.totalCount - 1) setStatus('success');
        }
    };

    const cancelTransfer = useCallback(() => {
        Object.values(dataChannels).forEach(dc => dc.close());
        Object.values(peerConnections).forEach(pc => pc.close());
        setDataChannels({});
        setPeerConnections({});
        setStatus('idle');
        setProgress(0);
        setSpeed(0);
        setEta(0);
        setMetadata(null);
        setReceivedFile(null);
        transferredBytes.current = 0;
    }, [dataChannels, peerConnections]);

    const retryTransfer = useCallback(() => {
        cancelTransfer();
    }, [cancelTransfer]);

    return {
        status, progress, speed, eta, metadata, receivedFile, errorMsg,
        startSession, joinSession, sendFiles, cancelTransfer, retryTransfer
    };
}
