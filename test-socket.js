/* eslint-env node */
import { io } from 'socket.io-client';

const socket = io('https://zepglide.onrender.com', {
    transports: ['websocket', 'polling']
});

console.log("Attempting to connect...");

socket.on('connect', () => {
    console.log('Connected! ID:', socket.id);
    process.exit(0);
});

socket.on('connect_error', (err) => {
    console.error('Connection error:', err.message);
    process.exit(1);
});

setTimeout(() => {
    console.error('Timeout');
    process.exit(1);
}, 5000);
