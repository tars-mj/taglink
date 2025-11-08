# Supabase Configuration for Email Verification

## Problem

Email confirmation links from Supabase take too long to load or don't redirect properly after clicking.

## Root Cause

The `emailRedirectTo` URL in Supabase configuration may not match your local/production environment, causing the callback to fail or timeout.

## Solution

### 1. Configure Redirect URLs in Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `taglink` (rvtusbaz...)
3. Navigate to **Authentication** → **URL Configuration**
4. Add the following URLs to **Redirect URLs**:

**For Local Development:**
```
http://localhost:3000/auth/callback
http://localhost:3001/auth/callback
http://localhost:3002/auth/callback
```

**For Production (Railway):**
```
https://taglink-production.up.railway.app/auth/callback
```

**⚠️ Important:** Add **ALL** URLs above (both localhost and Railway) so email verification works in both environments!

5. Click **Save changes**

### 2. Set Site URL (CRITICAL!)

In the same **URL Configuration** section:

- **Site URL**: Set to your production domain
  - **Production**: `https://taglink-production.up.railway.app`
  - ⚠️ **DO NOT** use localhost - emails will be sent to users with this URL!
  - This URL is used in email confirmation links

### 3. Test Email Confirmation

1. Register a new account
2. Check your email for confirmation link
3. Click the link
4. You should be redirected to `/auth/callback`
5. The callback route will:
   - Exchange the code for a session
   - Set authentication cookies
   - Redirect you to `/dashboard`
6. Check console logs for debugging:
   ```
   [Auth Callback] Processing callback request
   [Auth Callback] Code present: true
   [Auth Callback] Exchanging code for session...
   [Auth Callback] Successfully exchanged code, redirecting to: /dashboard
   ```

### 4. Common Issues

#### Issue: "Invalid redirect URL"
**Solution:** Make sure the callback URL is added to Redirect URLs in Supabase Dashboard

#### Issue: Email redirects to localhost:8080 or wrong URL
**Root Cause:** Old emails were generated BEFORE you updated Site URL in Supabase

**Solution:**
1. **Delete the test account in Supabase Dashboard:**
   - Go to Authentication → Users
   - Find the user and delete them
2. **Verify Site URL is set to production:**
   - Go to Authentication → URL Configuration
   - Site URL should be: `https://taglink-production.up.railway.app`
   - NOT localhost!
3. **Verify Redirect URLs include production:**
   - `https://taglink-production.up.railway.app/auth/callback` should be in the list
4. **Register a NEW account:**
   - Use a different email or the same one (after deleting old account)
   - The new confirmation email will have the correct Railway URL
5. **Important:** Old emails are NOT updated when you change Site URL - you must register fresh

#### Issue: Infinite loading after clicking email link
**Solution:**
- Check browser console for errors
- Check server logs for callback errors
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set correctly

#### Issue: "No code provided in callback"
**Solution:**
- Email link is malformed
- Try registering again
- Check Supabase email templates

#### Issue: "Error exchanging code"
**Solution:**
- Code may have expired (valid for 1 hour)
- Code may have already been used
- Request a new verification email

#### Issue: "User from sub claim in JWT does not exist" in Railway logs
**Solution:** This error is now fixed - middleware was intercepting the callback route before session could be created. The `/auth/callback` route is now excluded from middleware.

### 5. Email Template Configuration (Optional)

To customize the confirmation email:

1. Go to **Authentication** → **Email Templates**
2. Select **Confirm signup**
3. Update the template with your branding
4. Ensure the link uses: `{{ .ConfirmationURL }}`

### 6. Development vs Production

**Development (localhost):**
- Use `http://localhost:3000/auth/callback` (or 3001, 3002 based on port)
- Email confirmation works the same as production
- Register test accounts locally

**Production (Railway):**
- Use `https://taglink-production.up.railway.app/auth/callback`
- SSL is automatically configured by Railway
- Test with a real email (not temporary/throwaway)
- Users register on production URL
- Email links will point to Railway (Site URL setting)

### 7. Disable Email Confirmation (Dev Only)

For faster development, you can disable email confirmation:

1. Go to **Authentication** → **Providers** → **Email**
2. Uncheck **Confirm email**
3. Save

**WARNING:** Don't do this in production!

## Current Callback Implementation

Our `/auth/callback` route:
- Accepts `code` parameter from Supabase
- Exchanges code for session using `exchangeCodeForSession()`
- Sets auth cookies automatically
- Redirects to `/dashboard` on success
- Redirects to `/login?error=...` on failure
- Includes detailed console logging for debugging

## Monitoring

Watch server logs during email confirmation:
```bash
npm run dev
```

Look for:
```
[Auth Callback] Processing callback request
[Auth Callback] Code present: true
[Auth Callback] Exchanging code for session...
[Auth Callback] Successfully exchanged code, redirecting to: /dashboard
```

If you see errors, they will appear as:
```
[Auth Callback] Error exchanging code: <error message>
```

## Next Steps

After configuring Supabase:
1. Test with a new account registration
2. Check email and click confirmation link
3. Verify redirect works smoothly
4. Monitor console logs for any issues
