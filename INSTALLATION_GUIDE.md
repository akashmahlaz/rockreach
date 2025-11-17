# Quick Installation Guide

## 📦 Required Packages

Run this command to install the necessary dependencies:

```bash
npm install react-markdown remark-gfm
```

Or if using bun:

```bash
bun install react-markdown remark-gfm
```

## 🚀 What Was Implemented

### 1. Professional Table Rendering
- **File**: `components/c/message-bubble.tsx`
- **Change**: Now uses `react-markdown` with `remark-gfm` for GitHub Flavored Markdown
- **Result**: Tables render beautifully instead of showing raw markdown

### 2. CSV Export from Chat
- **Files**: 
  - `lib/assistant/tools.ts` (added exportLeadsToCSV tool)
  - `app/api/leads/download-csv/route.ts` (new API endpoint)
- **Change**: AI can now generate downloadable CSV files
- **Result**: Users get instant download links in chat responses

### 3. Professional Empty State
- **File**: `components/c/empty-state.tsx`
- **Change**: Updated with industry-specific examples and value proposition
- **Result**: Clear expectations and better first impression

### 4. Enhanced AI Prompt
- **File**: `app/api/chat/route.ts`
- **Change**: System prompt now enforces table formatting and CSV generation
- **Result**: Consistent, professional responses

## 🔧 Database Setup

The system will automatically create a `temp_files` collection in MongoDB when the first CSV is generated. No manual setup needed.

### Collection Schema:
```javascript
{
  fileId: String,      // Unique identifier
  orgId: String,       // Organization ID
  userId: String,      // User ID (optional)
  content: String,     // CSV content
  filename: String,    // e.g., "leads-export-2025-11-17.csv"
  mimeType: String,    // "text/csv"
  createdAt: Date,     // Creation timestamp
  expiresAt: Date      // Expiration (24 hours)
}
```

## 🎯 Testing the Changes

### 1. Test Table Rendering
Ask the AI:
```
Find 10 CEOs at tech companies in San Francisco
```

Expected result:
- Professional HTML table with styled headers
- Hover effects on rows
- Clean, readable formatting

### 2. Test CSV Export
Ask the AI:
```
Find 25 CFOs at fintech companies and give me a CSV
```

Expected result:
- AI generates CSV automatically
- Download link appears in response: `[Download CSV](link)`
- Click link downloads file immediately

### 3. Test Empty State
1. Start a new chat
2. See new professional empty state
3. Click an example prompt
4. Verify it executes correctly

## 🐛 Troubleshooting

### Issue: "Module not found: react-markdown"
**Solution**: Run `npm install react-markdown remark-gfm`

### Issue: Tables still show as markdown
**Solution**: 
1. Clear browser cache
2. Restart dev server
3. Verify packages installed correctly

### Issue: CSV download link doesn't work
**Solution**:
1. Check MongoDB connection
2. Verify `/api/leads/download-csv/route.ts` exists
3. Check browser console for errors

### Issue: Empty state not showing new design
**Solution**:
1. Hard refresh browser (Ctrl+Shift+R)
2. Check that `components/c/empty-state.tsx` was updated
3. Clear Next.js cache: `rm -rf .next`

## 📋 Files Changed Summary

### Modified Files (5):
1. ✅ `components/c/message-bubble.tsx`
2. ✅ `components/c/empty-state.tsx`
3. ✅ `lib/assistant/tools.ts`
4. ✅ `app/api/chat/route.ts`

### New Files (3):
1. ✅ `app/api/leads/download-csv/route.ts`
2. ✅ `UI_IMPROVEMENT_PLAN.md`
3. ✅ `IMPLEMENTATION_SUMMARY.md`

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] Install dependencies: `npm install react-markdown remark-gfm`
- [ ] Test table rendering with sample data
- [ ] Test CSV download with 5+ leads
- [ ] Verify empty state loads correctly
- [ ] Check mobile responsiveness
- [ ] Test across browsers (Chrome, Firefox, Safari)
- [ ] Verify MongoDB connection for temp file storage
- [ ] Set up cleanup cron job for expired files (optional)

## 🎨 Customization Options

### Change CSV Expiration Time
Edit `lib/assistant/tools.ts`, line ~470:
```typescript
expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Change 24 to desired hours
```

### Change Table Styling
Edit `components/c/message-bubble.tsx`, lines ~88-115:
```typescript
table: ({ node, ...props }) => (
  <table className="YOUR-CUSTOM-CLASSES" {...props} />
),
```

### Change Auto-Export Threshold
Edit `app/api/chat/route.ts`, line ~65:
```typescript
// Current: auto-export for 5+ leads
// Change "5+" to your desired threshold
```

## 📞 Need Help?

### Common Questions:

**Q: Do I need to restart the server?**
A: Yes, after installing packages or modifying API routes.

**Q: Will existing chats break?**
A: No, changes are backward compatible.

**Q: Can users still export from leads page?**
A: Yes, the existing export functionality still works.

**Q: How long do CSV files last?**
A: 24 hours by default, then auto-deleted.

**Q: Is there a file size limit?**
A: No hard limit, but MongoDB has 16MB document limit. Consider moving to S3 for very large exports.

## ✅ Verification

After installation, verify everything works:

1. **Start dev server**:
   ```bash
   npm run dev
   ```

2. **Open browser**: http://localhost:3000/c/new

3. **Check empty state**: Should see new professional design

4. **Test search**: "Find 5 CTOs in tech"

5. **Verify table**: Should render as HTML table

6. **Test CSV**: Should show download link

7. **Click download**: File should download immediately

## 🎉 Success!

If all steps complete successfully, your platform now has:
- ✅ Professional ChatGPT-quality table rendering
- ✅ Instant CSV downloads from chat
- ✅ Clear value proposition
- ✅ Improved UX throughout

Enjoy your upgraded platform! 🚀
