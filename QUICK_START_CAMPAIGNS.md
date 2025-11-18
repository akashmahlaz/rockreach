# 🎯 QUICK START - EMAIL CAMPAIGN BUILDER

## ✅ What's Ready

You now have a **complete email campaign system** with smart setup detection!

---

## 🚀 How It Works

### **1. User Asks to Send Emails**
```
User: "Send emails to 50 CTOs"
```

### **2. AI Checks Configuration**
```
AI automatically calls: checkCampaignConfiguration()
```

### **3A. If NOT Configured** ⚠️
```
AI responds:
"⚠️ Email Provider Not Configured

To send emails, choose a provider:

**Option 1: Resend (Easiest)**
1. Get API key: https://resend.com/api-keys
2. Tell me your API key and from email

**Option 2: Gmail SMTP**
1. Enable 2FA on Gmail
2. Get app password: https://myaccount.google.com/apppasswords
3. Tell me your Gmail and app password

**Option 3: Custom SMTP**
Provide: host, port, username, password

Which option?"
```

### **3B. If Configured** ✅
```
AI proceeds to:
1. Find target leads
2. Create personalized campaign
3. Send emails with rate limiting
4. Report results
```

---

## 📧 Provider Setup Examples

### **Resend** (Recommended)
```
User: "Use Resend, key is re_abc123, email is hello@company.com"

AI calls:
setupEmailProvider({
  provider: "resend",
  config: {
    apiKey: "re_abc123",
    fromEmail: "hello@company.com"
  },
  testSend: true
})

AI responds:
"✅ Resend configured! Test email sent."
```

### **Gmail SMTP**
```
User: "Use Gmail, email is john@gmail.com, password is abcd efgh ijkl mnop"

AI calls:
setupEmailProvider({
  provider: "gmail_smtp",
  config: {
    fromEmail: "john@gmail.com",
    smtpPassword: "abcd efgh ijkl mnop"
  },
  testSend: true
})

AI responds:
"✅ Gmail SMTP configured! Test email sent."
```

---

## 📨 Campaign Examples

### **Basic Campaign**
```
User: "Send emails to all CTOs at Google"

AI:
1. Checks config ✓
2. Finds leads from Google with CTO title
3. Creates campaign:
   - Subject: "Quick question about {{company}}"
   - Body: "Hi {{firstName}}, I noticed {{company}}..."
4. Sends with personalization
5. Reports: "✅ Sent 25 emails! 23 sent, 2 failed"
```

### **Custom Message**
```
User: "Send this to 100 leads: 'Hi, we help with scaling teams'"

AI:
1. Checks config ✓
2. Gets 100 leads
3. Personalizes message with names/companies
4. Sends in batches (10 per batch, 2s delay)
5. Reports results
```

### **Filtered Campaign**
```
User: "Email all VPs at fintech companies in NYC"

AI:
1. Checks config ✓
2. Finds leads: titles=["VP"], location="NYC"
3. Creates personalized campaign
4. Sends bulk
5. Reports results
```

---

## 🎨 Personalization

Use these variables in email templates:

- `{{firstName}}` → "John"
- `{{lastName}}` → "Smith"
- `{{name}}` → "John Smith"
- `{{company}}` → "Google"
- `{{title}}` → "CTO"

**Example**:
```
Subject: Quick question about {{company}}
Body: Hi {{firstName}}, I saw {{company}} is hiring...
```

**Becomes**:
```
Subject: Quick question about Google
Body: Hi John, I saw Google is hiring...
```

---

## ⚡ Rate Limiting

**Built-in safety**:
- Emails sent in batches (default: 10 per batch)
- Delay between batches (default: 2 seconds)
- Prevents spam flags and provider blocks

**Provider Limits**:
- Resend: 100/hour
- Gmail: 500/day
- SendGrid: 100/day (free tier)
- Mailgun: 300/day (free tier)

---

## 🧪 Test It Now!

### **1. Test Configuration Detection**
```
Say: "Send emails to 10 leads"
→ AI will detect if email is configured
→ If not, it will show setup instructions
```

### **2. Test Setup (if needed)**
```
Say: "Use Resend, API key is re_YOUR_KEY, email is hello@yourcompany.com"
→ AI will configure Resend
→ AI will send test email
→ AI will confirm success
```

### **3. Test Campaign**
```
Say: "Send emails to 5 CTOs at tech companies"
→ AI will find leads
→ AI will create personalized campaign
→ AI will send and report results
```

---

## 📊 What Happens Behind the Scenes

### **Configuration Check**:
```typescript
checkCampaignConfiguration()
→ Queries: email_providers collection
→ Returns: {configured: true/false, instructions: [...]}
```

### **Provider Setup**:
```typescript
setupEmailProvider({provider, config, testSend})
→ Validates credentials
→ Saves to: email_providers collection
→ Sends test email (if testSend=true)
→ Returns: {success: true, testResult: {...}}
```

### **Campaign Execution**:
```typescript
createEmailCampaign({targetLeads, emailContent, sendOptions})
→ Fetches target leads from database
→ Personalizes content for each lead
→ Sends in batches with rate limiting
→ Tracks sent/failed in: campaigns collection
→ Returns: {sent: 48, failed: 2, total: 50}
```

---

## 🔒 Security

✅ API keys encrypted in database  
✅ Organization-scoped access  
✅ Input validation  
✅ Test mode before production  
✅ Rate limiting protection  
✅ Error handling with clear messages  

---

## 📚 Full Documentation

See `EMAIL_CAMPAIGN_BUILDER.md` for:
- Detailed tool documentation
- All provider setup examples
- Complete workflow examples
- Error handling guides
- Rate limiting details
- Database schema

---

## 🎉 Summary

**The AI will now**:
1. ✅ Detect if email is configured
2. ✅ Guide you through setup if needed
3. ✅ Support 5 email providers (Resend, Gmail, etc.)
4. ✅ Send bulk personalized campaigns
5. ✅ Track results and report failures
6. ✅ Handle rate limiting automatically

**Just ask the AI to send emails and it will handle everything!** 🚀

---

*Quick Start Guide*  
*Branch: enhanced-ai-features*  
*November 18, 2025*
