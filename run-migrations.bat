@echo off
echo.
echo ========================================
echo TweetToCourse Database Migrations
echo ========================================
echo.

echo Migration 1: Initial Schema
echo ----------------------------------------
type "supabase\migrations\001_initial_schema.sql"
echo.
echo ========================================
echo.

echo Migration 2: Subscription Fields
echo ----------------------------------------
type "supabase\migrations\002_add_subscription_fields.sql"
echo.
echo ========================================
echo.

echo Instructions:
echo 1. Copy each SQL migration above
echo 2. Go to your Supabase project dashboard
echo 3. Navigate to SQL Editor
echo 4. Paste and run each migration in order
echo 5. Verify the tables were created successfully
echo.
pause