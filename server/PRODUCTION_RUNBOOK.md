# 📚 NaturineX Production Runbook

## 🚨 Emergency Contacts
- **On-Call Engineer**: [Your Phone]
- **DevOps Lead**: [DevOps Phone]
- **Security Team**: [Security Email]
- **Render Support**: https://render.com/support
- **Resend Support**: https://resend.com/support

## 🔥 Incident Response Procedures

### Email Service Down
```bash
# 1. Check service health
curl https://naturinex-api.onrender.com/health

# 2. Check Resend API status
curl -X GET https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY"

# 3. Check logs
render logs --service naturinex-api --tail

# 4. Restart service if needed
render restart --service naturinex-api

# 5. Fallback: Enable mock mode
# Set USE_MOCK_DATA=true in Render env vars
```

### Database Connection Issues
```sql
-- 1. Check connection pool
SELECT count(*) FROM pg_stat_activity 
WHERE datname = 'naturinex';

-- 2. Kill idle connections
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE datname = 'naturinex' 
AND state = 'idle' 
AND state_change < NOW() - INTERVAL '10 minutes';

-- 3. Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 4. Vacuum and analyze
VACUUM ANALYZE;
```

### High Email Bounce Rate
```bash
# 1. Check bounce logs
psql $DATABASE_URL -c "
  SELECT recipient, error, COUNT(*) 
  FROM email_logs 
  WHERE status = 'bounced' 
  AND sent_at > NOW() - INTERVAL '1 hour'
  GROUP BY recipient, error
  ORDER BY COUNT(*) DESC
  LIMIT 10;
"

# 2. Check blacklist
psql $DATABASE_URL -c "
  SELECT * FROM email_blacklist 
  ORDER BY added_at DESC 
  LIMIT 20;
"

# 3. Verify DNS records
nslookup -type=TXT _dmarc.yourdomain.com
nslookup -type=TXT yourdomain.com | grep spf
```

### API Rate Limiting Active
```bash
# 1. Check current limits
curl https://naturinex-api.onrender.com/api/usage/stats

# 2. Identify heavy users
psql $DATABASE_URL -c "
  SELECT user_id, COUNT(*) as requests 
  FROM api_usage 
  WHERE created_at > NOW() - INTERVAL '1 hour'
  GROUP BY user_id 
  ORDER BY requests DESC 
  LIMIT 10;
"

# 3. Temporarily increase limits
# Update MAX_REQUESTS_PER_MINUTE in Render env
```

## 📊 Monitoring Commands

### Health Checks
```bash
# Full health check
curl https://naturinex-api.onrender.com/health | jq

# Email service status
curl https://naturinex-api.onrender.com/api/email/stats?days=1

# Database health
psql $DATABASE_URL -c "SELECT version();"

# System metrics
curl https://naturinex-api.onrender.com/api/monitoring/dashboard
```

### Performance Metrics
```sql
-- Slow queries
SELECT 
  query,
  calls,
  mean_exec_time,
  total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Table bloat
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  n_dead_tup,
  n_live_tup
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC;

-- Connection stats
SELECT 
  state,
  COUNT(*)
FROM pg_stat_activity
GROUP BY state;
```

## 🔧 Common Fixes

### Clear Email Queue
```sql
-- Remove stuck emails
DELETE FROM email_logs 
WHERE status = 'pending' 
AND sent_at < NOW() - INTERVAL '1 hour';

-- Reset rate limits
DELETE FROM email_logs 
WHERE recipient IN (
  SELECT recipient 
  FROM email_logs 
  WHERE status = 'rate_limited'
  AND sent_at < NOW() - INTERVAL '1 hour'
);
```

### Reset User Session
```sql
-- Clear user sessions
DELETE FROM user_sessions 
WHERE user_id = 'USER_ID';

-- Force password reset
UPDATE users 
SET reset_token = 'temp_token_' || gen_random_uuid(),
    reset_expires = NOW() + INTERVAL '1 hour'
WHERE email = 'user@example.com';
```

### Unblock IP Address
```sql
-- Check blocked IPs
SELECT * FROM monitoring_logs 
WHERE issue_type = 'IP_BLOCKED' 
AND created_at > NOW() - INTERVAL '1 day';

-- Remove IP from blacklist (in app memory)
-- Requires service restart to clear memory cache
```

## 🚀 Deployment Procedures

### Standard Deployment
```bash
# 1. Run tests locally
npm test

# 2. Check for secrets in code
git secrets --scan

# 3. Push to GitHub
git push origin main

# 4. Monitor deployment
render logs --service naturinex-api --tail

# 5. Verify deployment
curl https://naturinex-api.onrender.com/health
```

### Rollback Procedure
```bash
# 1. Go to Render Dashboard
# 2. Navigate to Service → Deploys
# 3. Find last working deploy
# 4. Click "Rollback to this deploy"

# Or via CLI:
render rollback --service naturinex-api --to DEPLOY_ID
```

### Database Migration
```bash
# 1. Backup database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# 2. Run migration
psql $DATABASE_URL -f migrations/new_migration.sql

# 3. Verify migration
psql $DATABASE_URL -c "\dt"

# 4. If failed, restore
psql $DATABASE_URL < backup_20240101.sql
```

## 📈 Scaling Procedures

### Horizontal Scaling
```yaml
# Update render.yaml
services:
  - type: web
    name: naturinex-api
    plan: standard  # Upgrade plan
    scaling:
      minInstances: 2
      maxInstances: 10
      targetMemoryPercent: 70
      targetCPUPercent: 70
```

### Database Scaling
```bash
# 1. Upgrade via Render Dashboard
# 2. Or update render.yaml:
databases:
  - name: naturinex-db
    plan: standard  # From free
    
# 3. Add read replicas if needed
```

## 🔒 Security Procedures

### Rotate Secrets
```bash
# 1. Generate new secrets
openssl rand -base64 32  # For JWT_SECRET
openssl rand -hex 32     # For ENCRYPTION_KEY

# 2. Update in Render Dashboard
# 3. Deploy new version
# 4. Monitor for issues
```

### Security Audit
```bash
# 1. Check dependencies
npm audit

# 2. Fix vulnerabilities
npm audit fix

# 3. Check for secrets
git secrets --scan-history

# 4. Review access logs
psql $DATABASE_URL -c "
  SELECT * FROM monitoring_logs 
  WHERE severity IN ('CRITICAL', 'HIGH')
  AND created_at > NOW() - INTERVAL '7 days';
"
```

## 📝 Maintenance Tasks

### Daily
- [ ] Check health endpoint
- [ ] Review error logs
- [ ] Check email delivery rates
- [ ] Monitor resource usage

### Weekly
- [ ] Review security alerts
- [ ] Check database growth
- [ ] Update dependencies
- [ ] Backup database
- [ ] Review API usage patterns

### Monthly
- [ ] Security audit
- [ ] Performance review
- [ ] Cost optimization review
- [ ] Disaster recovery test
- [ ] Update documentation

## 🎯 Performance Optimization

### Database Indexes
```sql
-- Add missing indexes
CREATE INDEX CONCURRENTLY idx_email_logs_recipient_date 
ON email_logs(recipient, sent_at);

CREATE INDEX CONCURRENTLY idx_api_usage_user_endpoint 
ON api_usage(user_id, endpoint);

-- Rebuild bloated indexes
REINDEX CONCURRENTLY INDEX idx_name;
```

### Query Optimization
```sql
-- Find missing indexes
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE tablename IN ('email_logs', 'users', 'api_usage')
AND n_distinct > 100
AND correlation < 0.1
ORDER BY n_distinct DESC;
```

## 📊 Dashboards & Monitoring

### Render Dashboard
- URL: https://dashboard.render.com
- Monitor: CPU, Memory, Disk, Network
- Alerts: Set up for >80% usage

### Database Monitoring
```sql
-- Create monitoring view
CREATE OR REPLACE VIEW system_health AS
SELECT 
  (SELECT COUNT(*) FROM email_logs WHERE sent_at > NOW() - INTERVAL '1 hour') as emails_last_hour,
  (SELECT COUNT(*) FROM api_usage WHERE created_at > NOW() - INTERVAL '1 hour') as api_calls_last_hour,
  (SELECT COUNT(*) FROM pg_stat_activity) as db_connections,
  (SELECT pg_database_size(current_database())) as db_size,
  NOW() as checked_at;

-- Query health
SELECT * FROM system_health;
```

### Custom Metrics
```javascript
// Add to monitoring endpoint
app.get('/api/monitoring/metrics', async (req, res) => {
  const metrics = await productionMonitor.getMonitoringDashboard();
  res.json(metrics);
});
```

## 🚨 Disaster Recovery

### Backup Strategy
```bash
# Automated daily backups (configure in Render)
# Manual backup
pg_dump $DATABASE_URL | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Restore from backup
gunzip < backup_20240101_120000.sql.gz | psql $DATABASE_URL
```

### Data Recovery
```sql
-- Recover deleted user
INSERT INTO users SELECT * FROM users_backup WHERE id = 'USER_ID';

-- Recover email logs
INSERT INTO email_logs 
SELECT * FROM email_logs_backup 
WHERE sent_at BETWEEN '2024-01-01' AND '2024-01-02';
```

## 📞 Support Procedures

### User Issues
1. Check user exists in database
2. Verify email verification status
3. Check recent activity logs
4. Review error logs for user ID
5. Test with user's email

### Email Not Received
1. Check email_logs table
2. Verify email not in blacklist
3. Check rate limiting
4. Verify DNS records
5. Check spam folders
6. Resend if necessary

## 🔍 Troubleshooting Flowchart

```
Service Down?
├── Yes → Check Render Status
│   ├── Render Down → Wait/Contact Support
│   └── Render Up → Check Logs
│       ├── Error Found → Apply Fix
│       └── No Error → Restart Service
└── No → Check Specific Issue
    ├── Email Issues → Check Resend/DNS
    ├── API Issues → Check Rate Limits
    └── DB Issues → Check Connections/Space
```

## 📚 Additional Resources

- [Render Docs](https://render.com/docs)
- [Resend Docs](https://resend.com/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [OWASP Security Guide](https://owasp.org/www-project-top-ten/)

---

**Last Updated**: January 2024
**Version**: 1.0.0
**Maintained By**: DevOps Team