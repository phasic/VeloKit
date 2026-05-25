# Backend Deployment Guide

This guide covers deploying the VeloKit backend middleware to various platforms.

## Quick Deploy Options

### Option 1: Railway (Recommended - Easiest)

1. **Sign up**: Go to https://railway.app and sign up with GitHub

2. **Create new project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your VeloKit repository
   - Select the `server` folder as the root directory

3. **Set environment variables**:
   - Go to your project → Variables
   - Add: `OPENWEATHER_API_KEY` = your API key
   - Add: `PORT` = 3001 (optional, Railway auto-assigns)

4. **Deploy**: Railway will automatically deploy when you push to GitHub

5. **Get your URL**: Railway provides a URL like `https://your-app.railway.app`

**Cost**: Free tier available, then pay-as-you-go

---

### Option 2: Render (Free Tier Available)

1. **Sign up**: Go to https://render.com and sign up

2. **Create new Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Set:
     - **Name**: velokit-backend
     - **Root Directory**: `server`
     - **Environment**: Node
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`

3. **Set environment variables**:
   - Scroll to "Environment Variables"
   - Add: `OPENWEATHER_API_KEY` = your API key
   - Add: `PORT` = 3001

4. **Deploy**: Click "Create Web Service"

5. **Get your URL**: Render provides a URL like `https://velokit-backend.onrender.com`

**Cost**: Free tier (spins down after inactivity), paid plans available

---

### Option 3: Fly.io

1. **Install Fly CLI**:
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login**:
   ```bash
   fly auth login
   ```

3. **Create app**:
   ```bash
   cd server
   fly launch
   ```

4. **Set secrets**:
   ```bash
   fly secrets set OPENWEATHER_API_KEY=your_api_key_here
   ```

5. **Deploy**:
   ```bash
   fly deploy
   ```

**Cost**: Free tier available

---

### Option 4: Vercel (Serverless Functions)

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Create `vercel.json` in server folder**:
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "index.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "index.js"
       }
     ]
   }
   ```

3. **Deploy**:
   ```bash
   cd server
   vercel
   ```

4. **Set environment variables** in Vercel dashboard

**Cost**: Free tier available

---

## After Deployment: Update Frontend

Once your backend is deployed, you need to update the frontend to use the production backend URL.

### Option A: Environment Variable (Recommended)

1. **Create `.env.production`** in project root:
   ```env
   VITE_API_BASE_URL=https://your-backend-url.com
   ```

2. **Update `vite.config.ts`** to use the environment variable:
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

### Option B: Update Frontend Service Calls

Update `src/services/weatherService.ts` to use the production URL:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export async function geocodeCity(cityName: string): Promise<Location> {
  const url = `${API_BASE_URL}/api/weather/geocode?city=${encodeURIComponent(cityName)}`;
  // ... rest of code
}
```

### Option C: Build-time Configuration

For static hosting (GitHub Pages), you'll need to build with the production API URL:

```bash
VITE_API_BASE_URL=https://your-backend-url.com npm run build
```

---

## CORS Configuration

If deploying to a different domain, update CORS in `server/index.js`:

```javascript
app.use(cors({
  origin: [
    'http://localhost:5173', // Dev
    'https://your-username.github.io', // Production
    'https://your-custom-domain.com' // Custom domain
  ],
  credentials: true
}));
```

Or allow all origins (less secure, but simpler):
```javascript
app.use(cors());
```

---

## Testing Your Deployment

1. **Check health endpoint**:
   ```bash
   curl https://your-backend-url.com/health
   ```

2. **Test geocoding**:
   ```bash
   curl "https://your-backend-url.com/api/weather/geocode?city=London"
   ```

3. **Test weather forecast**:
   ```bash
   curl "https://your-backend-url.com/api/weather/forecast?lat=51.5&lon=-0.1&units=metric"
   ```

---

## Recommended Setup

For easiest deployment, I recommend:

1. **Backend**: Railway or Render (both have free tiers)
2. **Frontend**: GitHub Pages (already set up) or Vercel
3. **Environment**: Use environment variables for API base URL

---

## Troubleshooting

**Backend returns 401 Unauthorized:**
- Check that `OPENWEATHER_API_KEY` is set correctly in your platform's environment variables
- Verify the API key is valid and has the right subscription

**CORS errors:**
- Update CORS configuration to include your frontend domain
- Check that the frontend is using the correct backend URL

**Connection refused:**
- Verify the backend URL is correct
- Check that the backend is running (check health endpoint)
- Ensure firewall/security settings allow connections

