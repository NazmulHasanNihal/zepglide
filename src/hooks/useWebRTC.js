import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

const SIGNAL_URL = 'http://localhost:3002';
const CHUNK_SIZE = 262144; // 256KB per chunk for maximum local throughput

export function useWebRTC() {
    const [socket, setSocket] = useState(null);
    const [peerConnection, setPeerConnection] = useState(null);
    const [dataChannel, setDataChannel] = useState(null);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('idle'); // idle, connecting, connected, transferring, success, error
    const [receivedFile, setReceivedFile] = useState(null);
    const [speed, setSpeed] = useState(0); 
    const [eta, setEta] = useState(0);
    const [metadata, setMetadata] = useState(null);
    
    const fileBuffer = useRef([]);
    const transferredBytes = useRef(0);
    const totalSize = useRef(0);
    const lastBytes = useRef(0);
    const lastTime = useRef(0);
    const transferStartTime = useRef(0);

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
                const currentSpeed = (deltaBytes / (1024 * 1024)) / deltaSeconds; // MB/s
                setSpeed(currentSpeed);

                const remainingBytes = totalSize.current - transferredBytes.current;
                if (currentSpeed > 0) {
                    setEta(Math.round(remainingBytes / (currentSpeed * 1024 * 1024)));
                }
            }

            lastBytes.current = transferredBytes.current;
            lastTime.current = now;
        }, 1000);

        return () => clearInterval(interval);
    }, [status]);

    // Initial Socket setup
    useEffect(() => {
        const newSocket = io(SIGNAL_URL);
        setSocket(newSocket);
        return () => newSocket.close();
    }, []);

    // RTCPeerConnection Setup
    const setupPeerConnection = useCallback((pin, isInitiator) => {
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        // Connection State Monitoring
        pc.oniceconnectionstatechange = () => {
            if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
                console.warn('[WebRTC] Connection dropped/failed');
                setStatus('error');
            }
        };

        // ICE Candidate Handling
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('signal', { pin, signalData: { candidate: event.candidate } });
            }
        };

        // Data Channel Handling
        if (isInitiator) {
            const dc = pc.createDataChannel('zepglide-transfer');
            setupDataChannel(dc);
        } else {
            pc.ondatachannel = (event) => {
                setupDataChannel(event.channel);
            };
        }

        setPeerConnection(pc);
        return pc;
    }, [socket]);

    const setupDataChannel = (dc) => {
        dc.binaryType = 'arraybuffer';
        dc.onopen = () => {
            setStatus('connected');
            console.log('P2P Data Channel Open');
        };
        dc.onmessage = (event) => {
            handleIncomingData(event.data);
        };
        dc.onclose = () => setStatus('idle');
        setDataChannel(dc);
    };

    // --- SENDER LOGIC ---
    const startSession = useCallback((pin) => {
        if (!socket) return;
        setStatus('connecting');
        const pc = setupPeerConnection(pin, true);

        socket.emit('create-room', pin);

        socket.on('peer-joined', async () => {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit('signal', { pin, signalData: { sdp: pc.localDescription } });
        });

        socket.on('signal', async ({ sdp, candidate }) => {
            if (sdp) await pc.setRemoteDescription(new RTCSessionDescription(sdp));
            if (candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate));
        });
    }, [socket, setupPeerConnection]);

    const sendFiles = async (filesArray) => {
        if (!dataChannel || dataChannel.readyState !== 'open') return;
        
        setStatus('transferring');
        
        // Notify receiver of batch
        const totalBatchSize = filesArray.reduce((acc, f) => acc + f.size, 0);
        dataChannel.send(JSON.stringify({
            type: 'batch_info',
            count: filesArray.length,
            totalSize: totalBatchSize
        }));

        for (let i = 0; i < filesArray.length; i++) {
            await new Promise((resolve) => {
                const file = filesArray[i];
                transferredBytes.current = 0;
                totalSize.current = file.size;

                dataChannel.send(JSON.stringify({
                    type: 'metadata',
                    index: i,
                    totalCount: filesArray.length,
                    name: file.name,
                    size: file.size,
                    mime: file.type
                }));

                const reader = new FileReader();
                let offset = 0;

                const readNextChunk = () => {
                    const slice = file.slice(transferredBytes.current, transferredBytes.current + CHUNK_SIZE);
                    reader.readAsArrayBuffer(slice);
                };

                reader.onload = (e) => {
                    dataChannel.send(e.target.result);
                    transferredBytes.current += e.target.result.byteLength;
                    setProgress(Math.round((transferredBytes.current / file.size) * 100));

                    if (transferredBytes.current < file.size) {
                        if (dataChannel.bufferedAmount > dataChannel.bufferedAmountLowThreshold) {
                            dataChannel.onbufferedamountlow = () => {
                                dataChannel.onbufferedamountlow = null;
                                readNextChunk();
                            };
                        } else {
                            readNextChunk();
                        }
                    } else {
                        setTimeout(() => resolve(), 50); // slight buffer before next file metadata
                    }
                };
                readNextChunk();
            });
        }
        setStatus('success');
    };

    const cancelTransfer = useCallback(() => {
        if (dataChannel) dataChannel.close();
        if (peerConnection) peerConnection.close();
        setStatus('idle');
        setProgress(0);
        setSpeed(0);
        setEta(0);
        setMetadata(null);
        setReceivedFile(null);
        transferredBytes.current = 0;
    }, [dataChannel, peerConnection]);

    const retryTransfer = useCallback(() => {
        cancelTransfer();
        // The UI will re-trigger startSession or joinSession based on role
    }, [cancelTransfer]);

    // --- RECEIVER LOGIC ---
    const joinSession = useCallback((pin) => {
        if (!socket) return;
        setStatus('connecting');
        const pc = setupPeerConnection(pin, false);

        socket.emit('join-room', pin);

        socket.on('signal', async ({ sdp, candidate }) => {
            if (sdp) {
                await pc.setRemoteDescription(new RTCSessionDescription(sdp));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.emit('signal', { pin, signalData: { sdp: pc.localDescription } });
            }
            if (candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate));
        });
    }, [socket, setupPeerConnection]);

    const handleIncomingData = (data) => {
        if (typeof data === 'string') {
            const msg = JSON.parse(data);
            if (msg.type === 'batch_info') {
                setStatus('transferring');
                setReceivedFile([]); // initialize array for batch mode
            } else if (msg.type === 'metadata') {
                setMetadata(msg);
                totalSize.current = msg.size;
                fileBuffer.current = [];
                transferredBytes.current = 0;
            } else if (msg.type === 'cancel') {
                cancelTransfer();
            }
            return;
        }

        // Handle binary chunk
        fileBuffer.current.push(data);
        transferredBytes.current += data.byteLength;
        setProgress(Math.round((transferredBytes.current / totalSize.current) * 100));

        if (transferredBytes.current >= totalSize.current && metadata) {
            const blob = new Blob(fileBuffer.current, { type: metadata.mime });
            const fileObj = {
                blob,
                name: metadata.name,
                url: URL.createObjectURL(blob),
                index: metadata.index
            };
            
            setReceivedFile(prev => {
                if (Array.isArray(prev)) {
                    return [...prev, fileObj];
                }
                return [fileObj];
            });

            if (metadata.index === metadata.totalCount - 1) {
                setStatus('success');
            }
        }
    };

    return {
        status, 
        progress, 
        speed,
        eta,
        metadata,
        receivedFile, 
        startSession, 
        joinSession, 
        sendFiles,
        cancelTransfer,
        retryTransfer
    };
}
