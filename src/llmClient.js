const { GoogleGenAI } = require('@google/genai');

/**
 * Calls Google Gemini API with a multi-message conversation
 * @param {string} model - Model name (e.g., 'gemini-1.5-pro')
 * @param {number} temperature - Temperature for response generation
 * @param {string[]} messages - Array of message strings
 * @returns {Promise<string>} LLM response content
 */
async function callGemini(model, temperature, messages) {
    try {
        // Check for API key
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY environment variable is not set. Please set it in your .env file.');
        }

        console.log(`🤖 Calling Gemini model: ${model} with temperature: ${temperature}`);
        console.log(`📝 Sending ${messages.length} messages to LLM`);

        // Initialize the Gemini client
        const genAI = new GoogleGenAI({ apiKey });
        
        // Get the model
        const geminiModel = genAI.models.getModel(model);
        
        // Prepare the conversation content
        // For Gemini, we need to structure this as a single prompt with all messages
        const fullPrompt = messages.join('\n\n');
        
        // Make the API call
        const response = await geminiModel.generateContent({
            contents: fullPrompt,
            config: {
                temperature: temperature,
                maxOutputTokens: 8192,
            }
        });

        // Extract the response text
        const responseText = response.text;
        
        if (!responseText) {
            throw new Error('Empty response from Gemini API');
        }

        console.log(`✅ Received response from Gemini (${responseText.length} characters)`);
        return responseText;

    } catch (error) {
        // Handle specific error types
        if (error.message.includes('API key')) {
            throw new Error(`Authentication failed: ${error.message}`);
        } else if (error.message.includes('quota') || error.message.includes('rate limit')) {
            throw new Error(`Rate limit exceeded: ${error.message}. Please try again later.`);
        } else if (error.message.includes('model')) {
            throw new Error(`Model error: ${error.message}. Please check if the model name is correct.`);
        } else {
            throw new Error(`Gemini API error: ${error.message}`);
        }
    }
}

/**
 * Calls Gemini with retry logic for rate limiting
 * @param {string} model - Model name
 * @param {number} temperature - Temperature setting
 * @param {string[]} messages - Array of messages
 * @param {number} maxRetries - Maximum number of retries
 * @returns {Promise<string>} LLM response
 */
async function callGeminiWithRetry(model, temperature, messages, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await callGemini(model, temperature, messages);
        } catch (error) {
            lastError = error;
            
            // If it's a rate limit error, wait before retrying
            if (error.message.includes('rate limit') && attempt < maxRetries) {
                const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff
                console.log(`⏳ Rate limited. Waiting ${waitTime}ms before retry ${attempt + 1}/${maxRetries}`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue;
            }
            
            // If it's not a rate limit error, or we've exhausted retries, throw
            if (attempt === maxRetries) {
                throw lastError;
            }
        }
    }
    
    throw lastError;
}

/**
 * Test function to verify Gemini API connectivity
 * @returns {Promise<boolean>} True if API is working
 */
async function testGeminiConnection() {
    try {
        console.log('🔍 Testing Gemini API connection...');
        
        const testResponse = await callGemini('gemini-1.5-pro', 0.1, ['Hello, can you respond with just "API test successful"?']);
        
        if (testResponse.toLowerCase().includes('api test successful')) {
            console.log('✅ Gemini API connection test passed');
            return true;
        } else {
            console.log('⚠️  Gemini API responded but with unexpected content');
            return false;
        }
    } catch (error) {
        console.error('❌ Gemini API connection test failed:', error.message);
        return false;
    }
}

module.exports = {
    callGemini,
    callGeminiWithRetry,
    testGeminiConnection
}; 