// Test Gemini AI Integration
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function testGeminiAI() {
    console.log('🧪 Testing Gemini AI Integration...\n');

    // Check for API key
    if (!process.env.GEMINI_API_KEY) {
        console.error('❌ GEMINI_API_KEY is not set in .env file');
        return;
    }

    try {
        // Initialize Gemini
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        // Test 1: Basic medication alternative query
        console.log('Test 1: Getting natural alternatives for Ibuprofen...');
        const prompt1 = `As a natural wellness expert, provide natural alternatives for Ibuprofen (anti-inflammatory pain reliever). Include:
        1. Natural alternatives with similar effects
        2. Dosage recommendations
        3. Safety considerations
        4. When to consult healthcare provider
        Format as JSON with fields: alternatives (array), safety_notes, consultation_advice`;

        const result1 = await model.generateContent(prompt1);
        const response1 = await result1.response;
        console.log('✅ Response received:');
        console.log(response1.text().substring(0, 500) + '...\n');

        // Test 2: OCR text analysis
        console.log('Test 2: Analyzing medication label text...');
        const ocrText = `
        TYLENOL Extra Strength
        Acetaminophen 500mg
        Pain Reliever/Fever Reducer
        Directions: Adults take 2 caplets every 6 hours
        Do not exceed 6 caplets in 24 hours
        `;

        const prompt2 = `Analyze this medication label text and provide:
        1. Medication name and active ingredient
        2. Natural alternatives for this medication
        3. Key safety warnings
        Format as structured data`;

        const result2 = await model.generateContent(prompt2 + '\n\nLabel text: ' + ocrText);
        const response2 = await result2.response;
        console.log('✅ OCR Analysis Response:');
        console.log(response2.text().substring(0, 500) + '...\n');

        // Test 3: Personalized recommendations
        console.log('Test 3: Personalized wellness recommendations...');
        const prompt3 = `Create a personalized natural wellness plan for someone who frequently uses over-the-counter pain relievers. Include:
        1. Preventive natural approaches
        2. Lifestyle modifications
        3. Supplement recommendations
        4. Warning signs to watch for`;

        const result3 = await model.generateContent(prompt3);
        const response3 = await result3.response;
        console.log('✅ Personalized Plan:');
        console.log(response3.text().substring(0, 500) + '...\n');

        // Test 4: Safety check
        console.log('Test 4: Interaction and safety check...');
        const prompt4 = `Check for potential interactions between:
        - Turmeric supplements
        - Ginger tea
        - Prescribed blood thinners
        Provide safety warnings and recommendations`;

        const result4 = await model.generateContent(prompt4);
        const response4 = await result4.response;
        console.log('✅ Safety Analysis:');
        console.log(response4.text().substring(0, 500) + '...\n');

        console.log('🎉 All AI tests completed successfully!');
        console.log('✅ Gemini AI is properly configured and working');

        // Test response time
        console.log('\n⏱️  Performance Test...');
        const startTime = Date.now();
        await model.generateContent('What is turmeric good for?');
        const responseTime = Date.now() - startTime;
        console.log(`Response time: ${responseTime}ms`);

    } catch (error) {
        console.error('❌ AI Test Failed:', error.message);

        if (error.message.includes('API_KEY')) {
            console.error('Issue: Invalid API key. Please check your GEMINI_API_KEY');
        } else if (error.message.includes('quota')) {
            console.error('Issue: API quota exceeded. Please check your Gemini API usage');
        } else if (error.message.includes('network')) {
            console.error('Issue: Network error. Please check your internet connection');
        }
    }
}

// Run the test
testGeminiAI();