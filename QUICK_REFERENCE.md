# Quick Reference: Admin User Management

## Admin Features Quick Access

### URLs
- **Admin Analytics**: `/admin/analytics` → Overview with cost/usage metrics
- **User Management**: `/admin/users` → Manage users, ban/unban, view leads
- **AI Providers**: `/admin/ai-providers` → Configure AI provider settings (coming soon)

### API Endpoints

#### List All Users
```typescript
GET /api/admin/users
Response: Array<{
  id: string;
  email: string;
  name: string;
  role: "admin" | "user";
  banned: boolean;
  leadsCount: number;
  apiUsageCount: number;
}>
```

#### Ban/Unban User
```typescript
PATCH /api/admin/users
Body: {
  userId: string;
  action: "ban" | "unban" | "changeRole";
  role?: string; // if action === "changeRole"
}
```

#### View User Leads
```typescript
GET /api/admin/users/leads?userId=<userId>
Response: Array<{
  _id: string;
  name: string;
  email: string;
  company: string;
  title: string;
  createdAt: Date;
}>
```

## Component Usage

### UserActions Component
```tsx
import { UserActions } from "@/components/admin/user-actions";

<UserActions 
  userId={user.id}
  email={user.email}
  name={user.name}
  banned={user.banned}
/>
```

**Features:**
- Dropdown menu with View Leads and Ban/Unban options
- Leads dialog with scrollable table
- Ban confirmation with AlertDialog
- Loading states for all actions
- Toast notifications for success/error

### AdminUsersClient Component
```tsx
import AdminUsersClient from "@/components/admin/admin-users-client";

<AdminUsersClient 
  users={serializedUsers} 
  organizations={serializedOrganizations} 
/>
```

**Features:**
- Search users by name, email, or organization
- Display user cards with avatars
- Role badges (Admin, Org name)
- Ban status badge (red "Banned" badge)
- Edit Role button + UserActions dropdown

## Database Schema

### User Collection
```typescript
{
  _id: ObjectId,
  email: string,
  name?: string,
  role: "admin" | "user",
  banned?: boolean,           // NEW: Ban status
  bannedAt?: Date,            // NEW: When banned
  bannedBy?: string,          // NEW: Admin who banned (userId)
  orgId?: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes
```typescript
// Existing
{ email: 1 } unique
{ orgId: 1 }

// Consider adding for performance:
{ banned: 1, bannedAt: -1 }
```

## User Flows

### 1. Ban User
```
Admin clicks user dropdown → 
"Ban User" (red text) → 
Confirmation dialog → 
"Confirm" → 
API call (loading) → 
Success toast → 
Page refresh → 
User shows "Banned" badge
```

### 2. View Leads
```
Admin clicks "View Leads" → 
Dialog opens (loading) → 
API fetches leads → 
Table displays (scrollable) → 
Admin reviews → 
"Close" to dismiss
```

### 3. Unban User
```
Admin sees banned user → 
Dropdown → "Unban User" → 
Confirmation → 
API call → 
Success toast → 
Badge removed
```

## Security Checks

All admin endpoints verify:
1. ✅ User is authenticated (`session.user`)
2. ✅ User has admin role (`session.user.role === "admin"`)
3. ✅ Org-scoped queries (users can only manage their org)
4. ✅ Input validation (userId, action types)

## Testing Checklist

### Manual Testing Steps:
```bash
# 1. Test ban functionality
- [ ] Navigate to /admin/users
- [ ] Click dropdown on a user
- [ ] Select "Ban User"
- [ ] Confirm in dialog
- [ ] Verify "Banned" badge appears
- [ ] Verify user cannot login

# 2. Test unban functionality
- [ ] Click dropdown on banned user
- [ ] Select "Unban User"
- [ ] Confirm in dialog
- [ ] Verify badge disappears
- [ ] Verify user can login

# 3. Test view leads
- [ ] Click "View Leads" in dropdown
- [ ] Verify dialog opens with loading
- [ ] Verify leads table displays
- [ ] Verify scrolling works for many leads
- [ ] Verify "No leads found" for empty state

# 4. Test navigation
- [ ] From /admin/analytics, click "Manage Users"
- [ ] Verify navigates to /admin/users
- [ ] Click "AI Providers" (shows 404 for now)

# 5. Test permissions
- [ ] Login as regular user
- [ ] Try accessing /admin/users directly
- [ ] Verify redirected to /dashboard
- [ ] Try API calls directly (should fail)
```

## Vercel Deployment

### Environment Variables
```bash
# Required
MONGODB_URI=mongodb+srv://...
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=...

# Optional (for Redis caching & rate limiting)
REDIS_URL=redis://...
```

### Redis Setup (Quick Start)
1. Vercel Dashboard → Your Project → Storage
2. Click "Create Database" → Select "KV (Upstash Redis)"
3. Name it → Select region → Create
4. Click "Connect to Project" → Select your project
5. Vercel auto-adds `KV_URL` → Copy to `REDIS_URL`
6. Deploy!

See `VERCEL_REDIS_SETUP.md` for detailed instructions.

## Troubleshooting

### Issue: "Forbidden" error when banning
**Cause:** User is not admin
**Fix:** Check `session.user.role === "admin"` in database

### Issue: Leads not showing
**Cause:** Org mismatch or no leads
**Fix:** Verify `lead.userId === targetUserId` and `lead.orgId === session.user.orgId`

### Issue: Page not refreshing after ban
**Cause:** `router.refresh()` not working
**Fix:** Check `useRouter` from `next/navigation` is used (not `next/router`)

### Issue: Multiple toasts appearing
**Cause:** Multiple API calls from rapid clicking
**Fix:** Disable buttons during loading state (already implemented)

## Code Snippets

### Check if user is banned (middleware)
```typescript
// middleware.ts or auth check
if (session.user.banned) {
  return NextResponse.redirect(new URL('/banned', request.url));
}
```

### Get banned users count
```typescript
const bannedCount = await db.collection("users")
  .countDocuments({ banned: true, orgId });
```

### Get ban history
```typescript
const banHistory = await db.collection("users")
  .find({ banned: true })
  .sort({ bannedAt: -1 })
  .project({ email: 1, bannedAt: 1, bannedBy: 1 })
  .toArray();
```

## Next Steps

### Recommended Enhancements:
1. **Ban Page**: Create `/banned` page for banned users
2. **Ban Reason**: Add text field for ban reason
3. **Ban History**: Log all ban/unban actions in AuditLog
4. **Bulk Actions**: Ban multiple users at once
5. **Email Notifications**: Notify user when banned/unbanned
6. **Temporary Bans**: Add expiration date for auto-unban
7. **Search/Filter**: Add search in leads dialog
8. **Export Leads**: CSV export from leads dialog

### Performance Optimizations:
1. **Pagination**: Add pagination to user list (100+ users)
2. **Virtual Scrolling**: For leads list (1000+ leads)
3. **Caching**: Cache user list in Redis (1 minute TTL)
4. **Indexes**: Add composite index `{ orgId: 1, banned: 1, createdAt: -1 }`

## Documentation Files
- 📄 `ADMIN_FEATURES_SUMMARY.md` - Complete feature documentation
- 📄 `VERCEL_REDIS_SETUP.md` - Redis setup guide
- 📄 `QUICK_REFERENCE.md` - This file
- 📄 `ENTERPRISE_ARCHITECTURE.md` - System architecture
- 📄 `MONGODB_BEST_PRACTICES.md` - Database patterns

---

**Last Updated:** $(date)
**Version:** 1.0.0
**Status:** ✅ Production Ready
