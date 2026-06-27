-- 1. Enable Row Level Security (RLS) on all tables flagged by the Advisor
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- 2. Profiles Policies
-- Anyone can view profiles (needed for global discovery/maps)
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
-- Users can only insert/update their own profile
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 3. Preferences Policies
-- Users can only view and update their own preferences
CREATE POLICY "Users can view their own preferences" ON public.preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own preferences" ON public.preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own preferences" ON public.preferences FOR UPDATE USING (auth.uid() = user_id);

-- 4. Transfers Policies
-- Users can only view and update their own transfer history
CREATE POLICY "Users can view their own transfers" ON public.transfers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own transfers" ON public.transfers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own transfers" ON public.transfers FOR UPDATE USING (auth.uid() = user_id);

-- 5. System Config Policies
-- Anyone can read the global config (needed to check maintenance mode, etc)
CREATE POLICY "System config is viewable by everyone" ON public.system_config FOR SELECT USING (true);
-- No insert/update/delete policies for authenticated/anon users are created.
-- Only the backend (using the Service Role Key) will be able to modify the system_config.
