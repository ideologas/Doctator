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

        // Basic validation
        if (!config.steps || !Array.isArray(config.steps)) {
            throw new Error('Configuration must have a "steps" array');
        }

        if (config.steps.length === 0) {
            throw new Error('Configuration must have at least one step');
        }

        // Validate each step has required fields
        config.steps.forEach((step, index) => {
            if (!step.model) {
                throw new Error(`Step ${index} is missing required "model" field`);
            }
            if (!step.initial_instruction_file) {
                throw new Error(`Step ${index} is missing required "initial_instruction_file" field`);
            }
            if (!step.post_instruction_file) {
                throw new Error(`Step ${index} is missing required "post_instruction_file" field`);
            }
            if (!step.input_folders || !Array.isArray(step.input_folders)) {
                throw new Error(`Step ${index} is missing required "input_folders" array`);
            }
            if (!step.output_folder) {
                throw new Error(`Step ${index} is missing required "output_folder" field`);
            }
        });

        // Replace template variables in paths
        const processedConfig = replaceTemplateVariables(config);

        console.log(`✅ Configuration loaded successfully with ${processedConfig.steps.length} steps`);
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