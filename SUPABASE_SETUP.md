# Supabase + Google Login Setup

## 1. You Need These Values

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- Google OAuth Client ID
- Google OAuth Client Secret

## 2. How To Get Google Client ID / Secret

1. Open Google Cloud Console.
2. Create or choose a project.
3. Go to `APIs & Services` -> `OAuth consent screen`.
4. Configure the consent screen:
   - App name: your product name
   - Support email: your email
   - Authorized domain: your production domain if you have one
5. Go to `APIs & Services` -> `Credentials`.
6. Click `Create Credentials` -> `OAuth client ID`.
7. Choose `Web application`.
8. Add Authorized JavaScript origins:
   - `http://localhost:5173`
   - your production domain, for example `https://kulaifoodmap.com`
9. Add Authorized redirect URIs:
   - `https://<your-supabase-project-ref>.supabase.co/auth/v1/callback`
10. Copy the generated Client ID and Client Secret.

## 3. Enable Google Auth In Supabase

1. Open Supabase Dashboard.
2. Go to `Authentication` -> `Providers` -> `Google`.
3. Enable Google provider.
4. Paste the Google Client ID and Client Secret.
5. In `Authentication` -> `URL Configuration`, set:
   - Site URL: `http://localhost:5173` for local development
   - Redirect URLs:
     - `http://localhost:5173`
     - `https://kulaifoodmap.com`
     - any preview domain you actually use

## 4. Create The Profiles Table And Daily Check-In Function

Run the SQL in [`supabase/profiles.sql`](./supabase/profiles.sql) inside Supabase SQL Editor.

## 5. Frontend Environment Variables

Add these to your local `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

You can find them in Supabase:

- `Project Settings` -> `API` -> `Project URL`
- `Project Settings` -> `API` -> `anon public key`

## 6. What The Current Frontend Now Does

- Shows a `Google 一键登录` button in the header
- Uses Supabase OAuth to sign in with Google
- Creates or updates the current user's `profiles` row
- Displays the user's avatar, nickname, points, and consecutive check-in days
- Lets the user claim the daily check-in reward through a secure database function

## 7. Production Checklist

- Add your production domain to Google OAuth authorized origins
- Add your production domain to Supabase redirect URLs
- Put `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` into your deployment environment
