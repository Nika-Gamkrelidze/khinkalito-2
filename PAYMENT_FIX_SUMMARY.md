# Payment System Fix Summary

## Issues Identified

The iPay integration was failing on Vercel with error `400 "Failed to read HTTP message"`. This was caused by several issues:

### 1. **Undefined Values in JSON Payload**
The `merchant` object was being sent with `undefined` values when environment variables were missing:
```javascript
merchant: {
  id: process.env.IPAY_MERCHANT_ID || undefined,  // ❌ undefined breaks JSON parsing
  terminal_id: process.env.IPAY_TERMINAL_ID || undefined,
  // ...
}
```

When `JSON.stringify()` encounters `undefined`, it can cause issues with strict API parsers.

### 2. **Missing Environment Variables**
The code didn't validate that required environment variables were present before making API calls.

### 3. **Inconsistent Merchant Field Handling**
The merchant object was always included even if none of the fields were populated, sending an object with all undefined values.

## Fixes Applied

### ✅ Fixed `app/api/orders/route.js`
1. Added validation for required environment variables
2. Changed merchant object to only be included when `IPAY_MERCHANT_ID` and `IPAY_TERMINAL_ID` are present
3. Optional fields (`name`, `inn`) are only added if they have values

### ✅ Fixed `app/api/payments/ipay/create/route.js`
Same fixes applied for consistency.

## Required Vercel Environment Variables

Make sure these are set in your Vercel project settings:

### **Required:**
```
IPAY_CLIENT_ID=<your-client-id>
IPAY_CLIENT_SECRET=<your-client-secret>
IPAY_CALLBACK_URL=https://your-domain.vercel.app/api/payments/ipay/webhook
IPAY_RETURN_URL=https://your-domain.vercel.app/en/checkout/ipay/return
```

### **Optional (but recommended):**
```
IPAY_API_BASE=https://api.bog.ge/payments/v1
IPAY_TOKEN_URL=https://oauth2.bog.ge/auth/realms/bog/protocol/openid-connect/token
WHATSAPP_CURRENCY=GEL
```

### **Merchant Fields (include if required by your iPay tenant):**
```
IPAY_MERCHANT_ID=<your-merchant-id>
IPAY_TERMINAL_ID=<your-terminal-id>
IPAY_MERCHANT_NAME=<your-merchant-name>  # Optional
IPAY_CLIENT_INN=<your-inn>  # Optional
```

## How to Verify in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Verify all required variables are set
4. Make sure URLs use your actual domain (not localhost)
5. **Important:** After adding/changing env variables, you must **redeploy** your application

## Testing After Deployment

1. Deploy the updated code to Vercel
2. Create a test order
3. Check the Network tab for the `/api/orders` request
4. If it still fails, check the Vercel function logs for detailed error messages

## Common Issues

### Issue: Still getting 400 errors
**Solution:** Check that:
- `IPAY_CALLBACK_URL` and `IPAY_RETURN_URL` use HTTPS and your actual domain
- Merchant fields are either all present or all absent (not partially filled)
- Your iPay credentials are valid for production (not sandbox credentials mixed with production URLs)

### Issue: "Missing access_token" error
**Solution:** 
- Verify `IPAY_CLIENT_ID` and `IPAY_CLIENT_SECRET` are correct
- Check that `IPAY_TOKEN_URL` points to the correct OAuth endpoint for your tenant

### Issue: Different error on local vs production
**Solution:**
- Local might use `.env` file while Vercel uses environment variables
- Make sure Vercel env vars match your local `.env` exactly
- Check that you're not using localhost URLs in Vercel

## Price Handling Note

There's an inconsistency in price handling between the two files:
- `app/api/orders/route.js`: Does NOT divide by 100 (prices in GEL units)
- `app/api/payments/ipay/create/route.js`: DOES divide by 100 (prices in minor units)

Make sure your database stores prices in the correct format. If you see extremely small amounts (like 0.01 GEL), you may need to adjust the price storage/handling.

## Next Steps

1. ✅ Code has been fixed
2. ⏭️ Verify Vercel environment variables
3. ⏭️ Redeploy to Vercel
4. ⏭️ Test with a real order
5. ⏭️ Monitor Vercel function logs for any remaining issues


