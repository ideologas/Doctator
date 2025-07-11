const fs = require('fs');
const path = require('path');

/**
 * Loads and parses a JSON configuration file
 * @param {string} configPath - Path to the configuration file
 * @returns {Object} Parsed configuration object
 */
function loadConfig(configPath) {
    try {
        // Check if file exists
        if (!fs.existsSync(configPath)) {
            throw new Error(`Configuration file not found: ${configPath}`);
        }

        // Read and parse the JSON file
        const configContent = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(configContent);

        // Basic validation for the new structure
        if (!config.execution_groups || !Array.isArray(config.execution_groups)) {
            throw new Error('Configuration must have an "execution_groups" array.');
        }

        if (config.execution_groups.length === 0) {
            throw new Error('Configuration must have at least one execution group.');
        }

        // Validate each step within each group
        config.execution_groups.forEach((group, groupIndex) => {
            if (!Array.isArray(group)) {
                throw new Error(`Execution group ${groupIndex} is not a valid array.`);
            }
            group.forEach((step, stepIndex) => {
                const stepId = `Group ${groupIndex + 1}, Step ${stepIndex + 1}`;
                if (!step.model) {
                    throw new Error(`${stepId} is missing required "model" field.`);
                }
                if (!step.initial_instruction_file) {
                    throw new Error(`${stepId} is missing required "initial_instruction_file" field.`);
                }
                if (!step.post_instruction_file) {
                    throw new Error(`${stepId} is missing required "post_instruction_file" field.`);
                }
                if (!step.input_folders || !Array.isArray(step.input_folders)) {
                    throw new Error(`${stepId} is missing required "input_folders" array.`);
                }
                if (!step.output_folder) {
                    throw new Error(`${stepId} is missing required "output_folder" field.`);
                }
            });
        });

        // Validate Git configuration if present
        if (config.git_repo) {
            const gitUtils = require('./gitUtils');
            gitUtils.validateGitConfig(config.git_repo);
        }

        // Replace template variables in paths
        const processedConfig = replaceTemplateVariables(config);

        const totalSteps = processedConfig.execution_groups.reduce((acc, group) => acc + group.length, 0);
        console.log(`✅ Configuration loaded successfully with ${totalSteps} steps in ${processedConfig.execution_groups.length} execution groups.`);
        return processedConfig;

    } catch (error) {
        if (error instanceof SyntaxError) {
            throw new Error(`Invalid JSON in configuration file: ${error.message}`);
        }
        throw error;
    }
}

/**
 * Replaces template variables like {{project_root_folder}} in the configuration
 * @param {Object} config - Configuration object
 * @returns {Object} Configuration with template variables replaced
 */
function replaceTemplateVariables(config) {
    const configStr = JSON.stringify(config);
    let processedStr = configStr;

    // Replace {{project_root_folder}} with the actual value
    if (config.project_root_folder) {
        const projectRoot = path.resolve(config.project_root_folder);
        processedStr = processedStr.replace(/\{\{project_root_folder\}\}/g, projectRoot);
    }

    return JSON.parse(processedStr);
}

module.exports = {
    loadConfig
}; 