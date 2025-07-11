require('dotenv').config();
const orchestrator = require('./src/orchestrator');

async function main() {
    try {
        console.log('🚀 AI-DocGen Engine Starting...');
        
        // Default to config.json, but allow override via command line
        const configPath = process.argv[2] || './config/config.json';
        
        console.log(`📋 Loading configuration from: ${configPath}`);
        await orchestrator.run(configPath);
        
        console.log('✅ AI-DocGen Engine Completed Successfully!');
    } catch (error) {
        console.error('❌ AI-DocGen Engine Failed:', error.message);
        process.exit(1);
    }
}

main(); 