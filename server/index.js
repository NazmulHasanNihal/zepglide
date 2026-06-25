import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { supabase } from './supabase.js';

const app = express();
const httpServer = createServer(app);
const port = process.env.PORT || 3001;

app.use(cors({ origin: '*' }));
app.use(express.json());

// --- Socket.IO Signaling Engine (merged from signaling-server) ---
const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    transports: ['websocket', 'polling']
});

const roomData = {};

// Health check for load balancers
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

io.on('connection', (socket) => {
    console.log(`[CONN] Node attached: ${socket.id}`);

    socket.on('create-room', (payload) => {
        const pin = typeof payload === 'string' ? payload : payload.pin;
        const password = payload.password || null;
        const isMultiPeer = payload.isMultiPeer || false;

        socket.join(pin);
        roomData[pin] = { ownerId: socket.id, password, isMultiPeer };
        console.log(`[ROOM] Created: ${pin} (MultiPeer: ${isMultiPeer}, Password: ${!!password})`);
    });

    socket.on('join-room', (payload) => {
        const pin = typeof payload === 'string' ? payload : payload.pin;
        const password = payload.password || null;

        const room = io.sockets.adapter.rooms.get(pin);
        const rData = roomData[pin];

        if (!room || !rData) {
            return socket.emit('room-error', { message: 'Room not found.' });
        }
        if (rData.password && rData.password !== password) {
            return socket.emit('room-error', { message: 'Invalid Room Password.' });
        }
        if (!rData.isMultiPeer && room.size >= 2) {
            return socket.emit('room-error', { message: 'Room already full.' });
        }

        socket.join(pin);
        console.log(`[ROOM] Node ${socket.id} joined: ${pin}`);
        io.to(rData.ownerId).emit('peer-joined', { receiverId: socket.id });
    });

    socket.on('signal', ({ pin, targetId, signalData }) => {
        const rData = roomData[pin];
        if (!rData) return;
        if (targetId) {
            io.to(targetId).emit('signal', { senderId: socket.id, signalData });
        } else {
            socket.to(pin).emit('signal', { senderId: socket.id, signalData });
        }
    });

    socket.on('disconnect', () => {
        console.log(`[DISC] Node detached: ${socket.id}`);
    });
});

// Removed hardcoded DEMO_USER_ID

// Auth middleware helper
async function getAuthUser(req) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return null;
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

// Helper to ensure profile exists
async function ensureProfile(userId, email, defaultName = 'Zepglide Transporter') {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error checking profile:', error);
      return;
    }

    if (!data) {
      console.log(`Seeding initial profile for ${userId}...`);
      const { error: pErr } = await supabase.from('profiles').insert({
        id: userId,
        name: defaultName,
        bio: 'Welcome to the Zepglide mesh.',
        website: '',
        email: email,
        location: '',
        country_code: 'US',
        role: 'Node Runner',
        plan: 'Free'
      });
      
      if (pErr) console.error('Error seeding profile:', pErr);
      
      const { error: prefErr } = await supabase.from('preferences').insert({
        user_id: userId,
        public_discovery: true,
        auto_accept: false,
        strict_e2ee: true,
        use_web_transport: true,
        use_web_gpu: true,
        cloud_bridge_fallback: true
      });
      
      if (prefErr) console.error('Error seeding preferences:', prefErr);
    }
  } catch (err) {
    console.error('Unexpected error in ensureProfile:', err);
  }
}

// --- PROFILE ---
app.get('/api/profile', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    // The name is passed in identities metadata during signup, optionally grab it
    const defaultName = user.user_metadata?.name || 'Zepglide Node';
    await ensureProfile(user.id, user.email, defaultName);
    
    const { data: profile, error: pErr } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    const { data: preferences, error: prefErr } = await supabase.from('preferences').select('*').eq('user_id', user.id).maybeSingle();
    
    if (!profile || !preferences) {
      console.warn('Profile or preferences still missing after ensureProfile');
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Map back to camelCase for the frontend
    res.json({
      profile: {
        ...profile,
        countryCode: profile.country_code
      },
      preferences: {
        publicDiscovery: preferences.public_discovery,
        autoAccept: preferences.auto_accept,
        strictE2EE: preferences.strict_e2ee,
        useWebTransport: preferences.use_web_transport,
        useWebGPU: preferences.use_web_gpu,
        cloudBridgeFallback: preferences.cloud_bridge_fallback
      }
    });
  } catch (err) {
    console.error('Error in GET /api/profile:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/profile', async (req, res) => {
  const user = await getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { profile, preferences } = req.body;
  
  if (profile) {
    const pUpdate = { ...profile };
    if (pUpdate.countryCode) {
      pUpdate.country_code = pUpdate.countryCode;
      delete pUpdate.countryCode;
    }
    await supabase.from('profiles').update(pUpdate).eq('id', user.id);
  }
  
  if (preferences) {
    const prefUpdate = {};
    if ('publicDiscovery' in preferences) prefUpdate.public_discovery = preferences.publicDiscovery;
    if ('autoAccept' in preferences) prefUpdate.auto_accept = preferences.autoAccept;
    if ('strictE2EE' in preferences) prefUpdate.strict_e2ee = preferences.strictE2EE;
    if ('useWebTransport' in preferences) prefUpdate.use_web_transport = preferences.useWebTransport;
    if ('useWebGPU' in preferences) prefUpdate.use_web_gpu = preferences.useWebGPU;
    if ('cloudBridgeFallback' in preferences) prefUpdate.cloud_bridge_fallback = preferences.cloudBridgeFallback;
    
    await supabase.from('preferences').update(prefUpdate).eq('user_id', user.id);
  }
  
  res.json({ success: true });
});

// --- HISTORY ---
app.get('/api/history', async (req, res) => {
  const user = await getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { data, error } = await supabase
    .from('transfers')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
    
  // Map 'recipient' from DB to 'to' for frontend compatibility
  const history = data?.map(h => ({
    ...h,
    to: h.recipient
  })) || [];

  res.json(history);
});

app.post('/api/transfers', async (req, res) => {
  const user = await getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { name, size, to, status } = req.body;
  
  const { data, error } = await supabase.from('transfers').insert({
    user_id: user.id,
    name,
    size,
    recipient: to || 'Unknown',
    status: status || 'Complete'
  }).select().single();
  
  res.json({ success: true, transfer: { ...data, to: data.recipient } });
});
// --- PROFILE STATS ---
app.get('/api/profile/stats', async (req, res) => {
  const user = await getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { data: transfers, error } = await supabase
      .from('transfers')
      .select('size, status, created_at')
      .eq('user_id', user.id);

    if (error) throw error;

    const totalHandshakes = transfers?.length || 0;
    
    // Parse sizes like "2.4 GB", "150 MB", "Batch Size"
    let totalSentBytes = 0;
    transfers?.forEach(t => {
      const sizeStr = t.size || '';
      const match = sizeStr.match(/([\d.]+)\s*(GB|MB|KB|TB)/i);
      if (match) {
        const val = parseFloat(match[1]);
        const unit = match[2].toUpperCase();
        if (unit === 'TB') totalSentBytes += val * 1024;
        else if (unit === 'GB') totalSentBytes += val;
        else if (unit === 'MB') totalSentBytes += val / 1024;
        else if (unit === 'KB') totalSentBytes += val / (1024 * 1024);
      }
    });

    // Calculate trust based on real factors
    let trustScore = Math.min(100, 50 + (totalHandshakes * 2));

    // Recent 4 activities
    const recentTransfers = (transfers || []).slice(0, 4).map(t => ({
      action: t.status === 'Complete' ? 'Transfer Complete' : 'Transfer',
      target: t.size,
      time: getTimeAgo(new Date(t.created_at))
    }));

    res.json({
      totalHandshakes,
      totalSent: totalSentBytes >= 1 ? `${totalSentBytes.toFixed(1)} GB` : `${(totalSentBytes * 1024).toFixed(0)} MB`,
      totalReceived: '0 MB',
      trustScore,
      storageUsed: totalSentBytes.toFixed(1),
      storageLimit: 50,
      recentActivity: recentTransfers
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// --- ADMIN MANAGEMENT ---
app.get('/api/admin/users', async (req, res) => {
  const user = await getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  // Only admin can access
  if (user.email !== 'nazmulhas36@gmail.com') return res.status(403).json({ error: 'Forbidden' });

  const { data: profiles, error } = await supabase.from('profiles').select('*');
  if (error) return res.status(500).json({ error: error.message });

  const users = profiles.map(p => ({
    id: p.id,
    email: p.email || 'Unknown',
    plan: 'Standard',
    bw: 'Unknown',
    status: 'Active',
    region: p.country_code || 'US'
  }));

  res.json(users);
});

app.get('/api/admin/transfers', async (req, res) => {
  const user = await getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  if (user.email !== 'nazmulhas36@gmail.com') return res.status(403).json({ error: 'Forbidden' });

  const { data: dbTransfers, error } = await supabase.from('transfers').select('*').order('created_at', { ascending: false }).limit(50);
  if (error) return res.status(500).json({ error: error.message });

  const transfers = dbTransfers.map(t => ({
    id: t.id,
    file: t.name || 'Unknown',
    size: t.size || '0 MB',
    type: 'P2P (WebRTC)',
    status: t.status || 'Complete',
    speed: '-- MB/s'
  }));

  res.json(transfers);
});

// --- DEVICES ---
app.get('/api/devices', async (req, res) => {
  const user = await getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const devices = [
     { id: user.id, name: 'Current Workstation', type: 'Desktop', os: 'Web Browser', status: 'Online', lastSeen: 'Now', location: 'Current', ip: 'Masked', isCurrent: true }
  ];

  res.json(devices);
});

app.get('/api/map', async (req, res) => {
  const { data: profiles, error } = await supabase.from('profiles').select('country_code');
  if (error) return res.json({});

  const aggregated = {};
  profiles.forEach(p => {
    const cc = p.country_code || 'Unknown';
    aggregated[cc] = (aggregated[cc] || 0) + 1;
  });
  
  res.json(aggregated);
});

app.get('/api/telemetry', async (req, res) => {
  const { data: transfers } = await supabase.from('transfers').select('id, name, size, status, created_at').order('created_at', { ascending: false }).limit(5);
  const events = (transfers || []).map(t => ({
     id: t.id, type: 'Transfer', msg: `${t.status}: ${t.name} - ${t.size}`, time: new Date(t.created_at).toLocaleTimeString()
  }));
  res.json(events);
});

// --- ADMIN ---
app.get('/api/admin/metrics', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: transferCount } = await supabase.from('transfers').select('*', { count: 'exact', head: true });

    res.json({
      activeTransfers: transferCount || 0,
      nodesOnline: userCount || 0,
      trafficRate: '--',
      health: 'Optimal'
    });
  } catch (err) {
    res.json({ activeTransfers: 0, nodesOnline: 0, trafficRate: '0 req/s', health: 'Error' });
  }
});

httpServer.listen(port, () => {
  console.log(`🚀 Zepglide Backend + Signaling Engine listening at http://localhost:${port}`);
});
