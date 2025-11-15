# Vercel Redis Setup Guide

This guide explains how to configure Redis for your Next.js application deployed on Vercel.

## Option 1: Vercel KV (Recommended for Vercel deployments)

Vercel KV is powered by Upstash Redis and provides a managed Redis solution optimized for Vercel deployments.

### Setup Steps:

1. **Add Vercel KV to Your Project**
   - Go to your project in [Vercel Dashboard](https://vercel.com/dashboard)
   - Navigate to the "Storage" tab
   - Click "Create Database" → Select "KV (Upstash Redis)"
   - Choose a name for your database (e.g., `rockreach-redis`)
   - Select a region close to your primary MongoDB region for lower latency
   - Click "Create"

2. **Connect to Your Project**
   - After creation, click "Connect to Project"
   - Select your project from the dropdown
   - Vercel will automatically add the required environment variables:
     - `KV_URL`
     - `KV_REST_API_URL`
     - `KV_REST_API_TOKEN`
     - `KV_REST_API_READ_ONLY_TOKEN`

3. **Update Your Environment Variables**
   
   In your Vercel project settings → Environment Variables, add:
   
   ```
   REDIS_URL=<your-kv-url>
   ```
   
   **Important:** Copy the value from `KV_URL` that Vercel auto-generated.

4. **Update Your Code (Already Done)**
   
   The existing `lib/redis.ts` file is already configured to work with `REDIS_URL` environment variable:
   
   ```typescript
   const redisUrl = process.env.REDIS_URL;
   ```

5. **Deploy**
   
   Simply push your changes or trigger a redeploy:
   
   ```bash
   git push origin main
   ```
   
   Vercel will automatically redeploy with Redis enabled.

### Free Tier Limits (Hobby Plan):

- **Storage:** 256 MB
- **Daily Requests:** 10,000 commands/day
- **Max Connections:** 500 concurrent
- **Data Retention:** Unlimited (as long as data fits in 256 MB)

These limits are typically sufficient for:
- Small to medium applications
- Development/staging environments
- Projects with moderate caching needs

### Monitoring Usage:

1. Go to Vercel Dashboard → Storage → Your KV Database
2. View real-time metrics:
   - Storage used
   - Daily commands
   - Request rate

## Option 2: External Upstash Redis

If you need more control or higher limits, use standalone Upstash Redis.

### Setup Steps:

1. **Create Upstash Account**
   - Go to [console.upstash.com](https://console.upstash.com)
   - Sign up (free tier available)

2. **Create Redis Database**
   - Click "Create Database"
   - Choose a name
   - Select region (match your app region)
   - Choose "Global" for worldwide low latency (optional, paid)
   - Click "Create"

3. **Get Connection URL**
   - Copy the Redis connection URL (starts with `redis://`)
   - Or use the REST API URL for better serverless compatibility

4. **Add to Vercel Environment Variables**
   
   In Vercel Dashboard → Your Project → Settings → Environment Variables:
   
   ```
   REDIS_URL=redis://default:<password>@<host>:<port>
   ```

5. **Deploy**
   
   ```bash
   git push origin main
   ```

### Upstash Free Tier:

- **Storage:** 10 MB
- **Max Requests:** 10,000 commands/day
- **Max Concurrent Connections:** 1,000
- **Max Command Size:** 1 MB
- **Max Database Size:** 10 MB

## Option 3: Redis Cloud (Enterprise)

For production applications with higher requirements.

### Setup Steps:

1. **Create Redis Cloud Account**
   - Go to [redis.com/cloud](https://redis.com/try-free/)
   - Sign up for free trial

2. **Create Database**
   - Choose cloud provider (AWS, GCP, Azure)
   - Select region
   - Configure memory and throughput
   - Note connection details

3. **Add to Vercel**
   
   ```
   REDIS_URL=redis://<username>:<password>@<host>:<port>
   ```

4. **Deploy**

### Redis Cloud Free Tier:

- **Memory:** 30 MB
- **Bandwidth:** 30 MB/day
- **Connections:** 30 concurrent
- **High availability:** No (paid feature)

## Verifying Redis Connection

### Local Testing:

1. Add `.env.local`:
   ```
   REDIS_URL=redis://localhost:6379
   ```

2. Start local Redis:
   ```bash
   # Windows (if Redis installed)
   redis-server
   
   # Or use Docker
   docker run -p 6379:6379 redis:7-alpine
   ```

3. Run your app:
   ```bash
   bun dev
   ```

4. Check console for:
   ```
   ✅ Redis connected successfully
   ```

### Production Testing:

After deploying to Vercel:

1. Check deployment logs in Vercel Dashboard
2. Look for Redis connection messages
3. If Redis fails, app will continue with graceful degradation (no errors)

## How Redis is Used in Your App

### 1. **Rate Limiting** (20 requests/minute per user)
   ```typescript
   // lib/rate-limit.ts
   const allowed = await checkRateLimit(userId, 20, 60000);
   ```

### 2. **Conversation Caching** (1-5 minute TTL)
   ```typescript
   // API: /api/assistant/conversations
   await cacheSet(cacheKey, conversations, 300); // 5 minutes
   ```

### 3. **API Usage Caching** (1 minute TTL)
   ```typescript
   // API: /api/admin/analytics
   await cacheSet(cacheKey, analytics, 60); // 1 minute
   ```

### 4. **Cache Invalidation**
   ```typescript
   // On conversation update/delete
   await invalidatePattern(`conversations:${userId}:*`);
   ```

## Graceful Degradation

The app is designed to work **without Redis**:

- If `REDIS_URL` is not set, Redis features are disabled
- Rate limiting falls back to in-memory (resets on restart)
- API responses are served without caching
- No errors or crashes occur

This is intentional for:
- **Development:** Work without Redis setup
- **Deployment flexibility:** Deploy without Redis initially
- **Reliability:** App continues if Redis fails

## Environment Variables Summary

### Required for Production:
```bash
REDIS_URL=redis://default:<password>@<host>:<port>
```

### Optional (Vercel KV auto-generates these):
```bash
KV_URL=redis://...
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...
KV_REST_API_READ_ONLY_TOKEN=...
```

### Local Development:
```bash
REDIS_URL=redis://localhost:6379
```

## Troubleshooting

### Issue: "Redis connection failed"
**Solution:** Check `REDIS_URL` format and credentials

### Issue: Rate limiting not working
**Solution:** Verify Redis is connected. Check logs for Redis errors.

### Issue: High Redis command count
**Solution:** 
- Reduce cache TTL values
- Use cache invalidation sparingly
- Consider pagination for large datasets

### Issue: Vercel KV hitting limits
**Solutions:**
- Upgrade to Pro plan ($20/month) → 1 GB storage, 1M commands/day
- Use external Upstash with higher limits
- Optimize caching strategy (longer TTL, fewer cache sets)

## Performance Optimization

### 1. **Cache Stratification**
Use different TTLs for different data types:
```typescript
// Hot data (1 minute)
await cacheSet(key, data, 60);

// Warm data (5 minutes)
await cacheSet(key, data, 300);

// Cold data (30 minutes)
await cacheSet(key, data, 1800);
```

### 2. **Batch Operations**
Use pipelines for multiple operations:
```typescript
const pipeline = redis.pipeline();
pipeline.set(key1, value1);
pipeline.set(key2, value2);
await pipeline.exec();
```

### 3. **Compression**
For large datasets, compress before caching:
```typescript
import zlib from "zlib";
const compressed = zlib.gzipSync(JSON.stringify(data));
await cacheSet(key, compressed, ttl);
```

## Security Best Practices

1. **Never commit credentials** - Use environment variables only
2. **Use TLS** - Ensure Redis URL uses `rediss://` (with SSL) for production
3. **Rotate passwords** - Change Redis credentials periodically
4. **Restrict access** - Use Vercel's built-in security or IP allowlisting
5. **Monitor logs** - Watch for unusual Redis activity

## Cost Estimation

### Vercel KV (Hobby - Free):
- $0/month for 256 MB, 10K commands/day

### Vercel KV (Pro):
- $20/month for 1 GB, 1M commands/day

### Upstash (Standalone):
- Free: $0/month (10 MB, 10K commands/day)
- Pay-as-you-go: $0.20 per 100K commands
- Pro: Starting at $10/month

### Redis Cloud:
- Free: 30 MB
- Paid: Starting at $5/month for 100 MB

## Recommended Setup for Your App

**Development:**
```bash
# .env.local
REDIS_URL=redis://localhost:6379
```

**Staging/Production (Vercel):**
1. Use Vercel KV (easiest setup)
2. Start with Hobby plan (free)
3. Monitor usage in first month
4. Upgrade to Pro if needed ($20/month)

**Expected Usage:**
- 100-1000 users: Hobby plan sufficient
- 1000-10000 users: Pro plan recommended
- 10000+ users: Consider Redis Cloud or external Upstash

## Next Steps

1. ✅ Add Vercel KV to your project
2. ✅ Verify `REDIS_URL` environment variable is set
3. ✅ Deploy to Vercel
4. ✅ Test rate limiting (try 21+ requests in 1 minute)
5. ✅ Monitor Redis usage in Vercel Dashboard
6. ✅ Optimize TTL values based on your traffic patterns

## Support

If you encounter issues:
- Check [Vercel KV Docs](https://vercel.com/docs/storage/vercel-kv)
- Check [Upstash Docs](https://docs.upstash.com/redis)
- Review `lib/redis.ts` for implementation details
- Verify environment variables are correctly set in Vercel

## Summary

Your Next.js app is **Redis-ready** with graceful degradation:
- ✅ Rate limiting (20 req/min per user)
- ✅ Conversation caching (5 min TTL)
- ✅ Analytics caching (1 min TTL)
- ✅ Works without Redis (optional feature)

**Simplest path:** Use Vercel KV → Enable in 2 clicks → Automatic setup ✨
