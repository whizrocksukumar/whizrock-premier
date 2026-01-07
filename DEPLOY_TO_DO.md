# Deploy to DigitalOcean App Platform - Step by Step

## Prerequisites
- [ ] GitHub repo for this project
- [ ] DigitalOcean account (https://cloud.digitalocean.com)
- [ ] Your Supabase credentials
- [ ] GoHighLevel API credentials (from Whizrock)

---

## Step 1: Push Code to GitHub (5 minutes)

If you haven't already:

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit - ready for DigitalOcean deployment"

# Create repo on GitHub, then:
git remote add origin https://github.com/yourusername/whizrock-premier.git
git push -u origin main
```

---

## Step 2: Create App on DigitalOcean (10 minutes)

### A. Start App Creation
1. Go to: https://cloud.digitalocean.com/apps
2. Click **"Create App"**
3. Choose **"GitHub"** as source
4. Click **"Manage Access"** and authorize DigitalOcean

### B. Select Repository
1. Select your repository: `whizrock-premier`
2. Branch: `main`
3. Source Directory: `/` (root)
4. Autodeploy: ✅ **Checked** (deploys on every push)

### C. Configure Resources
**App will auto-detect:**
- Type: Web Service
- Build Command: `npm run build`
- Run Command: `npm start`
- HTTP Port: 3000

Click **"Next"**

### D. Set Environment Variables
Click **"Edit"** next to environment variables and add these:

**Required - Supabase:**
```
NEXT_PUBLIC_SUPABASE_URL = https://syyzrgybeqnyjfqealnv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5eXpyZ3liZXFueWpmcWVhbG52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMjk3MDksImV4cCI6MjA3NjcwNTcwOX0.ICKIx4p-q39j1nMK42abdFmGRevpSfxkiozPkxDnE1Q
SUPABASE_SERVICE_ROLE_KEY = [your service role key - mark as ENCRYPTED]
```

**Optional - For later:**
```
RESEND_API_KEY = [your resend key - mark as ENCRYPTED]
GHL_API_KEY = [get from Whizrock - mark as ENCRYPTED]
GHL_LOCATION_ID = [get from Whizrock - mark as ENCRYPTED]
```

**Auto-generated:**
```
NEXT_PUBLIC_APP_URL = ${APP_URL}
NODE_ENV = production
```

Click **"Save"**

### E. Choose Plan
**Recommended for testing:**
- Basic - $5/month
- 512 MB RAM / 1 vCPU
- Perfect for staging/testing

Click **"Next"**

### F. Name Your App
- App Name: `whizrock-premier-staging`
- Project: Default (or create "Whizrock")
- Region: **Sydney** (closest to NZ)

Click **"Create Resources"**

---

## Step 3: Wait for Deployment (5-10 minutes)

You'll see:
1. ⏳ Building... (installing dependencies, building Next.js)
2. ⏳ Deploying... (starting the app)
3. ✅ **Live!** (app is running)

Your app URL will be something like:
```
https://whizrock-premier-staging-xxxxx.ondigitalocean.app
```

---

## Step 4: Test the Deployment

### A. Check Basic Functionality
1. Open the app URL
2. Try to login/navigate
3. Create a test quote
4. Verify database connection works

### B. Check Logs
If something fails:
1. Click your app in DigitalOcean dashboard
2. Go to **"Runtime Logs"**
3. Look for errors in red

Common issues:
- Missing environment variable
- Database connection timeout
- Build errors

---

## Step 5: Configure Custom Domain (Optional)

If you want `staging.whizrockpremier.co.nz`:

1. In DigitalOcean app dashboard, click **"Settings"**
2. Go to **"Domains"**
3. Click **"Add Domain"**
4. Enter: `staging.whizrockpremier.co.nz`
5. Add DNS records (shown on screen) to your domain provider

---

## Step 6: Set Up GHL Integration (Next Phase)

Once the app is running, we'll add:

### Phase 1: Test GHL Connection
```bash
# Test API access
curl -X GET https://rest.gohighlevel.com/v1/contacts \
  -H "Authorization: Bearer YOUR_GHL_API_KEY"
```

### Phase 2: Create Webhook Endpoints
- `/api/webhooks/ghl` - Receive events from GHL
- `/api/sync/contacts` - Sync contacts from GHL
- `/api/sync/opportunities` - Sync opportunities

### Phase 3: Connect Workflows
- Assessment complete → Create GHL task
- Quote sent → Update GHL opportunity
- Job complete → Send GHL email

---

## Troubleshooting

### Build Fails
**Error:** "Module not found"
**Fix:** Check package.json has all dependencies

**Error:** "Build timeout"
**Fix:** Upgrade to larger instance size

### App Won't Start
**Error:** "Port 3000 already in use"
**Fix:** Should auto-fix, but check run command is `npm start`

**Error:** "Cannot connect to database"
**Fix:** Verify Supabase environment variables are correct

### App Runs But Pages Error
**Error:** "500 Internal Server Error"
**Fix:** Check Runtime Logs for specific error

**Error:** "Environment variable not defined"
**Fix:** Add missing variable in Settings → Environment Variables

---

## Cost Management

### Current Setup Cost
- **App:** $5/month (Basic plan)
- **Bandwidth:** First 100GB free
- **Total:** ~$5-7/month

### If You Need More Power
- **Pro Plan:** $12/month (1GB RAM, better for production)
- **Multiple apps:** $5 each (can run dev, staging, prod separately)

---

## Monitoring

### Check App Health
1. Dashboard shows CPU/Memory usage
2. Set up alerts for:
   - High CPU (>80%)
   - High memory (>80%)
   - Response time (>2s)

### View Logs
Real-time logs in dashboard:
- Build logs
- Runtime logs
- Request logs

---

## Auto-Deploy Setup

Already configured! ✅

Every time you push to `main` branch:
1. DigitalOcean pulls latest code
2. Runs `npm run build`
3. Deploys new version
4. Zero downtime deployment

To disable auto-deploy:
1. App Settings → Source
2. Uncheck "Autodeploy"

---

## Next Steps After Deployment

1. ✅ **Verify app works** - Test all main features
2. ✅ **Note the URL** - Share with team for testing
3. ✅ **Get GHL credentials** - From your Whizrock account
4. ✅ **Plan integration** - Start with contact sync
5. ✅ **Test workflows** - Assessment → Task → Email

---

## Quick Commands

### Redeploy Manually
```bash
# Make changes locally
git add .
git commit -m "Update feature"
git push

# DigitalOcean auto-deploys (if enabled)
```

### View Logs Remotely
```bash
# Install doctl CLI (optional)
brew install doctl  # Mac
# or download from: https://docs.digitalocean.com/reference/doctl/

# Authenticate
doctl auth init

# View logs
doctl apps logs YOUR_APP_ID
```

### Rollback Deployment
In DigitalOcean dashboard:
1. Go to "Deployments" tab
2. Find previous working deployment
3. Click "⋯" → "Redeploy"

---

## Support

If you get stuck:
1. Check DigitalOcean docs: https://docs.digitalocean.com/products/app-platform/
2. Check the Runtime Logs for errors
3. Let me know and I'll help debug!

---

## Ready to Deploy?

Just follow Step 1 (push to GitHub) and Step 2 (create app on DigitalOcean).

I'll help you with any issues that come up! 🚀
