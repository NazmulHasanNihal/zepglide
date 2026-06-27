-- Drop existing tables to avoid conflicts
DROP TABLE IF EXISTS public.preferences CASCADE;
DROP TABLE IF EXISTS public.transfers CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 1. Create profiles table
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name TEXT,
    bio TEXT,
    website TEXT,
    email TEXT,
    location TEXT,
    country_code TEXT,
    role TEXT,
    plan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 2. Create preferences table
CREATE TABLE public.preferences (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    public_discovery BOOLEAN DEFAULT true,
    auto_accept BOOLEAN DEFAULT false,
    strict_e2ee BOOLEAN DEFAULT true,
    use_web_transport BOOLEAN DEFAULT true,
    use_web_gpu BOOLEAN DEFAULT true,
    cloud_bridge_fallback BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 3. Create transfers table
CREATE TABLE public.transfers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT,
    size TEXT,
    recipient TEXT,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 4. Disable Row Level Security (RLS) on these tables temporarily
-- (Since your Node.js backend uses the ANON key to perform database actions without passing the user's JWT into the Supabase queries, we need RLS disabled for the backend to read/write successfully. Alternatively, you can use the Service Role Key in your backend.)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfers DISABLE ROW LEVEL SECURITY;
