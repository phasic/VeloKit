# How to Redeploy Backend Changes to Railway

## Automatic Deployment (Recommended)

If your Railway project is connected to GitHub, **deployment happens automatically** when you push to the `main` branch.

1. **Push your changes** (already done ✅)
   ```bash
   git push
   ```

2. **Check Railway Dashboard**
   - Go to https://railway.app
   - Open your VeloKit project
   - Go to the **"Deployments"** tab
   - You should see a new deployment starting automatically
   - Wait for it to complete (green checkmark)

3. **Verify Deployment**
   - Check the deployment logs for any errors
   - Test the health endpoint:
     ```bash
     curl https://velokit-production.up.railway.app/health
     ```

## Manual Redeployment

If automatic deployment didn't trigger, you can manually redeploy:

### Option 1: Via Railway Dashboard

1. Go to https://railway.app
2. Open your **VeloKit** project
3. Click on your **service** (the backend service)
4. Go to the **"Deployments"** tab
5. Click **"Redeploy"** button (or three dots menu → Redeploy)
6. Select **"Redeploy"** to use the latest code from GitHub

### Option 2: Via Railway CLI

1. **Install Railway CLI** (if not already installed):
   ```bash
   npm i -g @railway/cli
   ```

2. **Login**:
   ```bash
   railway login
   ```

3. **Link your project** (first time only):
   ```bash
   cd server
   railway link
   ```

4. **Deploy**:
   ```bash
   railway up
   ```

## Verify Changes Are Deployed

After deployment, verify the rate limiting is active:

1. **Check server logs** in Railway:
   - Go to your service → **"Deployments"** → Click on latest deployment
   - View **"Logs"**
   - You should see:
     ```
     🛡️  Rate limiting enabled:
        - All API endpoints: 100 requests per day per IP
     ```

2. **Test the API**:
   ```bash
   # Test health endpoint
   curl https://velokit-production.up.railway.app/health
   
   # Should return: {"status":"ok","timestamp":"..."}
   ```

3. **Test rate limiting** (optional):
   ```bash
   # Make multiple requests to see rate limit headers
   curl -I https://velokit-production.up.railway.app/api/weather/geocode?city=London
   
   # Check headers for RateLimit-* values
   ```

## Troubleshooting

**Deployment not starting:**
- Check that Railway is connected to your GitHub repo
- Verify you pushed to the `main` branch
- Check Railway project settings → Source → GitHub connection

**Deployment fails:**
- Check deployment logs in Railway
- Verify `server/package.json` has `express-rate-limit` dependency
- Ensure `OPENWEATHER_API_KEY` environment variable is set

**Rate limiting not working:**
- Check server logs for rate limit middleware initialization
- Verify the middleware is applied before routes
- Test with multiple requests from the same IP

## Environment Variables

Make sure these are set in Railway:
- `OPENWEATHER_API_KEY` - Your OpenWeather API key
- `PORT` - (Optional, Railway auto-assigns)
- `FRONTEND_URL` - (Optional, for CORS)

To check/update:
1. Railway → Your Service → **"Variables"** tab
2. Verify all required variables are set
3. Add/update as needed

## Quick Checklist

- [ ] Code pushed to GitHub ✅
- [ ] Railway connected to GitHub repo
- [ ] Deployment triggered (automatic or manual)
- [ ] Deployment completed successfully
- [ ] Environment variables set correctly
- [ ] Health endpoint responds
- [ ] Rate limiting active (check logs)


