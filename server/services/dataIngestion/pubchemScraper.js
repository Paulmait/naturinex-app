const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const NaturalRemedy = require('../../models/naturalRemedySchema');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

class PubChemScraper {
  constructor() {
    this.baseUrl = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug';
    this.maxRetries = 3;
    this.retryDelay = 1000;
  }

  /**
   * Scrape natural compounds from PubChem
   */
  async scrapeNaturalCompounds(compounds) {
    const results = [];
    
    for (const compound of compounds) {
      try {
        console.log(`Scraping PubChem data for: ${compound}`);
        
        // Search for compound
        const cid = await this.searchCompound(compound);
        if (!cid) continue;
        
        // Get compound details
        const details = await this.getCompoundDetails(cid);
        
        // Get bioactivity data
        const bioactivity = await this.getBioactivity(cid);
        
        // Process with AI for safety and effectiveness analysis
        const aiAnalysis = await this.analyzeWithAI(details, bioactivity);
        
        // Create structured data
        const remedyData = {
          name: compound,
          scientificName: details.IUPACName || compound,
          commonNames: details.Synonyms?.slice(0, 5) || [],
          category: this.categorizeCompound(details),
          dataSources: [{
            name: 'PubChem',
            sourceId: cid.toString(),
            url: `https://pubchem.ncbi.nlm.nih.gov/compound/${cid}`,
            lastUpdated: new Date(),
            reliability: 95
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
            supplements: [],
            conditions: aiAnalysis.conditionInteractions || []
          },
          activeCompounds: [details.MolecularFormula],
          mechanism: aiAnalysis.mechanism || '',
          qualityScore: this.calculateQualityScore(details, bioactivity, aiAnalysis),
          reviewedBy: 'AI',
          status: 'active'
        };
        
        results.push(remedyData);
        
        // Rate limiting
        await this.delay(500);
        
      } catch (error) {
        console.error(`Error scraping ${compound}:`, error.message);
      }
    }
    
    return results;
  }

  /**
   * Search for compound ID
   */
  async searchCompound(name) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/compound/name/${encodeURIComponent(name)}/cids/JSON`
      );
      
      return response.data.IdentifierList?.CID?.[0];
    } catch (error) {
      console.error(`Compound not found: ${name}`);
      return null;
    }
  }

  /**
   * Get detailed compound information
   */
  async getCompoundDetails(cid) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/compound/cid/${cid}/property/MolecularFormula,MolecularWeight,IUPACName,CanonicalSMILES/JSON`
      );
      
      // Get synonyms
      const synonymResponse = await axios.get(
        `${this.baseUrl}/compound/cid/${cid}/synonyms/JSON`
      );
      
      const details = response.data.PropertyTable.Properties[0];
      details.Synonyms = synonymResponse.data.InformationList.Information[0].Synonym;
      
      return details;
    } catch (error) {
      console.error(`Error getting compound details:`, error.message);
      return {};
    }
  }

  /**
   * Get bioactivity data
   */
  async getBioactivity(cid) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/compound/cid/${cid}/assaysummary/JSON`
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error getting bioactivity:`, error.message);
      return {};
    }
  }

  /**
   * Analyze compound with AI for safety and medical uses
   */
  async analyzeWithAI(details, bioactivity) {
    try {
      const prompt = `
        Analyze this natural compound for medicinal use:
        
        Compound: ${details.IUPACName || 'Unknown'}
        Formula: ${details.MolecularFormula || 'Unknown'}
        Synonyms: ${details.Synonyms?.slice(0, 10).join(', ') || 'None'}
        
        Based on scientific evidence, provide:
        1. Medical conditions it may help (with effectiveness rating)
        2. General safety assessment (very-safe/safe/moderate/caution/dangerous)
        3. Common side effects (with frequency and severity)
        4. Drug interactions (major/moderate/minor)
        5. Contraindications
        6. Pregnancy and lactation safety
        7. Mechanism of action
        
        Format as JSON with these exact fields:
        {
          "conditions": [{"name": "", "effectiveness": "", "evidence": {"studies": 0, "quality": ""}}],
          "safety": "",
          "sideEffects": [{"effect": "", "frequency": "", "severity": ""}],
          "drugInteractions": [{"name": "", "severity": "", "description": ""}],
          "contraindications": [],
          "pregnancySafety": "",
          "lactationSafety": "",
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
   * Categorize compound type
   */
  categorizeCompound(details) {
    const formula = details.MolecularFormula?.toLowerCase() || '';
    
    if (formula.includes('vitamin')) return 'vitamin';
    if (details.IUPACName?.includes('acid')) return 'compound';
    if (details.Synonyms?.some(s => s.toLowerCase().includes('mineral'))) return 'mineral';
    
    return 'compound';
  }

  /**
   * Calculate quality score
   */
  calculateQualityScore(details, bioactivity, aiAnalysis) {
    let score = 50; // Base score
    
    // Add points for completeness
    if (details.MolecularFormula) score += 10;
    if (details.IUPACName) score += 10;
    if (aiAnalysis.conditions?.length > 0) score += 15;
    if (aiAnalysis.safety) score += 15;
    
    // Cap at 100
    return Math.min(score, 100);
  }

  /**
   * Delay helper for rate limiting
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = PubChemScraper;