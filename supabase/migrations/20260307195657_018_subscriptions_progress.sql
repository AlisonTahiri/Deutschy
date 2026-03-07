-- Phase 4: Subscriptions & Local Sync

-- Create an enum for subscription status
CREATE TYPE subscription_status AS ENUM ('active', 'grace_period', 'expired');

-- Create user_subscriptions table
CREATE TABLE user_subscriptions (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    subscribed_level_id UUID REFERENCES levels(id) ON DELETE SET NULL, -- Allow null if they unsubscribe fully or level is deleted
    status subscription_status NOT NULL DEFAULT 'expired',
    expires_at TIMESTAMPTZ,
    grace_period_ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for user_subscriptions
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can read their own subscription
CREATE POLICY "Users can view own subscription" 
    ON user_subscriptions FOR SELECT 
    USING (auth.uid() = user_id);

-- Depending on architecture, the backend (RevenueCat webhook / Edge function) might update this.
-- If the client needs to update it locally via SDK, we allow self-updates for now.
CREATE POLICY "Users can insert own subscription"
    ON user_subscriptions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
    ON user_subscriptions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Admins can view/update all
CREATE POLICY "Admins can view all subscriptions"
    ON user_subscriptions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can update all subscriptions"
    ON user_subscriptions FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Create user_progress table (Remote backup of local DB stats)
CREATE TABLE user_progress (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    total_xp INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    last_activity_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Users can manage their own progress
CREATE POLICY "Users can manage own progress"
    ON user_progress FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Admins can view all progress
CREATE POLICY "Admins can view all progress"
    ON user_progress FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Function to auto-update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_subscriptions_updated_at
    BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at
    BEFORE UPDATE ON user_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
