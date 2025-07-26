const admin = require('firebase-admin');
const axios = require('axios');
const { PubChemAPI, WHOTMDB, MSKCCDB } = require('../services/externalAPIs');
const { 
  transformers, 
  mergeSubstanceData, 
  validateSubstance 
} = require('../models/substanceSchema');

// Initialize APIs
const pubchem = new PubChemAPI();
const who = new WHOTMDB();
const mskcc = new MSKCCDB();

// Firestore collections
const db = admin.firestore();
const substancesCollection = db.collection('substances');
const ingestionLogsCollection = db.collection('ingestionLogs');

/**
 * Main ingestion orchestrator
 * Can be triggered by Cloud Tasks, Cloud Scheduler, or manual trigger
 */
async function runDataIngestion(options = {}) {
  const { 
    source = 'all', // 'pubchem', 'who', 'mskcc', 'all'
    batchSize = 50,
    substances = null // Array of specific substances to update
  } = options;
  
  const startTime = Date.now();
  const log = {
    id: `ingestion_${Date.now()}`,
    startTime: new Date(),
    source,
    status: 'running',
    stats: {
      processed: 0,
      succeeded: 0,
      failed: 0,
      skipped: 0
    },
    errors: []
  };
  
  try {
    // Create log entry
    await ingestionLogsCollection.doc(log.id).set(log);
    
    // Get substances to process
    const substancesToProcess = substances || await getSubstancesToProcess(source);
    
    // Process in batches
    for (let i = 0; i < substancesToProcess.length; i += batchSize) {
      const batch = substancesToProcess.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (substance) => {
        try {
          await ingestSubstance(substance, source);
          log.stats.succeeded++;
        } catch (error) {
          console.error(`Failed to ingest ${substance.name}:`, error);
          log.stats.failed++;
          log.errors.push({
            substance: substance.name,
            error: error.message,
            timestamp: new Date()
          });
        }
        log.stats.processed++;
      }));
      
      // Update progress
      await ingestionLogsCollection.doc(log.id).update({
        stats: log.stats,
        lastUpdate: new Date()
      });
      
      // Rate limiting pause
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Finalize log
    log.status = 'completed';
    log.endTime = new Date();
    log.duration = Date.now() - startTime;
    
    await ingestionLogsCollection.doc(log.id).update(log);
    
    return log;
  } catch (error) {
    log.status = 'failed';
    log.error = error.message;
    await ingestionLogsCollection.doc(log.id).update(log);
    throw error;
  }
}

/**
 * Ingest a single substance from specified sources
 */
async function ingestSubstance(substanceInfo, sources = 'all') {
  const { name, type = 'herb', id } = substanceInfo;
  const substanceId = id || `${type}_${name.toLowerCase().replace(/\s+/g, '_')}`;
  
  const results = [];
  const sourcesToUse = sources === 'all' ? ['pubchem', 'who', 'mskcc'] : [sources];
  
  // Fetch from each source
  for (const source of sourcesToUse) {
    try {
      let data = null;
      
      switch (source) {
        case 'pubchem':
          data = await ingestFromPubChem(name);
          break;
        case 'who':
          data = await ingestFromWHO(name);
          break;
        case 'mskcc':
          data = await ingestFromMSKCC(name);
          break;
      }
      
      if (data) {
        results.push({
          source,
          data: transformers[source](data)
        });
      }
    } catch (error) {
      console.error(`Error ingesting ${name} from ${source}:`, error);
    }
  }
  
  if (results.length === 0) {
    throw new Error(`No data found for ${name}`);
  }
  
  // Merge all source data
  const mergedData = mergeSubstanceData([
    { id: substanceId, type, names: { common: name } },
    ...results.map(r => r.data)
  ]);
  
  // Add metadata
  mergedData.metadata.sources = results.map(r => ({
    name: r.source,
    lastSync: new Date(),
    version: '1.0'
  }));
  
  // Validate
  const validation = validateSubstance(mergedData);
  if (!validation.valid) {
    console.warn(`Validation warnings for ${name}:`, validation.errors);
  }
  
  // Prepare for Firestore
  const firestoreData = prepareForFirestore(mergedData);
  
  // Save to Firestore
  await substancesCollection.doc(substanceId).set(firestoreData, { merge: true });
  
  // Update search index
  await updateSearchIndex(substanceId, firestoreData);
  
  return mergedData;
}

/**
 * Ingest from PubChem
 */
async function ingestFromPubChem(substanceName) {
  try {
    const data = await pubchem.searchCompound(substanceName);
    if (!data) return null;
    
    // Get additional data
    const naturalSources = await pubchem.getNaturalSources(substanceName);
    
    return {
      ...data,
      naturalSources
    };
  } catch (error) {
    console.error('PubChem ingestion error:', error);
    return null;
  }
}

/**
 * Ingest from WHO Traditional Medicine Database
 */
async function ingestFromWHO(substanceName) {
  try {
    const results = await who.searchTraditionalMedicine(substanceName);
    return results[0] || null;
  } catch (error) {
    console.error('WHO ingestion error:', error);
    return null;
  }
}

/**
 * Ingest from MSKCC
 */
async function ingestFromMSKCC(substanceName) {
  try {
    const results = await mskcc.searchHerb(substanceName);
    return results[0] || null;
  } catch (error) {
    console.error('MSKCC ingestion error:', error);
    return null;
  }
}

/**
 * Get list of substances to process
 */
async function getSubstancesToProcess(source) {
  // Priority substances list
  const prioritySubstances = [
    { name: 'Ashwagandha', type: 'herb' },
    { name: 'Turmeric', type: 'herb' },
    { name: 'Ginger', type: 'herb' },
    { name: 'Valerian', type: 'herb' },
    { name: 'Echinacea', type: 'herb' },
    { name: 'St Johns Wort', type: 'herb' },
    { name: 'Milk Thistle', type: 'herb' },
    { name: 'Saw Palmetto', type: 'herb' },
    { name: 'Ginkgo Biloba', type: 'herb' },
    { name: 'Garlic', type: 'herb' },
    { name: 'Green Tea', type: 'herb' },
    { name: 'Rhodiola', type: 'herb' },
    { name: 'Boswellia', type: 'herb' },
    { name: 'Feverfew', type: 'herb' },
    { name: 'Butterbur', type: 'herb' },
    { name: 'Devils Claw', type: 'herb' },
    { name: 'Quercetin', type: 'compound' },
    { name: 'Curcumin', type: 'compound' },
    { name: 'Resveratrol', type: 'compound' },
    { name: 'Omega-3', type: 'compound' },
    { name: 'Probiotics', type: 'compound' },
    { name: 'Melatonin', type: 'compound' },
    { name: 'Glucosamine', type: 'compound' },
    { name: 'Chondroitin', type: 'compound' },
    { name: 'CoQ10', type: 'compound' }
  ];
  
  // Check which need updating (older than 7 days)
  const needsUpdate = [];
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  for (const substance of prioritySubstances) {
    const id = `${substance.type}_${substance.name.toLowerCase().replace(/\s+/g, '_')}`;
    const doc = await substancesCollection.doc(id).get();
    
    if (!doc.exists || doc.data().lastUpdated?.toDate() < sevenDaysAgo) {
      needsUpdate.push(substance);
    }
  }
  
  return needsUpdate;
}

/**
 * Prepare data for Firestore storage
 */
function prepareForFirestore(data) {
  // Flatten for better querying
  const firestoreData = {
    // Top-level searchable fields
    commonName: data.names?.common || '',
    scientificName: data.names?.scientific || '',
    type: data.type,
    effectiveness: data.medicalUses?.map(use => use.condition) || [],
    safetyLevel: determineSafetyLevel(data.safety),
    
    // Full data
    ...data,
    
    // Search optimization
    searchText: generateSearchText(data),
    
    // Timestamps
    lastUpdated: admin.firestore.FieldValue.serverTimestamp()
  };
  
  return firestoreData;
}

/**
 * Determine overall safety level
 */
function determineSafetyLevel(safety) {
  if (!safety) return 'unknown';
  
  const hasSerious = safety.contraindications?.some(c => 
    /serious|dangerous|fatal|severe/i.test(c)
  );
  
  const hasMajorInteractions = safety.interactions?.some(i => 
    i.severity === 'major'
  );
  
  if (hasSerious || hasMajorInteractions) return 'caution';
  if (safety.sideEffects?.common?.length > 3) return 'moderate';
  return 'safe';
}

/**
 * Generate searchable text
 */
function generateSearchText(data) {
  const parts = [
    data.names?.common,
    data.names?.scientific,
    ...(data.names?.traditional || []),
    ...(data.medicalUses?.map(use => use.condition) || []),
    data.traditional?.systems?.join(' ')
  ].filter(Boolean);
  
  return parts.join(' ').toLowerCase();
}

/**
 * Update search index for better performance
 */
async function updateSearchIndex(substanceId, data) {
  // Create search index entries
  const indexEntries = [];
  
  // Index by condition
  for (const use of data.medicalUses || []) {
    indexEntries.push({
      type: 'condition',
      value: use.condition.toLowerCase(),
      substanceId,
      effectiveness: use.effectiveness
    });
  }
  
  // Index by name
  if (data.names?.common) {
    indexEntries.push({
      type: 'name',
      value: data.names.common.toLowerCase(),
      substanceId
    });
  }
  
  // Batch write to search index
  const batch = db.batch();
  for (const entry of indexEntries) {
    const docId = `${entry.type}_${entry.value}_${substanceId}`;
    batch.set(db.collection('searchIndex').doc(docId), entry);
  }
  await batch.commit();
}

// Cloud Function exports
module.exports = {
  runDataIngestion,
  ingestSubstance,
  
  // Cloud Function entry points
  scheduledIngestion: async (req, res) => {
    try {
      const result = await runDataIngestion({ source: 'all' });
      res.json({ success: true, result });
    } catch (error) {
      console.error('Scheduled ingestion error:', error);
      res.status(500).json({ error: error.message });
    }
  },
  
  manualIngestion: async (req, res) => {
    try {
      const { source, substances } = req.body;
      const result = await runDataIngestion({ source, substances });
      res.json({ success: true, result });
    } catch (error) {
      console.error('Manual ingestion error:', error);
      res.status(500).json({ error: error.message });
    }
  }
};