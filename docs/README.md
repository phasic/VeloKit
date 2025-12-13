# Dress My Ride - Technical Documentation

## Table of Contents

1. [Overview](#overview)
2. [How the App Works](#how-the-app-works)
3. [User Flows](#user-flows)
4. [Features](#features)
5. [Data Flow](#data-flow)
6. [Caching and Performance](#caching-and-performance)
7. [PWA Capabilities](#pwa-capabilities)
8. [Deployment](#deployment)

## Overview

Dress My Ride is a Progressive Web App that helps cyclists determine what clothing to wear based on current and forecasted weather conditions. The app analyzes temperature, wind speed, and rain probability to provide personalized clothing recommendations for cycling rides.

### Core Functionality

The app works by:
1. **Detecting Location**: Uses your device's GPS or allows manual city input
2. **Fetching Weather**: Retrieves weather forecast data for your location
3. **Analyzing Conditions**: Evaluates temperature, wind, and rain probability
4. **Generating Recommendations**: Applies rule-based logic to suggest appropriate cycling clothing
5. **Displaying Results**: Shows categorized clothing items with explanations

## How the App Works

### Quick View (Default Experience)

When you open the app for the first time (after setup), you'll see the **Quick View** page. This is the fastest way to get a recommendation:

1. **Automatic Location Detection**: The app requests permission to use your current location
2. **Default Settings**: Uses current time, 2-hour ride duration, and your preferred units
3. **Weather Fetch**: Automatically fetches weather data for your location
4. **Instant Recommendation**: Displays what to wear immediately

**Pull-to-Refresh**: On mobile devices, you can pull down on the Quick View page to refresh the weather data and get updated recommendations.

### Custom Ride Configuration

For more control, you can configure a custom ride:

1. **Select Location**: Choose between:
   - Current location (GPS)
   - Manual city entry (search by city name)
2. **Set Date & Time**: Pick when your ride will start
3. **Set Duration**: Specify how long your ride will be (default: 2 hours)
4. **Choose Units**: Select metric (°C, km/h) or imperial (°F, mph)
5. **Get Recommendation**: The app fetches weather data for your specific ride window and provides recommendations

### Weather Analysis

The app analyzes three key weather factors:

#### Temperature
- Uses "feels like" temperature (accounts for wind chill)
- Analyzes the minimum temperature during your ride window
- Determines base clothing layers needed

#### Wind Speed
- Checks maximum wind speed during your ride
- Recommends wind-blocking items when wind exceeds 25 km/h (15 mph)
- Wind blockers are added on top of temperature-based recommendations

#### Rain Probability
- Monitors maximum rain probability during your ride
- Recommends rain protection (rain jacket) if any rain is expected
- Rain protection is added on top of other recommendations

### Clothing Recommendations

Recommendations are organized into six categories:

1. **Head**: Headbands, skullcaps, balaclavas
2. **Neck/Face**: Balaclavas, neck warmers
3. **Chest**: Jerseys, undershirts, jackets, layers
4. **Legs**: Shorts, tights, leg warmers
5. **Hands**: Gloves (thin, medium, heavy, mittens)
6. **Feet**: Socks, shoe covers, toe warmers

Each recommendation includes:
- **What to Wear**: List of clothing items by category
- **Weather Summary**: Temperature range, wind speed, rain probability
- **Why?**: Explanation of why each item is recommended
- **Ride Details**: Date, time, duration, and location

### Wardrobe Guide

The **Wardrobe** page provides a comprehensive reference:

1. **All Clothing Items**: Complete list of all available clothing items, organized by category
2. **Temperature Scenarios**: Shows what to wear at different temperature ranges
3. **Wind Scenarios**: Shows additional items needed for different wind speeds
4. **Rain Scenarios**: Shows rain protection recommendations

This helps you understand the full range of recommendations and plan for different conditions.

## User Flows

### First-Time User Flow

1. **Welcome Screen**: New users see a welcome screen explaining the app
2. **Choose Path**:
   - **Add API Key**: For full functionality with real weather data
   - **Try Demo Mode**: Explore the app with randomized weather data
3. **Settings**: If adding API key, you're taken to Settings to enter it
4. **Quick View**: After setup, you see the Quick View with recommendations

### Regular Use Flow

1. **Open App**: App loads Quick View automatically
2. **View Recommendation**: See what to wear based on current conditions
3. **Refresh** (optional): Pull down to refresh or click refresh button
4. **Custom Ride** (optional): Tap "Custom" to configure a specific ride
5. **View Details**: See weather summary and explanations

### Custom Ride Flow

1. **Navigate to Custom**: Tap "Custom" in bottom navigation
2. **Select Location**: Choose GPS or enter city name
3. **Set Parameters**: Configure date, time, duration, units
4. **Get Recommendation**: Tap "Get Recommendation"
5. **View Results**: See detailed recommendation with ride details

### Settings Flow

1. **Open Settings**: Tap settings icon in header
2. **Configure Preferences**:
   - API key management
   - Theme (light/dark/system)
   - Date format
   - Default ride duration
   - Demo mode toggle
3. **Manage Cache**: Clear weather cache if needed
4. **View About**: See app information and attributions

## Features

### Location Services

- **GPS Location**: Automatic detection using browser geolocation API
- **Manual Entry**: Search by city name if GPS is unavailable or denied
- **City Display**: Shows nearest city name with coordinates
- **Location Caching**: Remembers your location for quick access

### Weather Data

- **Real-Time Forecast**: Uses OpenWeather One Call API 3.0
- **Hourly Data**: Analyzes hourly forecasts for your ride window
- **Multiple Metrics**: Temperature, wind speed, rain probability
- **Units Support**: Metric and imperial units
- **Caching**: Weather data cached for 30 minutes to reduce API calls

### Recommendations

- **Rule-Based Logic**: Applies temperature thresholds to determine base clothing
- **Layered Approach**: Adds wind and rain protection on top of base recommendations
- **Categorized Display**: Organizes items by body part for easy reference
- **Explanations**: Provides reasoning for each recommendation
- **Visual Indicators**: Shows emojis indicating why each item is needed (temperature, wind, rain)

### Personalization

- **Theme Preferences**: Light, dark, or system theme
- **Date Format**: Custom or system date format
- **Default Duration**: Set your preferred ride duration
- **Units Preference**: Choose metric or imperial
- **Demo Mode**: Test the app without an API key

### Offline Support

- **Service Worker**: Caches app assets for offline access
- **Offline Page**: Shows fallback page when offline
- **Weather Cache**: Uses cached weather data when available
- **PWA Installation**: Can be installed as a native app

## Data Flow

### Weather Data Flow

1. **User Action**: User requests recommendation (Quick View or Custom)
2. **Location Check**: App determines location (GPS or manual)
3. **Cache Check**: App checks if weather data exists in cache
4. **Cache Hit**: If valid cache exists (< 30 minutes old), use cached data
5. **Cache Miss**: If no cache or expired, fetch from API
6. **API Call**: Request weather forecast for location and time window
7. **Process Data**: Extract relevant weather metrics
8. **Update Cache**: Store data in cache for future use
9. **Generate Recommendation**: Pass weather data to recommendation engine

### Recommendation Flow

1. **Weather Data Input**: Receives weather summary (temperature, wind, rain)
2. **Temperature Analysis**: Determines base clothing based on temperature thresholds
3. **Wind Analysis**: Adds wind protection if wind speed exceeds threshold
4. **Rain Analysis**: Adds rain protection if rain probability > 0
5. **Categorization**: Organizes items into head, neck/face, chest, legs, hands, feet
6. **Explanation Generation**: Creates explanations for each recommendation
7. **Display**: Shows categorized recommendations to user

### Location Resolution Flow

1. **GPS Coordinates**: App receives precise coordinates from browser
2. **Reverse Geocoding**: Converts coordinates to city name
3. **Cache Check**: Checks if city name exists in geocoding cache
4. **Cache Hit**: Uses cached city name
5. **Cache Miss**: Calls geocoding API to get city name
6. **Display**: Shows city name with coordinates

## Caching and Performance

### Weather Cache

- **Duration**: 30 minutes
- **Key**: Location (rounded to ~11km), start time (rounded to hour), duration
- **Purpose**: Reduces API calls for same location/time combinations
- **Storage**: Multiple entries stored in localStorage
- **Invalidation**: Time-based expiration or manual clear

### Geocoding Cache

- **Duration**: 24 hours
- **Key**: Coordinates (rounded to ~1.1km)
- **Purpose**: Reduces API calls for same locations
- **Storage**: Multiple entries stored in localStorage
- **Invalidation**: Time-based expiration

### Performance Optimizations

- **Coordinate Rounding**: Rounds coordinates for consistent caching
- **Time Rounding**: Rounds start times to nearest hour for cache keys
- **Multiple Cache Entries**: Stores multiple weather/geocoding entries
- **Service Worker**: Caches app assets for faster loading
- **Lazy Loading**: Not implemented (small bundle size)

## PWA Capabilities

### Installation

- **Install Prompt**: Browser shows install prompt when app meets criteria
- **Header Button**: Install button appears in header when app is not installed
- **Installation**: User can install app to home screen
- **Standalone Mode**: App runs in standalone mode when installed

### Offline Functionality

- **Asset Caching**: All app assets cached by service worker
- **Offline Page**: Shows fallback page when offline
- **Weather Cache**: Uses cached weather data when available
- **Limited Functionality**: Full functionality requires internet connection

### App-Like Experience

- **Standalone Display**: Runs without browser UI when installed
- **Home Screen Icon**: Custom icon on device home screen
- **Splash Screen**: Shows app icon during loading
- **Full Screen**: Uses full screen on mobile devices

## Deployment

### Build Process

1. **TypeScript Compilation**: Compiles TypeScript to JavaScript
2. **Vite Build**: Bundles and optimizes code
3. **PWA Generation**: Creates service worker and manifest
4. **Documentation**: Copies documentation to dist folder
5. **Output**: Creates `dist/` directory with all files

### GitHub Pages Deployment

- **Base Path**: `/DressMyRide/`
- **Branch**: `gh-pages`
- **Process**: Build → Deploy to `gh-pages` branch
- **Documentation**: Available at `/DressMyRide/docs/`

### Deployment Steps

1. Run `npm run deploy`
2. Script builds the app
3. Copies documentation
4. Deploys to GitHub Pages
5. App is live at GitHub Pages URL
