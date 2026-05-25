# How to Add Your OpenWeather API Key

## Step 1: Create the `.env` file

The `.env` file should be in the **project root** directory (same level as `package.json`).

If it doesn't exist, copy the example file:
```bash
cp env.example .env
```

## Step 2: Add Your API Key

Open the `.env` file and replace `your_api_key_here` with your actual OpenWeather API key:

```env
OPENWEATHER_API_KEY=your_actual_api_key_here
PORT=3001
```

## Step 3: Get Your API Key

1. Go to https://openweathermap.org/api
2. Sign up for a free account (if you don't have one)
3. Subscribe to the **One Call API 3.0** (free tier available)
4. Copy your API key from the dashboard

## Security: Your API Key Won't Be Pushed to GitHub

✅ The `.env` file is already in `.gitignore`, so it will **never** be committed to Git.

To verify:
```bash
git check-ignore .env
```

If it returns `.env`, then it's properly ignored.

## Testing

After adding your API key:

1. Start the server:
   ```bash
   cd server
   npm start
   ```

2. Or start both frontend and backend:
   ```bash
   npm run dev:all
   ```

3. Check the server logs - it should show:
   ```
   🚀 Server running on http://localhost:3001
   📡 Weather API proxy ready
   ```

If you see a warning about the API key not being configured, double-check your `.env` file.

## Important Notes

- ⚠️ **Never commit `.env` to Git** - it's already in `.gitignore`
- ⚠️ **Never share your API key** publicly
- ✅ The `env.example` file is safe to commit (it doesn't contain real keys)
- ✅ Your API key stays on your local machine and server only

