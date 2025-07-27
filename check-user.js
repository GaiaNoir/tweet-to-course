const { createAdminClient } = require('./src/lib/supabase.ts');

async function checkUser() {
  try {
    const supabase = createAdminClient();
    
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, subscription_tier, customer_code, subscription_code, auth_user_id')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    console.log('Recent users:');
    users.forEach(user => {
      console.log(`- ${user.email}: ${user.subscription_tier} (customer: ${user.customer_code || 'none'}, sub: ${user.subscription_code || 'none'}, auth_id: ${user.auth_user_id || 'none'})`);
    });
  } catch (err) {
    console.error('Script error:', err);
  }
}

checkUser();