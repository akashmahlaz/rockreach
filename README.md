# RocketReach Lead Generation System

A professional lead generation and management system built with Next.js, integrating the RocketReach API for finding and enriching prospect data.

## Features

- 🔐 **Secure Authentication**: Google OAuth via Auth.js with MongoDB adapter
- 🔑 **Admin-Controlled API Keys**: RocketReach API keys managed in admin panel, encrypted at rest
- 🔍 **Lead Search**: Search for prospects by name, title, company, domain, and location
- 📊 **Lead Management**: Save leads to lists, tag, and export
- 🎯 **Professional UI**: Built with shadcn/ui components in neutral color scheme
- 📈 **Usage Tracking**: Monitor API usage and audit logs
- 🔄 **Retry Logic**: Automatic retry with exponential backoff for rate limits

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI**: shadcn/ui, Tailwind CSS 4, Radix UI
- **Backend**: Next.js API Routes, Server Actions
- **Database**: MongoDB with Mongoose
- **Auth**: Auth.js (NextAuth v5) with Google Provider
- **Security**: AES-256-GCM encryption for API keys

## Setup Instructions

### 1. Clone and Install

```bash
cd c:\Users\akash\upwork\rockreach
npm install
```

### 2. Environment Variables

Copy `.env.local.example` to `.env.local`:

```powershell
Copy-Item .env.local.example .env.local
```

Then update `.env.local` with your credentials:

```env
# MongoDB
MONGODB_URI=your-mongodb-connection-string

# Auth.js
AUTH_SECRET=generate-with: openssl rand -base64 32
AUTH_GOOGLE_ID=your-google-oauth-client-id
AUTH_GOOGLE_SECRET=your-google-oauth-client-secret

# Encryption key for storing RocketReach API key
APP_MASTER_KEY=generate-with: openssl rand -hex 32

# Next.js
NEXTAUTH_URL=http://localhost:3000
```

### 3. Setup Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Client Secret to `.env.local`

### 4. Run Development Server

```powershell
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── admin/
│   │   │   └── rocketreach-settings/  # Admin settings API
│   │   ├── auth/                      # Auth.js routes
│   │   └── leads/
│   │       ├── search/                # Lead search API
│   │       └── save/                  # Save leads API
│   ├── admin/
│   │   └── settings/                  # Admin settings UI
│   ├── leads/
│   │   └── search/                    # Lead search UI
│   └── page.tsx                       # Dashboard
├── components/
│   ├── auth/                          # Sign in/out components
│   └── ui/                            # shadcn/ui components
├── lib/
│   ├── crypto.ts                      # Encryption utilities
│   ├── db.ts                          # MongoDB connection
│   ├── rocketreach.ts                 # RocketReach client
│   └── utils.ts                       # Helper functions
├── models/                            # Mongoose models
│   ├── ApiUsage.ts
│   ├── AuditLog.ts
│   ├── Lead.ts
│   ├── LeadList.ts
│   ├── LeadSearch.ts
│   ├── Organization.ts
│   └── RocketReachSettings.ts
└── auth.ts                            # Auth.js configuration
```

## Usage Flow

### Admin Setup (First Time)

1. Sign in with Google
2. Go to **Admin > Settings**
3. Enter your RocketReach API key
4. Configure rate limits, concurrency, and retry policy
5. Save settings (API key is encrypted and stored in MongoDB)

### Searching for Leads

1. Go to **Search Leads**
2. Enter search criteria:
   - Name
   - Job Title
   - Company
   - Domain
   - Location
3. Click **Search**
4. Review results in table
5. Select leads to save
6. Add to a list or tag

### Managing Leads

- View all saved leads in **Lead Lists**
- Create custom lists
- Export to CSV
- View search history
- Monitor API usage

## API Integration

The system uses RocketReach API with the following endpoints:

- `POST /api/leads/search` - Search for people
- `POST /api/leads/save` - Save leads to database
- `GET /api/admin/rocketreach-settings` - Get settings
- `POST /api/admin/rocketreach-settings` - Update settings

### RocketReach API Configuration

Settings are managed in admin panel and cached for 60 seconds:

- **Base URL**: Default `https://api.rocketreach.co`
- **Daily Limit**: Default 1000 requests/day
- **Concurrency**: Default 2 concurrent requests
- **Retry Policy**: 5 retries with exponential backoff (500ms - 30s)

## Security

- ✅ API keys encrypted with AES-256-GCM
- ✅ Master encryption key stored in environment variable (never in database)
- ✅ Server-side only API calls (keys never sent to client)
- ✅ Auth.js session management
- ✅ MongoDB connection with proper error handling
- ✅ Audit logging for admin actions

## Scaling Considerations

### Current Architecture
- Settings cached for 60s to reduce DB reads
- Retry logic with jitter prevents thundering herd
- Rate limit handling built-in

### Future Improvements
- Add background job queue for bulk enrichment
- Implement per-organization quotas
- Add webhook support for real-time updates
- Multi-tenant org management with roles
- Redis caching layer
- Elasticsearch for lead search
- S3/storage for CSV exports

## Development

```bash
# Run dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint
npm run lint
```

## License

Private - All rights reserved

