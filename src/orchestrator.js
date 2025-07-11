const fs = require('fs');
const path = require('path');
const configLoader = require('./configLoader');
const fileUtils = require('./fileUtils');
const llmClient = require('./llmClient');

async function run(configPath) {
    try {
        console.log('📋 Loading configuration...');
        const config = configLoader.loadConfig(configPath);
        
        console.log('🔍 Validating environment...');
        await validateEnvironment(config);
        
        console.log('🚀 Starting execution groups...');
        for (const [index, group] of config.execution_groups.entries()) {
            console.log(`\n--- Running Execution Group ${index + 1}/${config.execution_groups.length} ---`);
            const promises = group.map(step => executeStep(step));
            await Promise.all(promises);
            console.log(`--- Execution Group ${index + 1} Completed ---`);
        }
        
        console.log('\n🎉 All execution groups completed successfully!');
    } catch (error) {
        console.error('❌ Orchestrator failed:', error.message);
        throw error;
    }
}

async function validateEnvironment(config) {
    const apiKeyVar = config.llm_api_key_env_var || 'GEMINI_API_KEY';
    if (!process.env[apiKeyVar]) {
        throw new Error(`Environment variable ${apiKeyVar} is not set.`);
    }
    
    const isConnected = await llmClient.testGeminiConnection();
    if (!isConnected) {
        throw new Error('Failed to connect to Gemini API.');
    }
    
    console.log('✅ Environment validation passed');
}

function generateSlug(title) {
    return title
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '');
}

async function executeStep(step) {
    console.log(`\n📝 Executing step: ${step.name || 'Unnamed Step'}`);
    
    try {
        console.log('📖 Loading instruction files...');
        const initialInstruction = loadInstructionFile(step.initial_instruction_file);
        const postInstruction = loadInstructionFile(step.post_instruction_file);
        
        let allChunks = [];
        for (const folder of step.input_folders) {
            if (fs.existsSync(folder)) {
                let files = fs.readdirSync(folder).filter(f => (f.startsWith('code_part_') || f.startsWith('chunk_')) && f.endsWith('.txt'));
                if (files.length > 0) {
                    files.sort();
                    files.forEach((file) => {
                        const content = fs.readFileSync(path.join(folder, file), 'utf8');
                        allChunks.push(content);
                    });
                    console.log(`📦 Loaded ${files.length} prepared chunks from folder: ${folder}`);
                }
            } else {
                console.warn(`⚠️  Input folder does not exist: ${folder}`);
            }
        }
        
        const messages = [initialInstruction, ...allChunks, postInstruction];
        console.log(`🤖 Calling Gemini API for step: ${step.name}`);
        const llmResponse = await llmClient.callGeminiWithRetry(step.model, step.temperature, messages);

        const logDir = path.join(process.cwd(), 'logs');
        if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
        const timestamp = new Date().toISOString().replace(/:/g, '-');
        const logFile = path.join(logDir, `llm-response-${step.name}-${timestamp}.log`);
        fs.writeFileSync(logFile, llmResponse, 'utf8');
        console.log(`📝 Full LLM response for this step has been logged to: ${logFile}`);

        const titleMatch = llmResponse.match(/<title>(.*?)<\/title>/i);
        if (!titleMatch || !titleMatch[1]) {
            throw new Error("Could not find a <title> tag in the AI's response.");
        }
        const title = titleMatch[1];
        const fileName = `${generateSlug(title)}.html`;

        const operations = [{
            operation: 'create',
            file_path: fileName,
            file_content: llmResponse
        }];
        
        console.log('💾 Applying file operations...');
        fileUtils.applyFileOperations(operations, step.output_folder);
        console.log(`✅ Step "${step.name || 'Unnamed Step'}" completed successfully`);
    } catch (error) {
        console.error(`❌ Step "${step.name || 'Unnamed Step'}" failed:`, error.message);
        throw error;
    }
}

function loadInstructionFile(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            throw new Error(`Instruction file not found: ${filePath}`);
        }
        return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
        throw new Error(`Failed to load instruction file ${filePath}: ${error.message}`);
    }
}

module.exports = { run }; 