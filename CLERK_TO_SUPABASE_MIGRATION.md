# Clerk to Supabase Auth Migration Guide

This document outlines the migration from Clerk authentication to Supabase Auth for the TweetToCourse application.

## Overview

The application has been migrated from Clerk to Supabase Auth to consolidate authentication and database services under a single provider. This migration provides better integration with the existing Supabase database and simplifies the overall architecture.

## Changes Made

### 1. Database Schema Updates

- Added `auth_user_id` column to the `users` table that references `auth.users(id)`
- Updated all RLS policies to use `auth.uid()` instead of Clerk JWT claims
- Added automatic user profile creation trigger for new auth signups
- Made `clerk_user_id` nullable for transition period

### 2. Authentication System

- **Removed**: Clerk authentication components and providers
- **Added**: Supabase Auth UI components with email/password and OAuth providers
- **Updated**: All auth-related hooks and utilities to use Supabase Auth

### 3. API Routes Updated

All API routes have been updated to use Supabase auth instead of Clerk:

- `/api/user/profile` - User profile management
- `/api/user/update` - User data updates
- `/api/generate-course` - Course generation
- `/api/export-*` - All export endpoints
- `/api/payments/*` - Payment processing
- `/api/auth/notion/*` - Notion integration

### 4. Components Updated

- `Navigation` - Updated to use Supabase auth state
- `AuthButton` - Replaced Clerk components with custom Supabase auth UI
- `ProtectedRoute` - Updated to use Supabase auth checks
- All test pages and components

### 5. Database Service

- Added new methods that work with Supabase auth user IDs
- Maintained backward compatibility with Clerk methods during transition
- Updated all user operations to support both auth systems

## New Auth Flow

### Sign Up/Sign In Pages

- `/auth/sign-in` - Supabase Auth UI for sign in
- `/auth/sign-up` - Supabase Auth UI for sign up
- `/auth/callback` - OAuth callback handler
- `/auth/auth-code-error` - Error handling page

### Authentication Features

- Email/password authentication
- OAuth providers (Google, GitHub)
- Automatic user profile creation
- Session management
- Password reset functionality

## Environment Variables

### Removed (Clerk)
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
CLERK_WEBHOOK_SECRET
NEXT_PUBLIC_CLERK_SIGN_IN_URL
NEXT_PUBLIC_CLERK_SIGN_UP_URL
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL
```

### Required (Supabase)
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Migration Steps for Deployment

### 1. Database Migration

Run the migration to update the database schema:

```bash
# Apply the migration
supabase db push
```

Or manually apply the migration file: `005_migrate_to_supabase_auth.sql`

### 2. Environment Variables

Update your environment variables:

1. Remove all Clerk-related environment variables
2. Ensure Supabase environment variables are set correctly
3. Update your deployment environment (Vercel, etc.)

### 3. Supabase Auth Configuration

Configure authentication providers in your Supabase dashboard:

1. Go to Authentication > Providers
2. Enable desired providers (Google, GitHub, etc.)
3. Configure OAuth redirect URLs:
   - Development: `http://localhost:3000/auth/callback`
   - Production: `https://yourdomain.com/auth/callback`

### 4. User Data Migration

Existing users will need to sign up again with the new auth system. Consider:

1. Communicating the change to existing users
2. Providing a migration path for user data if needed
3. Keeping `clerk_user_id` for reference during transition

## Testing the Migration

### 1. Run Migration Script

```bash
node scripts/migrate-clerk-to-supabase.js
```

### 2. Test Authentication Flow

1. Visit `/auth/sign-up` to create a new account
2. Verify user profile is created automatically
3. Test sign in/sign out functionality
4. Test OAuth providers if configured

### 3. Test API Endpoints

1. Generate a course while authenticated
2. Test export functionality
3. Verify usage tracking works correctly

## Rollback Plan

If rollback is needed:

1. Revert database migration
2. Restore Clerk environment variables
3. Deploy previous version of the application

## Benefits of Migration

1. **Unified Stack**: Single provider for auth and database
2. **Better Integration**: Native RLS policies with Supabase Auth
3. **Cost Efficiency**: Reduced third-party service dependencies
4. **Simplified Architecture**: Fewer moving parts to maintain
5. **Better Performance**: Direct database integration

## Support

For issues related to the migration:

1. Check Supabase Auth documentation
2. Verify environment variables are set correctly
3. Check database migration was applied successfully
4. Review application logs for auth-related errors

## Next Steps

1. Monitor authentication metrics in Supabase dashboard
2. Update documentation and user guides
3. Consider removing Clerk-related code after successful migration
4. Optimize auth flow based on user feedback