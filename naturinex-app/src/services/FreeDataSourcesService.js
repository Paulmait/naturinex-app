// Free and Reputable Data Sources Service
// Uses only free, reliable APIs for medical data

class FreeDataSourcesService {
  constructor() {
    this.sources = {
      // NIH/NLM APIs (US National Institutes of Health) - FREE
      pubmed: {
        base: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils',
        key: 'free', // No API key required for basic usage
        rateLimit: 3, // 3 requests per second
      },
      
      // FDA APIs - FREE
      fda: {
        drugs: 'https://api.fda.gov/drug',
        labels: 'https://api.fda.gov/drug/label.json',
        events: 'https://api.fda.gov/drug/event.json',
        key: 'free', // No key required
      },
      
      // RxNorm (NIH) - FREE
      rxnorm: {
        base: 'https://rxnav.nlm.nih.gov/REST',
        key: 'free',
      },
      
      // OpenFDA - FREE
      openFDA: {
        base: 'https://api.fda.gov',
        key: 'free',
      },
      
      // DailyMed (NIH) - FREE
      dailymed: {
        base: 'https://dailymed.nlm.nih.gov/dailymed/services',
        key: 'free',
      },
      
      // MedlinePlus - FREE
      medlinePlus: {
        base: 'https://connect.medlineplus.gov/service',
        key: 'free',
      },
      
      // WHO APIs - FREE
      who: {
        icd: 'https://id.who.int/icd/release/11',
        key: 'free', // Registration required but free
      },
      
      // Natural Medicines Database (Limited Free Access)
      naturalMedicines: {
        base: 'https://naturalmedicines.therapeuticresearch.com',
        key: 'limited_free',
      },
    };
  }

  // Get drug information from FDA
  async getFDADrugInfo(drugName) {
    try {
      const response = await fetch(
        `${this.sources.fda.labels}?search=openfda.brand_name:"${drugName}"&limit=1`
      );
      
      if (!response.ok) throw new Error('FDA API error');
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const drug = data.results[0];
        return {
          name: drug.openfda?.brand_name?.[0] || drugName,
          genericName: drug.openfda?.generic_name?.[0],
          purpose: drug.purpose?.[0],
          warnings: drug.warnings?.[0],
          dosage: drug.dosage_and_administration?.[0],
          activeIngredient: drug.active_ingredient?.[0],
          interactions: drug.drug_interactions?.[0],
          contraindications: drug.contraindications?.[0],
          adverseReactions: drug.adverse_reactions?.[0],
          source: 'FDA',
        };
      }
      
      return null;
    } catch (error) {
      console.error('FDA API error:', error);
      return null;
    }
  }

  // Get drug interactions from RxNorm
  async getRxNormInteractions(rxcui) {
    try {
      const response = await fetch(
        `${this.sources.rxnorm.base}/interaction/interaction.json?rxcui=${rxcui}`
      );
      
      if (!response.ok) throw new Error('RxNorm API error');
      
      const data = await response.json();
      
      if (data.interactionTypeGroup) {
        return data.interactionTypeGroup.flatMap(group => 
          group.interactionType || []
        ).map(interaction => ({
          drug: interaction.minConceptItem?.name,
          severity: interaction.severity,
          description: interaction.description,
          source: 'RxNorm/NIH',
        }));
      }
      
      return [];
    } catch (error) {
      console.error('RxNorm API error:', error);
      return [];
    }
  }

  // Search PubMed for research
  async searchPubMedStudies(query, limit = 5) {
    try {
      // Search for IDs
      const searchResponse = await fetch(
        `${this.sources.pubmed.base}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmode=json&retmax=${limit}`
      );
      
      if (!searchResponse.ok) throw new Error('PubMed search error');
      
      const searchData = await searchResponse.json();
      const ids = searchData.esearchresult?.idlist || [];
      
      if (ids.length === 0) return [];
      
      // Fetch article details
      const summaryResponse = await fetch(
        `${this.sources.pubmed.base}/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`
      );
      
      if (!summaryResponse.ok) throw new Error('PubMed summary error');
      
      const summaryData = await summaryResponse.json();
      const articles = [];
      
      for (const id of ids) {
        const article = summaryData.result?.[id];
        if (article) {
          articles.push({
            title: article.title,
            authors: article.authors?.map(a => a.name).join(', '),
            journal: article.source,
            year: article.pubdate?.split(' ')[0],
            pmid: id,
            url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
            source: 'PubMed/NIH',
          });
        }
      }
      
      return articles;
    } catch (error) {
      console.error('PubMed API error:', error);
      return [];
    }
  }

  // Get natural alternatives from combined sources
  async getNaturalAlternatives(medication) {
    try {
      // Search PubMed for natural alternatives research
      const studies = await this.searchPubMedStudies(
        `${medication} natural alternative herbal supplement`,
        10
      );
      
      // Get FDA adverse events for the medication
      const adverseEvents = await this.getFDAAdverseEvents(medication);
      
      // Combine and analyze data
      const alternatives = this.analyzeStudiesForAlternatives(studies);
      
      return {
        medication,
        alternatives,
        studies,
        adverseEvents,
        disclaimer: 'Information from NIH/FDA public databases. Consult healthcare provider.',
        sources: ['PubMed/NIH', 'FDA', 'RxNorm'],
      };
    } catch (error) {
      console.error('Error getting natural alternatives:', error);
      return {
        medication,
        alternatives: [],
        error: 'Unable to fetch data',
      };
    }
  }

  // Get FDA adverse events
  async getFDAAdverseEvents(drugName) {
    try {
      const response = await fetch(
        `${this.sources.fda.events}?search=patient.drug.openfda.brand_name:"${drugName}"&limit=10`
      );
      
      if (!response.ok) throw new Error('FDA events API error');
      
      const data = await response.json();
      
      if (data.results) {
        const events = {};
        data.results.forEach(result => {
          result.patient?.reaction?.forEach(reaction => {
            const term = reaction.reactionmeddrapt;
            events[term] = (events[term] || 0) + 1;
          });
        });
        
        return Object.entries(events)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([reaction, count]) => ({
            reaction,
            count,
            source: 'FDA Adverse Event Reporting',
          }));
      }
      
      return [];
    } catch (error) {
      console.error('FDA events API error:', error);
      return [];
    }
  }

  // Get medication info from DailyMed
  async getDailyMedInfo(drugName) {
    try {
      const response = await fetch(
        `${this.sources.dailymed.base}/v2/spls.json?drug_name=${encodeURIComponent(drugName)}`
      );
      
      if (!response.ok) throw new Error('DailyMed API error');
      
      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        const spl = data.data[0];
        return {
          name: spl.drug_name,
          labeler: spl.labeler_name,
          packageDescription: spl.package_description,
          splId: spl.spl_id,
          setId: spl.setid,
          source: 'DailyMed/NIH',
        };
      }
      
      return null;
    } catch (error) {
      console.error('DailyMed API error:', error);
      return null;
    }
  }

  // Analyze studies for natural alternatives
  analyzeStudiesForAlternatives(studies) {
    const alternatives = new Map();
    
    // Common natural alternatives keywords
    const naturalKeywords = [
      'turmeric', 'curcumin', 'ginger', 'garlic', 'omega-3',
      'probiotics', 'vitamin d', 'magnesium', 'zinc', 'quercetin',
      'green tea', 'resveratrol', 'coq10', 'ashwagandha', 'valerian',
      'melatonin', 'cbd', 'glucosamine', 'chondroitin', 'saw palmetto',
      'echinacea', 'ginkgo', 'st johns wort', 'milk thistle', 'ginseng',
    ];
    
    studies.forEach(study => {
      const text = (study.title + ' ' + study.journal).toLowerCase();
      
      naturalKeywords.forEach(keyword => {
        if (text.includes(keyword)) {
          if (!alternatives.has(keyword)) {
            alternatives.set(keyword, {
              name: keyword.charAt(0).toUpperCase() + keyword.slice(1),
              studies: [],
              evidenceLevel: 'Research Available',
            });
          }
          alternatives.get(keyword).studies.push(study);
        }
      });
    });
    
    return Array.from(alternatives.values());
  }

  // Get comprehensive medication data
  async getComprehensiveMedicationData(medication) {
    const [fdaInfo, dailyMedInfo, studies] = await Promise.all([
      this.getFDADrugInfo(medication),
      this.getDailyMedInfo(medication),
      this.searchPubMedStudies(medication, 5),
    ]);
    
    return {
      medication,
      fda: fdaInfo,
      dailyMed: dailyMedInfo,
      research: studies,
      timestamp: new Date().toISOString(),
      sources: {
        fda: 'FDA (Free)',
        nih: 'NIH/PubMed (Free)',
        dailyMed: 'DailyMed/NIH (Free)',
      },
    };
  }

  // Verify all free APIs are accessible
  async verifyDataSources() {
    const status = {};
    
    // Test FDA API
    try {
      const fdaTest = await fetch(`${this.sources.fda.labels}?limit=1`);
      status.fda = fdaTest.ok ? 'operational' : 'error';
    } catch {
      status.fda = 'unreachable';
    }
    
    // Test PubMed API
    try {
      const pubmedTest = await fetch(
        `${this.sources.pubmed.base}/esearch.fcgi?db=pubmed&term=test&retmode=json&retmax=1`
      );
      status.pubmed = pubmedTest.ok ? 'operational' : 'error';
    } catch {
      status.pubmed = 'unreachable';
    }
    
    // Test RxNorm API
    try {
      const rxnormTest = await fetch(
        `${this.sources.rxnorm.base}/rxcui/1234.json`
      );
      status.rxnorm = rxnormTest.ok ? 'operational' : 'error';
    } catch {
      status.rxnorm = 'unreachable';
    }
    
    return {
      status,
      allOperational: Object.values(status).every(s => s === 'operational'),
      timestamp: new Date().toISOString(),
    };
  }
}

// Singleton instance
const freeDataSourcesService = new FreeDataSourcesService();

export default freeDataSourcesService;

// Export convenience functions
export const getFDADrugInfo = (drug) => freeDataSourcesService.getFDADrugInfo(drug);
export const getRxNormInteractions = (rxcui) => freeDataSourcesService.getRxNormInteractions(rxcui);
export const searchPubMedStudies = (query, limit) => freeDataSourcesService.searchPubMedStudies(query, limit);
export const getNaturalAlternatives = (med) => freeDataSourcesService.getNaturalAlternatives(med);
export const verifyDataSources = () => freeDataSourcesService.verifyDataSources();