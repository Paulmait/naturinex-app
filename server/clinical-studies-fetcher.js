/**
 * Clinical Studies Fetcher
 * Fetches and caches clinical studies from PubMed and ClinicalTrials.gov
 */

const admin = require('firebase-admin');
const fetch = require('node-fetch');
const cron = require('node-cron');

class ClinicalStudiesFetcher {
  constructor() {
    this.db = admin.firestore();
    this.pubmedBaseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
    this.clinicalTrialsUrl = 'https://clinicaltrials.gov/api/v2/studies';
    this.cacheDuration = 7 * 24 * 60 * 60 * 1000; // 7 days
    
    // Initialize CRON jobs
    this.initializeCronJobs();
  }

  /**
   * Initialize CRON jobs for fetching studies
   */
  initializeCronJobs() {
    // Weekly update of clinical studies (Sunday 3 AM)
    cron.schedule('0 3 * * 0', async () => {
      console.log('📚 Starting weekly clinical studies update...');
      await this.updateAllStudies();
    });

    // Daily update for trending medications (2:30 AM)
    cron.schedule('30 2 * * *', async () => {
      console.log('📚 Updating studies for trending medications...');
      await this.updateTrendingStudies();
    });
  }

  /**
   * Fetch clinical studies for a medication
   */
  async fetchStudies(medicationName, options = {}) {
    const {
      includeTrials = true,
      includePubMed = true,
      maxResults = 10,
      yearRange = 5
    } = options;

    const studies = {
      pubmed: [],
      clinicalTrials: [],
      metadata: {
        fetchedAt: new Date().toISOString(),
        medication: medicationName,
        totalCount: 0
      }
    };

    // Check cache first
    const cached = await this.getCachedStudies(medicationName);
    if (cached && !this.isCacheExpired(cached.fetchedAt)) {
      return cached;
    }

    // Fetch from PubMed
    if (includePubMed) {
      studies.pubmed = await this.fetchPubMedStudies(medicationName, maxResults, yearRange);
    }

    // Fetch from ClinicalTrials.gov
    if (includeTrials) {
      studies.clinicalTrials = await this.fetchClinicalTrials(medicationName, maxResults);
    }

    studies.metadata.totalCount = studies.pubmed.length + studies.clinicalTrials.length;

    // Cache the results
    await this.cacheStudies(medicationName, studies);

    return studies;
  }

  /**
   * Fetch studies from PubMed
   */
  async fetchPubMedStudies(medicationName, maxResults = 10, yearRange = 5) {
    try {
      const currentYear = new Date().getFullYear();
      const minYear = currentYear - yearRange;
      
      // Search query
      const searchQuery = encodeURIComponent(
        `${medicationName}[Title/Abstract] AND ${minYear}:${currentYear}[Publication Date] AND Clinical Trial[Publication Type]`
      );
      
      // First, get the list of PMIDs
      const searchUrl = `${this.pubmedBaseUrl}/esearch.fcgi?db=pubmed&term=${searchQuery}&retmax=${maxResults}&retmode=json&sort=relevance`;
      
      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json();
      
      if (!searchData.esearchresult || !searchData.esearchresult.idlist) {
        return [];
      }
      
      const pmids = searchData.esearchresult.idlist;
      
      if (pmids.length === 0) {
        return [];
      }
      
      // Fetch details for each PMID
      const summaryUrl = `${this.pubmedBaseUrl}/esummary.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=json`;
      const summaryResponse = await fetch(summaryUrl);
      const summaryData = await summaryResponse.json();
      
      const studies = [];
      
      for (const pmid of pmids) {
        const article = summaryData.result[pmid];
        if (article) {
          studies.push({
            id: pmid,
            title: article.title || 'Untitled',
            authors: article.authors ? article.authors.slice(0, 3).map(a => a.name).join(', ') : 'Unknown',
            journal: article.source || 'Unknown Journal',
            publicationDate: article.pubdate || 'Unknown Date',
            abstract: article.abstract || await this.fetchAbstract(pmid),
            url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
            type: 'PubMed',
            relevanceScore: this.calculateRelevance(article.title, medicationName)
          });
        }
      }
      
      return studies.sort((a, b) => b.relevanceScore - a.relevanceScore);
    } catch (error) {
      console.error('Error fetching PubMed studies:', error);
      return [];
    }
  }

  /**
   * Fetch abstract for a specific PMID
   */
  async fetchAbstract(pmid) {
    try {
      const url = `${this.pubmedBaseUrl}/efetch.fcgi?db=pubmed&id=${pmid}&retmode=text&rettype=abstract`;
      const response = await fetch(url);
      const text = await response.text();
      
      // Extract abstract section
      const abstractMatch = text.match(/ABSTRACT[\s\S]*?(?=\n\n|\nPMID)/);
      return abstractMatch ? abstractMatch[0].replace('ABSTRACT', '').trim() : 'No abstract available';
    } catch (error) {
      return 'Abstract not available';
    }
  }

  /**
   * Fetch clinical trials from ClinicalTrials.gov
   */
  async fetchClinicalTrials(medicationName, maxResults = 10) {
    try {
      const query = {
        'query.term': medicationName,
        'pageSize': maxResults,
        'countTotal': true,
        'sort': 'StartDate:desc'
      };
      
      const queryString = new URLSearchParams(query).toString();
      const response = await fetch(`${this.clinicalTrialsUrl}?${queryString}`);
      
      if (!response.ok) {
        throw new Error(`ClinicalTrials.gov API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.studies || data.studies.length === 0) {
        return [];
      }
      
      return data.studies.map(study => ({
        id: study.protocolSection?.identificationModule?.nctId || 'Unknown',
        title: study.protocolSection?.identificationModule?.briefTitle || 'Untitled',
        status: study.protocolSection?.statusModule?.overallStatus || 'Unknown',
        phase: study.protocolSection?.designModule?.phases?.join(', ') || 'Not Specified',
        startDate: study.protocolSection?.statusModule?.startDateStruct?.date || 'Unknown',
        completionDate: study.protocolSection?.statusModule?.completionDateStruct?.date || 'Ongoing',
        enrollment: study.protocolSection?.designModule?.enrollmentInfo?.count || 'Unknown',
        summary: study.protocolSection?.descriptionModule?.briefSummary || 'No summary available',
        conditions: study.protocolSection?.conditionsModule?.conditions || [],
        interventions: study.protocolSection?.armsInterventionsModule?.interventions?.map(i => i.name) || [],
        url: `https://clinicaltrials.gov/study/${study.protocolSection?.identificationModule?.nctId}`,
        type: 'ClinicalTrial',
        relevanceScore: this.calculateRelevance(
          study.protocolSection?.identificationModule?.briefTitle || '',
          medicationName
        )
      }));
    } catch (error) {
      console.error('Error fetching clinical trials:', error);
      return [];
    }
  }

  /**
   * Calculate relevance score
   */
  calculateRelevance(title, medicationName) {
    const titleLower = title.toLowerCase();
    const medLower = medicationName.toLowerCase();
    
    let score = 0;
    
    // Exact match
    if (titleLower.includes(medLower)) {
      score += 10;
    }
    
    // Partial matches
    const medWords = medLower.split(/\s+/);
    medWords.forEach(word => {
      if (word.length > 3 && titleLower.includes(word)) {
        score += 5;
      }
    });
    
    // Keywords that increase relevance
    const keywords = ['randomized', 'double-blind', 'placebo', 'efficacy', 'safety'];
    keywords.forEach(keyword => {
      if (titleLower.includes(keyword)) {
        score += 2;
      }
    });
    
    return score;
  }

  /**
   * Get cached studies
   */
  async getCachedStudies(medicationName) {
    try {
      const doc = await this.db
        .collection('clinicalStudies')
        .doc(medicationName.toLowerCase().replace(/\s+/g, '_'))
        .get();
      
      if (doc.exists) {
        return doc.data();
      }
      return null;
    } catch (error) {
      console.error('Error getting cached studies:', error);
      return null;
    }
  }

  /**
   * Cache studies in Firestore
   */
  async cacheStudies(medicationName, studies) {
    try {
      const docId = medicationName.toLowerCase().replace(/\s+/g, '_');
      
      await this.db
        .collection('clinicalStudies')
        .doc(docId)
        .set({
          ...studies,
          fetchedAt: admin.firestore.FieldValue.serverTimestamp(),
          expiresAt: new Date(Date.now() + this.cacheDuration)
        });
      
      // Also update search index
      await this.updateSearchIndex(medicationName, studies);
    } catch (error) {
      console.error('Error caching studies:', error);
    }
  }

  /**
   * Update search index for faster lookups
   */
  async updateSearchIndex(medicationName, studies) {
    try {
      const indexData = {
        medication: medicationName.toLowerCase(),
        totalStudies: studies.metadata.totalCount,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        hasRecentStudies: studies.pubmed.some(s => {
          const year = parseInt(s.publicationDate.match(/\d{4}/)?.[0] || '0');
          return year >= new Date().getFullYear() - 2;
        }),
        activeTrials: studies.clinicalTrials.filter(t => 
          ['Recruiting', 'Active', 'Enrolling'].some(status => 
            t.status.includes(status)
          )
        ).length
      };
      
      await this.db
        .collection('studiesIndex')
        .doc(medicationName.toLowerCase().replace(/\s+/g, '_'))
        .set(indexData, { merge: true });
    } catch (error) {
      console.error('Error updating search index:', error);
    }
  }

  /**
   * Check if cache is expired
   */
  isCacheExpired(fetchedAt) {
    if (!fetchedAt) return true;
    
    const fetchTime = fetchedAt.toDate ? fetchedAt.toDate() : new Date(fetchedAt);
    return Date.now() - fetchTime.getTime() > this.cacheDuration;
  }

  /**
   * Update studies for all medications in database
   */
  async updateAllStudies() {
    try {
      const MedicationDatabase = require('./medication-database');
      const medDb = new MedicationDatabase();
      const stats = medDb.getStats();
      
      console.log(`📚 Updating studies for ${stats.totalMedications} medications...`);
      
      let updated = 0;
      let failed = 0;
      
      // Get all medication keys
      const medications = Object.keys(medDb.medications);
      
      // Process in batches to avoid rate limiting
      const batchSize = 5;
      for (let i = 0; i < medications.length; i += batchSize) {
        const batch = medications.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (medKey) => {
          try {
            const med = medDb.medications[medKey];
            await this.fetchStudies(med.genericName, {
              maxResults: 5,
              yearRange: 3
            });
            updated++;
          } catch (error) {
            console.error(`Failed to update studies for ${medKey}:`, error);
            failed++;
          }
        }));
        
        // Rate limiting pause
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      console.log(`✅ Studies update complete. Updated: ${updated}, Failed: ${failed}`);
      
      // Log to audit
      await this.db.collection('auditLogs').add({
        action: 'studies_update_all',
        updated,
        failed,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      console.error('Error in updateAllStudies:', error);
    }
  }

  /**
   * Update studies for trending medications
   */
  async updateTrendingStudies() {
    try {
      // Get most searched medications from last 7 days
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      const scansSnapshot = await this.db
        .collection('scans')
        .where('createdAt', '>=', weekAgo)
        .get();
      
      // Count medication frequencies
      const medicationCounts = {};
      scansSnapshot.forEach(doc => {
        const med = doc.data().medicationName;
        if (med) {
          medicationCounts[med] = (medicationCounts[med] || 0) + 1;
        }
      });
      
      // Get top 10 trending medications
      const trending = Object.entries(medicationCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([med]) => med);
      
      console.log(`📚 Updating studies for ${trending.length} trending medications...`);
      
      for (const medication of trending) {
        await this.fetchStudies(medication, {
          maxResults: 10,
          yearRange: 2
        });
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      console.log('✅ Trending studies update complete');
    } catch (error) {
      console.error('Error updating trending studies:', error);
    }
  }

  /**
   * Get formatted studies for user display
   */
  async getStudiesForUser(medicationName, userTier) {
    const studies = await this.fetchStudies(medicationName);
    
    // Use the formatter for proper presentation
    const ClinicalStudiesFormatter = require('./clinical-studies-formatter');
    const formatter = new ClinicalStudiesFormatter();
    
    // Format with AI summarization and proper structure
    const formattedStudies = await formatter.formatStudiesForDisplay(
      {
        pubmedStudies: studies.pubmed,
        clinicalTrials: studies.clinicalTrials,
        metadata: studies.metadata
      },
      medicationName,
      userTier
    );
    
    return formattedStudies;
  }
}

module.exports = ClinicalStudiesFetcher;