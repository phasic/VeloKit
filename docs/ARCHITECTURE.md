# Architecture Documentation

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────┐
│                     User Interface                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │  Pages   │  │Components│  │  Styles   │            │
│  └──────────┘  └──────────┘  └──────────┘            │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  Application Layer                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │   App    │  │  State    │  │  Routing  │            │
│  └──────────┘  └──────────┘  └──────────┘            │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   Business Logic Layer                    │
│  ┌──────────┐  ┌──────────┐                            │
│  │ Clothing │  │  Utils   │                            │
│  │  Engine  │  │          │                            │
│  └──────────┘  └──────────┘                            │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    Data Layer                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │ Weather  │  │ Storage  │  │   Cache  │            │
│  │ Service  │  │          │  │           │            │
│  └──────────┘  └──────────┘  └──────────┘            │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  External Services                       │
│  ┌──────────┐  ┌──────────┐                            │
│  │OpenWeather│  │ Browser  │                            │
│  │   API    │  │   APIs   │                            │
│  └──────────┘  └──────────┘                            │
└─────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
App
├── Header (conditional)
│   ├── DevTools
│   ├── InstallButton (conditional)
│   └── SettingsButton
├── Main
│   ├── Welcome (conditional)
│   ├── Home (conditional)
│   ├── RideSetup (conditional)
│   ├── Recommendation (conditional)
│   ├── Settings (conditional)
│   ├── About (conditional)
│   └── ClothingGuide (conditional)
├── BottomTabBar (conditional)
└── InstallPrompt (conditional)
```

## Data Flow

### Weather Data Flow

```
User Action
    │
    ▼
Location Detection / Manual Input
    │
    ▼
Check Cache
    │
    ├── Cache Hit ──────► Return Cached Data
    │
    └── Cache Miss ─────► API Call
                            │
                            ▼
                        Process Response
                            │
                            ▼
                        Update Cache
                            │
                            ▼
                        Return Data
```

### Recommendation Flow

```
Weather Data
    │
    ▼
Clothing Engine
    │
    ├── Temperature Analysis
    ├── Wind Analysis
    └── Rain Analysis
    │
    ▼
Categorized Recommendations
    │
    ▼
Display to User
```

## State Management Flow

### App State

```
App Component State
├── page: 'welcome' | 'home' | 'setup' | 'recommendation' | 'settings' | 'about' | 'guide'
├── location: Location | null
├── config: RideConfig | null
├── weather: WeatherSummary | null
├── recommendation: ClothingRecommendation | null
├── loading: boolean
├── error: string | null
├── weatherOverride: Partial<WeatherSummary> | null
├── isInstalled: boolean
└── hasInstallPrompt: boolean
```

### Local Storage State

```
localStorage
├── API_KEY
├── THEME
├── DATE_FORMAT
├── DEFAULT_DURATION
├── DEMO_MODE
├── WELCOME_SEEN
├── INSTALL_PROMPT_DISMISSED
├── DISABLE_INSTALL_PROMPT
├── FORCE_INSTALL_PROMPT
├── WEATHER_CACHE (map)
└── GEOCODE_CACHE (map)
```

## Event Flow

### User Interactions

1. **Page Navigation**: `setPage()` → Re-render appropriate page component
2. **Location Request**: Geolocation API → `setLocation()` → Fetch weather
3. **Weather Fetch**: Check cache → API call if needed → `setWeather()` → Generate recommendation
4. **Recommendation**: Weather data → Clothing engine → `setRecommendation()`
5. **Settings Change**: Update localStorage → Re-initialize affected components

### PWA Events

1. **beforeinstallprompt**: Store prompt → Show install button → User clicks → Trigger install
2. **App Installed**: Detect standalone mode → Hide install prompts
3. **Service Worker**: Register → Cache assets → Handle offline

## Caching Strategy

### Weather Cache

- **Key Format**: `"lat,lon,startTime,duration"`
- **Precision**: Coordinates rounded to 1 decimal place (~11km)
- **Duration**: 30 minutes
- **Structure**: Map of entries

### Geocoding Cache

- **Key Format**: `"lat,lon"` (2 decimal places, ~1.1km)
- **Duration**: 24 hours
- **Structure**: Map of entries

### Cache Invalidation

- Time-based expiration
- Manual clear via Settings
- New location/time/duration creates new cache entry

## Security Considerations

1. **API Key Storage**: Stored in localStorage (client-side only)
2. **No Server**: All processing client-side
3. **HTTPS Required**: For PWA features and geolocation
4. **Input Validation**: TypeScript types provide compile-time safety
5. **XSS Protection**: React's built-in escaping

## Performance Optimizations

1. **Caching**: Reduces API calls
2. **Coordinate Rounding**: Consistent cache keys
3. **Service Worker**: Offline support and faster loads
4. **CSS Variables**: Efficient theming
5. **Component Lazy Loading**: Not implemented (small bundle)

## Browser Compatibility

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **PWA Support**: Chrome, Edge (full), Safari (iOS 11.3+)
- **Geolocation**: All modern browsers
- **localStorage**: All modern browsers

## Error Handling

### API Errors

- **401**: Invalid API key → Show error message
- **Network Errors**: Show error banner
- **No Data**: Show appropriate message

### User Errors

- **Location Denied**: Show manual input option
- **Invalid Input**: Form validation
- **Cache Errors**: Fallback to API call

## Testing Strategy

### Manual Testing

- DevTools for weather override
- Browser DevTools for mobile emulation
- PWA installation flow
- Offline mode

### Automated Testing

- Not currently implemented
- Future: Unit tests for clothing engine
- Future: Integration tests for API calls

