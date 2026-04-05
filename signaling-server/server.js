import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import helmet from 'helmet';
import cors from 'cors';

/**
 * Zepglide Signaling Server
 * -------------------------
 * High-performance signaling node for WebRTC/WebTransport peer coordination.
 * Hardened for NCP (Naver Cloud Platform) infrastructure with health monitoring.
 */

const app = express();
const httpServer = createServer(app);

// Basic Security & Middleware
app.use(helmet());
app.use(cors({ origin: '*' })); // Configured for global accessibility in initial phase
app.use(express.json());

// Socket.io Initialization
const io = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling'] // WebTransport-ready pathing
});

const PORT = process.env.PORT || 3002;

// --- NCP HEALTH MONITORING ---
/**
 * CRITICAL: Naver Cloud Platform Load Balancers require a 200 OK on this endpoint.
 */
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

// --- SIGNALING & MATCHMAKING LOGIC ---
io.on('connection', (socket) => {
    console.log(`[CONN] New node attached: ${socket.id}`);

    /**
     * Create Room Phase
     * Initializes a new signaling room with a 6-digit PIN.
     */
    socket.on('create-room', (pin) => {
        socket.join(pin);
        console.log(`[ROOM] Node ${socket.id} created/joined room: ${pin}`);
    });

    /**
     * Join Room Phase
     * Synchronizes two peers in an isolated signaling room.
     */
    socket.on('join-room', (pin) => {
        const room = io.sockets.adapter.rooms.get(pin);
        
        // Matchmaking Validation: Room must exist and contain exactly 1 peer.
        if (room && room.size === 1) {
            socket.join(pin);
            console.log(`[ROOM] Node ${socket.id} bonded to room: ${pin}`);
            
            // Notify both peers that the handshake can begin.
            io.to(pin).emit('peer-joined');
        } else {
            console.warn(`[ERR] Join failed for ${socket.id} on PIN: ${pin} (Room full or not found)`);
            socket.emit('room-error', { message: 'Room not found or already full.' });
        }
    });

    /**
     * Signaling Relay
     * Transparently passes SDP offers, answers, and ICE candidates between peers.
     */
    socket.on('signal', ({ pin, signalData }) => {
        // Broadcast signalData to the *other* socket in the same room.
        socket.to(pin).emit('signal', signalData);
    });

    /**
     * Cleanup Tracking
     */
    socket.on('disconnect', () => {
        console.log(`[DISC] Node detached: ${socket.id}`);
    });
});

// --- SERVER UP ---
httpServer.listen(PORT, () => {
    console.log(`🚀 Zepglide Signaling Engine online at http://localhost:${PORT}`);
    console.log(`📡 Health Check verified at http://localhost:${PORT}/health`);
});
