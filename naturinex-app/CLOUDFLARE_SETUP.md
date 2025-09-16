# 🛡️ CloudFlare Setup for Maximum Security

## Why CloudFlare is CRITICAL

Without CloudFlare, your Supabase Edge Functions are directly exposed to:
- DDoS attacks
- Bot traffic
- Scrapers and crawlers
- Brute force attempts
- Direct API abuse

CloudFlare acts as a shield, blocking malicious traffic BEFORE it reaches your API.

## Step 1: Sign Up for CloudFlare (Free)

1. Go to https://cloudflare.com
2. Sign up for free account
3. Add your domain (or get a free subdomain from Freenom if needed)

## Step 2: Configure DNS

1. Point your domain to CloudFlare nameservers
2. Add CNAME record:
   - Name: `api`
   - Target: `hxhbsxzkzarqwksbjpce.supabase.co`

Your API will now be: `https://api.yourdomain.com/functions/v1/analyze-secure`

## Step 3: Enable Security Features

### A. DDoS Protection (Automatic)
- ✅ Enabled by default on all plans
- Blocks volumetric attacks
- Protects against SYN floods

### B. Rate Limiting Rules (Free - 1 rule)
1. Go to **Security** → **WAF** → **Rate limiting rules**
2. Create rule:
   - Name: "API Rate Limit"
   - Path: `/functions/v1/analyze-secure`
   - Requests: 10 per minute per IP
   - Action: Block for 1 hour
   - Response: 429 Too Many Requests

### C. Bot Fight Mode
1. Go to **Security** → **Bots**
2. Enable **Bot Fight Mode**
3. This blocks:
   - Known bots
   - Headless browsers
   - Automated scripts

### D. Challenge Suspicious Traffic
1. Go to **Security** → **Settings**
2. Set Security Level to **Medium**
3. Enable **Browser Integrity Check**
4. Enable **Challenge Passage** (30 minutes)

## Step 4: Add Custom Firewall Rules

Go to **Security** → **WAF** → **Custom rules**

### Rule 1: Block Known VPNs/Proxies (Optional)
```
(ip.geoip.asnum in {13335 7922 16509})
Action: Challenge
```

### Rule 2: Block Suspicious User Agents
```
(http.user_agent contains "curl") or
(http.user_agent contains "wget") or
(http.user_agent contains "python") or
(http.user_agent contains "axios")
Action: Block
```

### Rule 3: Require Headers
```
(not http.request.headers["x-device-id"][0] contains "")
Action: Allow
Otherwise: Challenge
```

### Rule 4: Geographic Restrictions (Optional)
```
(not ip.geoip.country in {"US" "CA" "GB" "AU"})
Action: Challenge
```

## Step 5: Configure Page Rules

1. Go to **Rules** → **Page Rules**
2. Create rule for API endpoint:
   - URL: `api.yourdomain.com/functions/v1/*`
   - Settings:
     - Security Level: High
     - Cache Level: Bypass
     - Disable Performance
     - Enable "I'm Under Attack" mode (if needed)

## Step 6: Enable Analytics

1. Go to **Analytics** → **Traffic**
2. Monitor:
   - Total requests
   - Blocked threats
   - Bot traffic
   - Cache hit rate

## Step 7: Set Up Alerts

1. Go to **Notifications**
2. Create alerts for:
   - DDoS attack detected
   - High threat score
   - Origin error rates
   - SSL certificate issues

## Advanced Protection (Paid Plans)

### CloudFlare Pro ($20/month) adds:
- 20 Page Rules
- Advanced DDoS protection
- Web Application Firewall (WAF)
- 5 Rate Limiting rules

### CloudFlare Business ($200/month) adds:
- 50 Page Rules
- 100% uptime SLA
- Prioritized support
- Advanced bot management

## Integration with Your App

Update your environment variables:

```env
# Instead of direct Supabase URL
REACT_APP_API_URL_SUPABASE=https://api.yourdomain.com/functions/v1

# Add CloudFlare zone ID for purging
CLOUDFLARE_ZONE_ID=your_zone_id
CLOUDFLARE_API_TOKEN=your_api_token
```

## Monitoring CloudFlare Performance

### Check these metrics daily:
1. **Threats Blocked**: Should see 100+ daily once live
2. **Bandwidth Saved**: CloudFlare caches OPTIONS requests
3. **Bot Score**: Lower is more suspicious
4. **Rate Limited IPs**: Track repeat offenders

### Set up Webhook Notifications:
```javascript
// CloudFlare webhook endpoint
app.post('/webhooks/cloudflare', (req, res) => {
  const { alert_type, description, detected } = req.body;

  if (alert_type === 'ddos_attack') {
    // Enable "I'm Under Attack" mode
    // Send alerts to admin
    // Log to monitoring system
  }
});
```

## Testing CloudFlare Protection

### Test 1: Rate Limiting
```bash
# Should get blocked after 10 requests
for i in {1..20}; do
  curl https://api.yourdomain.com/functions/v1/analyze-secure
done
```

### Test 2: Bot Detection
```bash
# Should be challenged or blocked
curl -H "User-Agent: python-requests/2.28.0" \
  https://api.yourdomain.com/functions/v1/analyze-secure
```

### Test 3: Geographic Restrictions
Use VPN to test from blocked country - should see challenge page

## CloudFlare + Supabase Best Practices

1. **Never expose Supabase URL directly**
   - Always use CloudFlare proxy
   - Hide origin IP

2. **Enable SSL/TLS Full (Strict)**
   - Encrypts traffic between CloudFlare and Supabase
   - Validates certificates

3. **Use Transform Rules**
   - Add security headers
   - Modify requests before they reach origin

4. **Cache Static Responses**
   - Cache OPTIONS requests (CORS preflight)
   - Cache error pages

5. **Set Up Load Balancing** (Business plan)
   - Multiple Supabase projects
   - Automatic failover

## Emergency Response Plan

If under attack:

1. **Immediate Actions:**
   - Enable "I'm Under Attack" mode
   - Increase challenge difficulty
   - Block countries if needed

2. **Within 5 minutes:**
   - Check CloudFlare Analytics
   - Identify attack pattern
   - Create custom firewall rule

3. **Within 30 minutes:**
   - Contact CloudFlare support (if paid)
   - Scale up Supabase if needed
   - Notify users if service degraded

## Cost-Benefit Analysis

### Without CloudFlare:
- API abuse: $100-1000/day potential cost
- DDoS vulnerability: Service outage
- Bot traffic: 30-50% of requests
- No geographic control

### With CloudFlare Free:
- Blocks 90% of malicious traffic
- Basic DDoS protection
- Bot detection
- Cost: $0

### With CloudFlare Pro:
- Blocks 99% of malicious traffic
- Advanced WAF rules
- Multiple rate limits
- Cost: $20/month (saves $100s)

## 🎯 Action Items

1. **NOW**: Sign up for CloudFlare Free
2. **TODAY**: Configure DNS and basic rules
3. **THIS WEEK**: Monitor and adjust rules
4. **CONSIDER**: Upgrade to Pro if >10k users

**Your app is NOT production-ready without CloudFlare!**