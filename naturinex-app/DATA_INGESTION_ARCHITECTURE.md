# Data Ingestion Architecture for Naturinex

## Overview

We've implemented a comprehensive data ingestion system that scrapes authoritative medical databases nightly to build a safe, reliable natural alternatives database. The system uses Google's Gemini AI to analyze and validate all data for safety.

## Architecture Components

### 1. **Data Sources**
- **PubChem** (NIH): Chemical compounds and bioactivity data
- **WHO**: Traditional medicine monographs and safety guidelines  
- **MSKCC**: Cancer-specific herb information and interactions

### 2. **Scrapers**
Each source has a dedicated scraper that:
- Fetches data using APIs or web scraping
- Normalizes data into a consistent format
- Uses AI to enhance and analyze the information

### 3. **Safety Validation**
Comprehensive safety checks including:
- Dangerous substance detection
- Drug interaction validation
- Vulnerable population warnings
- AI-powered risk analysis

### 4. **Data Storage**
- **MongoDB**: Primary storage for detailed remedy data
- **Firestore**: Quick-access cache for app queries
- **Dual storage** ensures reliability and performance

## Key Features

### Safety-First Approach
```javascript
// Dangerous substances automatically flagged
const dangerousSubstances = [
  'ephedra', 'comfrey', 'kava', 'aristolochia', 
  'pennyroyal', 'sassafras', 'yohimbe'
];

// Critical drug interactions checked
const criticalInteractions = [
  { drug: 'warfarin', herbs: ['ginkgo', 'garlic', 'ginger'] },
  { drug: 'antidepressants', herbs: ['st johns wort'] }
];
```

### AI-Enhanced Analysis
Each remedy is analyzed by Gemini AI for:
- Hidden safety risks
- Long-term effects
- Population-specific concerns
- Quality control issues
- Overdose potential

### Data Attribution
All data includes proper attribution:
```
"Data sourced from: PubChem, WHO, MSKCC. 
Processed with Google Gemini AI for safety analysis."
```

## Scheduled Updates

The system runs nightly at 2 AM to:
1. Scrape latest data from all sources
2. Merge and deduplicate information
3. Validate safety with AI
4. Update both databases

## Environment Configuration

Add to your `.env` file:
```
# Enable data ingestion (set to 'true' in production)
ENABLE_DATA_INGESTION=false

# MongoDB connection (required for data storage)
MONGODB_URI=mongodb://localhost:27017/naturinex

# Already configured
GEMINI_API_KEY=your_api_key_here
```

## Safety Validation Process

1. **Source Data Collection**: Gather from PubChem, WHO, MSKCC
2. **AI Analysis**: Use Gemini to analyze safety and effectiveness
3. **Safety Scoring**: Rate each remedy 0-100
4. **Validation Checks**:
   - Dangerous substance screening
   - Drug interaction analysis
   - Vulnerable population warnings
   - Quality control verification
5. **Approval**: Only remedies scoring 50+ are included

## Example Data Structure

```javascript
{
  name: "Turmeric",
  scientificName: "Curcuma longa",
  category: "herb",
  dataSources: [
    { name: "PubChem", reliability: 95 },
    { name: "WHO", reliability: 100 },
    { name: "MSKCC", reliability: 95 }
  ],
  safety: {
    generalSafety: "safe",
    validationScore: 85,
    sideEffects: [...],
    contraindications: [...]
  },
  conditions: [
    { 
      name: "inflammation", 
      effectiveness: "proven",
      evidence: { studies: 45, quality: "high" }
    }
  ],
  attribution: "Data sourced from: PubChem, WHO, MSKCC..."
}
```

## Benefits

1. **Authoritative Sources**: Only trusted medical databases
2. **AI Validation**: Every remedy analyzed for safety
3. **Comprehensive Coverage**: 40+ common remedies tracked
4. **Nightly Updates**: Always current information
5. **Safety First**: Dangerous substances automatically excluded
6. **Proper Attribution**: All sources credited

## Testing

To test the ingestion system:
```bash
# Set in .env
NODE_ENV=development
ENABLE_DATA_INGESTION=true

# Run server
npm start

# Check logs for "Running test ingestion..."
```

## Production Deployment

1. Set up MongoDB Atlas or similar
2. Add `MONGODB_URI` to Render environment
3. Set `ENABLE_DATA_INGESTION=true`
4. Deploy and monitor logs

Your app now has a world-class natural remedies database that prioritizes user safety!