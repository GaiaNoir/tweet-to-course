# Disable Email Confirmation for Development

To fix the signup redirect issue, you need to disable email confirmation in your Supabase project:

## Steps:

1. **Go to your Supabase Dashboard**
   - Visit https://supabase.com/dashboard
   - Select your TweetToCourse project

2. **Navigate to Authentication Settings**
   - Go to Authentication → Settings
   - Find the "Email Confirmation" section

3. **Disable Email Confirmation**
   - Turn OFF "Enable email confirmations"
   - This allows users to sign up without email verification

4. **Alternative: Set up Email Templates (Recommended for Production)**
   - Go to Authentication → Email Templates
   - Configure your email templates
   - Set up a custom SMTP provider if needed

## Quick Test:

After disabling email confirmation:
1. Go to http://localhost:3000/debug-auth
2. Try signing up with a new email
3. Check if the user gets created and redirected properly

## For Production:

Re-enable email confirmation and set up proper email templates before going live.