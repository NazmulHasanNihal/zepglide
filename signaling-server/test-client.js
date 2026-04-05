import { io } from 'socket.io-client';

/**
 * Zepglide Signaling Engine - Automated Test Client
 * -----------------------------------------------
 * This script simulates two peers (Alice and Bob) connecting to the 
 * signaling server, joining a room by PIN, and exchanging a data packet.
 */

const PIN = "998877";
const SERVER_URL = 'http://localhost:3001';

async function runTest() {
    console.log("🧪 Starting Zepglide Signaling Test...");

    // 1. Initialize Peer A (Creator)
    const socketA = io(SERVER_URL);
    
    socketA.on('connect', () => {
        console.log(`[PEER A] Connected. Creating room ${PIN}...`);
        socketA.emit('create-room', PIN);
    });

    // 2. Initialize Peer B (Joiner)
    // Wait a bit for Peer A to settle
    setTimeout(() => {
        const socketB = io(SERVER_URL);

        socketB.on('connect', () => {
            console.log(`[PEER B] Connected. Attempting to join room ${PIN}...`);
            socketB.emit('join-room', PIN);
        });

        socketB.on('peer-joined', () => {
            console.log(`[PEER B] Success! Handshake established with Peer A.`);
            
            // 3. Test Signaling Relay
            console.log(`[PEER B] Sending mock SDP Offer to Peer A...`);
            socketB.emit('signal', { pin: PIN, signalData: { type: 'offer', sdp: 'v=0...' } });
        });

        socketB.on('room-error', (err) => {
            console.error(`[PEER B] Error: ${err.message}`);
            process.exit(1);
        });
    }, 1000);

    // 4. Handle Relay on Peer A
    socketA.on('peer-joined', () => {
        console.log(`[PEER A] Peer B detected. Ready for relay.`);
    });

    socketA.on('signal', (data) => {
        console.log(`[PEER A] 📥 Incoming Signal Relay: ${JSON.stringify(data)}`);
        console.log(`✅ TEST COMPLETE: Signaling relay confirmed.`);
        
        // Cleanup
        socketA.close();
        process.exit(0);
    });

    // Timeout safety
    setTimeout(() => {
        console.error("❌ Test Timeout: Signaling failed to complete.");
        process.exit(1);
    }, 5000);
}

runTest();
