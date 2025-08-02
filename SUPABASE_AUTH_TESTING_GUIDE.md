# Supabase Authentication System Testing Guide

## Overview
This guide provides step-by-step instructions for testing the complete Supabase authentication system that has been implemented for the TweetToCourse application.

## ⚠️ Important: Email Confirmation is DISABLED
- Users can sign up and immediately sign in without email verification
- No email confirmation steps are required
- This is intentional for testing purposes

## Testing Checklist

### 1. Database Setup ✅
- [x] Migration script created: `supabase/migrations/20250201_create_auth_system.sql`
- [x] Users table with UUID, email, subscription status, usage tracking
- [x] Jobs table with user_id foreign key
- [x] Row Level Security (RLS) policies enabled
- [x] Automatic user profile creation trigger

### 2. Authentication Components ✅
- [x] AuthProvider context for session management
- [x] SignUpForm with validation and error handling
- [x] SignInForm with redirect support
- [x] ResetPasswordForm for password recovery
- [x] UserProfile component showing user data
- [x] ProtectedRoute components for access control

### 3. Core Authentication Flow Testing

#### Test 1: Sign Up Flow
1. Navigate to `/auth/sign-up`
2. Fill in email and password (minimum 6 characters)
3. Confirm password matches
4. Click "Create Account"
5. **Expected Result**: 
   - User is immediately authenticated (no email confirmation)
   - Redirected to `/dashboard`
   - User profile automatically created in database

#### Test 2: Sign In Flow
1. Navigate to `/auth/sign-in`
2. Use the same credentials from sign up
3. Click "Sign In"
4. **Expected Result**:
   - User is authenticated immediately
   - Redirected to `/dashboard` or previous page

#### Test 3: Session Persistence
1. Sign in successfully
2. Refresh the page
3. Navigate to different pages
4. **Expected Result**:
   - User remains authenticated across page refreshes
   - No need to sign in again

#### Test 4: Route Protection
1. While signed out, try to access `/dashboard`
2. **Expected Result**:
   - Redirected to `/auth/sign-in`
   - After signing in, redirected back to `/dashboard`

#### Test 5: Sign Out
1. While signed in, click "Sign Out" in user profile
2. **Expected Result**:
   - User is signed out
   - Redirected to home page
   - Cannot access protected routes

### 4. Course Generation Integration Testing

#### Test 6: Authenticated Course Generation
1. Sign in to your account
2. Navigate to the home page
3. Enter a tweet URL or text content
4. Generate a course
5. **Expected Result**:
   - Course generation works
   - Course is saved with your user_id
   - Usage count is incremented
   - Course appears in your account

#### Test 7: Unauthenticated Course Generation
1. Sign out of your account
2. Try to generate a course
3. **Expected Result**:
   - API returns 401 authentication error
   - User is prompted to sign in

### 5. User Profile and Usage Tracking

#### Test 8: User Profile Display
1. Sign in and go to `/dashboard`
2. Check the user profile section
3. **Expected Result**:
   - Email address displayed
   - Subscription status (should be "free")
   - Usage count (starts at 0)
   - Member since date
   - Usage reset date

#### Test 9: Usage Limits
1. Generate courses until you reach the free tier limit (3 courses)
2. Try to generate another course
3. **Expected Result**:
   - Usage count increases with each generation
   - After reaching limit, further generations should be blocked
   - User prompted to upgrade

### 6. Error Handling Testing

#### Test 10: Invalid Credentials
1. Try to sign in with wrong password
2. **Expected Result**:
   - Clear error message displayed
   - User remains on sign-in page

#### Test 11: Duplicate Email
1. Try to sign up with an email that already exists
2. **Expected Result**:
   - Appropriate error message
   - User can try different email

#### Test 12: Network Errors
1. Disconnect internet and try to sign in
2. **Expected Result**:
   - Graceful error handling
   - User-friendly error message

## Database Verification

### Check User Creation
```sql
-- Verify user was created in both auth.users and public.users
SELECT 
  au.id,
  au.email,
  au.created_at as auth_created,
  pu.subscription_status,
  pu.monthly_usage_count,
  pu.created_at as profile_created
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
ORDER BY au.created_at DESC;
```

### Check Course-User Association
```sql
-- Verify courses are linked to users
SELECT 
  c.id,
  c.title,
  c.user_id,
  u.email,
  c.created_at
FROM public.courses c
JOIN public.users u ON c.user_id = u.id
ORDER BY c.created_at DESC;
```

### Check Usage Logs
```sql
-- Verify usage is being tracked
SELECT 
  ul.id,
  ul.user_id,
  u.email,
  ul.action,
  ul.created_at
FROM public.usage_logs ul
JOIN public.users u ON ul.user_id = u.id
ORDER BY ul.created_at DESC;
```

## Troubleshooting Common Issues

### Issue 1: "Authentication required" error
- **Cause**: User session not properly established
- **Solution**: Check browser cookies, try signing out and back in

### Issue 2: User profile not created
- **Cause**: Database trigger not working
- **Solution**: Check migration was applied, verify trigger exists

### Issue 3: Courses not linked to user
- **Cause**: API not getting user_id correctly
- **Solution**: Check server-side auth in API routes

### Issue 4: Route protection not working
- **Cause**: Middleware or AuthProvider issues
- **Solution**: Check middleware.ts and AuthProvider implementation

## Environment Variables Required

Ensure these are set in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Key Files Created/Modified

### New Files:
- `src/lib/auth.ts` - Auth helper functions
- `src/components/auth/AuthProvider.tsx` - Auth context
- `src/components/auth/SignUpForm.tsx` - Sign up form
- `src/components/auth/SignInForm.tsx` - Sign in form
- `src/components/auth/ResetPasswordForm.tsx` - Password reset
- `src/components/auth/UserProfile.tsx` - User profile display
- `src/components/auth/ProtectedRoute.tsx` - Route protection
- `src/app/auth/sign-up/page.tsx` - Sign up page
- `src/app/auth/sign-in/page.tsx` - Sign in page
- `src/app/auth/reset-password/page.tsx` - Reset password page
- `supabase/migrations/20250201_create_auth_system.sql` - Database schema

### Modified Files:
- `src/app/layout.tsx` - Added AuthProvider
- `src/middleware.ts` - Already had Supabase auth integration

## Success Criteria

The authentication system is working correctly if:
1. ✅ Users can sign up without email confirmation
2. ✅ Users can sign in immediately after signup
3. ✅ Sessions persist across page refreshes
4. ✅ Protected routes redirect to sign-in
5. ✅ Course generation requires authentication
6. ✅ Courses are linked to the correct user
7. ✅ Usage tracking works properly
8. ✅ User profiles display correct information
9. ✅ Sign out works and clears session
10. ✅ Error handling is user-friendly

## Next Steps After Testing

1. **Production Setup**: Configure email confirmation for production
2. **UI Polish**: Improve styling and user experience
3. **Advanced Features**: Add social login, 2FA, etc.
4. **Monitoring**: Set up auth event logging
5. **Security**: Review and harden security policies
