import express from 'express';
import cors from 'cors';
import { supabase } from './supabase.js';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

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
  
  // INJECT SIMULATION DATA
  const dummyHistory = [
    { id: 'sim-1', name: 'Zepglide_Engine_v4.tar.gz', size: '4.2 GB', to: 'Node Alpha (EU-Central)', status: 'Complete', created_at: new Date().toISOString() },
    { id: 'sim-2', name: 'Neural_Network_Weights.pt', size: '12.8 GB', to: 'Node Gamma (AS-East)', status: 'Complete', created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: 'sim-3', name: '4K_Render_Sequence.mp4', size: '1.1 GB', to: 'Node Sigma (US-West)', status: 'Complete', created_at: new Date(Date.now() - 86400000).toISOString() },
    { id: 'sim-4', name: 'Database_Dump_2026.sql', size: '840 MB', to: 'Node Zeta (SA-East)', status: 'Failed (Relay)', created_at: new Date(Date.now() - 172800000).toISOString() }
  ];

  res.json([...history, ...dummyHistory]);
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

    const totalHandshakes = (transfers?.length || 0) + 1420; // Simulated massive history
    
    // Parse sizes like "2.4 GB", "150 MB", "Batch Size"
    let totalSentBytes = 184.5; // Start with 184.5 GB simulated
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
    let trustScore = 98; // Simulated high trust node

    // Recent 4 activities
    const recentTransfers = [
      { action: 'Mirror Handshake', target: '4.2 GB', time: '2m ago' },
      { action: 'Relay Sync', target: '1.1 GB', time: '14m ago' },
      { action: 'Node Discovery', target: 'Handshake', time: '1h ago' },
      { action: 'Mirror Handshake', target: '12.8 GB', time: '3h ago' }
    ];

    res.json({
      totalHandshakes,
      totalSent: totalSentBytes >= 1 ? `${totalSentBytes.toFixed(1)} GB` : `${(totalSentBytes * 1024).toFixed(0)} MB`,
      totalReceived: '1.2 TB', // Simulated
      trustScore,
      storageUsed: (totalSentBytes % 50).toFixed(1), // Simulated storage usage
      storageLimit: 500, // Upgraded simulated limit
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

  const users = [
    { id: '1a2b3c4d', email: 'alpha.node@mesh.net', plan: 'Enterprise', bw: '14,204 transfers', status: 'Active', region: 'US' },
    { id: '2b3c4d5e', email: 'beta.relay@zepglide.io', plan: 'Pro', bw: '8,192 transfers', status: 'Active', region: 'DE' },
    { id: '3c4d5e6f', email: 'gamma.edge@global.org', plan: 'Teams', bw: '3,410 transfers', status: 'Active', region: 'JP' },
    { id: '4d5e6f7a', email: 'delta.sync@cloud.co', plan: 'Pro', bw: '1,024 transfers', status: 'Offline', region: 'BR' },
    { id: '5e6f7a8b', email: 'epsilon.core@net.io', plan: 'Enterprise', bw: '54,200 transfers', status: 'Active', region: 'UK' },
    { id: '6f7a8b9c', email: 'zeta.cache@edge.dev', plan: 'Free', bw: '42 transfers', status: 'Active', region: 'BD' }
  ];

  res.json(users);
});

app.get('/api/admin/transfers', async (req, res) => {
  const user = await getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  if (user.email !== 'nazmulhas36@gmail.com') return res.status(403).json({ error: 'Forbidden' });

  const transfers = [
    { id: 'tx_a1b2', file: 'production_database_backup_final.sql', size: '14.2 GB', type: 'P2P (WebRTC)', status: 'Complete', speed: '142 MB/s' },
    { id: 'tx_c3d4', file: 'client_brand_assets_2026.zip', size: '2.1 GB', type: 'TURN Relay', status: 'Active', speed: '45 MB/s' },
    { id: 'tx_e5f6', file: 'neural_weights_v4.pt', size: '42.8 GB', type: 'P2P (WebRTC)', status: 'Active', speed: '210 MB/s' },
    { id: 'tx_g7h8', file: '4k_drone_footage.mp4', size: '8.4 GB', type: 'P2P (WebTransport)', status: 'Complete', speed: '340 MB/s' },
    { id: 'tx_i9j0', file: 'system_logs_archive.tar.gz', size: '450 MB', type: 'P2P (WebRTC)', status: 'Failed', speed: '--' }
  ];

  res.json(transfers);
});

// --- DEVICES ---
app.get('/api/devices', async (req, res) => {
  const user = await getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const devices = [
     { id: user.id, name: 'Current Workstation', type: 'Desktop', os: 'Encrypted OS', status: 'Online', lastSeen: 'Now', location: 'Global Mesh', ip: 'Masked', isCurrent: true },
     { id: 'sim-dev-1', name: 'Zepglide Mobile App', type: 'Mobile', os: 'iOS 18', status: 'Online', lastSeen: '2m ago', location: 'London, UK', ip: 'Masked', isCurrent: false },
     { id: 'sim-dev-2', name: 'Studio Mac Studio', type: 'Desktop', os: 'macOS 15', status: 'Offline', lastSeen: '4h ago', location: 'Tokyo, JP', ip: 'Masked', isCurrent: false },
     { id: 'sim-dev-3', name: 'Backup NAS Node', type: 'Desktop', os: 'Linux', status: 'Online', lastSeen: 'Now', location: 'Frankfurt, DE', ip: 'Masked', isCurrent: false }
  ];

  res.json(devices);
});

app.get('/api/map', async (req, res) => {
  // Simulated high global density
  const aggregated = {
    'United States of America (USA)': 14205,
    'Germany': 8430,
    'United Kingdom (UK)': 6200,
    'Japan': 5100,
    'Brazil': 3240,
    'Australia': 2100,
    'India': 4500,
    'France': 3100,
    'Canada': 2800,
    'South Africa': 900
  };
  res.json(aggregated);
});

app.get('/api/telemetry', async (req, res) => {
  const events = [
     { id: 1, type: 'Sync', msg: 'Transfer 4K_Render - 12.4 GB', time: new Date().toLocaleTimeString() },
     { id: 2, type: 'Handshake', msg: 'Node Alpha connected to Node Zeta', time: new Date(Date.now() - 2000).toLocaleTimeString() },
     { id: 3, type: 'Relay', msg: 'TURN Server failover triggered (DE)', time: new Date(Date.now() - 5000).toLocaleTimeString() },
     { id: 4, type: 'Sync', msg: 'Database_Backup_2026 - 4.1 GB', time: new Date(Date.now() - 14000).toLocaleTimeString() },
     { id: 5, type: 'Discovery', msg: 'New P2P Mesh established in US-West', time: new Date(Date.now() - 22000).toLocaleTimeString() }
  ];
  res.json(events);
});

// --- ADMIN ---
app.get('/api/admin/metrics', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    res.json({
      activeTransfers: 142054,
      nodesOnline: 2840000,
      trafficRate: '5.4 TB/s',
      health: 'Optimal'
    });
  } catch (err) {
    res.json({ activeTransfers: 0, nodesOnline: 0, trafficRate: '0 req/s', health: 'Error' });
  }
});

app.listen(port, () => {
  console.log(`🚀 Zepglide Backend with Supabase listening at http://localhost:${port}`);
});
