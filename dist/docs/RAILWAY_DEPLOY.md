# Deploy to Railway - Step by Step

## Prerequisites
- GitHub account
- Railway account (free signup at https://railway.app)

## Step 1: Sign up for Railway

1. Go to https://railway.app
2. Click "Start a New Project"
3. Sign up with GitHub (recommended - easiest way)

## Step 2: Create New Project

1. After logging in, click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Authorize Railway to access your GitHub if prompted
4. Select your **VeloKit** repository
5. Railway will ask you to select a service - **DO NOT deploy yet!**

## Step 3: Configure the Service

Railway should auto-detect the `server` directory because we have `railway.toml` configured.

**If you need to manually set Root Directory:**

1. Click on your **service** (the one Railway created)
2. Go to **"Settings"** tab
3. Look for **"Source"** section or **"Root Directory"**
4. If you see it, set to: `server`
5. If you DON'T see it, that's okay - the `railway.toml` file will handle it

**Alternative: The `railway.toml` file I created will:**
- Tell Railway to run `cd server && npm start`
- This works even if Root Directory setting isn't visible

## Step 4: Set Environment Variables

1. In your Railway project, go to the **"Variables"** tab
2. Click **"New Variable"**
3. Add these variables:

   **Variable 1:**
   - Name: `OPENWEATHER_API_KEY`
   - Value: `your_actual_api_key_here` (paste your API key from .env)
   
   **Variable 2 (Optional):**
   - Name: `PORT`
   - Value: `3001` (Railway auto-assigns, but you can set this)

   **Variable 3 (Optional - for CORS):**
   - Name: `FRONTEND_URL`
   - Value: `https://phasic.github.io` (your GitHub Pages URL)

4. Click **"Add"** for each variable

## Step 5: Deploy

1. Go back to the **"Deployments"** tab
2. Railway should automatically start deploying
3. Wait for the deployment to complete (green checkmark)
4. Click on the service → **"Settings"** → **"Generate Domain"**
5. Copy your Railway URL (e.g., `https://velokit-production.up.railway.app`)

## Step 6: Test Your Backend

Test the health endpoint:
```bash
curl https://your-railway-url.railway.app/health
```

Should return:
```json
{"status":"ok","timestamp":"..."}
```

## Step 7: Update Frontend

Once your backend is deployed, you need to update the frontend to use the production backend URL.

### Option A: Environment Variable (Recommended)

1. Create `.env.production` in project root:
   ```env
   VITE_API_BASE_URL=https://your-railway-url.railway.app
   ```

2. Update `src/services/weatherService.ts` to use the base URL:
   ```typescript
   const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
   ```

3. Update all API calls to use `${API_BASE_URL}/api/...`

### Option B: Update Vite Config

Update `vite.config.ts` to use the production URL when building:
```typescript
server: {
  proxy: {
    '/api': {
      target: process.env.VITE_API_BASE_URL || 'http://localhost:3001',
      changeOrigin: true,
    }
  }
}
```

## Step 8: Deploy Frontend

After updating the frontend configuration:
```bash
VITE_API_BASE_URL=https://your-railway-url.railway.app npm run build
npm run deploy
```

## Troubleshooting

**Deployment fails:**
- Check that Root Directory is set to `server`
- Verify `npm start` command works locally
- Check Railway logs for errors

**401 Unauthorized errors:**
- Verify `OPENWEATHER_API_KEY` is set correctly in Railway Variables
- Check that the API key is valid

**CORS errors:**
- Add your frontend URL to `FRONTEND_URL` variable
- Or update CORS in `server/index.js` to include your domain

**Can't find the service:**
- Make sure you selected the correct GitHub repository
- Check that the `server` folder exists in your repo

