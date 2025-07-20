# Database Setup Guide

This directory contains the database schema and migration files for the TweetToCourse application using Supabase.

## Quick Setup

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note down your project URL and API keys

2. **Configure Environment Variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Update the following variables in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

3. **Run Database Migrations**
   - Copy the SQL from `migrations/001_initial_schema.sql`
   - Paste it into the Supabase SQL Editor
   - Execute the migration

## Database Schema

### Tables

#### `users`
Stores user account information synced from Clerk authentication.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| clerk_user_id | TEXT | Unique Clerk user identifier |
| email | TEXT | User email address |
| subscription_tier | TEXT | 'free', 'pro', or 'lifetime' |
| usage_count | INTEGER | Total generations count |
| created_at | TIMESTAMP | Account creation time |
| updated_at | TIMESTAMP | Last update time |

#### `courses`
Stores generated course content and metadata.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to users table |
| title | TEXT | Course title |
| original_content | TEXT | Original tweet/thread content |
| modules | JSONB | Course modules data |
| created_at | TIMESTAMP | Course creation time |
| updated_at | TIMESTAMP | Last update time |

#### `usage_logs`
Tracks user actions for analytics and billing.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to users table |
| action | TEXT | 'generate', 'export_pdf', 'export_notion' |
| metadata | JSONB | Additional action data |
| created_at | TIMESTAMP | Action timestamp |

## Security

### Row Level Security (RLS)
All tables have RLS enabled with policies that ensure:
- Users can only access their own data
- Service role can bypass RLS for admin operations
- Proper authentication is required for all operations

### Indexes
Optimized indexes are created for:
- User lookups by Clerk ID and email
- Course queries by user and creation date
- Usage log queries by user and action type

## Usage Examples

### Creating a User
```typescript
import { UserService } from '@/lib/database';

const user = await UserService.createUser({
  clerk_user_id: 'clerk_123',
  email: 'user@example.com',
  subscription_tier: 'free',
});
```

### Creating a Course
```typescript
import { CourseService } from '@/lib/database';

const course = await CourseService.createCourse({
  user_id: user.id,
  title: 'My Generated Course',
  original_content: 'Original tweet content...',
  modules: [
    {
      id: 'module_1',
      title: 'Module 1',
      summary: 'Module summary',
      takeaways: ['Key takeaway'],
      order: 1,
    },
  ],
});
```

### Logging Usage
```typescript
import { UsageService } from '@/lib/database';

await UsageService.logAction({
  user_id: user.id,
  action: 'generate',
  metadata: { source: 'tweet_url' },
});
```

## Testing

Run the database tests:
```bash
npm run test:run
```

The tests use mocked Supabase clients and verify:
- User CRUD operations
- Course management
- Usage tracking
- Error handling
- Database health checks

## Maintenance

### Cleanup Old Logs
```typescript
import { cleanupOldUsageLogs } from '@/lib/db-init';

// Clean up logs older than 90 days
await cleanupOldUsageLogs(90);
```

### Health Monitoring
```typescript
import { getDatabaseHealth } from '@/lib/db-init';

const health = await getDatabaseHealth();
console.log('Database health:', health);
```

## Migration Notes

- The initial migration creates all necessary tables, indexes, and RLS policies
- Future migrations should be numbered sequentially (002_, 003_, etc.)
- Always test migrations on a staging environment first
- Backup your database before running migrations in production

## Troubleshooting

### Common Issues

1. **Connection Errors**
   - Verify environment variables are set correctly
   - Check Supabase project status
   - Ensure API keys have proper permissions

2. **RLS Policy Errors**
   - Verify user authentication is working
   - Check that Clerk user ID is properly set
   - Ensure service role key is used for admin operations

3. **Migration Failures**
   - Check for syntax errors in SQL
   - Verify all dependencies (extensions) are available
   - Ensure proper permissions for schema changes