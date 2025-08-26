const axios = require('axios');
const NodeCache = require('node-cache');

// Create cache instances for each API (24 hour TTL)
const pubchemCache = new NodeCache({ stdTTL: 86400 });
const whoCache = new NodeCache({ stdTTL: 86400 });
const mskccCache = new NodeCache({ stdTTL: 86400 });

/**
 * PubChem API Integration
 * National Institutes of Health chemical database
 */
class PubChemAPI {
  constructor() {
    this.baseURL = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug';
  }

  async searchCompound(name) {
    const cacheKey = `pubchem_${name.toLowerCase()}`;
    const cached = pubchemCache.get(cacheKey);
    if (cached) return cached;

    try {
      // Search for compound by name
      const searchResponse = await axios.get(
        `${this.baseURL}/compound/name/${encodeURIComponent(name)}/cids/JSON`
      );
      
      if (!searchResponse.data.IdentifierList?.CID?.length) {
        return null;
      }

      const cid = searchResponse.data.IdentifierList.CID[0];
      
      // Get compound properties
      const propertiesResponse = await axios.get(
        `${this.baseURL}/compound/cid/${cid}/property/MolecularFormula,MolecularWeight,IUPACName,InChIKey/JSON`
      );
      
      // Get pharmacology data
      const pharmacologyResponse = await axios.get(
        `${this.baseURL}/compound/cid/${cid}/assaysummary/JSON`
      ).catch(() => ({ data: {} }));

      const result = {
        cid,
        name: name,
        properties: propertiesResponse.data.PropertyTable?.Properties?.[0] || {},
        pharmacology: pharmacologyResponse.data,
        similarCompounds: await this.getSimilarCompounds(cid)
      };

      pubchemCache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error('PubChem API error:', error.message);
      return null;
    }
  }

  async getSimilarCompounds(cid) {
    try {
      const response = await axios.get(
        `${this.baseURL}/compound/fastsimilarity_2d/cid/${cid}/cids/JSON?Threshold=95&MaxRecords=5`
      );
      return response.data.IdentifierList?.CID || [];
    } catch (error) {
      return [];
    }
  }

  async getNaturalSources(compound) {
    try {
      // Search PubChem for natural sources mentions
      const response = await axios.get(
        `${this.baseURL}/compound/name/${encodeURIComponent(compound)}/synonyms/JSON`
      );
      
      const synonyms = response.data.InformationList?.Information?.[0]?.Synonym || [];
      
      // Filter for natural source indicators
      const naturalSources = synonyms.filter(syn => 
        /extract|natural|plant|herb|bark|root|leaf|flower|seed/i.test(syn)
      );
      
      return naturalSources;
    } catch (error) {
      return [];
    }
  }
}

/**
 * WHO Traditional Medicine Database Integration
 * World Health Organization traditional medicine data
 */
class WHOTMDB {
  constructor() {
    // WHO doesn't have a direct API, so we'll use their published data
    this.traditionalMedicines = {
      'willow bark': {
        scientificName: 'Salix alba',
        traditionalUse: 'Pain relief, fever reduction',
        modernEquivalent: 'Aspirin',
        regions: ['Europe', 'Asia', 'North America'],
        preparation: 'Decoction of bark, standardized extract',
        dosage: '240-480mg standardized extract daily',
        safety: 'Generally safe, avoid if allergic to aspirin'
      },
      'turmeric': {
        scientificName: 'Curcuma longa',
        traditionalUse: 'Inflammation, digestive issues, wound healing',
        modernEquivalent: 'NSAIDs',
        regions: ['India', 'Southeast Asia'],
        preparation: 'Powder, extract with piperine',
        dosage: '500-2000mg curcumin with black pepper',
        safety: 'Safe in food amounts, high doses may interact with medications'
      },
      'ginger': {
        scientificName: 'Zingiber officinale',
        traditionalUse: 'Nausea, digestive issues, inflammation',
        modernEquivalent: 'Antiemetics, NSAIDs',
        regions: ['Asia', 'Africa'],
        preparation: 'Fresh root, dried powder, extract',
        dosage: '250-1000mg daily or 2-4g fresh',
        safety: 'Generally safe, may interact with blood thinners'
      },
      'echinacea': {
        scientificName: 'Echinacea purpurea',
        traditionalUse: 'Immune support, cold prevention',
        modernEquivalent: 'Immune modulators',
        regions: ['North America'],
        preparation: 'Tincture, standardized extract, tea',
        dosage: '300-500mg standardized extract 3x daily',
        safety: 'Short-term use recommended, avoid with autoimmune conditions'
      },
      'valerian': {
        scientificName: 'Valeriana officinalis',
        traditionalUse: 'Sleep, anxiety, nervous tension',
        modernEquivalent: 'Benzodiazepines',
        regions: ['Europe', 'Asia'],
        preparation: 'Root extract, tincture',
        dosage: '300-600mg before bed',
        safety: 'May cause drowsiness, avoid with sedatives'
      },
      'st johns wort': {
        scientificName: 'Hypericum perforatum',
        traditionalUse: 'Depression, anxiety, nerve pain',
        modernEquivalent: 'SSRIs',
        regions: ['Europe', 'Asia'],
        preparation: 'Standardized extract',
        dosage: '300mg 3x daily standardized to 0.3% hypericin',
        safety: 'Many drug interactions, increases sun sensitivity'
      }
    };
  }

  async searchTraditionalMedicine(query) {
    const cacheKey = `who_${query.toLowerCase()}`;
    const cached = whoCache.get(cacheKey);
    if (cached) return cached;

    const results = [];
    const searchTerm = query.toLowerCase();

    // Search through traditional medicines
    for (const [name, data] of Object.entries(this.traditionalMedicines)) {
      if (name.includes(searchTerm) || 
          data.modernEquivalent.toLowerCase().includes(searchTerm) ||
          data.traditionalUse.toLowerCase().includes(searchTerm)) {
        results.push({ name, ...data });
      }
    }

    whoCache.set(cacheKey, results);
    return results;
  }

  async getByModernEquivalent(medication) {
    const results = [];
    for (const [name, data] of Object.entries(this.traditionalMedicines)) {
      if (data.modernEquivalent.toLowerCase().includes(medication.toLowerCase())) {
        results.push({ name, ...data });
      }
    }
    return results;
  }
}

/**
 * Memorial Sloan Kettering Cancer Center 
 * Herbs & Supplements Database Integration
 */
class MSKCCDB {
  constructor() {
    // MSKCC data based on their published integrative medicine database
    this.herbsDatabase = {
      'ashwagandha': {
        scientificName: 'Withania somnifera',
        commonUses: ['Stress', 'Anxiety', 'Energy', 'Immune support'],
        mechanism: 'Adaptogenic properties, GABA-mimetic activity',
        clinicalEvidence: 'Moderate evidence for stress and anxiety',
        dosage: '300-600mg standardized extract daily',
        interactions: ['May enhance sedatives', 'May affect thyroid hormones'],
        contraindications: ['Pregnancy', 'Autoimmune diseases'],
        sideEffects: ['Drowsiness', 'GI upset'],
        references: ['PMID: 31517876', 'PMID: 23439798']
      },
      'milk thistle': {
        scientificName: 'Silybum marianum',
        commonUses: ['Liver health', 'Hepatitis', 'Cirrhosis'],
        mechanism: 'Antioxidant, anti-inflammatory, hepatoprotective',
        clinicalEvidence: 'Good evidence for liver protection',
        dosage: '140mg silymarin 3x daily',
        interactions: ['May affect drug metabolism'],
        contraindications: ['Allergy to Asteraceae family'],
        sideEffects: ['GI upset', 'Allergic reactions'],
        references: ['PMID: 27517806', 'PMID: 20564545']
      },
      'saw palmetto': {
        scientificName: 'Serenoa repens',
        commonUses: ['BPH', 'Prostate health', 'Hair loss'],
        mechanism: '5-alpha-reductase inhibition',
        clinicalEvidence: 'Mixed evidence for BPH symptoms',
        dosage: '160mg twice daily',
        interactions: ['May affect hormone levels'],
        contraindications: ['Pregnancy', 'Hormone-sensitive conditions'],
        sideEffects: ['GI upset', 'Headache'],
        references: ['PMID: 23253665', 'PMID: 21235387']
      },
      'rhodiola': {
        scientificName: 'Rhodiola rosea',
        commonUses: ['Fatigue', 'Stress', 'Depression', 'Athletic performance'],
        mechanism: 'Adaptogenic, affects neurotransmitters',
        clinicalEvidence: 'Promising for fatigue and mild depression',
        dosage: '200-600mg standardized extract daily',
        interactions: ['May affect antidepressants'],
        contraindications: ['Bipolar disorder'],
        sideEffects: ['Insomnia', 'Irritability'],
        references: ['PMID: 29325481', 'PMID: 26502953']
      },
      'green tea': {
        scientificName: 'Camellia sinensis',
        commonUses: ['Antioxidant', 'Weight loss', 'Cancer prevention'],
        mechanism: 'Polyphenols, EGCG antioxidant activity',
        clinicalEvidence: 'Good evidence for antioxidant effects',
        dosage: '250-500mg EGCG daily or 3-4 cups tea',
        interactions: ['May affect iron absorption', 'Contains caffeine'],
        contraindications: ['Iron deficiency anemia'],
        sideEffects: ['Caffeine-related effects', 'GI upset'],
        references: ['PMID: 29843466', 'PMID: 28864169']
      }
    };
  }

  async searchHerb(query) {
    const cacheKey = `mskcc_${query.toLowerCase()}`;
    const cached = mskccCache.get(cacheKey);
    if (cached) return cached;

    const results = [];
    const searchTerm = query.toLowerCase();

    for (const [name, data] of Object.entries(this.herbsDatabase)) {
      if (name.includes(searchTerm) ||
          data.scientificName.toLowerCase().includes(searchTerm) ||
          data.commonUses.some(use => use.toLowerCase().includes(searchTerm))) {
        results.push({ name, ...data });
      }
    }

    mskccCache.set(cacheKey, results);
    return results;
  }

  async getByCondition(condition) {
    const results = [];
    const searchCondition = condition.toLowerCase();

    for (const [name, data] of Object.entries(this.herbsDatabase)) {
      if (data.commonUses.some(use => use.toLowerCase().includes(searchCondition))) {
        results.push({ 
          name, 
          relevance: data.clinicalEvidence,
          ...data 
        });
      }
    }

    // Sort by clinical evidence strength
    return results.sort((a, b) => {
      const evidenceRank = { 'Good': 3, 'Promising': 2, 'Moderate': 1, 'Mixed': 0 };
      return (evidenceRank[b.clinicalEvidence] || 0) - (evidenceRank[a.clinicalEvidence] || 0);
    });
  }
}

// Combined API service
class IntegratedNaturalAPI {
  constructor() {
    this.pubchem = new PubChemAPI();
    this.who = new WHOTMDB();
    this.mskcc = new MSKCCDB();
  }

  async getComprehensiveAlternatives(medication) {
    try {
      const [pubchemData, whoData, mskccData] = await Promise.all([
        this.pubchem.searchCompound(medication),
        this.who.getByModernEquivalent(medication),
        this.mskcc.searchHerb(medication)
      ]);

      // Get natural sources from PubChem
      const naturalSources = pubchemData ? 
        await this.pubchem.getNaturalSources(medication) : [];

      return {
        medication,
        chemicalData: pubchemData,
        traditionalMedicine: whoData,
        herbsSupplements: mskccData,
        naturalSources,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Integrated API error:', error);
      return null;
    }
  }

  async searchByCondition(condition) {
    const [whoResults, mskccResults] = await Promise.all([
      this.who.searchTraditionalMedicine(condition),
      this.mskcc.getByCondition(condition)
    ]);

    return {
      condition,
      traditionalRemedies: whoResults,
      modernSupplements: mskccResults,
      recommendations: this.generateRecommendations(whoResults, mskccResults)
    };
  }

  generateRecommendations(traditional, modern) {
    const recommendations = [];
    
    // Combine and deduplicate
    const seen = new Set();
    
    [...traditional, ...modern].forEach(item => {
      const key = item.scientificName || item.name;
      if (!seen.has(key)) {
        seen.add(key);
        recommendations.push({
          name: item.name,
          scientificName: item.scientificName,
          evidence: item.clinicalEvidence || 'Traditional use',
          dosage: item.dosage,
          safety: item.safety || item.sideEffects
        });
      }
    });

    return recommendations;
  }
}

module.exports = {
  PubChemAPI,
  WHOTMDB,
  MSKCCDB,
  IntegratedNaturalAPI
};