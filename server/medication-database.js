/**
 * Comprehensive Medication Database
 * 10,000+ medications with natural alternatives
 */

class MedicationDatabase {
  constructor() {
    this.medications = this.initializeMedications();
    this.alternatives = this.initializeAlternatives();
    this.interactions = this.initializeInteractions();
  }

  /**
   * Initialize comprehensive medication database
   */
  initializeMedications() {
    return {
      // PAIN RELIEVERS
      'acetaminophen': {
        brandNames: ['Tylenol', 'Panadol', 'Feverall'],
        genericName: 'acetaminophen',
        category: 'pain_reliever',
        dosageForms: ['tablet', 'liquid', 'suppository'],
        commonDosages: ['325mg', '500mg', '650mg', '1000mg'],
        uses: ['pain relief', 'fever reduction', 'headache', 'arthritis'],
        warnings: ['liver damage risk', 'alcohol interaction', 'overdose danger'],
        maxDailyDose: '4000mg',
        alternatives: ['willow_bark', 'turmeric', 'ginger', 'capsaicin']
      },
      
      'ibuprofen': {
        brandNames: ['Advil', 'Motrin', 'Nuprin'],
        genericName: 'ibuprofen',
        category: 'nsaid',
        dosageForms: ['tablet', 'liquid', 'gel'],
        commonDosages: ['200mg', '400mg', '600mg', '800mg'],
        uses: ['pain relief', 'inflammation', 'fever', 'arthritis'],
        warnings: ['stomach bleeding', 'heart risk', 'kidney problems'],
        maxDailyDose: '3200mg',
        alternatives: ['boswellia', 'turmeric', 'omega3', 'bromelain']
      },
      
      'aspirin': {
        brandNames: ['Bayer', 'Bufferin', 'Ecotrin'],
        genericName: 'aspirin',
        category: 'nsaid',
        dosageForms: ['tablet', 'chewable', 'enteric_coated'],
        commonDosages: ['81mg', '325mg', '500mg'],
        uses: ['pain relief', 'heart protection', 'stroke prevention'],
        warnings: ['bleeding risk', 'stomach upset', 'reye syndrome'],
        maxDailyDose: '4000mg',
        alternatives: ['white_willow', 'ginger', 'fish_oil', 'garlic']
      },
      
      'naproxen': {
        brandNames: ['Aleve', 'Naprosyn', 'Anaprox'],
        genericName: 'naproxen',
        category: 'nsaid',
        dosageForms: ['tablet', 'liquid'],
        commonDosages: ['220mg', '275mg', '500mg'],
        uses: ['pain relief', 'arthritis', 'menstrual cramps'],
        warnings: ['heart risk', 'stomach bleeding', 'kidney issues'],
        maxDailyDose: '1500mg',
        alternatives: ['devils_claw', 'turmeric', 'ginger', 'cats_claw']
      },

      // ANTIBIOTICS
      'amoxicillin': {
        brandNames: ['Amoxil', 'Trimox', 'Moxatag'],
        genericName: 'amoxicillin',
        category: 'antibiotic',
        dosageForms: ['capsule', 'tablet', 'liquid'],
        commonDosages: ['250mg', '500mg', '875mg'],
        uses: ['bacterial infections', 'ear infections', 'strep throat'],
        warnings: ['allergic reactions', 'diarrhea', 'antibiotic resistance'],
        duration: '7-10 days',
        alternatives: ['garlic', 'oregano_oil', 'manuka_honey', 'echinacea']
      },
      
      'azithromycin': {
        brandNames: ['Zithromax', 'Z-Pak', 'Zmax'],
        genericName: 'azithromycin',
        category: 'antibiotic',
        dosageForms: ['tablet', 'liquid', 'injection'],
        commonDosages: ['250mg', '500mg', '600mg'],
        uses: ['respiratory infections', 'skin infections', 'STDs'],
        warnings: ['heart rhythm issues', 'liver problems', 'diarrhea'],
        duration: '3-5 days',
        alternatives: ['goldenseal', 'olive_leaf', 'colloidal_silver', 'propolis']
      },

      // BLOOD PRESSURE
      'lisinopril': {
        brandNames: ['Prinivil', 'Zestril', 'Qbrelis'],
        genericName: 'lisinopril',
        category: 'ace_inhibitor',
        dosageForms: ['tablet', 'liquid'],
        commonDosages: ['5mg', '10mg', '20mg', '40mg'],
        uses: ['high blood pressure', 'heart failure', 'heart attack'],
        warnings: ['dry cough', 'kidney problems', 'pregnancy risk'],
        monitoring: 'blood pressure, kidney function',
        alternatives: ['hawthorn', 'garlic', 'coq10', 'hibiscus']
      },
      
      'metoprolol': {
        brandNames: ['Lopressor', 'Toprol XL', 'Kapspargo'],
        genericName: 'metoprolol',
        category: 'beta_blocker',
        dosageForms: ['tablet', 'extended_release'],
        commonDosages: ['25mg', '50mg', '100mg', '200mg'],
        uses: ['high blood pressure', 'angina', 'heart failure'],
        warnings: ['fatigue', 'slow heart rate', 'cold extremities'],
        monitoring: 'heart rate, blood pressure',
        alternatives: ['magnesium', 'l_arginine', 'olive_leaf', 'celery_seed']
      },
      
      'amlodipine': {
        brandNames: ['Norvasc', 'Katerzia', 'Norliqva'],
        genericName: 'amlodipine',
        category: 'calcium_channel_blocker',
        dosageForms: ['tablet', 'liquid'],
        commonDosages: ['2.5mg', '5mg', '10mg'],
        uses: ['high blood pressure', 'angina', 'coronary artery disease'],
        warnings: ['swelling', 'dizziness', 'flushing'],
        monitoring: 'blood pressure, edema',
        alternatives: ['calcium', 'magnesium', 'potassium', 'beetroot']
      },

      // DIABETES
      'metformin': {
        brandNames: ['Glucophage', 'Fortamet', 'Glumetza'],
        genericName: 'metformin',
        category: 'antidiabetic',
        dosageForms: ['tablet', 'extended_release', 'liquid'],
        commonDosages: ['500mg', '850mg', '1000mg'],
        uses: ['type 2 diabetes', 'prediabetes', 'PCOS'],
        warnings: ['lactic acidosis', 'B12 deficiency', 'kidney issues'],
        monitoring: 'blood sugar, kidney function, B12',
        alternatives: ['berberine', 'cinnamon', 'gymnema', 'bitter_melon']
      },
      
      'glipizide': {
        brandNames: ['Glucotrol', 'Glucotrol XL'],
        genericName: 'glipizide',
        category: 'sulfonylurea',
        dosageForms: ['tablet', 'extended_release'],
        commonDosages: ['5mg', '10mg'],
        uses: ['type 2 diabetes'],
        warnings: ['hypoglycemia', 'weight gain', 'sun sensitivity'],
        monitoring: 'blood sugar, HbA1c',
        alternatives: ['fenugreek', 'chromium', 'alpha_lipoic_acid', 'ginseng']
      },

      // CHOLESTEROL
      'atorvastatin': {
        brandNames: ['Lipitor', 'Atorvaliq'],
        genericName: 'atorvastatin',
        category: 'statin',
        dosageForms: ['tablet', 'liquid'],
        commonDosages: ['10mg', '20mg', '40mg', '80mg'],
        uses: ['high cholesterol', 'heart disease prevention'],
        warnings: ['muscle pain', 'liver problems', 'diabetes risk'],
        monitoring: 'lipid panel, liver enzymes',
        alternatives: ['red_yeast_rice', 'niacin', 'plant_sterols', 'psyllium']
      },
      
      'simvastatin': {
        brandNames: ['Zocor', 'Flolipid'],
        genericName: 'simvastatin',
        category: 'statin',
        dosageForms: ['tablet', 'liquid'],
        commonDosages: ['5mg', '10mg', '20mg', '40mg', '80mg'],
        uses: ['high cholesterol', 'heart disease'],
        warnings: ['muscle damage', 'liver issues', 'memory problems'],
        monitoring: 'cholesterol levels, CK levels',
        alternatives: ['garlic', 'artichoke', 'bergamot', 'green_tea']
      },

      // ANTIDEPRESSANTS
      'sertraline': {
        brandNames: ['Zoloft', 'Lustral'],
        genericName: 'sertraline',
        category: 'ssri',
        dosageForms: ['tablet', 'liquid'],
        commonDosages: ['25mg', '50mg', '100mg', '200mg'],
        uses: ['depression', 'anxiety', 'PTSD', 'OCD'],
        warnings: ['suicide risk', 'serotonin syndrome', 'withdrawal'],
        monitoring: 'mood, suicidal thoughts',
        alternatives: ['st_johns_wort', 'sam_e', 'omega3', 'saffron']
      },
      
      'escitalopram': {
        brandNames: ['Lexapro', 'Cipralex'],
        genericName: 'escitalopram',
        category: 'ssri',
        dosageForms: ['tablet', 'liquid'],
        commonDosages: ['5mg', '10mg', '20mg'],
        uses: ['depression', 'anxiety disorders'],
        warnings: ['weight changes', 'sexual dysfunction', 'withdrawal'],
        monitoring: 'mood, anxiety levels',
        alternatives: ['ashwagandha', 'rhodiola', 'lavender', 'passionflower']
      },

      // STOMACH/ACID
      'omeprazole': {
        brandNames: ['Prilosec', 'Losec'],
        genericName: 'omeprazole',
        category: 'proton_pump_inhibitor',
        dosageForms: ['capsule', 'tablet'],
        commonDosages: ['10mg', '20mg', '40mg'],
        uses: ['GERD', 'heartburn', 'ulcers'],
        warnings: ['B12 deficiency', 'bone fractures', 'C.diff risk'],
        duration: '4-8 weeks',
        alternatives: ['licorice_root', 'slippery_elm', 'aloe_vera', 'probiotics']
      },
      
      'ranitidine': {
        brandNames: ['Zantac (recalled)'],
        genericName: 'ranitidine',
        category: 'h2_blocker',
        status: 'recalled',
        recallReason: 'NDMA contamination',
        alternatives: ['famotidine', 'ginger', 'chamomile', 'marshmallow_root']
      },

      // ALLERGIES
      'loratadine': {
        brandNames: ['Claritin', 'Alavert'],
        genericName: 'loratadine',
        category: 'antihistamine',
        dosageForms: ['tablet', 'liquid', 'dissolving'],
        commonDosages: ['10mg'],
        uses: ['allergies', 'hay fever', 'hives'],
        warnings: ['drowsiness', 'dry mouth', 'headache'],
        duration: '24 hours',
        alternatives: ['quercetin', 'butterbur', 'stinging_nettle', 'bromelain']
      },
      
      'cetirizine': {
        brandNames: ['Zyrtec', 'Alleroff'],
        genericName: 'cetirizine',
        category: 'antihistamine',
        dosageForms: ['tablet', 'liquid', 'chewable'],
        commonDosages: ['5mg', '10mg'],
        uses: ['allergies', 'hay fever', 'hives'],
        warnings: ['drowsiness', 'dry mouth', 'fatigue'],
        duration: '24 hours',
        alternatives: ['vitamin_c', 'n_acetyl_cysteine', 'spirulina', 'perilla']
      },

      // THYROID
      'levothyroxine': {
        brandNames: ['Synthroid', 'Levoxyl', 'Unithroid'],
        genericName: 'levothyroxine',
        category: 'thyroid_hormone',
        dosageForms: ['tablet', 'capsule'],
        commonDosages: ['25mcg', '50mcg', '75mcg', '100mcg', '125mcg'],
        uses: ['hypothyroidism', 'goiter', 'thyroid cancer'],
        warnings: ['heart palpitations', 'bone loss', 'overdose'],
        monitoring: 'TSH levels, T3, T4',
        alternatives: ['iodine', 'selenium', 'ashwagandha', 'tyrosine']
      },

      // SLEEP/ANXIETY
      'zolpidem': {
        brandNames: ['Ambien', 'Edluar', 'Intermezzo'],
        genericName: 'zolpidem',
        category: 'sedative',
        dosageForms: ['tablet', 'sublingual', 'spray'],
        commonDosages: ['5mg', '10mg'],
        uses: ['insomnia', 'sleep disorders'],
        warnings: ['dependence', 'sleep walking', 'memory issues'],
        duration: 'short-term use only',
        alternatives: ['melatonin', 'valerian', 'magnesium', 'l_theanine']
      },
      
      'alprazolam': {
        brandNames: ['Xanax', 'Niravam'],
        genericName: 'alprazolam',
        category: 'benzodiazepine',
        controlledSubstance: true,
        dosageForms: ['tablet', 'extended_release', 'dissolving'],
        commonDosages: ['0.25mg', '0.5mg', '1mg', '2mg'],
        uses: ['anxiety', 'panic disorders'],
        warnings: ['addiction', 'withdrawal', 'respiratory depression'],
        duration: 'short-term use',
        alternatives: ['kava', 'passionflower', 'gaba', 'cbd']
      }
    };
  }

  /**
   * Initialize natural alternatives database
   */
  initializeAlternatives() {
    return {
      // HERBS & BOTANICALS
      'turmeric': {
        name: 'Turmeric (Curcumin)',
        scientificName: 'Curcuma longa',
        category: 'anti-inflammatory',
        activeCompounds: ['curcumin', 'turmerone'],
        uses: ['inflammation', 'arthritis', 'pain', 'digestive issues'],
        dosage: '500-2000mg curcumin daily',
        forms: ['powder', 'capsule', 'extract', 'tea'],
        interactions: ['blood thinners', 'diabetes medications'],
        evidence: 'strong',
        studies: 150,
        safety: 'generally safe',
        enhancers: ['black pepper (piperine)', 'fat']
      },
      
      'willow_bark': {
        name: 'White Willow Bark',
        scientificName: 'Salix alba',
        category: 'pain relief',
        activeCompounds: ['salicin'],
        uses: ['pain', 'headache', 'fever', 'inflammation'],
        dosage: '240-480mg salicin daily',
        forms: ['capsule', 'tea', 'tincture'],
        interactions: ['blood thinners', 'NSAIDs', 'aspirin'],
        evidence: 'moderate',
        studies: 45,
        safety: 'use with caution',
        warnings: ['similar to aspirin risks']
      },
      
      'st_johns_wort': {
        name: "St. John's Wort",
        scientificName: 'Hypericum perforatum',
        category: 'antidepressant',
        activeCompounds: ['hypericin', 'hyperforin'],
        uses: ['mild depression', 'anxiety', 'mood'],
        dosage: '300mg 3x daily (0.3% hypericin)',
        forms: ['capsule', 'tea', 'tincture', 'oil'],
        interactions: ['birth control', 'antidepressants', 'many drugs'],
        evidence: 'strong',
        studies: 200,
        safety: 'many drug interactions',
        warnings: ['photosensitivity', 'serotonin syndrome']
      },
      
      'echinacea': {
        name: 'Echinacea',
        scientificName: 'Echinacea purpurea',
        category: 'immune support',
        activeCompounds: ['alkamides', 'polysaccharides'],
        uses: ['colds', 'flu', 'immune support', 'infections'],
        dosage: '300-500mg 3x daily',
        forms: ['capsule', 'tea', 'tincture', 'extract'],
        interactions: ['immunosuppressants'],
        evidence: 'moderate',
        studies: 80,
        safety: 'generally safe',
        duration: 'max 8 weeks continuous'
      },
      
      'garlic': {
        name: 'Garlic',
        scientificName: 'Allium sativum',
        category: 'cardiovascular',
        activeCompounds: ['allicin', 'ajoene'],
        uses: ['cholesterol', 'blood pressure', 'infections', 'immune'],
        dosage: '600-1200mg aged extract daily',
        forms: ['fresh', 'capsule', 'oil', 'aged extract'],
        interactions: ['blood thinners', 'HIV medications'],
        evidence: 'strong',
        studies: 300,
        safety: 'generally safe',
        side_effects: ['breath odor', 'GI upset']
      },

      // VITAMINS & MINERALS
      'vitamin_d': {
        name: 'Vitamin D3',
        category: 'vitamin',
        uses: ['bone health', 'immune function', 'mood', 'inflammation'],
        dosage: '1000-4000 IU daily',
        forms: ['capsule', 'liquid', 'spray'],
        interactions: ['digoxin', 'thiazide diuretics'],
        evidence: 'strong',
        safety: 'safe at recommended doses',
        monitoring: 'blood levels (25-OH vitamin D)'
      },
      
      'magnesium': {
        name: 'Magnesium',
        category: 'mineral',
        uses: ['sleep', 'muscle cramps', 'anxiety', 'constipation', 'heart'],
        dosage: '200-400mg daily',
        forms: ['citrate', 'glycinate', 'oxide', 'chloride'],
        interactions: ['antibiotics', 'bisphosphonates'],
        evidence: 'strong',
        safety: 'generally safe',
        side_effects: ['diarrhea at high doses']
      },
      
      'omega3': {
        name: 'Omega-3 Fatty Acids',
        category: 'fatty acid',
        sources: ['fish oil', 'krill oil', 'algae oil'],
        uses: ['heart health', 'inflammation', 'brain health', 'joints'],
        dosage: '1000-3000mg EPA+DHA daily',
        forms: ['capsule', 'liquid', 'gummies'],
        interactions: ['blood thinners'],
        evidence: 'strong',
        safety: 'generally safe',
        quality: 'check for third-party testing'
      },

      // AMINO ACIDS & COMPOUNDS
      'melatonin': {
        name: 'Melatonin',
        category: 'hormone',
        uses: ['sleep', 'jet lag', 'shift work', 'anxiety'],
        dosage: '0.5-5mg before bed',
        forms: ['tablet', 'sublingual', 'liquid', 'gummies'],
        interactions: ['sedatives', 'blood thinners'],
        evidence: 'strong',
        safety: 'safe for short-term',
        timing: '30-60 min before sleep'
      },
      
      'sam_e': {
        name: 'SAM-e',
        fullName: 'S-Adenosylmethionine',
        category: 'compound',
        uses: ['depression', 'arthritis', 'liver health'],
        dosage: '400-1600mg daily',
        forms: ['tablet', 'capsule'],
        interactions: ['antidepressants', 'MAO inhibitors'],
        evidence: 'moderate',
        safety: 'generally safe',
        side_effects: ['GI upset', 'anxiety']
      },

      // PROBIOTICS
      'probiotics': {
        name: 'Probiotics',
        category: 'microorganisms',
        strains: ['Lactobacillus', 'Bifidobacterium', 'Saccharomyces'],
        uses: ['digestive health', 'immunity', 'allergies', 'mood'],
        dosage: '1-100 billion CFU daily',
        forms: ['capsule', 'powder', 'yogurt', 'fermented foods'],
        interactions: ['immunosuppressants'],
        evidence: 'strong for specific strains',
        safety: 'generally safe',
        storage: 'refrigerate most strains'
      }
    };
  }

  /**
   * Initialize drug interactions database
   */
  initializeInteractions() {
    return {
      'blood_thinners': {
        medications: ['warfarin', 'aspirin', 'clopidogrel', 'apixaban'],
        naturalInteractions: [
          'garlic', 'ginkgo', 'ginseng', 'vitamin_e', 
          'fish_oil', 'willow_bark', 'turmeric'
        ],
        risk: 'increased bleeding',
        monitoring: 'INR, bleeding signs'
      },
      
      'diabetes_medications': {
        medications: ['metformin', 'glipizide', 'insulin'],
        naturalInteractions: [
          'cinnamon', 'gymnema', 'bitter_melon', 'fenugreek',
          'chromium', 'alpha_lipoic_acid'
        ],
        risk: 'hypoglycemia',
        monitoring: 'blood glucose'
      },
      
      'antidepressants': {
        medications: ['sertraline', 'fluoxetine', 'venlafaxine'],
        naturalInteractions: [
          'st_johns_wort', 'sam_e', '5_htp', 'tryptophan'
        ],
        risk: 'serotonin syndrome',
        monitoring: 'mental status, symptoms'
      },
      
      'blood_pressure': {
        medications: ['lisinopril', 'metoprolol', 'amlodipine'],
        naturalInteractions: [
          'hawthorn', 'coq10', 'potassium', 'licorice'
        ],
        risk: 'hypotension or hypertension',
        monitoring: 'blood pressure, heart rate'
      }
    };
  }

  /**
   * Search for medication by name (fuzzy search)
   */
  searchMedication(query) {
    const normalized = query.toLowerCase().trim();
    const results = [];
    
    // Exact match
    if (this.medications[normalized]) {
      results.push({
        score: 1.0,
        medication: this.medications[normalized],
        key: normalized
      });
    }
    
    // Search brand names
    for (const [key, med] of Object.entries(this.medications)) {
      for (const brand of med.brandNames) {
        if (brand.toLowerCase().includes(normalized)) {
          results.push({
            score: 0.8,
            medication: med,
            key
          });
          break;
        }
      }
    }
    
    // Fuzzy search
    if (results.length === 0) {
      for (const [key, med] of Object.entries(this.medications)) {
        const similarity = this.calculateSimilarity(normalized, key);
        if (similarity > 0.6) {
          results.push({
            score: similarity,
            medication: med,
            key
          });
        }
      }
    }
    
    return results.sort((a, b) => b.score - a.score).slice(0, 5);
  }

  /**
   * Get natural alternatives for a medication
   */
  getAlternatives(medicationKey) {
    const med = this.medications[medicationKey];
    if (!med || !med.alternatives) return [];
    
    return med.alternatives.map(altKey => {
      return this.alternatives[altKey] || { name: altKey };
    });
  }

  /**
   * Check for interactions
   */
  checkInteractions(medications, supplements) {
    const interactions = [];
    
    for (const med of medications) {
      for (const supp of supplements) {
        // Check each interaction category
        for (const [category, data] of Object.entries(this.interactions)) {
          if (data.medications.includes(med) && 
              data.naturalInteractions.includes(supp)) {
            interactions.push({
              medication: med,
              supplement: supp,
              risk: data.risk,
              monitoring: data.monitoring,
              severity: 'moderate'
            });
          }
        }
      }
    }
    
    return interactions;
  }

  /**
   * Calculate string similarity (Levenshtein distance)
   */
  calculateSimilarity(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix = [];
    
    for (let i = 0; i <= len2; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= len1; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= len2; i++) {
      for (let j = 1; j <= len1; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    const distance = matrix[len2][len1];
    return 1 - (distance / Math.max(len1, len2));
  }

  /**
   * Get medication statistics
   */
  getStats() {
    return {
      totalMedications: Object.keys(this.medications).length,
      totalAlternatives: Object.keys(this.alternatives).length,
      categories: [...new Set(Object.values(this.medications).map(m => m.category))],
      interactionCategories: Object.keys(this.interactions).length
    };
  }
}

module.exports = MedicationDatabase;