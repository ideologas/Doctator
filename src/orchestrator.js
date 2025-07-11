const fs = require('fs');
const path = require('path');
const configLoader = require('./configLoader');
const fileUtils = require('./fileUtils');
const llmClient = require('./llmClient');

/**
 * Main orchestrator function that runs the AI-DocGen process
 * @param {string} configPath - Path to the configuration file
 */
async function run(configPath) {
    try {
        // Load configuration
        console.log('📋 Loading configuration...');
        const config = configLoader.loadConfig(configPath);
        
        // Validate environment
        console.log('🔍 Validating environment...');
        await validateEnvironment(config);
        
        // Process steps (for MVP, we only have one step)
        console.log('🚀 Starting step execution...');
        
        for (const step of config.steps) {
            await executeStep(step);
        }
        
        console.log('🎉 All steps completed successfully!');
        
    } catch (error) {
        console.error('❌ Orchestrator failed:', error.message);
        throw error;
    }
}

/**
 * Validates the environment and dependencies
 * @param {Object} config - Configuration object
 */
async function validateEnvironment(config) {
    // Check if API key is set
    const apiKeyVar = config.llm_api_key_env_var || 'GEMINI_API_KEY';
    if (!process.env[apiKeyVar]) {
        throw new Error(`Environment variable ${apiKeyVar} is not set. Please create a .env file with your Gemini API key.`);
    }
    
    // Test API connection
    const isConnected = await llmClient.testGeminiConnection();
    if (!isConnected) {
        throw new Error('Failed to connect to Gemini API. Please check your API key and network connection.');
    }
    
    console.log('✅ Environment validation passed');
}

/**
 * Executes a single step in the documentation generation process
 * @param {Object} step - Step configuration object
 */
async function executeStep(step) {
    console.log(`\n📝 Executing step: ${step.name || 'Unnamed Step'}`);
    
    try {
        // 1. Load prompt instructions
        console.log('📖 Loading instruction files...');
        const initialInstruction = loadInstructionFile(step.initial_instruction_file);
        const postInstruction = loadInstructionFile(step.post_instruction_file);
        
        // 2. Read and concatenate input files
        console.log('📁 Reading input files...');
        const concatenatedContent = fileUtils.readAndConcatenateFiles(
            step.input_folders,
            step.file_filters
        );
        
        if (!concatenatedContent || concatenatedContent.trim().length === 0) {
            console.warn('⚠️  No content found in input folders. Skipping step.');
            return;
        }
        
        // 3. Chunk the content
        console.log('📦 Chunking content...');
        const chunks = fileUtils.chunkString(concatenatedContent, 9000);
        
        // 4. Prepare messages for LLM
        console.log('💬 Preparing messages for LLM...');
        const messages = [
            initialInstruction,
            ...chunks,
            postInstruction
        ];
        
        // 5. Call LLM
        console.log('🤖 Calling Gemini API...');
        const llmResponse = await llmClient.callGeminiWithRetry(
            step.model,
            step.temperature,
            messages
        );
        
        // 6. Parse LLM response
        console.log('🔍 Parsing LLM response...');
        const operations = parseLLMResponse(llmResponse);
        
        // 7. Apply file operations
        console.log('💾 Applying file operations...');
        fileUtils.applyFileOperations(operations, step.output_folder);
        
        console.log(`✅ Step "${step.name || 'Unnamed Step'}" completed successfully`);
        
    } catch (error) {
        console.error(`❌ Step "${step.name || 'Unnamed Step'}" failed:`, error.message);
        throw error;
    }
}

/**
 * Loads content from an instruction file
 * @param {string} filePath - Path to the instruction file
 * @returns {string} File content
 */
function loadInstructionFile(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            throw new Error(`Instruction file not found: ${filePath}`);
        }
        
        const content = fs.readFileSync(filePath, 'utf8');
        console.log(`📄 Loaded instruction file: ${filePath}`);
        return content;
        
    } catch (error) {
        throw new Error(`Failed to load instruction file ${filePath}: ${error.message}`);
    }
}

/**
 * Parses the LLM response and extracts file operations
 * @param {string} llmResponse - Raw response from LLM
 * @returns {Array} Array of file operations
 */
function parseLLMResponse(llmResponse) {
    try {
        // Clean the response - remove any markdown formatting or extra text
        let cleanResponse = llmResponse.trim();
        
        // Look for JSON content (it might be wrapped in markdown code blocks)
        const jsonMatch = cleanResponse.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
            cleanResponse = jsonMatch[1].trim();
        } else {
            // Try to find JSON array patterns
            const arrayMatch = cleanResponse.match(/\[\s*\{[\s\S]*\}\s*\]/);
            if (arrayMatch) {
                cleanResponse = arrayMatch[0];
            }
        }
        
        // Parse JSON
        const operations = JSON.parse(cleanResponse);
        
        // Validate operations
        if (!Array.isArray(operations)) {
            throw new Error('LLM response must be an array of operations');
        }
        
        // Validate each operation
        for (let i = 0; i < operations.length; i++) {
            const op = operations[i];
            
            if (!op.operation || !['create', 'update', 'delete'].includes(op.operation)) {
                throw new Error(`Invalid operation at index ${i}: ${op.operation}`);
            }
            
            if (!op.file_path) {
                throw new Error(`Missing file_path at index ${i}`);
            }
            
            if ((op.operation === 'create' || op.operation === 'update') && !op.file_content) {
                throw new Error(`Missing file_content for ${op.operation} operation at index ${i}`);
            }
        }
        
        console.log(`✅ Parsed ${operations.length} file operations from LLM response`);
        return operations;
        
    } catch (error) {
        console.error('❌ Failed to parse LLM response:', error.message);
        console.error('Raw LLM response:', llmResponse.substring(0, 500) + '...');
        throw new Error(`Failed to parse LLM response: ${error.message}`);
    }
}

module.exports = {
    run
}; 