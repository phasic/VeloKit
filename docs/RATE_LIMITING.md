# Rate Limiting

The VeloKit backend implements rate limiting to protect against API abuse and prevent a single user from exhausting the OpenWeather API quota.

## Rate Limits

### All API Endpoints
- **Limit**: 100 requests per day per IP address
- **Applies to**: All `/api/*` endpoints
- **Includes**: Weather forecast, geocoding, reverse geocoding, and all API calls
- **Window**: 24-hour rolling window

## How It Works

Rate limiting is implemented using `express-rate-limit` middleware:

1. **IP-based tracking**: Each client IP address is tracked separately
2. **Sliding window**: Uses a 24-hour rolling window
3. **Automatic reset**: Limits reset automatically after the time window expires
4. **Standard headers**: Returns `RateLimit-*` headers with limit information

## Rate Limit Response

When a rate limit is exceeded, the API returns:

```json
{
  "error": "Too many requests",
  "message": "Daily request limit exceeded. You have used all 100 requests for today. Please try again tomorrow.",
  "retryAfter": "24 hours"
}
```

HTTP Status: `429 Too Many Requests`

## Rate Limit Headers

The API includes rate limit information in response headers:

- `RateLimit-Limit`: Maximum number of requests allowed
- `RateLimit-Remaining`: Number of requests remaining in current window
- `RateLimit-Reset`: Unix timestamp when the rate limit resets

## Configuration

Rate limits can be adjusted in `server/index.js`:

```javascript
// General API limiter
const generalLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours (1 day)
  max: 100, // requests per day
});

// Weather forecast limiter (same limit)
const weatherForecastLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours (1 day)
  max: 100, // requests per day
});
```

## Why These Limits?

- **100 requests/day**: Provides reasonable daily usage while preventing abuse
- **24-hour window**: Prevents a single user from exhausting API quota
- **IP-based**: Tracks by IP address to identify individual users

## Testing Rate Limits

To test rate limiting:

```bash
# Make 101 requests quickly
for i in {1..101}; do
  curl https://your-backend-url.railway.app/api/weather/geocode?city=London
done

# The 101st request should return 429 Too Many Requests
```

## Bypassing Rate Limits (Development)

In development, you can temporarily disable rate limiting by commenting out the middleware:

```javascript
// app.use('/api', generalLimiter);
```

**Note**: Never disable rate limiting in production!

## Best Practices

1. **Client-side caching**: Cache API responses to reduce requests
2. **Batch requests**: Combine multiple operations when possible
3. **Error handling**: Handle 429 errors gracefully and retry after the window expires
4. **User feedback**: Inform users when rate limits are hit

## Monitoring

Monitor rate limit hits in your server logs. High numbers of 429 responses may indicate:
- Legitimate heavy usage (consider increasing limits)
- Potential abuse (consider stricter limits or IP blocking)
- Need for caching improvements

