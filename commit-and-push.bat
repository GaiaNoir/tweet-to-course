@echo off
git add .
git commit -m "feat: Add custom branding feature for Pro users

- Add branding settings component with logo upload, color picker, footer text
- Create API routes for branding management (get, update, upload-logo)
- Add database migration for branding_settings JSONB column
- Update PDF exports to use custom branding (colors, logo, footer)
- Add branding section to dashboard for Pro users
- Update pricing page to highlight custom branding features
- Add storage bucket and RLS policies for user assets
- Include watermark removal for Pro users
- Add branding utilities and tests

This feature allows Pro users to:
- Upload custom logos
- Set brand colors (primary/accent)
- Add custom footer text
- Remove watermarks from exports
- Create professional white-label content"

git push origin main
pause