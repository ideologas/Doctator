const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');

// Convert exec to promise-based
const execAsync = util.promisify(exec);

/**
 * Executes a shell command with options
 * @param {string} command - The command to execute
 * @param {Object} options - Execution options (cwd, etc.)
 * @returns {Promise<string>} Command output
 */
async function executeCommand(command, options = {}) {
    try {
        console.log(`🔧 Executing: ${command}`);
        const { stdout, stderr } = await execAsync(command, options);
        
        if (stderr && stderr.trim()) {
            console.warn(`⚠️  Command stderr: ${stderr}`);
        }
        
        return stdout;
    } catch (error) {
        console.error(`❌ Command failed: ${command}`);
        console.error(`Error: ${error.message}`);
        throw new Error(`Command execution failed: ${error.message}`);
    }
}

/**
 * Clones a repository and checks out the very first commit
 * @param {Object} params - Parameters object
 * @param {string} params.repoUrl - Git repository URL
 * @param {string} params.branch - Branch to clone from
 * @param {string} params.destinationPath - Where to clone the repository
 */
async function cloneAndCheckoutFirstCommit({ repoUrl, branch, destinationPath }) {
    const originalCwd = process.cwd();
    
    try {
        console.log('🚀 Starting Git Integration: First Commit Analysis');
        console.log(`📁 Repository: ${repoUrl}`);
        console.log(`🌿 Branch: ${branch}`);
        console.log(`📂 Destination: ${destinationPath}`);
        
        // 1. Prepare clean slate for first commit analysis
        console.log('🧹 Preparing clean slate for first commit analysis...');
        
        if (fs.existsSync(destinationPath)) {
            const contents = fs.readdirSync(destinationPath);
            if (contents.length > 0) {
                console.log('⚠️  Destination path exists and is not empty. Cleaning for fresh first commit analysis...');
                
                // Check if it's a Git repository
                const gitPath = path.join(destinationPath, '.git');
                if (fs.existsSync(gitPath)) {
                    console.log('🗑️  Removing existing Git repository...');
                } else {
                    console.log('🗑️  Removing existing directory contents...');
                }
                
                // Remove the entire directory
                fs.rmSync(destinationPath, { recursive: true, force: true });
                console.log('✅ Cleaned existing directory');
            }
        }
        
        // Create the destination directory
        fs.mkdirSync(destinationPath, { recursive: true });
        
        // 2. Clone the repository (shallow clone for speed)
        console.log('📥 Cloning repository...');
        await executeCommand(
            `git clone --no-checkout --branch ${branch} "${repoUrl}" "${destinationPath}"`,
            { cwd: path.dirname(destinationPath) }
        );
        
        // 3. Change to the repository directory
        process.chdir(destinationPath);
        console.log(`📂 Changed to directory: ${destinationPath}`);
        
        // 4. Find the first commit
        console.log('🔍 Finding the first commit...');
        const firstCommitHash = (await executeCommand('git rev-list --max-parents=0 HEAD')).trim();
        
        if (!firstCommitHash) {
            throw new Error('Repository has no commits or could not find first commit');
        }
        
        console.log(`🎯 First commit hash: ${firstCommitHash}`);
        
        // 5. Checkout the first commit
        console.log(`📋 Checking out first commit: ${firstCommitHash}`);
        await executeCommand(`git checkout ${firstCommitHash}`);
        
        // 6. Verify the checkout
        const currentCommit = (await executeCommand('git rev-parse HEAD')).trim();
        if (currentCommit !== firstCommitHash) {
            throw new Error(`Failed to checkout first commit. Expected: ${firstCommitHash}, Got: ${currentCommit}`);
        }
        
        // 7. Get commit information for logging
        const commitInfo = (await executeCommand('git log --oneline -1')).trim();
        console.log(`📝 First commit info: ${commitInfo}`);
        
        // 8. List files in the first commit
        const files = (await executeCommand('git ls-tree -r --name-only HEAD')).trim().split('\n').filter(f => f);
        console.log(`📄 Files in first commit: ${files.length} files`);
        
        if (files.length > 0) {
            console.log('📋 Sample files:');
            files.slice(0, 5).forEach(file => console.log(`   - ${file}`));
            if (files.length > 5) {
                console.log(`   ... and ${files.length - 5} more files`);
            }
        }
        
        console.log('✅ Git Integration completed successfully!');
        console.log(`📁 Repository is now at the first commit state in: ${destinationPath}`);
        
    } catch (error) {
        console.error('❌ Git Integration failed:', error.message);
        
        // Clean up on failure
        if (fs.existsSync(destinationPath)) {
            console.log('🧹 Cleaning up failed clone...');
            try {
                fs.rmSync(destinationPath, { recursive: true, force: true });
            } catch (cleanupError) {
                console.warn('⚠️  Could not clean up destination directory:', cleanupError.message);
            }
        }
        
        throw error;
    } finally {
        // Always restore original working directory
        if (process.cwd() !== originalCwd) {
            process.chdir(originalCwd);
            console.log(`📂 Restored working directory: ${originalCwd}`);
        }
    }
}

/**
 * Validates Git configuration
 * @param {Object} gitConfig - Git configuration object
 * @returns {boolean} True if configuration is valid
 */
function validateGitConfig(gitConfig) {
    if (!gitConfig) {
        throw new Error('Git configuration is missing');
    }
    
    if (!gitConfig.url) {
        throw new Error('Git repository URL is required');
    }
    
    if (!gitConfig.branch) {
        throw new Error('Git branch is required');
    }
    
    // Basic URL validation
    const urlPattern = /^https?:\/\/.*\.git$|^git@.*:.*\.git$/;
    if (!urlPattern.test(gitConfig.url)) {
        throw new Error('Invalid Git repository URL format');
    }
    
    return true;
}

module.exports = {
    executeCommand,
    cloneAndCheckoutFirstCommit,
    validateGitConfig
}; 