# Clone App to DigitalOcean for GHL Integration Testing

## Overview
Create a separate staging environment to test GoHighLevel integration without affecting production.

---

## Step 1: Prepare the Code

### A. Create a new branch for GHL integration
```bash
git checkout -b ghl-integration
```

### B. Update environment variables template
Create `.env.staging` with:
```env
# Supabase - You can use same project or create new one
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# GoHighLevel API (get from Whizrock)
GHL_API_KEY=your_ghl_api_key
GHL_LOCATION_ID=your_ghl_location_id
GHL_WEBHOOK_SECRET=your_webhook_secret

# App URL
NEXT_PUBLIC_APP_URL=https://staging-whizrock-premier.yourdomain.com

# Resend (optional - can skip if using GHL for emails)
RESEND_API_KEY=your_resend_key
```

---

## Step 2: DigitalOcean Setup

### Option A: App Platform (Recommended - Easiest)

1. **Create New App**
   - Go to: https://cloud.digitalocean.com/apps
   - Click "Create App"
   - Connect GitHub repo
   - Select branch: `ghl-integration`
   - Detect: Next.js app

2. **Configure Build**
   - Build Command: `npm run build`
   - Run Command: `npm start`
   - HTTP Port: 3000

3. **Add Environment Variables**
   - Paste all variables from `.env.staging`

4. **Choose Plan**
   - Basic: $5/month (512MB RAM) - good for testing
   - Pro: $12/month (1GB RAM) - better performance

5. **Deploy**
   - Click "Create Resources"
   - Wait 5-10 minutes for first deploy

### Option B: Droplet with Docker (More Control)

1. **Create Droplet**
   - Ubuntu 22.04 LTS
   - Basic plan: $6/month
   - Choose datacenter closest to you

2. **SSH into Droplet**
```bash
ssh root@your_droplet_ip
```

3. **Install Docker & Docker Compose**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
apt-get install docker-compose-plugin
```

4. **Clone Your Repo**
```bash
git clone https://github.com/yourusername/whizrock-premier.git
cd whizrock-premier
git checkout ghl-integration
```

5. **Create Dockerfile** (I'll create this for you)

6. **Build & Run**
```bash
docker compose up -d
```

---

## Step 3: Database Setup

### Option 1: Use Existing Supabase (Easier)
- Same database, different app instance
- No migration needed
- Can test with real data

### Option 2: New Supabase Project (Cleaner)
- Create new Supabase project: https://app.supabase.com
- Run migrations from `supabase/migrations`
- Populate with test data

---

## Step 4: GHL Integration Setup

### A. Get GHL API Credentials
From your Whizrock GHL account:
1. Go to Settings → Integrations → API
2. Create new API key
3. Get your Location ID
4. Note webhook endpoint format

### B. Add GHL Service Layer
I'll create:
- `src/lib/ghl-service.ts` - API client
- `src/app/api/webhooks/ghl/route.ts` - Receive webhooks from GHL
- `src/app/api/sync/ghl/route.ts` - Sync data to GHL

---

## Step 5: Testing Plan

### Phase 1: Contact Sync (Week 1)
- [ ] Fetch contacts from GHL
- [ ] Display in quote creation
- [ ] Push new contacts to GHL when created

### Phase 2: Opportunity Sync (Week 2)
- [ ] Create GHL opportunity when quote sent
- [ ] Update GHL opportunity when quote accepted
- [ ] Sync status changes both ways

### Phase 3: Task/Activity Sync (Week 3)
- [ ] Create GHL task when assessment completed
- [ ] Push job completion to GHL activity feed
- [ ] Test workflow automation

### Phase 4: Email via GHL (Week 4)
- [ ] Replace Resend with GHL email API
- [ ] Test quote email delivery
- [ ] Test certificate delivery
- [ ] Add SMS notifications (bonus)

---

## Step 6: Monitoring & Rollback

### Monitor
- DigitalOcean App Metrics
- Supabase Logs
- GHL API usage
- Error tracking with Sentry (optional)

### Rollback Plan
If integration fails:
1. Keep current production running (untouched)
2. Fix issues in staging
3. Only merge to main when stable

---

## Cost Estimate

### Minimal Setup
- DigitalOcean App Platform: $5/month
- Supabase (same project): $0
- GHL API: Included in Whizrock
- **Total: $5/month**

### Recommended Setup
- DigitalOcean App Platform: $12/month
- Separate Supabase project: $25/month
- **Total: $37/month**

---

## Next Steps - What I'll Do

1. **Create Docker setup** for easy deployment
2. **Create GHL service layer** with TypeScript types
3. **Create webhook endpoints** to receive GHL events
4. **Create sync scripts** to push data to GHL
5. **Document API mappings** (your data ↔ GHL data)

---

## Questions to Answer

1. **Which DigitalOcean option?**
   - App Platform (easier) ✅ Recommended
   - Droplet + Docker (more control)

2. **Database?**
   - Use existing Supabase ✅ Recommended for testing
   - Create new Supabase project

3. **GHL Access?**
   - Do you have API credentials for Whizrock?
   - Can you access the API settings in GHL?

4. **Timeline?**
   - How quickly do you need this set up?
   - Should I prioritize getting it running first, then add integration?

---

## What Should I Start With?

**Option A: Get staging environment running first** (1 hour)
- Clone current app to DigitalOcean
- Verify it works
- Then add GHL integration

**Option B: Build GHL integration locally first** (2 hours)
- Create GHL service layer
- Test API calls
- Then deploy to DigitalOcean

Which approach do you prefer?
