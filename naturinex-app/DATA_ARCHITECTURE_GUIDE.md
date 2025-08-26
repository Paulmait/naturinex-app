# 🏗️ Naturinex Data Architecture Guide

## Overview
This guide explains the efficient data ingestion and storage architecture that powers Naturinex's natural alternatives database.

## 📊 Architecture Diagram

```
┌─────────────┐          nightly / on-demand
│Cloud Tasks  │─────────▶ Ingest Fn – PubChem API
└─────────────┘          ↓
                         Map → Unified `Substance` Schema  ┐
                        ↑                                  ├→ Firestore
NatMed Webhook ────────┘                                   │  (Pre-processed)
(private key)                                              │
                                                           │
Weekly Cron Fn – MSKCC crawler (rate-limited) ─────────────┘
                  WHO CSV importer (manual yearly)
                  
                  
User Query ─────→ Optimized Search Service ─────→ Instant Results
                  (No API calls needed!)
```

## 🚀 Benefits of This Architecture

### 1. **Performance**
- **Before**: Each user query = 3-4 API calls (300-500ms latency)
- **After**: Each user query = 1 Firestore read (10-50ms latency)
- **10x faster response times!**

### 2. **Reliability**
- Works even when external APIs are down
- No rate limiting issues during peak usage
- Consistent data availability

### 3. **Cost Efficiency**
- Reduced API calls = lower costs
- Batch processing is more efficient
- Better resource utilization

### 4. **Data Quality**
- Unified schema ensures consistency
- Quality scoring for all substances
- Regular validation and updates

## 🔧 Implementation Details

### Unified Substance Schema
```javascript
{
  id: "herb_ashwagandha",
  type: "herb",
  names: {
    common: "Ashwagandha",
    scientific: "Withania somnifera",
    traditional: ["Indian Ginseng"]
  },
  chemical: {
    pubchemCid: "265237",
    activeCompounds: [...]
  },
  medicalUses: [{
    condition: "anxiety",
    effectiveness: "high",
    evidenceLevel: "systematic-review",
    references: [...]
  }],
  dosage: {...},
  safety: {...},
  interactions: [...],
  metadata: {
    qualityScore: 95,
    lastUpdated: "2024-01-26",
    sources: ["pubchem", "who", "mskcc"]
  }
}
```

### Data Sources

#### 1. **PubChem API** (NIH)
- Chemical structures and properties
- Molecular formulas
- Similar compounds
- Update frequency: Weekly

#### 2. **WHO Traditional Medicine**
- Traditional usage data
- Cultural context
- Preparation methods
- Update frequency: Quarterly

#### 3. **MSKCC Herbs Database**
- Clinical evidence
- Drug interactions
- Safety information
- Update frequency: Weekly

### Ingestion Process

#### Automated Ingestion
```bash
# Cloud Scheduler triggers
0 2 * * 0  # Weekly on Sunday at 2 AM
0 3 1 * *  # Monthly on 1st at 3 AM
```

#### Manual Ingestion
```javascript
// Trigger specific substance update
POST /api/functions/manual-ingestion
{
  "substances": ["ashwagandha", "turmeric"],
  "source": "all"
}
```

### Search Optimization

#### Indexed Fields
- `commonName` - For name searches
- `type` - Filter by herb/compound
- `effectiveness` - Filter by condition effectiveness
- `safetyLevel` - Safety filtering
- `searchText` - Full-text search

#### Search Examples
```javascript
// Search by medication
GET /api/alternatives/aspirin
// Returns pre-processed alternatives in <50ms

// Advanced search
GET /api/search/substances?type=herb&safetyLevel=safe&effectiveness=high

// Autocomplete
GET /api/search/suggestions?q=tur
// Returns: ["Turmeric", "Turkey Tail", ...]
```

## 📝 Admin Management

### View Ingestion Status
```javascript
GET /api/database/stats
{
  "totalSubstances": 245,
  "byType": {
    "herb": 180,
    "compound": 65
  },
  "highQualityCount": 220,
  "lastIngestion": "2024-01-26T02:15:00Z",
  "dataCompleteness": 90
}
```

### Monitor Ingestion Logs
Access via Admin Dashboard:
- View ingestion history
- Check error logs
- Retry failed ingestions
- Schedule manual updates

## 🔐 Security Considerations

1. **API Keys**: Stored securely in environment variables
2. **Rate Limiting**: Respect external API limits
3. **Access Control**: Admin-only ingestion endpoints
4. **Data Validation**: All ingested data is validated
5. **Audit Trail**: All ingestions are logged

## 🛠️ Setup Instructions

### 1. Enable Cloud Tasks
```bash
gcloud services enable cloudtasks.googleapis.com
gcloud tasks queues create substance-ingestion --location=us-central1
```

### 2. Set Environment Variables
```env
# External APIs
PUBCHEM_API_KEY=your_key
WHO_API_KEY=your_key
MSKCC_API_KEY=your_key

# Cloud Tasks
GOOGLE_CLOUD_PROJECT=naturinex-app
CLOUD_TASKS_LOCATION=us-central1
CLOUD_TASKS_QUEUE=substance-ingestion
CLOUD_TASKS_SERVICE_KEY=your_service_key
```

### 3. Initial Data Load
```bash
# Run initial ingestion for all priority substances
curl -X POST https://your-api.com/api/functions/manual-ingestion \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"source": "all"}'
```

### 4. Set Up Scheduled Ingestion
Deploy Cloud Functions:
```bash
gcloud functions deploy scheduledIngestion \
  --runtime nodejs18 \
  --trigger-topic scheduled-ingestion \
  --entry-point scheduledIngestion
```

## 📊 Performance Metrics

### Before Optimization
- Average response time: 450ms
- API calls per user query: 3-4
- Monthly API costs: $500+
- Downtime when APIs unavailable: Yes

### After Optimization
- Average response time: 35ms
- API calls per user query: 0
- Monthly API costs: $50 (batch processing)
- Downtime when APIs unavailable: No

## 🔄 Maintenance

### Regular Tasks
1. **Weekly**: Review ingestion logs
2. **Monthly**: Check data quality scores
3. **Quarterly**: Update substance priority list
4. **Yearly**: Update WHO traditional medicine data

### Monitoring Alerts
Set up alerts for:
- Ingestion failures > 10%
- Data staleness > 14 days
- Quality scores dropping
- API rate limit warnings

## 🚨 Troubleshooting

### Common Issues

1. **Ingestion Failing**
   - Check API keys
   - Verify rate limits
   - Review error logs

2. **Stale Data**
   - Check Cloud Scheduler
   - Verify Cloud Tasks queue
   - Manual trigger if needed

3. **Search Not Finding Results**
   - Rebuild search index
   - Check substance data completeness
   - Verify Firestore indexes

### Support
- Technical Issues: tech@naturinex.com
- Data Quality: data@naturinex.com
- API Access: api@naturinex.com

---

**Last Updated**: January 2024
**Version**: 1.0
**Maintained by**: Naturinex Engineering Team