/*
  # Add User Subscription System

  1. New Tables
    - `user_subscriptions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to user_profiles)
      - `subscription_type` (text: 'weekly' or 'yearly')
      - `start_date` (timestamp)
      - `end_date` (timestamp)
      - `is_active` (boolean)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `user_subscriptions` table
    - Add policies for users to read their own subscription data
    - Add policies for authenticated users to insert their own subscription

  3. Functions
    - Function to check if user subscription is active
    - Function to create default subscription on user creation
*/

-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  subscription_type text NOT NULL CHECK (subscription_type IN ('weekly', 'yearly')),
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own subscription"
  ON user_subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription"
  ON user_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON user_subscriptions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to check if subscription is active
CREATE OR REPLACE FUNCTION is_subscription_active(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_subscriptions 
    WHERE user_id = user_uuid 
    AND is_active = true 
    AND end_date > now()
  );
END;
$$;

-- Create function to get subscription info
CREATE OR REPLACE FUNCTION get_user_subscription(user_uuid uuid)
RETURNS TABLE (
  subscription_type text,
  start_date timestamptz,
  end_date timestamptz,
  is_active boolean,
  days_remaining integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    us.subscription_type,
    us.start_date,
    us.end_date,
    us.is_active,
    GREATEST(0, EXTRACT(days FROM (us.end_date - now()))::integer) as days_remaining
  FROM user_subscriptions us
  WHERE us.user_id = user_uuid
  AND us.is_active = true
  ORDER BY us.created_at DESC
  LIMIT 1;
END;
$$;

-- Create trigger function to create default subscription
CREATE OR REPLACE FUNCTION create_default_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create a weekly subscription by default (can be changed later)
  INSERT INTO user_subscriptions (user_id, subscription_type, start_date, end_date)
  VALUES (
    NEW.id,
    'weekly',
    now(),
    now() + interval '7 days'
  );
  RETURN NEW;
END;
$$;

-- Create trigger to auto-create subscription when user profile is created
DROP TRIGGER IF EXISTS create_subscription_on_user_creation ON user_profiles;
CREATE TRIGGER create_subscription_on_user_creation
  AFTER INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_subscription();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS user_subscriptions_user_id_idx ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS user_subscriptions_active_idx ON user_subscriptions(is_active, end_date);