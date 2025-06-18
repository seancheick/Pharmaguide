-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id UUID UNIQUE NOT NULL,
    email TEXT,
    is_anonymous BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    age INTEGER,
    gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    health_goals JSONB DEFAULT '[]'::jsonb,
    conditions JSONB DEFAULT '[]'::jsonb,
    medications JSONB DEFAULT '[]'::jsonb,
    allergies JSONB DEFAULT '[]'::jsonb,
    genetics JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    ai_response_style TEXT DEFAULT 'concise' CHECK (ai_response_style IN ('concise', 'detailed', 'technical')),
    budget_range TEXT DEFAULT 'mid' CHECK (budget_range IN ('budget', 'mid', 'premium')),
    primary_focus TEXT DEFAULT 'safety' CHECK (primary_focus IN ('safety', 'efficacy', 'value', 'naturalness')),
    notifications JSONB DEFAULT '{"push_enabled": true, "email_enabled": true, "reminder_frequency": "daily"}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own data"
    ON public.users
    FOR SELECT
    USING (auth.uid() = auth_id);

CREATE POLICY "Users can insert their own data"
    ON public.users
    FOR INSERT
    WITH CHECK (auth.uid() = auth_id);

CREATE POLICY "Users can update their own data"
    ON public.users
    FOR UPDATE
    USING (auth.uid() = auth_id);

-- User profiles policies
CREATE POLICY "Users can view their own profile"
    ON public.user_profiles
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = user_profiles.user_id
        AND users.auth_id = auth.uid()
    ));

CREATE POLICY "Users can insert their own profile"
    ON public.user_profiles
    FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = user_profiles.user_id
        AND users.auth_id = auth.uid()
    ));

CREATE POLICY "Users can update their own profile"
    ON public.user_profiles
    FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = user_profiles.user_id
        AND users.auth_id = auth.uid()
    ));

-- User preferences policies
CREATE POLICY "Users can view their own preferences"
    ON public.user_preferences
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = user_preferences.user_id
        AND users.auth_id = auth.uid()
    ));

CREATE POLICY "Users can insert their own preferences"
    ON public.user_preferences
    FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = user_preferences.user_id
        AND users.auth_id = auth.uid()
    ));

CREATE POLICY "Users can update their own preferences"
    ON public.user_preferences
    FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = user_preferences.user_id
        AND users.auth_id = auth.uid()
    ));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON public.users(auth_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id); 