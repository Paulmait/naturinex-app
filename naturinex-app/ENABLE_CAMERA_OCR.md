# 🎯 Enable Camera OCR for Beta Testing

## Quick Setup (15 minutes)

### Step 1: Get Google Cloud Vision API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable "Cloud Vision API"
4. Create credentials → API Key
5. Copy the API key

### Step 2: Add to Render Environment

Add this environment variable:
```
GOOGLE_VISION_API_KEY=your_api_key_here
```

### Step 3: Update Server Code

Replace the current `/api/analyze` endpoint in `server/index.js` with:

```javascript
// Add at top with other imports
const axios = require('axios');

// Replace the existing app.post('/api/analyze') with:
app.post('/api/analyze', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    console.log('📊 Analyzing medication from image with OCR');
    
    // Convert image to base64
    const imageBase64 = req.file.buffer.toString('base64');
    
    // Call Google Vision API
    const visionResponse = await axios.post(
      `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_VISION_API_KEY}`,
      {
        requests: [{
          image: { content: imageBase64 },
          features: [{ type: 'TEXT_DETECTION' }]
        }]
      }
    );
    
    const detectedText = visionResponse.data.responses[0]?.fullTextAnnotation?.text || '';
    
    if (!detectedText) {
      return res.status(400).json({ 
        error: 'Could not read text from image. Please try manual entry.' 
      });
    }
    
    // Extract medication name (simple approach - looks for common patterns)
    const medicationMatch = detectedText.match(/([A-Za-z]+(?:\s+[A-Za-z]+)*)\s*(?:\d+\s*mg)?/i);
    const medicationName = medicationMatch ? medicationMatch[1] : 'Unknown Medication';
    
    // Use existing Gemini AI to analyze the detected medication
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `Analyze the medication "${medicationName}" (detected from image) and provide natural alternatives.
    
    Format the response as a JSON object with the following structure:
    {
      "medicationName": "string",
      "medicationType": "string",
      "alternatives": [
        {
          "name": "string",
          "effectiveness": "string (High/Moderate/Low)",
          "description": "string",
          "benefits": ["string"]
        }
      ],
      "warnings": ["string"]
    }`;
    
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const analysisResult = JSON.parse(jsonMatch[0]);
      res.json({
        ...analysisResult,
        detectedText: detectedText.substring(0, 100) + '...' // For debugging
      });
    } else {
      throw new Error('Invalid AI response format');
    }
    
  } catch (error) {
    console.error('Image analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze image. Please use manual entry instead.' 
    });
  }
});
```

### Step 4: Install Required Package

Add to server/package.json dependencies:
```json
"multer": "^1.4.5-lts.1",
"axios": "^1.6.0"
```

Then in server directory:
```bash
npm install
```

### Step 5: Add Multer Setup

Add this after your imports in server/index.js:
```javascript
const multer = require('multer');
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});
```

## Alternative: Quick Mock for Testing

If you want to test without setting up Google Vision, use this mock version:

```javascript
app.post('/api/analyze', upload.single('image'), async (req, res) => {
  try {
    console.log('📊 Mock analyzing medication from image');
    
    // Simulate OCR delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Return mock data for testing
    const mockMedications = ['Ibuprofen', 'Aspirin', 'Tylenol', 'Amoxicillin'];
    const randomMed = mockMedications[Math.floor(Math.random() * mockMedications.length)];
    
    // Use Gemini to analyze the mock medication
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Analyze "${randomMed}" and provide natural alternatives...`;
    
    // ... rest of the analysis code
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze image' });
  }
});
```

## Testing

1. Deploy to Render
2. Test with Expo Go or TestFlight
3. Camera should now extract text and analyze medications!

## Cost Estimate

- Google Vision API: $1.50 per 1000 images
- For 1000 beta testers doing 10 scans each = $15
- Very affordable for beta testing!