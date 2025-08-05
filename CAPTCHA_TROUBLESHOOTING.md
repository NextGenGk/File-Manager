# CAPTCHA Troubleshooting Guide

## Issue: "The CAPTCHA failed to load. This may be due to an unsupported browser or a browser extension."

This error occurs in Clerk authentication forms and can be caused by several factors.

## Quick Fixes Applied

✅ **Updated Content Security Policy (CSP)** in `next.config.ts`:
- Added CAPTCHA providers to allowed frame sources
- Added script sources for Google CAPTCHA and Cloudflare
- Changed X-Frame-Options from DENY to SAMEORIGIN

✅ **Added OAuth callback routes** to middleware public routes:
- `/sso-callback`
- `/oauth-callback` 
- `/auth/callback`

✅ **Updated ClerkProvider configuration** with proper publishableKey

## Manual Troubleshooting Steps

### 1. Browser Issues
- **Disable browser extensions** temporarily (especially ad blockers, privacy extensions)
- **Try a different browser** (Chrome, Firefox, Edge)
- **Clear browser cache and cookies**
- **Check if running in private/incognito mode**

### 2. Network Issues
- **Check firewall settings** - ensure CAPTCHA domains aren't blocked
- **Corporate networks** - contact IT to whitelist CAPTCHA domains
- **VPN/Proxy** - try disabling temporarily

### 3. Clerk Dashboard Settings
- Go to [Clerk Dashboard](https://dashboard.clerk.dev)
- Check **Security** settings
- Verify **CAPTCHA provider** is enabled
- Check **Redirect URLs** include your app domains

### 4. Environment Variables
Ensure your Clerk keys are complete:
```bash
# These should be much longer (100+ characters)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### 5. Domains to Whitelist
If using corporate firewalls, whitelist these domains:
- `*.clerk.dev`
- `*.clerk.com`
- `challenges.cloudflare.com`
- `www.google.com`
- `www.gstatic.com`
- `js.stripe.com`

## Alternative Solutions

### Option 1: Disable CAPTCHA (Development Only)
In Clerk Dashboard:
1. Go to Security settings
2. Disable bot protection temporarily
3. **Note**: Only for development/testing

### Option 2: Use Email/Password Only
Remove social providers temporarily if CAPTCHA is causing issues.

### Option 3: Custom Authentication
Implement custom auth flow without CAPTCHA dependency.

## Testing the Fix

1. **Clear browser cache**
2. **Try different browsers**
3. **Test with extensions disabled**
4. **Check browser console for errors**
5. **Verify network requests aren't blocked**

## If Issues Persist

1. **Contact Clerk Support** with browser/network details
2. **Check Clerk Status Page** for service issues
3. **Review Clerk documentation** for updates
4. **Consider alternative auth providers**

## Monitoring

Watch for these console errors:
- `Content Security Policy` violations
- `Failed to load resource` from CAPTCHA domains
- `Refused to frame` errors
- Network timeout errors

The CSP and middleware changes should resolve most CAPTCHA loading issues.
