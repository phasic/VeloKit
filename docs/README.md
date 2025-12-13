# Dress My Ride - Technical Documentation

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Services](#services)
5. [State Management](#state-management)
6. [PWA Features](#pwa-features)
7. [API Integration](#api-integration)
8. [Deployment](#deployment)
9. [Development Guide](#development-guide)

## Architecture Overview

Dress My Ride is a React-based Progressive Web App (PWA) built with TypeScript and Vite. The application follows a component-based architecture with clear separation of concerns:

- **Presentation Layer**: React components organized by pages and reusable UI components
- **Business Logic**: Clothing recommendation engine and weather data processing
- **Data Layer**: Weather service API integration and local storage management
- **PWA Layer**: Service worker, manifest, and install prompt handling

### Technology Stack

- **Framework**: React 18.2
- **Language**: TypeScript 5.2
- **Build Tool**: Vite 5.0
- **PWA**: vite-plugin-pwa 0.17
- **Styling**: CSS with CSS Variables for theming
- **State Management**: React Hooks (useState, useEffect)
- **Storage**: localStorage API
- **External APIs**: OpenWeatherMap One Call API 3.0

## Project Structure

```
DressMyRide/
├── public/                 # Static assets
│   ├── manifest.json      # PWA manifest
│   ├── icons/             # App icons
│   └── offline.html       # Offline fallback page
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── BottomTabBar.tsx
│   │   ├── DevTools.tsx
│   │   └── InstallPrompt.tsx
│   ├── pages/            # Page components
│   │   ├── Home.tsx      # Quick view (main page)
│   │   ├── RideSetup.tsx # Custom ride configuration
│   │   ├── Recommendation.tsx
│   │   ├── Settings.tsx
│   │   ├── ClothingGuide.tsx
│   │   ├── About.tsx
│   │   └── Welcome.tsx
│   ├── services/         # External API services
│   │   └── weatherService.ts
│   ├── logic/            # Business logic
│   │   └── clothingEngine.ts
│   ├── utils/            # Utility functions
│   │   ├── storage.ts    # localStorage wrapper
│   │   ├── dateFormat.ts
│   │   └── demoWeather.ts
│   ├── types/            # TypeScript type definitions
│   │   └── index.ts
│   ├── App.tsx           # Main app component
│   ├── App.css           # Global styles
│   └── main.tsx          # Entry point
├── docs/                 # Documentation
├── dist/                 # Build output
├── vite.config.ts        # Vite configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Dependencies and scripts
```

## Core Components

### App.tsx

The root component that manages:
- **Routing**: Page state management (`welcome`, `home`, `setup`, `recommendation`, `settings`, `about`, `guide`)
- **Global State**: Location, ride config, weather data, recommendations
- **Theme Management**: Light/dark mode initialization
- **Install Detection**: PWA installation status

**Key State:**
- `page`: Current page/view
- `location`: User's location (coordinates + city name)
- `config`: Ride configuration (start time, duration, units)
- `weather`: Weather summary data
- `recommendation`: Clothing recommendations
- `loading`: Loading state
- `error`: Error messages

### Pages

#### Home.tsx
- **Purpose**: Quick view with automatic location detection
- **Features**:
  - Pull-to-refresh on mobile
  - Automatic weather fetch on load
  - Quick recommendation display
- **State**: Quick view data, loading states, pull-to-refresh state

#### RideSetup.tsx
- **Purpose**: Custom ride configuration
- **Features**:
  - Date/time picker
  - Duration selector
  - Location selection (current location or manual city input)
  - Units selection (metric/imperial)

#### Recommendation.tsx
- **Purpose**: Detailed clothing recommendation display
- **Features**:
  - Weather summary
  - Categorized clothing items
  - "Why?" explanation section
  - Ride details

#### Settings.tsx
- **Purpose**: User preferences and configuration
- **Features**:
  - API key management
  - Theme selection (light/dark/system)
  - Date format preference
  - Default ride duration
  - Demo mode toggle
  - Install prompt disable option
  - Cache management

#### ClothingGuide.tsx (Wardrobe)
- **Purpose**: Complete clothing guide
- **Features**:
  - All clothing items by category
  - Temperature-based scenarios
  - Wind-based scenarios
  - Rain-based scenarios
  - Collapsible sections

### Components

#### BottomTabBar.tsx
- iOS-style bottom navigation bar
- Pages: Quick view, Custom, Wardrobe
- Active state highlighting with slide animation

#### InstallPrompt.tsx
- PWA install prompt handling
- Detects `beforeinstallprompt` event
- Manages install/dismiss logic
- Exports utilities for header install button

#### DevTools.tsx
- Development tools (visible on localhost)
- Weather data override
- Testing utilities (welcome screen reset, install prompt forcing)

## Services

### weatherService.ts

Handles all weather-related API calls and caching.

#### `fetchWeatherForecast(location, config): Promise<WeatherSummary>`
- Fetches hourly forecast from OpenWeather One Call API 3.0
- Filters data for ride window (start time + duration)
- Computes summary (min/max temps, wind, rain probability)
- **Caching**: 30-minute cache, keyed by location (rounded to 1 decimal), start time (rounded to hour), and duration

#### `reverseGeocode(lat, lon): Promise<string | null>`
- Converts coordinates to city name
- Uses OpenWeather Geocoding API
- **Caching**: 24-hour cache, keyed by coordinates (rounded to 2 decimal places)

**Cache Strategy:**
- Weather cache: 30 minutes, multiple entries (map structure)
- Geocoding cache: 24 hours, multiple entries (map structure)
- Cache keys use rounded values for consistency

### clothingEngine.ts

Core business logic for clothing recommendations.

#### `recommendClothing(weather, config): ClothingRecommendation`
- Analyzes weather conditions (temperature, wind, rain)
- Applies rule-based logic to determine clothing items
- Returns categorized recommendations:
  - `head`: Headwear items
  - `neckFace`: Neck and face protection
  - `chest`: Upper body layers
  - `legs`: Lower body items
  - `hands`: Gloves
  - `feet`: Footwear and socks

**Temperature Rules:**
- >21°C: Shorts, short-sleeve jersey
- >15°C: Shorts, long-sleeve jersey
- >10°C: Leg warmers/tights, long-sleeve jersey with undershirt
- >7°C: Tights, wicking undershirt, lined jacket, thin gloves, headband
- >4°C: Tights, heavy mock turtleneck, lined jacket, medium gloves
- >1°C: Heavyweight tights, heavy turtleneck, heavy jacket, heavy gloves
- -1°C: Heavyweight tights, heavy turtleneck, heavy jacket, heavy gloves, lined skullcap
- -4°C: Winter bib tights, full turtleneck, jersey, jacket, mittens, balaclava
- ≤-7°C: Same as -4°C

**Wind Rules:**
- >25 km/h: Wind blocker recommended

**Rain Rules:**
- Any rain probability: Rain jacket recommended

## State Management

### Local Storage (storage.ts)

Centralized localStorage wrapper with type safety.

**Stored Data:**
- `API_KEY`: OpenWeather API key
- `THEME`: Theme preference (`light`, `dark`, `system`)
- `DATE_FORMAT`: Date format preference (`custom`, `system`)
- `DEFAULT_DURATION`: Default ride duration in hours
- `DEMO_MODE`: Demo mode enabled flag
- `WELCOME_SEEN`: First-time user flag
- `INSTALL_PROMPT_DISMISSED`: Timestamp of dismissed install prompt
- `DISABLE_INSTALL_PROMPT`: User preference to disable install prompt
- `FORCE_INSTALL_PROMPT`: DevTools flag for testing
- `WEATHER_CACHE`: Map of cached weather data
- `GEOCODE_CACHE`: Map of cached geocoding results

**Cache Structure:**
```typescript
// Weather cache: Map<string, { data: WeatherSummary, timestamp: number }>
// Key format: "lat,lon,startTime,duration"

// Geocode cache: Map<string, { city: string, timestamp: number }>
// Key format: "lat,lon" (2 decimal places)
```

### React State

- **App-level state**: Managed in `App.tsx` using `useState`
- **Component-level state**: Each component manages its own local state
- **No global state management library**: Uses React hooks exclusively

## PWA Features

### Service Worker

- Generated by `vite-plugin-pwa`
- Workbox-based service worker
- Precaches all app assets
- Offline fallback page

### Manifest

Located at `public/manifest.json`:
- App name: "Dress My Ride"
- Icons: 192x192 and 512x512
- Display mode: `standalone`
- Theme color: Primary color
- Start URL: `/DressMyRide/`

### Install Prompt

- Detects `beforeinstallprompt` event
- Shows banner prompt (dismissible, respects user preference)
- Header install button (always visible when not installed)
- Handles Safari fallback (manual install instructions)

### Offline Support

- Service worker caches all assets
- Offline fallback page (`offline.html`)
- Weather data requires online connection

## API Integration

### OpenWeatherMap One Call API 3.0

**Endpoint**: `https://api.openweathermap.org/data/3.0/onecall`

**Parameters:**
- `lat`: Latitude
- `lon`: Longitude
- `units`: `metric` or `imperial`
- `exclude`: `current,minutely,daily,alerts`
- `appid`: API key

**Response**: Hourly forecast data

**Error Handling:**
- 401: Invalid API key or subscription required
- Other errors: Generic error message with status code

### OpenWeatherMap Geocoding API

**Endpoint**: `https://api.openweathermap.org/geo/1.0/reverse`

**Parameters:**
- `lat`: Latitude
- `lon`: Longitude
- `limit`: 1
- `appid`: API key

**Response**: Array of location objects with `name` property

## Deployment

### Build Process

1. TypeScript compilation (`tsc`)
2. Vite build (`vite build`)
3. PWA asset generation (service worker, manifest)
4. Output to `dist/` directory

### GitHub Pages Deployment

**Base Path**: `/DressMyRide/`

Configured in `vite.config.ts`:
```typescript
base: '/DressMyRide/'
```

**Deploy Script** (`package.json`):
```json
"deploy": "npm run build && gh-pages -d dist"
```

**Deploy Process**:
1. Build the project
2. Deploy `dist/` to `gh-pages` branch
3. GitHub Pages serves from `gh-pages` branch

**Documentation Deployment**:
- Documentation is deployed to `/DressMyRide/docs/`
- Automatically included in deployment

### Environment Variables

- No build-time environment variables required
- API key stored in localStorage (user-provided)
- Base path configured in `vite.config.ts`

## Development Guide

### Prerequisites

- Node.js 18+ and npm
- OpenWeather API key (for full functionality)
- Git (for deployment)

### Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Start dev server: `npm run dev`
4. Open `http://localhost:5173/DressMyRide/`

### Development Workflow

1. **Feature Development**:
   - Create feature branch
   - Make changes
   - Test locally
   - Commit and push

2. **Testing**:
   - Use DevTools for weather override testing
   - Test on mobile devices (Chrome DevTools mobile emulation)
   - Test PWA installation flow

3. **Deployment**:
   - Merge to `main` branch
   - Run `npm run deploy`
   - Verify on GitHub Pages

### Code Style

- TypeScript strict mode enabled
- React functional components with hooks
- CSS with CSS Variables for theming
- Component files co-located with CSS files

### Key Development Files

- `src/App.tsx`: Main app logic and routing
- `src/logic/clothingEngine.ts`: Clothing recommendation rules
- `src/services/weatherService.ts`: API integration
- `src/utils/storage.ts`: LocalStorage management
- `vite.config.ts`: Build configuration

### Debugging

- **DevTools**: Available on localhost (not in production)
- **Console Logs**: Check browser console for errors
- **Network Tab**: Monitor API calls
- **Application Tab**: Inspect localStorage

### Common Issues

1. **API Key Issues**:
   - Ensure One Call API 3.0 subscription is active
   - Check API key is correctly stored in localStorage

2. **Cache Issues**:
   - Clear weather cache in Settings
   - Check localStorage in browser DevTools

3. **PWA Installation**:
   - Ensure HTTPS or localhost
   - Check manifest.json is valid
   - Verify service worker is registered

4. **Build Issues**:
   - Clear `dist/` and `node_modules/`
   - Reinstall dependencies: `npm install`
   - Check TypeScript errors: `npm run build`

### Performance Considerations

- Weather data cached for 30 minutes
- Geocoding cached for 24 hours
- Service worker precaches all assets
- Lazy loading not implemented (small bundle size)

### Future Enhancements

- Service worker updates and versioning
- Background sync for offline support
- Push notifications for weather alerts
- Advanced caching strategies
- Performance monitoring

