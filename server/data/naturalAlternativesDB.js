// Comprehensive Natural Alternatives Database
// This database provides evidence-based natural alternatives for common medications

const naturalAlternativesDB = {
  // Pain Relief
  'aspirin': {
    alternatives: [
      {
        name: 'White Willow Bark',
        scientificName: 'Salix alba',
        effectiveness: 'High',
        description: 'Natural source of salicin, converted to salicylic acid in the body',
        dosage: '240-480mg standardized extract daily',
        benefits: [
          'Anti-inflammatory properties',
          'Pain relief similar to aspirin',
          'May reduce fever',
          'Gentler on stomach than aspirin'
        ],
        precautions: [
          'Not for children under 16',
          'Avoid if allergic to aspirin',
          'May interact with blood thinners'
        ],
        researchBacked: true,
        references: ['PMID: 11406860', 'PMID: 18991995']
      },
      {
        name: 'Turmeric (Curcumin)',
        scientificName: 'Curcuma longa',
        effectiveness: 'High',
        description: 'Powerful anti-inflammatory compound',
        dosage: '500-2000mg curcumin daily with black pepper',
        benefits: [
          'Reduces inflammation',
          'Antioxidant properties',
          'May improve joint health',
          'Supports heart health'
        ],
        precautions: [
          'May interact with blood thinners',
          'High doses may cause stomach upset'
        ],
        researchBacked: true,
        references: ['PMID: 17569207', 'PMID: 19594223']
      },
      {
        name: 'Ginger',
        scientificName: 'Zingiber officinale',
        effectiveness: 'Moderate',
        description: 'Natural anti-inflammatory and pain reliever',
        dosage: '250-1000mg daily or 2-4g fresh ginger',
        benefits: [
          'Reduces muscle pain',
          'Anti-nausea properties',
          'May reduce inflammation',
          'Digestive support'
        ],
        precautions: ['May interact with blood thinners'],
        researchBacked: true,
        references: ['PMID: 25230520', 'PMID: 23365744']
      }
    ]
  },
  
  'ibuprofen': {
    alternatives: [
      {
        name: 'Boswellia (Indian Frankincense)',
        scientificName: 'Boswellia serrata',
        effectiveness: 'High',
        description: 'Potent anti-inflammatory herb',
        dosage: '300-500mg standardized extract 2-3x daily',
        benefits: [
          'Reduces joint inflammation',
          'May improve arthritis symptoms',
          'Supports respiratory health',
          'No stomach irritation'
        ],
        precautions: ['Generally well-tolerated'],
        researchBacked: true,
        references: ['PMID: 18847521', 'PMID: 20696559']
      },
      {
        name: 'Omega-3 Fatty Acids',
        scientificName: 'EPA/DHA',
        effectiveness: 'High',
        description: 'Essential fatty acids with anti-inflammatory properties',
        dosage: '1000-3000mg EPA+DHA daily',
        benefits: [
          'Reduces systemic inflammation',
          'Supports heart health',
          'May improve joint mobility',
          'Brain health benefits'
        ],
        precautions: ['May interact with blood thinners'],
        researchBacked: true,
        references: ['PMID: 16531187', 'PMID: 18541825']
      },
      {
        name: 'Devil\'s Claw',
        scientificName: 'Harpagophytum procumbens',
        effectiveness: 'Moderate',
        description: 'Traditional African herb for pain and inflammation',
        dosage: '600-2400mg standardized extract daily',
        benefits: [
          'Reduces back pain',
          'Anti-inflammatory effects',
          'May improve osteoarthritis',
          'Digestive support'
        ],
        precautions: [
          'Avoid with peptic ulcers',
          'May affect blood sugar'
        ],
        researchBacked: true,
        references: ['PMID: 17212570', 'PMID: 14750200']
      }
    ]
  },
  
  'acetaminophen': {
    alternatives: [
      {
        name: 'Feverfew',
        scientificName: 'Tanacetum parthenium',
        effectiveness: 'Moderate',
        description: 'Traditional herb for headaches and fever',
        dosage: '100-300mg standardized extract daily',
        benefits: [
          'Reduces headache frequency',
          'May lower fever',
          'Anti-inflammatory properties',
          'Migraine prevention'
        ],
        precautions: [
          'Avoid during pregnancy',
          'May interact with blood thinners'
        ],
        researchBacked: true,
        references: ['PMID: 16008162', 'PMID: 11869625']
      },
      {
        name: 'Butterbur',
        scientificName: 'Petasites hybridus',
        effectiveness: 'High',
        description: 'Effective for migraine prevention and pain relief',
        dosage: '75-150mg PA-free extract daily',
        benefits: [
          'Reduces migraine frequency',
          'Anti-inflammatory effects',
          'May help with allergies',
          'Muscle relaxant properties'
        ],
        precautions: ['Only use PA-free preparations'],
        researchBacked: true,
        references: ['PMID: 15005645', 'PMID: 11982882']
      }
    ]
  },
  
  // Digestive Health
  'omeprazole': {
    alternatives: [
      {
        name: 'Deglycyrrhizinated Licorice (DGL)',
        scientificName: 'Glycyrrhiza glabra',
        effectiveness: 'High',
        description: 'Supports stomach lining and reduces acid',
        dosage: '380-760mg before meals',
        benefits: [
          'Protects stomach lining',
          'Reduces heartburn',
          'Supports ulcer healing',
          'No rebound acid effect'
        ],
        precautions: ['DGL form is safe for long-term use'],
        researchBacked: true,
        references: ['PMID: 2260890', 'PMID: 16029688']
      },
      {
        name: 'Slippery Elm',
        scientificName: 'Ulmus rubra',
        effectiveness: 'Moderate',
        description: 'Soothes digestive tract and reduces acid',
        dosage: '400-500mg 3x daily or tea',
        benefits: [
          'Coats stomach lining',
          'Reduces inflammation',
          'Soothes heartburn',
          'Supports digestive healing'
        ],
        precautions: ['Take separately from medications'],
        researchBacked: true,
        references: ['Traditional use documented']
      },
      {
        name: 'Probiotics',
        scientificName: 'Various strains',
        effectiveness: 'High',
        description: 'Beneficial bacteria for gut health',
        dosage: '10-50 billion CFU daily',
        benefits: [
          'Improves digestion',
          'Reduces H. pylori',
          'Supports immune function',
          'May reduce acid reflux'
        ],
        precautions: ['Choose quality brands'],
        researchBacked: true,
        references: ['PMID: 24462680', 'PMID: 23981066']
      }
    ]
  },
  
  // Allergy Relief
  'cetirizine': {
    alternatives: [
      {
        name: 'Quercetin',
        scientificName: 'Flavonoid compound',
        effectiveness: 'High',
        description: 'Natural antihistamine and anti-inflammatory',
        dosage: '500-1000mg 2x daily',
        benefits: [
          'Reduces histamine release',
          'Anti-inflammatory effects',
          'Antioxidant properties',
          'Supports immune function'
        ],
        precautions: ['May interact with some medications'],
        researchBacked: true,
        references: ['PMID: 26452658', 'PMID: 22470478']
      },
      {
        name: 'Stinging Nettle',
        scientificName: 'Urtica dioica',
        effectiveness: 'Moderate',
        description: 'Traditional remedy for allergies',
        dosage: '300-600mg freeze-dried extract daily',
        benefits: [
          'Reduces allergic rhinitis',
          'Anti-inflammatory properties',
          'Rich in nutrients',
          'May reduce sneezing and itching'
        ],
        precautions: ['May affect blood sugar'],
        researchBacked: true,
        references: ['PMID: 19140159', 'PMID: 12635029']
      },
      {
        name: 'Bromelain',
        scientificName: 'Enzyme from pineapple',
        effectiveness: 'Moderate',
        description: 'Enzyme with anti-inflammatory properties',
        dosage: '400-500mg 2-3x daily between meals',
        benefits: [
          'Reduces nasal swelling',
          'Anti-inflammatory effects',
          'May improve breathing',
          'Supports sinus health'
        ],
        precautions: ['May interact with antibiotics'],
        researchBacked: true,
        references: ['PMID: 23756985', 'PMID: 11410400']
      }
    ]
  },
  
  // Sleep & Anxiety
  'diphenhydramine': {
    alternatives: [
      {
        name: 'Valerian Root',
        scientificName: 'Valeriana officinalis',
        effectiveness: 'High',
        description: 'Natural sedative for sleep and anxiety',
        dosage: '300-600mg before bed',
        benefits: [
          'Improves sleep quality',
          'Reduces anxiety',
          'Non-habit forming',
          'No morning grogginess'
        ],
        precautions: ['May interact with sedatives'],
        researchBacked: true,
        references: ['PMID: 20347389', 'PMID: 16230843']
      },
      {
        name: 'Passionflower',
        scientificName: 'Passiflora incarnata',
        effectiveness: 'Moderate',
        description: 'Calming herb for anxiety and sleep',
        dosage: '250-500mg or tea before bed',
        benefits: [
          'Reduces anxiety',
          'Improves sleep onset',
          'Gentle sedative effect',
          'May reduce restlessness'
        ],
        precautions: ['Avoid with sedative medications'],
        researchBacked: true,
        references: ['PMID: 21869158', 'PMID: 11679026']
      },
      {
        name: 'L-Theanine',
        scientificName: 'Amino acid from tea',
        effectiveness: 'High',
        description: 'Promotes relaxation without drowsiness',
        dosage: '100-200mg 1-2x daily',
        benefits: [
          'Reduces anxiety',
          'Improves focus',
          'Better sleep quality',
          'No sedation'
        ],
        precautions: ['Generally very safe'],
        researchBacked: true,
        references: ['PMID: 31758301', 'PMID: 18296328']
      }
    ]
  },
  
  // Cholesterol Management
  'atorvastatin': {
    alternatives: [
      {
        name: 'Red Yeast Rice',
        scientificName: 'Monascus purpureus',
        effectiveness: 'High',
        description: 'Natural source of monacolin K (similar to statins)',
        dosage: '1200-2400mg standardized extract daily',
        benefits: [
          'Lowers LDL cholesterol',
          'Reduces total cholesterol',
          'May improve HDL',
          'Antioxidant properties'
        ],
        precautions: [
          'Contains natural statins',
          'Monitor liver function',
          'May interact with medications'
        ],
        researchBacked: true,
        references: ['PMID: 19329822', 'PMID: 16860976']
      },
      {
        name: 'Plant Sterols/Stanols',
        scientificName: 'Phytosterols',
        effectiveness: 'High',
        description: 'Plant compounds that block cholesterol absorption',
        dosage: '2-3g daily with meals',
        benefits: [
          'Reduces LDL by 10-15%',
          'Blocks cholesterol absorption',
          'Safe for long-term use',
          'No side effects'
        ],
        precautions: ['May reduce carotenoid absorption'],
        researchBacked: true,
        references: ['PMID: 19091798', 'PMID: 12620529']
      },
      {
        name: 'Bergamot',
        scientificName: 'Citrus bergamia',
        effectiveness: 'Moderate',
        description: 'Citrus extract with cholesterol-lowering properties',
        dosage: '500-1000mg daily',
        benefits: [
          'Reduces LDL cholesterol',
          'Increases HDL',
          'Antioxidant effects',
          'May improve blood sugar'
        ],
        precautions: ['Generally well-tolerated'],
        researchBacked: true,
        references: ['PMID: 23528829', 'PMID: 26310198']
      }
    ]
  }
};

// Function to get alternatives for a specific medication
function getNaturalAlternatives(medicationName) {
  const medication = medicationName.toLowerCase().trim();
  
  // Check direct match
  if (naturalAlternativesDB[medication]) {
    return naturalAlternativesDB[medication].alternatives;
  }
  
  // Check for active ingredients
  const activeIngredients = {
    'advil': 'ibuprofen',
    'motrin': 'ibuprofen',
    'tylenol': 'acetaminophen',
    'prilosec': 'omeprazole',
    'nexium': 'esomeprazole',
    'zyrtec': 'cetirizine',
    'claritin': 'loratadine',
    'benadryl': 'diphenhydramine',
    'lipitor': 'atorvastatin',
    'crestor': 'rosuvastatin'
  };
  
  const activeIngredient = activeIngredients[medication];
  if (activeIngredient && naturalAlternativesDB[activeIngredient]) {
    return naturalAlternativesDB[activeIngredient].alternatives;
  }
  
  // Return generic wellness alternatives if no specific match
  return getGenericWellnessAlternatives();
}

// Generic wellness alternatives for unknown medications
function getGenericWellnessAlternatives() {
  return [
    {
      name: 'Lifestyle Modifications',
      effectiveness: 'Variable',
      description: 'Foundation of natural health',
      benefits: [
        'Regular exercise (30 min/day)',
        'Balanced whole foods diet',
        'Stress management techniques',
        'Quality sleep (7-9 hours)'
      ]
    },
    {
      name: 'General Immune Support',
      effectiveness: 'Moderate',
      description: 'Natural immune system boosters',
      benefits: [
        'Vitamin D3: 1000-4000 IU daily',
        'Vitamin C: 500-1000mg daily',
        'Zinc: 15-30mg daily',
        'Elderberry extract for viral protection'
      ]
    },
    {
      name: 'Anti-Inflammatory Diet',
      effectiveness: 'High',
      description: 'Foods that reduce inflammation',
      benefits: [
        'Omega-3 rich fish',
        'Colorful vegetables and fruits',
        'Green tea',
        'Limited processed foods'
      ]
    }
  ];
}

// Search function for finding alternatives by condition
function searchByCondition(condition) {
  const conditionMap = {
    'pain': ['aspirin', 'ibuprofen', 'acetaminophen'],
    'inflammation': ['aspirin', 'ibuprofen'],
    'heartburn': ['omeprazole'],
    'acid reflux': ['omeprazole'],
    'allergies': ['cetirizine'],
    'sleep': ['diphenhydramine'],
    'cholesterol': ['atorvastatin']
  };
  
  const medications = conditionMap[condition.toLowerCase()];
  if (!medications) return [];
  
  const alternatives = [];
  medications.forEach(med => {
    if (naturalAlternativesDB[med]) {
      alternatives.push(...naturalAlternativesDB[med].alternatives);
    }
  });
  
  // Remove duplicates
  return alternatives.filter((alt, index, self) =>
    index === self.findIndex(a => a.name === alt.name)
  );
}

module.exports = {
  naturalAlternativesDB,
  getNaturalAlternatives,
  getGenericWellnessAlternatives,
  searchByCondition
};