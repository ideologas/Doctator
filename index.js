require('dotenv').config();
const configLoader = require('./src/configLoader');
const gitUtils = require('./src/gitUtils');
const orchestrator = require('./src/orchestrator');

async function runGitIntegrationForFirstCommit(config) {
    if (!config.git_repo) {
        console.log('ℹ️  No Git repository configured. Skipping Git integration step.');
        return;
    }

    console.log('🚀 Starting Git Integration Step: Checking out the FIRST commit...');
    
    await gitUtils.cloneAndCheckoutFirstCommit({
        repoUrl: config.git_repo.url,
        branch: config.git_repo.branch,
        destinationPath: config.project_root_folder
    });
    
    console.log('✅ Git Integration Step Completed. Project is at the first commit.');
}

async function main() {
    const originalCwd = process.cwd(); // Store initial working directory

    try {
        console.log('🚀 AI-DocGen Engine Starting...');
        
        // Default to config.json, but allow override via command line
        const configPath = process.argv[2] || './config/config.json';
        
        console.log(`📋 Loading configuration from: ${configPath}`);
        const config = configLoader.loadConfig(configPath);

        // --- GIT INTEGRATION STEP: Checkout First Commit ---
        await runGitIntegrationForFirstCommit(config);
        // --- END GIT INTEGRATION STEP ---

        // Now, proceed with the LLM orchestration. The 'orchestrator'
        // will then read files from 'config.project_root_folder' which
        // now contains the first commit's state.
        await orchestrator.run(configPath);

        console.log('✅ AI-DocGen Engine Completed Successfully!');

    } catch (error) {
        console.error('❌ AI-DocGen Engine Failed:', error.message);
        // Ensure we always change back to original CWD if process.chdir was used
        if (process.cwd() !== originalCwd) {
            process.chdir(originalCwd);
        }
        process.exit(1);
    } finally {
        // Ensure original CWD is restored even on success
        if (process.cwd() !== originalCwd) {
            process.chdir(originalCwd);
        }
    }
}

main(); 