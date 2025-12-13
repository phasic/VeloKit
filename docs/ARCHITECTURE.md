# Architecture Documentation

## System Overview

Dress My Ride is a client-side Progressive Web App that provides cycling clothing recommendations based on weather conditions. The app runs entirely in the browser, with no backend server required.

## High-Level Architecture

```
User Device
    │
    ├── Browser (React App)
    │   ├── UI Components
    │   ├── State Management
    │   └── Business Logic
    │
    ├── Browser APIs
    │   ├── Geolocation API
    │   ├── localStorage API
    │   └── Service Worker API
    │
    └── External Services
        └── OpenWeather API
```

## Application Structure

### Pages and Views

The app consists of several main views that users navigate between:

- **Welcome**: First-time user onboarding
- **Quick View**: Default home page with automatic recommendations
- **Custom Setup**: Configuration page for custom rides
- **Recommendation**: Detailed recommendation display
- **Settings**: User preferences and configuration
- **Wardrobe**: Complete clothing guide reference
- **About**: App information and attributions

### Navigation Flow

```
Welcome
  ├── Settings (Add API Key)
  └── Quick View (Try Demo)
      │
      ├── Custom Setup
      │   └── Recommendation
      │
      ├── Wardrobe
      │
      └── Settings
          └── About
```

## Data Sources

### Weather Data

- **Source**: OpenWeather One Call API 3.0
- **Data Type**: Hourly weather forecasts
- **Metrics**: Temperature, wind speed, rain probability
- **Update Frequency**: Real-time API calls, cached for 30 minutes

### Location Data

- **Source**: Browser Geolocation API or manual input
- **Format**: Latitude/longitude coordinates
- **Enhancement**: Reverse geocoding to get city names
- **Storage**: Cached in localStorage

### User Preferences

- **Storage**: localStorage
- **Types**: Theme, date format, default duration, units, API key
- **Persistence**: Survives browser sessions

## Processing Pipeline

### Recommendation Generation Pipeline

```
User Input
    │
    ├── Location (GPS or Manual)
    │   └── Coordinates
    │
    ├── Ride Configuration
    │   ├── Start Time
    │   ├── Duration
    │   └── Units
    │
    └── Weather Data
        ├── Fetch from API (or Cache)
        ├── Filter for Ride Window
        └── Extract Metrics
            │
            └── Recommendation Engine
                ├── Temperature Analysis
                ├── Wind Analysis
                └── Rain Analysis
                    │
                    └── Categorized Recommendations
```

### Weather Data Processing

1. **Location Input**: Receives coordinates from GPS or manual entry
2. **Cache Check**: Looks for existing weather data in cache
3. **API Request**: If no cache, requests forecast from OpenWeather API
4. **Time Window Filter**: Filters hourly data for ride start time + duration
5. **Metric Extraction**: Extracts min/max temperatures, max wind, max rain probability
6. **Cache Storage**: Stores processed data in cache
7. **Return Summary**: Returns weather summary object

### Recommendation Processing

1. **Weather Input**: Receives weather summary
2. **Temperature Evaluation**: Determines base clothing based on temperature thresholds
3. **Wind Evaluation**: Adds wind protection if needed
4. **Rain Evaluation**: Adds rain protection if needed
5. **Categorization**: Organizes items into body part categories
6. **Explanation Generation**: Creates explanations for recommendations
7. **Return Recommendation**: Returns structured recommendation object

## State Management

### Application State

The app manages state at the top level in the main App component:

- **Current Page**: Which view is currently displayed
- **Location**: User's current or selected location
- **Ride Config**: Date, time, duration, units for the ride
- **Weather Data**: Fetched weather summary
- **Recommendation**: Generated clothing recommendation
- **Loading State**: Whether data is being fetched
- **Error State**: Any error messages to display

### Persistent State

User preferences and cached data stored in localStorage:

- **API Key**: User's OpenWeather API key
- **Theme**: Light, dark, or system preference
- **Date Format**: Custom or system format preference
- **Default Duration**: Preferred ride duration
- **Units**: Metric or imperial preference
- **Demo Mode**: Whether demo mode is enabled
- **Welcome Seen**: Whether user has seen welcome screen
- **Install Prompt**: Install prompt dismissal and preferences
- **Weather Cache**: Cached weather data (multiple entries)
- **Geocoding Cache**: Cached city names (multiple entries)

## Caching Strategy

### Weather Data Caching

- **Purpose**: Reduce API calls for same location/time combinations
- **Key Structure**: `"lat,lon,startTime,duration"`
- **Precision**: Coordinates rounded to 1 decimal (~11km), time rounded to hour
- **Duration**: 30 minutes
- **Storage**: Map structure allowing multiple cache entries
- **Invalidation**: Time-based expiration or manual clear

### Geocoding Caching

- **Purpose**: Reduce API calls for same locations
- **Key Structure**: `"lat,lon"` (2 decimal places, ~1.1km)
- **Duration**: 24 hours
- **Storage**: Map structure allowing multiple cache entries
- **Invalidation**: Time-based expiration

### Cache Benefits

- **Reduced API Calls**: Saves API quota and improves performance
- **Faster Responses**: Instant display of cached data
- **Offline Support**: Can show cached data when offline
- **Cost Savings**: Fewer API calls mean lower costs

## User Interaction Patterns

### Quick View Pattern

1. User opens app
2. App automatically detects location
3. App fetches weather (or uses cache)
4. App generates recommendation
5. User sees recommendation immediately
6. User can refresh to get updated data

### Custom Ride Pattern

1. User navigates to Custom page
2. User selects location (GPS or manual)
3. User configures ride parameters
4. User requests recommendation
5. App fetches weather for specific time window
6. App generates recommendation
7. User sees detailed recommendation

### Settings Pattern

1. User navigates to Settings
2. User changes preferences
3. Preferences saved to localStorage
4. App updates immediately (theme, etc.)
5. Some changes require page refresh

## Error Handling

### Location Errors

- **Permission Denied**: Shows manual input option
- **Unavailable**: Shows manual input option
- **Timeout**: Shows manual input option

### API Errors

- **401 Unauthorized**: Shows error message about API key
- **Network Error**: Shows error banner with retry option
- **No Data**: Shows appropriate message

### Cache Errors

- **Parse Error**: Falls back to API call
- **Missing Data**: Falls back to API call

## Performance Considerations

### Loading Performance

- **Service Worker**: Caches app assets for instant loading
- **Code Splitting**: Not implemented (small bundle size)
- **Lazy Loading**: Not implemented (small bundle size)

### Runtime Performance

- **Caching**: Reduces API calls and improves response time
- **Coordinate Rounding**: Ensures consistent cache hits
- **Efficient Updates**: Only updates changed state

### Network Performance

- **Cache-First Strategy**: Uses cache when available
- **API Optimization**: Only fetches needed data
- **Request Batching**: Not applicable (single API endpoint)

## Security Considerations

### Client-Side Security

- **API Key Storage**: Stored in localStorage (client-side only)
- **No Server**: All processing happens client-side
- **HTTPS Required**: For PWA features and geolocation
- **Input Validation**: TypeScript provides type safety

### Data Privacy

- **Location Data**: Only sent to weather API, not stored elsewhere
- **No Tracking**: No analytics or tracking implemented
- **User Control**: Users can clear all data via Settings

## Browser Compatibility

### Required Features

- **Geolocation API**: For location detection
- **localStorage API**: For data persistence
- **Service Worker API**: For PWA features
- **Fetch API**: For API calls

### Browser Support

- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support (iOS 11.3+ for PWA)
- **Edge**: Full support

## Scalability Considerations

### Current Limitations

- **Single User**: No multi-user support
- **Client-Side Only**: No backend infrastructure
- **API Dependent**: Requires external weather API

### Future Scalability

- **Backend Option**: Could add backend for API key management
- **User Accounts**: Could add user authentication
- **Data Analytics**: Could add usage analytics
- **Caching Layer**: Could add server-side caching
