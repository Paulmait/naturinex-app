const mongoose = require('mongoose');

const naturalRemedySchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    index: true,
    unique: true
  },
  scientificName: {
    type: String,
    index: true
  },
  commonNames: [{
    type: String
  }],
  category: {
    type: String,
    enum: ['herb', 'supplement', 'vitamin', 'mineral', 'compound', 'food', 'lifestyle'],
    required: true
  },
  
  // Source Information
  dataSources: [{
    name: {
      type: String,
      enum: ['PubChem', 'WHO', 'MSKCC', 'Manual', 'AI-Enhanced'],
      required: true
    },
    sourceId: String,
    url: String,
    lastUpdated: Date,
    reliability: {
      type: Number,
      min: 0,
      max: 100
    }
  }],
  
  // Medical Information
  conditions: [{
    name: String,
    effectiveness: {
      type: String,
      enum: ['proven', 'likely', 'possible', 'unlikely', 'disproven']
    },
    evidence: {
      studies: Number,
      quality: {
        type: String,
        enum: ['high', 'moderate', 'low', 'very-low']
      }
    }
  }],
  
  // Safety Information
  safety: {
    generalSafety: {
      type: String,
      enum: ['very-safe', 'safe', 'moderate', 'caution', 'dangerous'],
      required: true
    },
    sideEffects: [{
      effect: String,
      frequency: {
        type: String,
        enum: ['very-common', 'common', 'uncommon', 'rare', 'very-rare']
      },
      severity: {
        type: String,
        enum: ['mild', 'moderate', 'severe']
      }
    }],
    contraindications: [String],
    pregnancySafety: {
      type: String,
      enum: ['safe', 'likely-safe', 'unknown', 'likely-unsafe', 'unsafe']
    },
    lactationSafety: {
      type: String,
      enum: ['safe', 'likely-safe', 'unknown', 'likely-unsafe', 'unsafe']
    }
  },
  
  // Interaction Information
  interactions: {
    medications: [{
      name: String,
      severity: {
        type: String,
        enum: ['major', 'moderate', 'minor', 'none']
      },
      description: String
    }],
    supplements: [{
      name: String,
      severity: {
        type: String,
        enum: ['major', 'moderate', 'minor', 'none']
      },
      description: String
    }],
    conditions: [{
      condition: String,
      concern: String
    }]
  },
  
  // Dosage Information
  dosage: {
    adult: {
      typical: String,
      max: String,
      unit: String,
      frequency: String
    },
    pediatric: {
      typical: String,
      max: String,
      unit: String,
      frequency: String,
      ageRange: String
    },
    duration: {
      typical: String,
      max: String
    }
  },
  
  // Additional Information
  activeCompounds: [String],
  mechanism: String,
  bioavailability: String,
  halfLife: String,
  
  // Quality Control
  lastReviewed: {
    type: Date,
    default: Date.now
  },
  reviewedBy: {
    type: String,
    enum: ['AI', 'Expert', 'Both']
  },
  qualityScore: {
    type: Number,
    min: 0,
    max: 100
  },
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'review', 'deprecated'],
    default: 'active'
  }
});

// Indexes for performance
naturalRemedySchema.index({ 'conditions.name': 1 });
naturalRemedySchema.index({ category: 1, 'safety.generalSafety': 1 });
naturalRemedySchema.index({ qualityScore: -1 });
naturalRemedySchema.index({ lastReviewed: 1 });

// Update timestamp on save
naturalRemedySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('NaturalRemedy', naturalRemedySchema);