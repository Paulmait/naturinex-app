require('dotenv').config();
const mongoose = require('mongoose');
const NaturalRemedy = require('../models/naturalRemedySchema');

// Simple ingestion data for natural remedies
const remediesData = [
  {
    name: 'Turmeric',
    scientificName: 'Curcuma longa',
    category: 'herb',
    activeCompounds: ['curcumin', 'demethoxycurcumin', 'bisdemethoxycurcumin'],
    benefits: ['anti-inflammatory', 'antioxidant', 'pain relief', 'digestive health'],
    uses: ['arthritis', 'inflammation', 'digestive issues', 'wound healing'],
    dosage: '500-2000mg of curcumin daily',
    sideEffects: ['stomach upset', 'nausea', 'dizziness', 'diarrhea'],
    interactions: ['blood thinners', 'diabetes medications', 'stomach acid reducers'],
    description: 'Turmeric is a bright yellow spice commonly used in curry. Its active compound, curcumin, has powerful anti-inflammatory and antioxidant properties.',
    safety: {
      generalSafety: 'safe',
      pregnancySafety: 'likely-safe',
      lactationSafety: 'likely-safe'
    },
    dataSources: [{
      name: 'Manual',
      lastUpdated: new Date(),
      reliability: 85
    }]
  },
  {
    name: 'Ginger',
    scientificName: 'Zingiber officinale',
    category: 'herb',
    activeCompounds: ['gingerol', 'shogaol', 'zingerone'],
    benefits: ['nausea relief', 'anti-inflammatory', 'digestive aid', 'pain relief'],
    uses: ['nausea', 'motion sickness', 'morning sickness', 'arthritis', 'digestive issues'],
    dosage: '250-1000mg daily or 1-3g fresh ginger',
    sideEffects: ['heartburn', 'stomach upset', 'mouth irritation'],
    interactions: ['blood thinners', 'diabetes medications'],
    description: 'Ginger is a flowering plant whose rhizome is widely used as a spice and folk medicine. It has been used for thousands of years for various health conditions.'
  },
  {
    name: 'Garlic',
    scientificName: 'Allium sativum',
    category: 'herb',
    activeCompounds: ['allicin', 'alliin', 'ajoene'],
    benefits: ['cardiovascular health', 'immune support', 'antimicrobial', 'antioxidant'],
    uses: ['high blood pressure', 'high cholesterol', 'common cold', 'infections'],
    dosage: '600-1200mg aged garlic extract daily or 2-4 fresh cloves',
    sideEffects: ['bad breath', 'body odor', 'heartburn', 'upset stomach'],
    interactions: ['blood thinners', 'HIV medications', 'birth control pills'],
    description: 'Garlic is a species in the onion genus, Allium. It has been used both as a food flavoring and traditional medicine for centuries.'
  },
  {
    name: 'Echinacea',
    scientificName: 'Echinacea purpurea',
    category: 'herb',
    activeCompounds: ['alkamides', 'caffeic acid', 'polysaccharides'],
    benefits: ['immune support', 'cold prevention', 'anti-inflammatory', 'wound healing'],
    uses: ['common cold', 'flu prevention', 'upper respiratory infections', 'wound healing'],
    dosage: '300-500mg three times daily',
    sideEffects: ['nausea', 'stomach pain', 'allergic reactions', 'dizziness'],
    interactions: ['immunosuppressants', 'caffeine'],
    description: 'Echinacea is a group of herbaceous flowering plants in the daisy family. It is widely used to fight infections, especially the common cold and other upper respiratory infections.'
  },
  {
    name: 'Chamomile',
    scientificName: 'Matricaria chamomilla',
    category: 'herb',
    activeCompounds: ['apigenin', 'bisabolol', 'chamazulene'],
    benefits: ['sleep aid', 'anxiety relief', 'digestive aid', 'anti-inflammatory'],
    uses: ['insomnia', 'anxiety', 'digestive upset', 'skin irritation'],
    dosage: '400-1600mg daily or 1-4 cups of tea',
    sideEffects: ['allergic reactions', 'drowsiness', 'vomiting in large doses'],
    interactions: ['blood thinners', 'sedatives'],
    description: 'Chamomile is a daisy-like plant that has been used for centuries as a natural remedy for various health conditions, particularly for relaxation and sleep.'
  },
  {
    name: 'Peppermint',
    scientificName: 'Mentha × piperita',
    category: 'herb',
    activeCompounds: ['menthol', 'menthone', 'limonene'],
    benefits: ['digestive aid', 'headache relief', 'respiratory health', 'nausea relief'],
    uses: ['IBS', 'indigestion', 'headaches', 'common cold'],
    dosage: '450-750mg oil capsules daily or 1-2 cups tea',
    sideEffects: ['heartburn', 'allergic reactions', 'mouth sores'],
    interactions: ['antacids', 'diabetes medications'],
    description: 'Peppermint is a hybrid mint that is a cross between watermint and spearmint. It has been used for thousands of years for its pleasant taste and health benefits.'
  },
  {
    name: 'Lavender',
    scientificName: 'Lavandula angustifolia',
    category: 'herb',
    activeCompounds: ['linalool', 'linalyl acetate', 'camphor'],
    benefits: ['anxiety relief', 'sleep aid', 'pain relief', 'skin health'],
    uses: ['anxiety', 'insomnia', 'depression', 'skin irritation'],
    dosage: '80-160mg oil capsules daily or aromatherapy use',
    sideEffects: ['drowsiness', 'headache', 'constipation', 'skin irritation'],
    interactions: ['sedatives', 'blood pressure medications'],
    description: 'Lavender is a flowering plant in the mint family known for its sweet floral scent. It is commonly used in aromatherapy and has various medicinal properties.'
  },
  {
    name: 'Valerian',
    scientificName: 'Valeriana officinalis',
    category: 'herb',
    activeCompounds: ['valerenic acid', 'isovaleric acid', 'hesperidin'],
    benefits: ['sleep aid', 'anxiety relief', 'muscle relaxant', 'stress reduction'],
    uses: ['insomnia', 'anxiety', 'nervous tension', 'muscle cramps'],
    dosage: '300-600mg before bedtime',
    sideEffects: ['drowsiness', 'dizziness', 'stomach upset', 'headache'],
    interactions: ['sedatives', 'alcohol', 'anesthetics'],
    description: 'Valerian is a perennial flowering plant native to Europe and Asia. Its root has been used as a medicinal herb since ancient Greek and Roman times.'
  },
  {
    name: 'Milk Thistle',
    scientificName: 'Silybum marianum',
    category: 'herb',
    activeCompounds: ['silymarin', 'silybin', 'silydianin'],
    benefits: ['liver health', 'antioxidant', 'anti-inflammatory', 'blood sugar control'],
    uses: ['liver disease', 'hepatitis', 'cirrhosis', 'gallbladder disorders'],
    dosage: '200-400mg silymarin daily',
    sideEffects: ['diarrhea', 'nausea', 'bloating', 'allergic reactions'],
    interactions: ['diabetes medications', 'allergy medications'],
    description: 'Milk thistle is a flowering herb related to the daisy and ragweed family. It has been used for over 2,000 years as a natural treatment for liver and gallbladder disorders.'
  },
  {
    name: 'Ginseng',
    scientificName: 'Panax ginseng',
    category: 'herb',
    activeCompounds: ['ginsenosides', 'polysaccharides', 'peptidoglycans'],
    benefits: ['energy boost', 'cognitive function', 'immune support', 'blood sugar control'],
    uses: ['fatigue', 'cognitive decline', 'erectile dysfunction', 'flu prevention'],
    dosage: '200-400mg standardized extract daily',
    sideEffects: ['insomnia', 'headache', 'digestive issues', 'changes in blood pressure'],
    interactions: ['blood thinners', 'diabetes medications', 'MAO inhibitors'],
    description: 'Ginseng is a slow-growing perennial plant with fleshy roots. It has been used in traditional Chinese medicine for centuries as an adaptogen and energy booster.'
  }
];

async function runIngestion() {
  try {
    console.log('🌿 Starting data ingestion...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Clear existing data
    await NaturalRemedy.deleteMany({});
    console.log('🗑️  Cleared existing remedies');
    
    // Insert new data
    for (const remedy of remediesData) {
      // Add default safety if not present
      if (!remedy.safety) {
        remedy.safety = {
          generalSafety: 'safe',
          pregnancySafety: 'unknown',
          lactationSafety: 'unknown'
        };
      }
      
      // Add default data sources if not present
      if (!remedy.dataSources) {
        remedy.dataSources = [{
          name: 'Manual',
          lastUpdated: new Date(),
          reliability: 85
        }];
      }
      
      const newRemedy = new NaturalRemedy({
        ...remedy,
        source: 'manual_ingestion',
        lastUpdated: new Date(),
        metadata: {
          ingestionDate: new Date(),
          version: '1.0',
          validated: true
        }
      });
      
      await newRemedy.save();
      console.log(`✅ Saved: ${remedy.name}`);
    }
    
    console.log(`\n✨ Successfully ingested ${remediesData.length} remedies!`);
    
    // Test search
    const searchTest = await NaturalRemedy.find({ name: /turmeric/i });
    console.log(`\n🔍 Search test - Found ${searchTest.length} results for 'turmeric'`);
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error during ingestion:', error);
    process.exit(1);
  }
}

// Run the ingestion
runIngestion().then(() => {
  console.log('✅ Ingestion complete!');
  process.exit(0);
});