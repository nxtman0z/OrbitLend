// Simple test script for Gemini API
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI('AIzaSyDmQc9lihwtxJkRoo6uLmW70aQx-Fe5ENw');

async function testGemini() {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = "Hello! I'm testing the Gemini API for a lending platform chatbot. Can you respond with a helpful message about how you can assist users with their loans and financial questions?";

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('✅ Gemini API Test Successful!');
    console.log('Response:', text);
  } catch (error) {
    console.error('❌ Gemini API Test Failed:', error);
  }
}

testGemini();
