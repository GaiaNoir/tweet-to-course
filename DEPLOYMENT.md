# Deployment Guide for Tweet-to-Course

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI**: Install globally with `npm i -g vercel`
3. **Environment Variables**: Prepare all required environment variables

## Environment Variables Setup

Before deploying, you need to set up these environment variables in your Vercel dashboard:

### Required Environment Variables

1. **OpenAI**
   - `OPENAI_API_KEY`: Your OpenAI API key

2. **Clerk Authentication**
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk publishable key
   - `CLERK_SECRET_KEY`: Clerk secret key
   - `CLERK_WEBHOOK_SECRET`: Clerk webhook secret

3. **Supabase Database**
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
   - `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key

4. **Paystack Payments**
   - `PAYSTACK_SECRET_KEY`: Paystack secret key
   - `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`: Paystack public key
   - `PAYSTACK_WEBHOOK_SECRET`: Paystack webhook secret

5. **Notion Integration**
   - `NOTION_CLIENT_ID`: Notion OAuth client ID
   - `NOTION_CLIENT_SECRET`: Notion OAuth client secret
   - `NOTION_REDIRECT_URI`: Your deployed app URL + `/api/auth/notion/callback`

6. **App Configuration**
   - `NEXT_PUBLIC_APP_URL`: Your deployed app URL (e.g., https://your-app.vercel.app)

## Deployment Steps

### Option 1: Deploy via Vercel CLI

1. **Login to Vercel**
   ```bash
   vercel login
   ```

2. **Navigate to project directory**
   ```bash
   cd tweet-to-course
   ```

3. **Deploy for preview**
   ```bash
   npm run deploy:preview
   ```

4. **Deploy to production**
   ```bash
   npm run deploy
   ```

### Option 2: Deploy via Vercel Dashboard

1. **Connect Repository**
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Build Settings**
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

3. **Add Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add all the variables listed above

4. **Deploy**
   - Click "Deploy"

## Post-Deployment Configuration

### 1. Update Clerk Settings
- In your Clerk dashboard, update the allowed origins to include your Vercel URL
- Update webhook endpoints to point to your deployed app

### 2. Update Notion Integration
- Update the `NOTION_REDIRECT_URI` environment variable to your deployed URL
- Update the redirect URI in your Notion integration settings

### 3. Update Paystack Webhooks
- In your Paystack dashboard, update webhook URLs to point to your deployed app

### 4. Test the Deployment
- Visit your deployed app
- Test authentication flow
- Test course generation
- Test payment integration
- Test Notion export functionality

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check that all environment variables are set
   - Ensure TypeScript compilation passes locally
   - Check for missing dependencies

2. **Runtime Errors**
   - Check Vercel function logs
   - Verify API endpoints are accessible
   - Confirm database connections

3. **Authentication Issues**
   - Verify Clerk configuration
   - Check allowed origins in Clerk dashboard
   - Confirm webhook endpoints

4. **Payment Issues**
   - Verify Paystack configuration
   - Check webhook endpoints
   - Confirm API keys are correct

### Vercel-Specific Considerations

- **Function Timeout**: API routes have a 60-second timeout (configured in vercel.json)
- **Memory Limits**: Serverless functions have memory constraints
- **Cold Starts**: First requests may be slower due to cold starts
- **File Size Limits**: Large file operations may need optimization

## Monitoring

- Use Vercel Analytics for performance monitoring
- Check Vercel function logs for errors
- Monitor Supabase logs for database issues
- Set up error tracking (consider Sentry integration)