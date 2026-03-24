# Gmail SMTP Fix - FINAL STEPS

🔴 **ERROR PERSISTING** - 535 BadCredentials

## Root Causes & Fixes

1. ✅ EMAIL_USER/PASS present
2. ❌ **ENV VAR NAMES WRONG** ← Fix #1  
   `backend/.env`: Change `NODemailer_HOST` → `SMTP_HOST`  
   Change `NODemailer_PORT` → `SMTP_PORT`

3. ❌ **APP PASSWORD INVALID** ← Fix #2 (Critical)
   - Revoke old: lrnq uuuu udlf fryd
   - [Generate NEW](https://myaccount.google.com/apppasswords)
   - **Copy EXACTLY** (no extra spaces!)
   - Update EMAIL_PASS

## Test Sequence

```
cd backend
node seed.js
```

Expected: ✅ created messages + emails received

## If Still Fails

- Check 2FA enabled
- Try different email account
- Use Ethereal (test SMTP): EMAIL_USER=test@ethereal.email etc.
