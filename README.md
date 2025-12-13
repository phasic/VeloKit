# DressMyRide

A mobile-first Progressive Web App that recommends cycling clothing based on weather conditions.

## Features

- **Location-based weather**: Uses browser geolocation or manual city input
- **Smart recommendations**: Rule-based clothing recommendations based on temperature, wind, and rain
- **PWA support**: Installable on iOS and Android with offline fallback
- **Mobile-first design**: Optimized for mobile devices

## Setup

1. Install dependencies:
```bash
npm install
```

2. Get an OpenWeather API key:
   - Sign up at [openweathermap.org](https://openweathermap.org/api)
   - Get your free API key
   - Enter it in the app's Settings page

3. Generate PWA icons (optional):
   - Create `public/pwa-192x192.png` (192x192px)
   - Create `public/pwa-512x512.png` (512x512px)
   - Or use an online tool to generate from a source image

## Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173/DressMyRide/`

## Build

```bash
npm run build
```

The built files will be in the `dist` directory.

## Deployment

The app is configured to deploy to GitHub Pages at `/DressMyRide/`.

### Quick Deployment (Recommended)

Simply run:
```bash
npm run deploy
```

This will build the project and deploy it to the `gh-pages` branch automatically.

Alternatively, use the shell script:
```bash
./deploy.sh
```

**Note:** Make sure GitHub Pages is configured to serve from the `gh-pages` branch:
- Go to repository Settings → Pages
- Source: Deploy from a branch
- Branch: `gh-pages` / `(root)`

### Automatic Deployment (GitHub Actions)

Push to the `main` branch and GitHub Actions will automatically build and deploy to the `gh-pages` branch.

### Manual Deployment

1. Build the project:
```bash
npm run build
```

2. Deploy the `dist` folder to GitHub Pages:
```bash
npx gh-pages -d dist
```

## Configuration

- **Base path**: `/DressMyRide/` (configured in `vite.config.ts`)
- **API key**: Stored in localStorage (user-provided)
- **Weather cache**: 30 minutes in localStorage
- **Units**: Metric (°C / km/h) or Imperial (°F / mph)

