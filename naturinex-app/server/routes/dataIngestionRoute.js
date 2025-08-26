const express = require('express');
const router = express.Router();
const NaturalRemedy = require('../models/naturalRemedySchema');

// Basic remedy data
const basicRemedies = [
  {
    name: 'Turmeric',
    scientificName: 'Curcuma longa',
    category: 'herb',
    activeCompounds: ['curcumin'],
    benefits: ['anti-inflammatory', 'antioxidant'],
    uses: ['arthritis', 'inflammation'],
    description: 'Turmeric is a bright yellow spice with anti-inflammatory properties.',
    safety: { generalSafety: 'safe', pregnancySafety: 'likely-safe', lactationSafety: 'likely-safe' },
    dataSources: [{ name: 'Manual', lastUpdated: new Date(), reliability: 85 }]
  },
  {
    name: 'Ginger',
    scientificName: 'Zingiber officinale',
    category: 'herb',
    activeCompounds: ['gingerol'],
    benefits: ['nausea relief', 'anti-inflammatory'],
    uses: ['nausea', 'motion sickness'],
    description: 'Ginger is widely used for nausea relief and digestive health.',
    safety: { generalSafety: 'safe', pregnancySafety: 'likely-safe', lactationSafety: 'likely-safe' },
    dataSources: [{ name: 'Manual', lastUpdated: new Date(), reliability: 85 }]
  },
  {
    name: 'Garlic',
    scientificName: 'Allium sativum',
    category: 'herb',
    activeCompounds: ['allicin'],
    benefits: ['cardiovascular health', 'immune support'],
    uses: ['high blood pressure', 'cholesterol'],
    description: 'Garlic has been used for cardiovascular and immune health.',
    safety: { generalSafety: 'safe', pregnancySafety: 'likely-safe', lactationSafety: 'likely-safe' },
    dataSources: [{ name: 'Manual', lastUpdated: new Date(), reliability: 85 }]
  },
  {
    name: 'Echinacea',
    scientificName: 'Echinacea purpurea',
    category: 'herb',
    activeCompounds: ['alkamides'],
    benefits: ['immune support', 'cold prevention'],
    uses: ['common cold', 'flu prevention'],
    description: 'Echinacea is commonly used for immune support and cold prevention.',
    safety: { generalSafety: 'safe', pregnancySafety: 'unknown', lactationSafety: 'unknown' },
    dataSources: [{ name: 'Manual', lastUpdated: new Date(), reliability: 85 }]
  },
  {
    name: 'Chamomile',
    scientificName: 'Matricaria chamomilla',
    category: 'herb',
    activeCompounds: ['apigenin'],
    benefits: ['sleep aid', 'anxiety relief'],
    uses: ['insomnia', 'anxiety'],
    description: 'Chamomile is used for relaxation and sleep support.',
    safety: { generalSafety: 'safe', pregnancySafety: 'likely-safe', lactationSafety: 'likely-safe' },
    dataSources: [{ name: 'Manual', lastUpdated: new Date(), reliability: 85 }]
  }
];

// Data ingestion endpoint (protected)
router.post('/ingest-basic', async (req, res) => {
  try {
    // Simple auth check
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('Starting basic data ingestion...');
    
    // Clear existing data
    await NaturalRemedy.deleteMany({});
    
    // Insert basic remedies
    const results = await NaturalRemedy.insertMany(basicRemedies);
    
    console.log(`Successfully ingested ${results.length} remedies`);
    
    res.json({
      success: true,
      message: `Successfully ingested ${results.length} remedies`,
      remedies: results.map(r => r.name)
    });
    
  } catch (error) {
    console.error('Ingestion error:', error);
    res.status(500).json({ 
      error: 'Failed to ingest data',
      message: error.message 
    });
  }
});

module.exports = router;