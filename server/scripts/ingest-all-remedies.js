require('dotenv').config();
const mongoose = require('mongoose');
const { getNaturalRemediesData } = require('../services/dataIngestion');

async function ingestAllRemedies() {
  try {
    console.log('🌿 Starting full data ingestion for all remedies...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Full list of remedies to ingest
    const remedies = [
      'turmeric', 'ginger', 'garlic', 'honey', 'cinnamon',
      'green tea', 'chamomile', 'peppermint', 'lavender', 'echinacea',
      'ginseng', 'ashwagandha', 'valerian', 'elderberry', 'milk thistle',
      'st johns wort', 'saw palmetto', 'ginkgo biloba', 'hawthorn', 'feverfew',
      'black cohosh', 'evening primrose', 'tea tree oil', 'aloe vera', 'calendula',
      'arnica', 'witch hazel', 'eucalyptus', 'rosemary', 'thyme',
      'oregano oil', 'coconut oil', 'apple cider vinegar', 'lemon balm', 'passionflower'
    ];
    
    console.log(`📊 Ingesting data for ${remedies.length} remedies...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const remedy of remedies) {
      try {
        console.log(`\n🔄 Processing: ${remedy}`);
        const data = await getNaturalRemediesData(remedy);
        
        if (data && Object.keys(data).length > 0) {
          console.log(`✅ Successfully ingested data for: ${remedy}`);
          console.log(`   - PubChem: ${data.pubchem ? 'Yes' : 'No'}`);
          console.log(`   - WHO: ${data.who ? 'Yes' : 'No'}`);
          console.log(`   - MSKCC: ${data.mskcc ? 'Yes' : 'No'}`);
          successCount++;
        } else {
          console.log(`⚠️  Limited data found for: ${remedy}`);
          errorCount++;
        }
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`❌ Error ingesting ${remedy}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 INGESTION SUMMARY:');
    console.log(`✅ Successful: ${successCount} remedies`);
    console.log(`❌ Errors: ${errorCount} remedies`);
    console.log(`📈 Total processed: ${remedies.length} remedies`);
    console.log('='.repeat(50));
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Fatal error during ingestion:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  ingestAllRemedies().then(() => {
    console.log('✨ Full data ingestion completed!');
    process.exit(0);
  });
}

module.exports = { ingestAllRemedies };