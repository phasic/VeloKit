# Deploy to Railway - Updated Guide

## Step 1: Sign up for Railway

1. Go to https://railway.app
2. Click "Start a New Project"
3. Sign up with GitHub (recommended)

## Step 2: Create New Project

1. After logging in, click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Authorize Railway to access your GitHub if prompted
4. Select your **VeloKit** repository
5. Railway will automatically start detecting and deploying

## Step 3: Configure Root Directory (IMPORTANT!)

Railway might auto-detect the wrong directory. Here's how to fix it:

### Option A: Via Service Settings (New UI)

1. After Railway creates the service, click on the **service name** (not the project)
2. Go to the **"Settings"** tab
3. Look for **"Source"** section
4. Find **"Root Directory"** or **"Working Directory"**
5. Set it to: `server`
6. Click **"Save"**

### Option B: Via Service Configuration

1. Click on your service
2. Look for a **"Configure"** or **"Settings"** button
3. Scroll down to find **"Root Directory"**
4. Change from `/` (or empty) to `server`
5. Save changes

### Option C: If Root Directory is not visible

If you can't find Root Directory in Settings:

1. Go to your service → **"Deployments"** tab
2. Click on the latest deployment
3. Look for **"Build Logs"** or **"Deploy Logs"**
4. If you see errors about missing `package.json`, you need to set Root Directory

**Alternative: Create `railway.toml` in project root**

Create a file called `railway.toml` in your project root:

```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "cd server && npm start"
```

Or Railway might auto-detect if you have `server/package.json`.

## Step 4: Set Environment Variables

1. In your Railway project, click on your **service**
2. Go to the **"Variables"** tab
3. Click **"New Variable"**
4. Add:

   **Variable 1:**
   - Key: `OPENWEATHER_API_KEY`
   - Value: `your_actual_api_key_here`
   
   **Variable 2 (Optional):**
   - Key: `PORT`
   - Value: `3001`

   **Variable 3 (Optional - for CORS):**
   - Key: `FRONTEND_URL`
   - Value: `https://phasic.github.io`

5. Click **"Add"** for each variable

## Step 5: Verify Deployment

1. Railway should automatically redeploy when you change settings
2. Go to **"Deployments"** tab and wait for deployment to complete
3. Check the logs - you should see:
   ```
   🚀 Server running on http://localhost:3001
   📡 Weather API proxy ready
   ```

## Step 6: Get Your Backend URL

1. Click on your service → **"Settings"** tab
2. Scroll to **"Networking"** section
3. Click **"Generate Domain"** (if not already generated)
4. Copy your Railway URL (e.g., `https://velokit-production.up.railway.app`)

## Step 7: Test Your Backend

Test the health endpoint:
```bash
curl https://your-railway-url.railway.app/health
```

Should return:
```json
{"status":"ok","timestamp":"..."}
```

## Troubleshooting Root Directory

**If Root Directory setting doesn't exist:**

1. Railway might be detecting `package.json` in the root
2. Try creating `railway.toml` in project root with:
   ```toml
   [deploy]
   startCommand = "cd server && npm start"
   ```

3. Or rename/move files so Railway detects `server/package.json` correctly

**If deployment fails:**

- Check the build logs in Railway
- Make sure `server/package.json` exists
- Verify `npm start` command works locally
- Check that all dependencies are in `server/package.json`

