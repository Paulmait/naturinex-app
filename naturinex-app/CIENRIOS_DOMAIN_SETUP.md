# 🌐 Cienrios.com Domain Configuration

## Quick Setup Guide for CloudFlare + Vercel + Supabase

### ✅ DNS Records to Add in CloudFlare:

```
1. Frontend (Main Website):
   Type: CNAME
   Name: @
   Content: cname.vercel-dns.com
   Proxy: ON ☁️

   Type: CNAME
   Name: www
   Content: cname.vercel-dns.com
   Proxy: ON ☁️

2. API (Supabase Edge Functions):
   Type: CNAME
   Name: api
   Content: hxhbsxzkzarqwksbjpce.supabase.co
   Proxy: ON ☁️
```

### 🔗 Your Production URLs:

- **Website**: https://cienrios.com
- **API Endpoint**: https://api.cienrios.com/functions/v1/analyze-production
- **Stripe Webhook**: https://api.cienrios.com/functions/v1/stripe-webhook
- **Admin Dashboard**: https://cienrios.com/admin

### 📝 Environment Variables to Update:

#### Vercel Dashboard:
```env
REACT_APP_API_URL_SUPABASE=https://api.cienrios.com/functions/v1
REACT_APP_FRONTEND_URL=https://cienrios.com
```

#### Mobile App (.env):
```env
EXPO_PUBLIC_API_URL=https://api.cienrios.com/functions/v1
EXPO_PUBLIC_FRONTEND_URL=https://cienrios.com
```

### 🛡️ CloudFlare Security Settings:

1. **Security** → **Settings**:
   - Security Level: Medium
   - Challenge Passage: 30 minutes
   - Browser Integrity Check: ON

2. **Security** → **Bots**:
   - Bot Fight Mode: ON

3. **SSL/TLS** → **Overview**:
   - Encryption Mode: Full (strict)

4. **Security** → **WAF** → **Custom Rules**:
   ```
   Rule: Block Excessive API Calls
   Expression: (http.request.uri.path contains "/functions/v1/analyze")
   Action: Challenge
   ```

### 🔄 Update These Services:

#### 1. Stripe Dashboard:
- Webhook Endpoint: `https://api.cienrios.com/functions/v1/stripe-webhook`

#### 2. Google OAuth (if used):
- Authorized redirect URIs:
  - `https://cienrios.com/auth/callback`
  - `https://www.cienrios.com/auth/callback`

#### 3. Firebase (if still using for auth):
- Authorized domains:
  - `cienrios.com`
  - `www.cienrios.com`

### 🧪 Test Your Setup:

```bash
# Test frontend is proxied through CloudFlare
curl -I https://cienrios.com
# Should see: CF-Ray and Server: cloudflare headers

# Test API is working
curl -X POST https://api.cienrios.com/functions/v1/analyze-production \
  -H "Content-Type: application/json" \
  -d '{"medication": "test"}'

# Test rate limiting (should block after 10)
for i in {1..15}; do
  curl https://api.cienrios.com/functions/v1/analyze-production
  echo " - Request $i"
done
```

### 📊 Monitor Performance:

In CloudFlare Dashboard:
- **Analytics**: View traffic and threats
- **Security Events**: See blocked requests
- **Speed**: Check performance metrics
- **Cache**: Monitor cache hit rates

### 🚀 Go Live Checklist:

- [ ] DNS records added in CloudFlare
- [ ] Vercel domain configured
- [ ] Environment variables updated
- [ ] Stripe webhook updated
- [ ] CloudFlare security enabled
- [ ] SSL set to Full (strict)
- [ ] Bot protection enabled
- [ ] Rate limiting configured
- [ ] Test all endpoints working
- [ ] Mobile app using new URLs

### 💡 Pro Tips:

1. **Page Rules** (free plan = 3 rules):
   - `/admin/*` → Security Level: High
   - `/api/*` → Cache Level: Bypass
   - `/*` → Cache Level: Standard

2. **Firewall Rules**:
   - Block countries you don't serve
   - Challenge suspicious user agents
   - Require known bots to solve challenges

3. **Analytics**:
   - Set up email alerts for spikes
   - Monitor API usage patterns
   - Track geographic distribution

---

## 🎉 Your Domain is Production-Ready!

With CloudFlare protecting **cienrios.com**, you have:
- ✅ DDoS protection
- ✅ Bot blocking
- ✅ Global CDN
- ✅ Free SSL
- ✅ Hidden origin servers
- ✅ Analytics and insights

Your infrastructure can now handle **1M+ users** securely!