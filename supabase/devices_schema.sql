-- Create the 'devices' table
CREATE TABLE IF NOT EXISTS public.devices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT,
    os TEXT,
    status TEXT DEFAULT 'Online',
    location TEXT,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_agent TEXT
);

-- Enable Row Level Security
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own devices
CREATE POLICY "Users can insert their own devices" 
    ON public.devices FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own devices
CREATE POLICY "Users can view their own devices" 
    ON public.devices FOR SELECT 
    USING (auth.uid() = user_id);

-- Allow users to update their own devices
CREATE POLICY "Users can update their own devices" 
    ON public.devices FOR UPDATE 
    USING (auth.uid() = user_id);

-- Allow users to delete their own devices
CREATE POLICY "Users can delete their own devices" 
    ON public.devices FOR DELETE 
    USING (auth.uid() = user_id);
