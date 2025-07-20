# Notion Integration Setup Guide

This guide will walk you through setting up the Notion integration for your TweetToCourse application.

## Quick Setup Summary

1. **Create Notion Integration** at [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. **Configure OAuth** with your callback URL
3. **Set Environment Variables** in your `.env.local`
4. **Run Database Migration** for `user_integrations` table
5. **Test the Integration** in your app

**Time Required:** ~15 minutes

## Overview

The Notion integration allows Pro and Lifetime subscribers to:
- Export courses directly to their Notion workspace
- Download courses as Notion-compatible markdown files
- Manage their Notion connection from the dashboard

## Prerequisites

- A Notion account
- Admin access to a Notion workspace
- Your TweetToCourse application deployed and accessible via HTTPS (required for OAuth)

## Step 1: Create a Notion Integration

1. **Go to Notion Developers**
   - Visit [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)
   - Sign in with your Notion account

2. **Create New Integration**
   - Click "New integration"
   - Fill in the basic information:
     - **Name**: `TweetToCourse` (or your app name)
     - **Logo**: Upload your app logo (optional)
     - **Associated workspace**: Select your workspace

3. **Configure Capabilities**
   - **Content Capabilities**:
     - ✅ Read content
     - ✅ Insert content
     - ✅ Update content
   - **Comment Capabilities**: (leave unchecked)
   - **User Capabilities**: 
     - ✅ Read user information including email addresses

4. **Save Integration**
   - Click "Submit" to create the integration
   - Note down the **Internal Integration Token** (starts with `secret_`)

## Step 2: Set Up OAuth

1. **Configure OAuth Settings**
   - In your integration settings, go to the "OAuth Domain & URIs" section
   - **Redirect URIs**: Add your callback URL:
     ```
     https://yourdomain.com/api/auth/notion/callback
     ```
     Replace `yourdomain.com` with your actual domain
   
   - For local development, also add:
     ```
     http://localhost:3000/api/auth/notion/callback
     ```

2. **Get OAuth Credentials**
   - **OAuth client ID**: Found in the "OAuth Domain & URIs" section
   - **OAuth client secret**: Click "Show" to reveal the secret

## Step 3: Configure Environment Variables

Add these variables to your `.env.local` file:

```bash
# Notion Integration (OAuth)
NOTION_CLIENT_ID=your_oauth_client_id_here
NOTION_CLIENT_SECRET=your_oauth_client_secret_here
NOTION_REDIRECT_URI=https://yourdomain.com/api/auth/notion/callback

# For local development
# NOTION_REDIRECT_URI=http://localhost:3000/api/auth/notion/callback
```

### Environment Variable Details:

- **NOTION_CLIENT_ID**: The OAuth client ID from your Notion integration
- **NOTION_CLIENT_SECRET**: The OAuth client secret from your Notion integration  
- **NOTION_REDIRECT_URI**: The callback URL where users will be redirected after authorization

## Step 4: Database Setup

The integration requires the `user_integrations` table. If you haven't run the migration yet:

```bash
# Run the migration
npm run migrate

# Or manually apply the migration
supabase db push
```

The migration creates:
- `user_integrations` table for storing OAuth tokens
- Proper RLS policies for security
- Indexes for performance

## Step 5: Test the Integration

1. **Start your application**
   ```bash
   npm run dev
   ```

2. **Test OAuth Flow**
   - Sign in as a Pro or Lifetime user
   - Go to `/dashboard`
   - Click "Connect Notion" in the Integrations section
   - You should be redirected to Notion for authorization
   - After approval, you should be redirected back with a success message

3. **Test Export Functionality**
   - Generate a course
   - The NotionExport component should appear for Pro/Lifetime users
   - Try both "Export Directly" and "Download Markdown" options

## Step 6: Production Deployment

### Security Considerations:

1. **HTTPS Required**: Notion OAuth requires HTTPS in production
2. **Environment Variables**: Ensure all Notion credentials are properly set in your production environment
3. **Domain Verification**: Make sure your redirect URI matches exactly (including trailing slashes)

### Deployment Checklist:

- [ ] Notion integration created and configured
- [ ] OAuth redirect URI updated for production domain
- [ ] Environment variables set in production
- [ ] Database migrations applied
- [ ] HTTPS enabled on your domain
- [ ] Test OAuth flow in production

## Troubleshooting

### Common Issues:

1. **"Invalid redirect_uri" Error**
   - Ensure the redirect URI in Notion matches exactly with `NOTION_REDIRECT_URI`
   - Check for trailing slashes and protocol (http vs https)

2. **"Integration not found" Error**
   - Verify `NOTION_CLIENT_ID` is correct
   - Ensure the integration is published and active

3. **Token Exchange Failed**
   - Check `NOTION_CLIENT_SECRET` is correct
   - Verify the integration has proper OAuth capabilities enabled

4. **Permission Denied When Creating Pages**
   - The user needs to manually share pages/databases with your integration
   - Or the integration needs to be installed in their workspace

### Debug Mode:

Add this to your `.env.local` for debugging:

```bash
# Enable debug logging
DEBUG=notion:*
NODE_ENV=development
```

### Testing Endpoints:

You can test the API endpoints directly:

```bash
# Check connection status
curl -X GET "https://yourdomain.com/api/auth/notion/status" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get auth URL
curl -X GET "https://yourdomain.com/api/auth/notion/connect" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## API Reference

### Endpoints:

- `GET /api/auth/notion/connect` - Get OAuth authorization URL
- `GET /api/auth/notion/callback` - Handle OAuth callback
- `GET /api/auth/notion/status` - Check connection status
- `DELETE /api/auth/notion/status` - Disconnect Notion
- `POST /api/export-notion` - Export course to Notion

### Notion API Limits:

- **Rate Limits**: 3 requests per second per integration
- **Block Limits**: 100 blocks per request (handled automatically)
- **Page Size**: No explicit limit, but large pages may timeout

## Support

If you encounter issues:

1. Check the [Notion API documentation](https://developers.notion.com/)
2. Verify your integration settings in the Notion developer portal
3. Check your application logs for detailed error messages
4. Ensure all environment variables are correctly set

## Security Notes

- OAuth tokens are stored encrypted in the database
- Tokens are scoped to specific workspaces
- Users can disconnect at any time from the dashboard
- All API calls use the user's specific access token
- RLS policies ensure users can only access their own integrations