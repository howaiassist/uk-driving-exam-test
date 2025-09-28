const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from app.json
function loadEnvVars() {
  try {
    const appJsonPath = path.join(__dirname, '..', 'app.json');
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    
    const supabaseUrl = appJson.expo?.extra?.supabaseUrl;
    const supabaseServiceKey = appJson.expo?.extra?.supabaseServiceRoleKey;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration in app.json');
      console.error('Required: expo.extra.supabaseUrl and expo.extra.supabaseServiceRoleKey');
      process.exit(1);
    }
    
    return { supabaseUrl, supabaseServiceKey };
  } catch (error) {
    console.error('Error loading app.json:', error.message);
    process.exit(1);
  }
}
// Load environment variables
const { supabaseUrl, supabaseServiceKey } = loadEnvVars();

// Initialize Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function removeUser(email) {
  try {
    console.log(`Starting removal process for user: ${email}`);

    // First, get the user ID from user_profiles table
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        console.log(`No user found with email: ${email}`);
        return;
      }
      throw profileError;
    }

    const userId = profile.id;
    console.log(`Found user ID: ${userId}`);

    // Delete quiz results
    const { error: quizError } = await supabase
      .from('quiz_results')
      .delete()
      .eq('user_id', userId);

    if (quizError) {
      console.error('Error deleting quiz results:', quizError);
    } else {
      console.log('✓ Quiz results deleted');
    }

    // Delete user subscriptions
    const { error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .delete()
      .eq('user_id', userId);

    if (subscriptionError) {
      console.error('Error deleting subscriptions:', subscriptionError);
    } else {
      console.log('✓ User subscriptions deleted');
    }

    // Delete user profile
    const { error: profileDeleteError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', userId);

    if (profileDeleteError) {
      console.error('Error deleting user profile:', profileDeleteError);
    } else {
      console.log('✓ User profile deleted');
    }

    // Delete from auth (this will cascade delete the user)
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);

    if (authError) {
      console.error('Error deleting auth user:', authError);
    } else {
      console.log('✓ Auth user deleted');
    }

    console.log(`\n✅ Successfully removed user: ${email}`);

  } catch (error) {
    console.error('Error removing user:', error);
    process.exit(1);
  }
}

// Run the removal
removeUser('godfreyma@gmail.com')
  .then(() => {
    console.log('User removal completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to remove user:', error);
    process.exit(1);
  });