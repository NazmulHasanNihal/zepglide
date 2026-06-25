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

// Store extra room properties in memory (password, isMultiPeer, ownerId)
const roomData = {};

// --- SIGNALING & MATCHMAKING LOGIC ---
io.on('connection', (socket) => {
    console.log(`[CONN] New node attached: ${socket.id}`);

    /**
     * Create Room Phase
     * Initializes a new signaling room with a 6-digit PIN and optional Pro configurations.
     */
    socket.on('create-room', (payload) => {
        // Support both old format (string pin) and new format (object)
        const pin = typeof payload === 'string' ? payload : payload.pin;
        const password = payload.password || null;
        const isMultiPeer = payload.isMultiPeer || false;

        socket.join(pin);
        
        // Save room preferences
        roomData[pin] = {
            ownerId: socket.id,
            password: password,
            isMultiPeer: isMultiPeer
        };

        console.log(`[ROOM] Node ${socket.id} created room: ${pin} (MultiPeer: ${isMultiPeer}, Password: ${!!password})`);
    });

    /**
     * Join Room Phase
     * Synchronizes peers in an isolated signaling room.
     */
    socket.on('join-room', (payload) => {
        const pin = typeof payload === 'string' ? payload : payload.pin;
        const password = payload.password || null;
        
        const room = io.sockets.adapter.rooms.get(pin);
        const rData = roomData[pin];

        if (!room || !rData) {
            console.warn(`[ERR] Join failed for ${socket.id} on PIN: ${pin} (Room not found)`);
            return socket.emit('room-error', { message: 'Room not found.' });
        }

        // 1. Password Verification
        if (rData.password && rData.password !== password) {
            console.warn(`[ERR] Join failed for ${socket.id} on PIN: ${pin} (Invalid Password)`);
            return socket.emit('room-error', { message: 'Invalid Room Password.' });
        }

        // 2. Capacity Validation
        // If not multi-peer, max size is 1 (the owner). So adding this one makes 2.
        if (!rData.isMultiPeer && room.size >= 2) {
            console.warn(`[ERR] Join failed for ${socket.id} on PIN: ${pin} (Room full)`);
            return socket.emit('room-error', { message: 'Room already full. Sender is not a Pro Multi-Broadcaster.' });
        }

        socket.join(pin);
        console.log(`[ROOM] Node ${socket.id} bonded to room: ${pin}`);
        
        // Notify both the specific sender and this new receiver
        io.to(rData.ownerId).emit('peer-joined', { receiverId: socket.id });
    });

    /**
     * Signaling Relay
     * Passes SDP offers, answers, and ICE candidates between peers.
     */
    socket.on('signal', ({ pin, targetId, signalData }) => {
        const rData = roomData[pin];
        if (!rData) return;

        // If targetId is provided, send directly to that socket (for multi-peer selective routing)
        if (targetId) {
            io.to(targetId).emit('signal', { senderId: socket.id, signalData });
        } else {
            // Fallback to broadcasting to the room (excluding sender)
            socket.to(pin).emit('signal', { senderId: socket.id, signalData });
        }
    });

    /**
     * Cleanup Tracking
     */
    socket.on('disconnect', () => {
        console.log(`[DISC] Node detached: ${socket.id}`);
        // Optional: clean up roomData if owner disconnects, but socket.io cleans up rooms automatically when empty.
    });
});

// --- SERVER UP ---
httpServer.listen(PORT, () => {
    console.log(`🚀 Zepglide Signaling Engine online at http://localhost:${PORT}`);
    console.log(`📡 Health Check verified at http://localhost:${PORT}/health`);
});
