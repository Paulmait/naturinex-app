// Enhanced product name extraction with NLP-like pattern matching
function extractProductInfo(detectedText) {
  if (!detectedText) {
    return {
      productName: 'Unknown Product',
      brandName: null,
      activeIngredient: null,
      category: null,
      fullText: detectedText
    };
  }

  // Clean and normalize text
  const lines = detectedText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Common pharmaceutical and wellness product patterns
  const patterns = {
    // Prescription medication format: "DRUG_NAME DOSAGE FORM"
    prescription: /^([A-Z][A-Za-z]+(?:\s+[A-Za-z]+)*)\s+(\d+(?:\.\d+)?)\s*(MG|ML|MCG|G|IU|mg|ml|mcg|g)/i,
    
    // OTC brand names to look for
    brands: [
      'equate', 'walgreens', 'cvs', 'rite aid', 'kirkland', 'up&up', 'good sense',
      'bayer', 'advil', 'tylenol', 'excedrin', 'aleve', 'motrin', 'pepto-bismol',
      'prilosec', 'nexium', 'claritin', 'zyrtec', 'allegra', 'mucinex', 'robitussin',
      'nyquil', 'dayquil', 'tums', 'gaviscon', 'mylanta', 'maalox', 'imodium',
      'miralax', 'dulcolax', 'senokot', 'benefiber', 'metamucil'
    ],
    
    // Common active ingredients
    activeIngredients: [
      'ibuprofen', 'acetaminophen', 'aspirin', 'naproxen', 'diphenhydramine',
      'loratadine', 'cetirizine', 'fexofenadine', 'ranitidine', 'famotidine',
      'omeprazole', 'esomeprazole', 'lansoprazole', 'bismuth subsalicylate',
      'loperamide', 'simethicone', 'calcium carbonate', 'magnesium hydroxide',
      'polyethylene glycol', 'docusate', 'senna', 'psyllium'
    ],
    
    // Lines to skip
    skip: /^(NDC|Rx#|TAKE|USE|CAUTION|PROVIDER|compare to|federal law|lot|exp|mfg|dist|questions|warnings|directions|drug facts)/i,
    
    // Dosage patterns
    dosage: /(\d+(?:\.\d+)?)\s*(mg|ml|mcg|g|iu|%)/i,
  };
  
  // Results storage
  let productName = null;
  let brandName = null;
  let activeIngredient = null;
  let dosage = null;
  let category = null;
  
  // First pass: Look for brand names
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    // Skip instruction/legal lines
    if (patterns.skip.test(line)) continue;
    
    // Check against known brands
    for (const brand of patterns.brands) {
      if (lowerLine.includes(brand)) {
        brandName = brand.charAt(0).toUpperCase() + brand.slice(1);
        break;
      }
    }
  }
  
  // Second pass: Look for active ingredients and prescription names
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();
    
    // Skip if already processed
    if (patterns.skip.test(line)) continue;
    
    // Check for prescription pattern (e.g., "OMEPRAZOLE 20MG")
    const rxMatch = line.match(patterns.prescription);
    if (rxMatch) {
      productName = rxMatch[1];
      dosage = `${rxMatch[2]}${rxMatch[3]}`;
      category = 'prescription';
      break;
    }
    
    // Look for "active ingredient" label
    if (lowerLine.includes('active ingredient')) {
      // Check next line for the actual ingredient
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        const ingredientMatch = nextLine.match(/([A-Za-z\s]+?)(\d+(?:\.\d+)?\s*(?:mg|ml|mcg|g|%))?/i);
        if (ingredientMatch) {
          activeIngredient = ingredientMatch[1].trim();
          if (ingredientMatch[2]) {
            dosage = ingredientMatch[2].trim();
          }
        }
      }
    }
    
    // Check against known active ingredients
    for (const ingredient of patterns.activeIngredients) {
      if (lowerLine.includes(ingredient)) {
        activeIngredient = ingredient.charAt(0).toUpperCase() + ingredient.slice(1);
        // Try to extract dosage
        const dosageMatch = line.match(patterns.dosage);
        if (dosageMatch) {
          dosage = dosageMatch[0];
        }
        break;
      }
    }
  }
  
  // Third pass: Look for product descriptors if we haven't found a name
  if (!productName && !brandName) {
    const productKeywords = [
      'relief', 'tablet', 'capsule', 'liquid', 'syrup', 'gel', 'cream',
      'ointment', 'drops', 'spray', 'powder', 'suspension'
    ];
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (patterns.skip.test(line)) continue;
      
      for (const keyword of productKeywords) {
        if (lowerLine.includes(keyword) && line.length > 3 && line.length < 50) {
          productName = line;
          break;
        }
      }
      if (productName) break;
    }
  }
  
  // Determine final product name
  if (!productName) {
    if (brandName && activeIngredient) {
      productName = `${brandName} (${activeIngredient})`;
    } else if (brandName) {
      productName = brandName;
    } else if (activeIngredient) {
      productName = activeIngredient;
    } else {
      // Last resort: use the first non-skip line that's reasonable length
      for (const line of lines) {
        if (!patterns.skip.test(line) && line.length > 2 && line.length < 50) {
          productName = line;
          break;
        }
      }
    }
  }
  
  // Add dosage to product name if available
  if (productName && dosage && !productName.includes(dosage)) {
    productName = `${productName} ${dosage}`;
  }
  
  // Categorize the product
  if (!category) {
    if (activeIngredient || brandName) {
      category = 'otc'; // Over-the-counter
    } else {
      category = 'unknown';
    }
  }
  
  return {
    productName: productName || 'Unknown Product',
    brandName: brandName,
    activeIngredient: activeIngredient,
    dosage: dosage,
    category: category,
    fullText: detectedText
  };
}

module.exports = { extractProductInfo };