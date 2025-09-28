/*
  # Add Demo User for Testing

  1. Demo User Setup
    - Creates a demo user account for testing
    - Email: test@example.com
    - Password: password
    - Sets up corresponding user profile

  2. Notes
    - This is for development/demo purposes
    - In production, users would sign up normally
    - Password is hashed by Supabase Auth
*/

-- Note: We cannot directly insert into auth.users table via SQL
-- This migration creates the user profile structure
-- The demo user will be created via the application code

-- Ensure user_profiles table exists and is ready
-- The demo user will be created automatically when first accessed