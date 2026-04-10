# VibeFinance Deployment Guide

## Prerequisites

1. **Supabase Account** - [supabase.com](https://supabase.com)
2. **Polygon.io API Key** - [polygon.io](https://polygon.io)
3. **Vercel Account** (optional) - [vercel.com](https://vercel.com)

## Step 1: Set Up Supabase

### 1.1 Create Project
1. Go to [app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Fill in details and create project
4. Wait for project initialization (~2 minutes)

### 1.2 Run Database Schema
1. Go to SQL Editor in your Supabase dashboard
2. Open `plans/supabase-setup.md`
3. Copy and run each SQL section in order:
   - Enable UUID extension
   - Create tables (profiles, portfolios, assets, holdings, transactions, watchlist, price_alerts)
   - Set up Row Level Security (RLS) policies
   - Create triggers and functions

### 1.3 Configure Authentication
1. Go to Authentication > Providers
2. Enable **Email** authentication (already enabled)
3. (Optional) Enable **Google** OAuth:
   - Follow Supabase guide to set up Google OAuth
   - Add redirect URL: `https://your-project.supabase.co/auth/v1/callback`

### 1.4 Get API Keys
1. Go to Project Settings > API
2. Copy:
   - **Project URL** (VITE_SUPABASE_URL)
   - **anon/public** key (VITE_SUPABASE_ANON_KEY)

## Step 2: Get Polygon.io API Key

1. Sign up at [polygon.io](https://polygon.io)
2. Verify your email
3. Go to Dashboard > API Keys
4. Copy your API key

## Step 3: Configure Environment Variables

### Local Development

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your keys in `.env.local`:
   ```env
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   VITE_POLYGON_API_KEY=your_polygon_api_key
   VITE_APP_URL=http://localhost:3000
   VITE_APP_NAME=VibeFinance
   ```

3. Restart your dev server:
   ```bash
   npm run dev
   ```

## Step 4: Deploy to Vercel

### 4.1 Install Vercel CLI (Optional)
```bash
npm install -g vercel
```

### 4.2 Deploy via GitHub (Recommended)

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/vibefinance.git
   git push -u origin main
   ```

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Vite configuration

3. **Add Environment Variables:**
   - In Vercel project settings > Environment Variables
   - Add all variables from `.env.local`:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
     - `VITE_POLYGON_API_KEY`
     - `VITE_APP_URL` (your production URL)
     - `VITE_APP_NAME`

4. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live at `https://your-project.vercel.app`

### 4.3 Deploy via CLI

```bash
vercel login
vercel
# Follow prompts
vercel --prod
```

## Step 5: Post-Deployment Setup

### 5.1 Update Supabase Auth URLs
1. Go to Supabase Dashboard > Authentication > URL Configuration
2. Add your production URL to:
   - Site URL
   - Redirect URLs

### 5.2 Test Your Deployment
1. Visit your production URL
2. Try signing up
3. Add a test portfolio
4. Verify all features work

### 5.3 Add Custom Domain (Optional)
1. In Vercel project settings > Domains
2. Add your custom domain
3. Follow DNS configuration instructions

## Troubleshooting

### Build Errors

**TypeScript errors:**
```bash
npm run type-check
# Fix any errors, then redeploy
```

**Missing dependencies:**
```bash
npm install
npm run build
```

### Runtime Errors

**CORS issues:**
- Check Supabase RLS policies are enabled
- Verify API keys are correct
- Check browser console for specific errors

**Authentication not working:**
- Verify Supabase Auth is enabled
- Check redirect URLs are configured
- Ensure environment variables are set in production

**API rate limits:**
- Polygon.io free tier: 5 calls/minute
- Implement caching (already done via TanStack Query)
- Consider upgrading Polygon.io plan for production

## Performance Optimization

### Enable Vercel Analytics
```bash
npm install @vercel/analytics
```

Add to `src/main.tsx`:
```typescript
import { Analytics } from '@vercel/analytics/react';

// Add <Analytics /> to your app
```

### Enable Compression
Vercel automatically enables gzip/brotli compression.

### Monitor Performance
- Use Vercel Analytics dashboard
- Check Lighthouse scores
- Monitor Supabase database performance

## Backup & Maintenance

### Database Backups
- Supabase automatically backs up your database
- Access backups in Supabase Dashboard > Database > Backups

### Monitoring
- Set up Supabase alerts
- Monitor Vercel deployment logs
- Track API usage (Polygon.io dashboard)

## Scaling Considerations

### Database
- Supabase free tier: Up to 500MB database
- Upgrade to Pro for larger databases

### API Limits
- Polygon.io free: 5 calls/min
- Consider paid plans for production scale

### Hosting
- Vercel free tier: 100GB bandwidth/month
- Upgrade as needed for higher traffic

## Security Checklist

- [x] Environment variables not in git
- [x] Supabase RLS enabled on all tables
- [x] API keys stored securely
- [x] HTTPS enforced (Vercel default)
- [x] Input validation with Zod
- [x] SQL injection prevention (parameterized queries)

## Support

- **Supabase Docs:** [supabase.com/docs](https://supabase.com/docs)
- **Vercel Docs:** [vercel.com/docs](https://vercel.com/docs)
- **Polygon.io Docs:** [polygon.io/docs](https://polygon.io/docs)

---

**Status:** Ready for deployment ✅
**Last Updated:** 2026-04-08
