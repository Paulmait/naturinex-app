/**
 * Clinical Studies Formatter
 * Formats and summarizes clinical studies for user-friendly presentation
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

class ClinicalStudiesFormatter {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  /**
   * Format studies for user display with AI summarization
   */
  async formatStudiesForDisplay(studies, medicationName, userTier) {
    const formatted = {
      medication: medicationName,
      summary: null,
      keyFindings: [],
      latestResearch: [],
      activeTrials: [],
      safetyProfile: null,
      efficacyData: null,
      recommendations: []
    };

    try {
      // Generate AI summary based on tier
      if (userTier === 'professional' || userTier === 'premium') {
        formatted.summary = await this.generateAISummary(studies, medicationName, userTier);
      }

      // Format PubMed studies
      if (studies.pubmedStudies && studies.pubmedStudies.length > 0) {
        formatted.latestResearch = this.formatPubMedStudies(studies.pubmedStudies, userTier);
        formatted.keyFindings = await this.extractKeyFindings(studies.pubmedStudies, userTier);
      }

      // Format clinical trials
      if (studies.clinicalTrials && studies.clinicalTrials.length > 0) {
        formatted.activeTrials = this.formatClinicalTrials(studies.clinicalTrials, userTier);
      }

      // Extract safety and efficacy data for professional tier
      if (userTier === 'professional') {
        formatted.safetyProfile = await this.extractSafetyProfile(studies);
        formatted.efficacyData = await this.extractEfficacyData(studies);
        formatted.recommendations = await this.generateRecommendations(studies, medicationName);
      }

      // Add tier-specific information
      formatted.accessLevel = this.getAccessLevelInfo(userTier);
      
    } catch (error) {
      console.error('Error formatting studies:', error);
      formatted.error = 'Unable to format studies at this time';
    }

    return formatted;
  }

  /**
   * Generate AI summary of studies
   */
  async generateAISummary(studies, medicationName, userTier) {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
      
      // Prepare study data for summarization
      const studyTexts = [];
      
      if (studies.pubmedStudies) {
        studies.pubmedStudies.slice(0, 5).forEach(study => {
          studyTexts.push(`Study: ${study.title}\nAbstract: ${study.abstract || 'Not available'}`);
        });
      }
      
      if (studies.clinicalTrials) {
        studies.clinicalTrials.slice(0, 3).forEach(trial => {
          studyTexts.push(`Trial: ${trial.title}\nStatus: ${trial.status}\nSummary: ${trial.summary || 'Not available'}`);
        });
      }

      const prompt = userTier === 'professional' 
        ? `As a medical professional, analyze these clinical studies about ${medicationName} and provide:
           1. A comprehensive summary of the research findings
           2. Key efficacy data with statistical significance
           3. Safety profile and adverse events
           4. Clinical implications for practice
           5. Areas needing more research
           
           Studies to analyze:
           ${studyTexts.join('\n\n')}
           
           Format the response in clear sections with bullet points for easy reading.`
        : `Summarize these clinical studies about ${medicationName} for a general audience:
           1. What the studies found about effectiveness
           2. Important safety information
           3. Who might benefit from this medication
           
           Studies:
           ${studyTexts.join('\n\n')}
           
           Keep the language simple and avoid medical jargon. Include a reminder to consult healthcare providers.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
      
    } catch (error) {
      console.error('Error generating AI summary:', error);
      return 'Summary generation unavailable. Please review individual studies below.';
    }
  }

  /**
   * Format PubMed studies for display
   */
  formatPubMedStudies(pubmedStudies, userTier) {
    const formatted = pubmedStudies.slice(0, userTier === 'professional' ? 10 : 5).map(study => {
      const base = {
        title: this.truncateTitle(study.title),
        year: this.extractYear(study.publicationDate),
        journal: study.journal,
        type: 'Research Study'
      };

      if (userTier === 'professional') {
        return {
          ...base,
          authors: study.authors,
          abstract: this.formatAbstract(study.abstract),
          fullTextUrl: study.url,
          relevanceScore: study.relevanceScore,
          studyDesign: this.identifyStudyDesign(study.title + ' ' + (study.abstract || ''))
        };
      } else if (userTier === 'premium') {
        return {
          ...base,
          briefSummary: this.createBriefSummary(study.abstract),
          readMoreUrl: study.url
        };
      }

      return base;
    });

    return formatted;
  }

  /**
   * Format clinical trials for display
   */
  formatClinicalTrials(trials, userTier) {
    const formatted = trials.slice(0, userTier === 'professional' ? 5 : 3).map(trial => {
      const base = {
        title: this.truncateTitle(trial.title),
        status: this.formatStatus(trial.status),
        phase: trial.phase
      };

      if (userTier === 'professional') {
        return {
          ...base,
          nctId: trial.id,
          enrollment: `${trial.enrollment} participants`,
          startDate: trial.startDate,
          completionDate: trial.completionDate,
          conditions: trial.conditions,
          interventions: trial.interventions,
          summary: trial.summary,
          detailsUrl: trial.url
        };
      } else if (userTier === 'premium') {
        return {
          ...base,
          participantCount: trial.enrollment,
          briefDescription: this.createBriefSummary(trial.summary),
          isRecruiting: this.isRecruiting(trial.status)
        };
      }

      return base;
    });

    return formatted;
  }

  /**
   * Extract key findings from studies
   */
  async extractKeyFindings(studies, userTier) {
    const findings = [];
    
    studies.slice(0, 5).forEach(study => {
      const abstract = study.abstract || '';
      
      // Look for conclusion patterns
      const conclusionPatterns = [
        /conclusion[s]?:?\s*(.+?)(?:\.|$)/i,
        /result[s]?:?\s*(.+?)(?:\.|$)/i,
        /finding[s]?:?\s*(.+?)(?:\.|$)/i,
        /demonstrate[d]?\s+that\s+(.+?)(?:\.|$)/i,
        /show[ed]?\s+that\s+(.+?)(?:\.|$)/i
      ];
      
      conclusionPatterns.forEach(pattern => {
        const match = abstract.match(pattern);
        if (match && match[1]) {
          findings.push({
            finding: this.cleanFinding(match[1]),
            source: study.title,
            year: this.extractYear(study.publicationDate),
            confidence: this.assessConfidence(abstract)
          });
        }
      });
    });

    // Sort by confidence and limit based on tier
    return findings
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, userTier === 'professional' ? 10 : 5)
      .map(f => ({
        text: f.finding,
        source: `${f.source} (${f.year})`,
        reliability: f.confidence > 0.7 ? 'High' : f.confidence > 0.4 ? 'Moderate' : 'Low'
      }));
  }

  /**
   * Extract safety profile from studies
   */
  async extractSafetyProfile(studies) {
    const safety = {
      commonSideEffects: [],
      seriousAdverseEvents: [],
      contraindications: [],
      drugInteractions: [],
      specialPopulations: {}
    };

    // Analyze abstracts for safety information
    const allText = this.combineStudyTexts(studies);
    
    // Extract side effects
    const sideEffectPatterns = [
      /adverse event[s]?[:\s]+([^.]+)/gi,
      /side effect[s]?[:\s]+([^.]+)/gi,
      /tolerat[ed|ion]+[:\s]+([^.]+)/gi
    ];
    
    sideEffectPatterns.forEach(pattern => {
      const matches = allText.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          safety.commonSideEffects.push(this.cleanFinding(match[1]));
        }
      }
    });

    // Look for serious events
    if (allText.match(/serious adverse/i)) {
      safety.seriousAdverseEvents.push('Serious adverse events reported - review full studies');
    }

    // Special populations
    if (allText.match(/pregnan/i)) {
      safety.specialPopulations.pregnancy = 'Studies include pregnancy data - consult full text';
    }
    if (allText.match(/pediatric|children/i)) {
      safety.specialPopulations.pediatric = 'Pediatric data available';
    }
    if (allText.match(/elderly|geriatric/i)) {
      safety.specialPopulations.elderly = 'Elderly population studied';
    }

    return safety;
  }

  /**
   * Extract efficacy data from studies
   */
  async extractEfficacyData(studies) {
    const efficacy = {
      primaryOutcomes: [],
      effectSize: null,
      numberNeededToTreat: null,
      comparisonToPlacebo: null,
      comparisonToActiveControl: null,
      durationOfEffect: null
    };

    const allText = this.combineStudyTexts(studies);
    
    // Look for statistical data
    const statisticalPatterns = [
      /p\s*[<=]\s*0\.\d+/gi,
      /CI[:\s]+[\d\.]+%?\s*-\s*[\d\.]+%?/gi,
      /NNT[:\s]+\d+/gi,
      /efficacy[:\s]+[\d\.]+%/gi,
      /response rate[:\s]+[\d\.]+%/gi
    ];
    
    statisticalPatterns.forEach(pattern => {
      const matches = allText.matchAll(pattern);
      for (const match of matches) {
        efficacy.primaryOutcomes.push({
          metric: 'Statistical finding',
          value: match[0],
          context: this.extractContext(allText, match.index)
        });
      }
    });

    // Look for comparison data
    if (allText.match(/placebo/i)) {
      efficacy.comparisonToPlacebo = 'Placebo-controlled studies available';
    }
    if (allText.match(/versus|compared to/i)) {
      efficacy.comparisonToActiveControl = 'Active comparator studies available';
    }

    return efficacy;
  }

  /**
   * Generate clinical recommendations
   */
  async generateRecommendations(studies, medicationName) {
    const recommendations = [];
    
    // Analyze study quality
    const hasRCT = studies.pubmedStudies?.some(s => 
      s.title.match(/randomized|RCT|double-blind/i)
    );
    
    const hasMetaAnalysis = studies.pubmedStudies?.some(s => 
      s.title.match(/meta-analysis|systematic review/i)
    );
    
    if (hasMetaAnalysis) {
      recommendations.push({
        level: 'A',
        text: 'Strong evidence from meta-analysis supports use',
        confidence: 'High'
      });
    } else if (hasRCT) {
      recommendations.push({
        level: 'B',
        text: 'Moderate evidence from randomized controlled trials',
        confidence: 'Moderate'
      });
    }
    
    // Check for recent studies
    const currentYear = new Date().getFullYear();
    const hasRecentStudies = studies.pubmedStudies?.some(s => {
      const year = this.extractYear(s.publicationDate);
      return year && (currentYear - parseInt(year) <= 2);
    });
    
    if (hasRecentStudies) {
      recommendations.push({
        level: 'Current',
        text: 'Recent studies available (within 2 years)',
        confidence: 'High'
      });
    }
    
    // Active trials
    const activeTrials = studies.clinicalTrials?.filter(t => 
      this.isRecruiting(t.status)
    ).length || 0;
    
    if (activeTrials > 0) {
      recommendations.push({
        level: 'Ongoing',
        text: `${activeTrials} active clinical trials in progress`,
        confidence: 'Emerging'
      });
    }
    
    return recommendations;
  }

  /**
   * Helper functions
   */
  truncateTitle(title, maxLength = 100) {
    if (!title) return 'Untitled';
    return title.length > maxLength 
      ? title.substring(0, maxLength) + '...' 
      : title;
  }

  extractYear(dateString) {
    if (!dateString) return null;
    const match = dateString.match(/\d{4}/);
    return match ? match[0] : null;
  }

  formatStatus(status) {
    const statusMap = {
      'Recruiting': '🟢 Recruiting',
      'Active, not recruiting': '🟡 Active',
      'Completed': '✅ Completed',
      'Terminated': '🔴 Terminated',
      'Withdrawn': '⚠️ Withdrawn'
    };
    return statusMap[status] || status;
  }

  formatAbstract(abstract, maxLength = 500) {
    if (!abstract) return 'Abstract not available';
    if (abstract.length <= maxLength) return abstract;
    
    // Try to break at sentence
    const truncated = abstract.substring(0, maxLength);
    const lastPeriod = truncated.lastIndexOf('.');
    
    if (lastPeriod > maxLength * 0.8) {
      return truncated.substring(0, lastPeriod + 1);
    }
    return truncated + '...';
  }

  createBriefSummary(text, maxLength = 150) {
    if (!text) return 'Summary not available';
    
    // Remove technical jargon
    let cleaned = text
      .replace(/\([^)]*\)/g, '') // Remove parenthetical content
      .replace(/p\s*[<=]\s*[\d\.]+/gi, '') // Remove p-values
      .replace(/CI[:\s]+[\d\.\-\s%]+/gi, '') // Remove confidence intervals
      .replace(/n\s*=\s*\d+/gi, '') // Remove sample sizes
      .trim();
    
    if (cleaned.length <= maxLength) return cleaned;
    
    const truncated = cleaned.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    return truncated.substring(0, lastSpace) + '...';
  }

  identifyStudyDesign(text) {
    const designs = {
      'randomized controlled': 'RCT',
      'meta-analysis': 'Meta-Analysis',
      'systematic review': 'Systematic Review',
      'cohort study': 'Cohort Study',
      'case-control': 'Case-Control',
      'cross-sectional': 'Cross-Sectional',
      'observational': 'Observational',
      'phase 3': 'Phase 3 Trial',
      'phase 2': 'Phase 2 Trial'
    };
    
    const textLower = text.toLowerCase();
    for (const [pattern, design] of Object.entries(designs)) {
      if (textLower.includes(pattern)) {
        return design;
      }
    }
    return 'Clinical Study';
  }

  isRecruiting(status) {
    return status && status.toLowerCase().includes('recruiting');
  }

  cleanFinding(text) {
    return text
      .replace(/^\s*and\s*/i, '')
      .replace(/[,;]\s*$/, '')
      .trim()
      .charAt(0).toUpperCase() + text.slice(1);
  }

  assessConfidence(abstract) {
    if (!abstract) return 0.3;
    
    let confidence = 0.5; // Base confidence
    
    // Increase for quality indicators
    if (abstract.match(/double-blind/i)) confidence += 0.2;
    if (abstract.match(/randomized/i)) confidence += 0.15;
    if (abstract.match(/p\s*[<=]\s*0\.0[0-5]/i)) confidence += 0.15; // Strong significance
    if (abstract.match(/large cohort|n\s*[>=]\s*1000/i)) confidence += 0.1;
    
    // Decrease for limitations
    if (abstract.match(/limitation|small sample/i)) confidence -= 0.1;
    if (abstract.match(/pilot|preliminary/i)) confidence -= 0.15;
    
    return Math.min(1, Math.max(0, confidence));
  }

  combineStudyTexts(studies) {
    const texts = [];
    if (studies.pubmedStudies) {
      studies.pubmedStudies.forEach(s => {
        texts.push(s.title + ' ' + (s.abstract || ''));
      });
    }
    if (studies.clinicalTrials) {
      studies.clinicalTrials.forEach(t => {
        texts.push(t.title + ' ' + (t.summary || ''));
      });
    }
    return texts.join(' ');
  }

  extractContext(text, index, contextLength = 50) {
    const start = Math.max(0, index - contextLength);
    const end = Math.min(text.length, index + contextLength);
    return '...' + text.substring(start, end) + '...';
  }

  getAccessLevelInfo(tier) {
    const levels = {
      professional: {
        level: 'Full Access',
        features: ['Complete abstracts', 'All statistical data', 'Direct study links', 'Clinical recommendations']
      },
      premium: {
        level: 'Premium Access',
        features: ['Study summaries', 'Key findings', 'Basic safety data']
      },
      basic: {
        level: 'Limited Access',
        features: ['Study counts only']
      },
      free: {
        level: 'No Access',
        features: ['Upgrade required for clinical studies']
      }
    };
    return levels[tier] || levels.free;
  }
}

module.exports = ClinicalStudiesFormatter;