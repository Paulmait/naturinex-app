const axios = require('axios');
const cheerio = require('cheerio');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const NaturalRemedy = require('../../models/naturalRemedySchema');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

class WHOScraper {
  constructor() {
    // WHO Traditional Medicine databases
    this.sources = {
      monographs: 'https://www.who.int/publications/i/item/9789241511476',
      essentialMedicines: 'https://www.who.int/publications/i/item/WHO-MHP-HPS-EML-2023.02',
      traditionalMedicine: 'https://www.who.int/health-topics/traditional-complementary-and-integrative-medicine'
    };
  }

  /**
   * Scrape WHO monographs for herbal medicines
   */
  async scrapeHerbalMedicines(herbs) {
    const results = [];
    
    for (const herb of herbs) {
      try {
        console.log(`Scraping WHO data for: ${herb}`);
        
        // Search WHO database (Note: WHO doesn't have a public API, so we use AI to process known data)
        const whoData = await this.getWHOData(herb);
        
        // Process with AI for comprehensive analysis
        const aiAnalysis = await this.analyzeWithAI(herb, whoData);
        
        // Create structured data
        const remedyData = {
          name: herb,
          scientificName: aiAnalysis.scientificName || herb,
          commonNames: aiAnalysis.commonNames || [],
          category: 'herb',
          dataSources: [{
            name: 'WHO',
            sourceId: `WHO-${herb.replace(/\s+/g, '-').toLowerCase()}`,
            url: this.sources.monographs,
            lastUpdated: new Date(),
            reliability: 100 // WHO is highly reliable
          }],
          conditions: aiAnalysis.conditions || [],
          safety: {
            generalSafety: aiAnalysis.safety || 'moderate',
            sideEffects: aiAnalysis.sideEffects || [],
            contraindications: aiAnalysis.contraindications || [],
            pregnancySafety: aiAnalysis.pregnancySafety || 'unknown',
            lactationSafety: aiAnalysis.lactationSafety || 'unknown'
          },
          interactions: {
            medications: aiAnalysis.drugInteractions || [],
            supplements: aiAnalysis.supplementInteractions || [],
            conditions: aiAnalysis.conditionInteractions || []
          },
          dosage: aiAnalysis.dosage || {},
          activeCompounds: aiAnalysis.activeCompounds || [],
          mechanism: aiAnalysis.mechanism || '',
          qualityScore: this.calculateQualityScore(aiAnalysis),
          reviewedBy: 'AI',
          status: 'active'
        };
        
        results.push(remedyData);
        
        // Rate limiting
        await this.delay(1000);
        
      } catch (error) {
        console.error(`Error scraping WHO data for ${herb}:`, error.message);
      }
    }
    
    return results;
  }

  /**
   * Get WHO data (simulated - in production, would parse WHO documents)
   */
  async getWHOData(herb) {
    // In a real implementation, this would fetch and parse WHO monographs
    // For now, we'll use known WHO-approved herbs
    const whoApprovedHerbs = {
      'ginger': {
        approved: true,
        uses: ['nausea', 'motion sickness', 'morning sickness'],
        safety: 'Generally recognized as safe'
      },
      'turmeric': {
        approved: true,
        uses: ['inflammation', 'digestive disorders'],
        safety: 'Safe in culinary amounts'
      },
      'echinacea': {
        approved: true,
        uses: ['common cold', 'upper respiratory infections'],
        safety: 'Short-term use is safe'
      },
      'chamomile': {
        approved: true,
        uses: ['mild anxiety', 'sleep disorders', 'digestive upset'],
        safety: 'Generally safe, avoid if allergic to ragweed'
      },
      'garlic': {
        approved: true,
        uses: ['cardiovascular health', 'antimicrobial'],
        safety: 'Safe in dietary amounts'
      }
    };
    
    return whoApprovedHerbs[herb.toLowerCase()] || { approved: false };
  }

  /**
   * Analyze herb with AI using WHO standards
   */
  async analyzeWithAI(herb, whoData) {
    try {
      const prompt = `
        Analyze this herbal medicine according to WHO Traditional Medicine standards:
        
        Herb: ${herb}
        WHO Status: ${whoData.approved ? 'Approved' : 'Not in WHO database'}
        Known Uses: ${whoData.uses?.join(', ') || 'Unknown'}
        WHO Safety Notes: ${whoData.safety || 'No data'}
        
        Provide comprehensive analysis following WHO guidelines:
        1. Scientific name and common names
        2. Medical conditions with evidence levels (following WHO evidence standards)
        3. Safety assessment based on WHO criteria
        4. Side effects with frequency data
        5. Drug and supplement interactions
        6. Contraindications (especially vulnerable populations)
        7. Pregnancy and lactation safety (WHO categories)
        8. Dosage recommendations (traditional and modern)
        9. Active compounds
        10. Mechanism of action
        
        Format as JSON with these exact fields:
        {
          "scientificName": "",
          "commonNames": [],
          "conditions": [{"name": "", "effectiveness": "", "evidence": {"studies": 0, "quality": ""}}],
          "safety": "",
          "sideEffects": [{"effect": "", "frequency": "", "severity": ""}],
          "drugInteractions": [{"name": "", "severity": "", "description": ""}],
          "supplementInteractions": [{"name": "", "severity": "", "description": ""}],
          "contraindications": [],
          "pregnancySafety": "",
          "lactationSafety": "",
          "dosage": {
            "adult": {"typical": "", "max": "", "unit": "", "frequency": ""},
            "pediatric": {"typical": "", "max": "", "unit": "", "frequency": "", "ageRange": ""},
            "duration": {"typical": "", "max": ""}
          },
          "activeCompounds": [],
          "mechanism": "",
          "conditionInteractions": [{"condition": "", "concern": ""}]
        }
      `;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return {};
    } catch (error) {
      console.error('AI analysis error:', error.message);
      return {};
    }
  }

  /**
   * Calculate quality score based on WHO standards
   */
  calculateQualityScore(aiAnalysis) {
    let score = 60; // Base score for WHO data
    
    // Add points for comprehensive data
    if (aiAnalysis.scientificName) score += 5;
    if (aiAnalysis.conditions?.length > 0) score += 10;
    if (aiAnalysis.safety) score += 10;
    if (aiAnalysis.dosage?.adult) score += 10;
    if (aiAnalysis.activeCompounds?.length > 0) score += 5;
    
    return Math.min(score, 100);
  }

  /**
   * Delay helper for rate limiting
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = WHOScraper;