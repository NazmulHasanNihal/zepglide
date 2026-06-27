-- 1. Create a system_config table to hold global settings
CREATE TABLE IF NOT EXISTS public.system_config (
    id TEXT PRIMARY KEY DEFAULT 'global',
    max_transfer_size TEXT DEFAULT '50',
    global_rate_limit TEXT DEFAULT '15000',
    default_node_alloc TEXT DEFAULT '2',
    session_timeout TEXT DEFAULT '120',
    maintenance_mode BOOLEAN DEFAULT false,
    allow_registrations BOOLEAN DEFAULT true,
    force_e2ee BOOLEAN DEFAULT false,
    quantum_safe BOOLEAN DEFAULT true,
    zero_trust BOOLEAN DEFAULT true,
    auto_isolate BOOLEAN DEFAULT true,
    p2p_priority TEXT DEFAULT '94%',
    relay_throttling TEXT DEFAULT '12%',
    ingress_buffer TEXT DEFAULT '512ms',
    burst_multiplier TEXT DEFAULT '1.8x',
    blacklisted_regions TEXT[] DEFAULT '{}'
);

-- Insert the default global config row
INSERT INTO public.system_config (id) VALUES ('global') ON CONFLICT (id) DO NOTHING;

-- 2. Add 'status' column to profiles table for suspending users
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active';

-- 3. Disable RLS for system_config (so your backend with ANON key can read/write it)
ALTER TABLE public.system_config DISABLE ROW LEVEL SECURITY;
