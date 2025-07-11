const fs = require('fs');
const path = require('path');

/**
 * Recursively reads all files from input folders and concatenates them with separators
 * @param {string[]} inputFolders - Array of folder paths to read from
 * @param {string[]} fileFilters - Array of file extensions to include (e.g., ['*.ts', '*.js'])
 * @returns {string} Concatenated file content with separators
 */
function readAndConcatenateFiles(inputFolders, fileFilters = []) {
    let concatenatedContent = '';
    
    for (const folder of inputFolders) {
        if (!fs.existsSync(folder)) {
            console.warn(`⚠️  Input folder not found: ${folder}`);
            continue;
        }
        
        const files = getAllFiles(folder, fileFilters);
        
        for (const filePath of files) {
            try {
                const fileContent = fs.readFileSync(filePath, 'utf8');
                const relativePath = path.relative(process.cwd(), filePath);
                
                // Add file separator with clear boundaries
                concatenatedContent += `\n--- FILE_START: ${relativePath} ---\n`;
                concatenatedContent += fileContent;
                concatenatedContent += `\n--- FILE_END: ${relativePath} ---\n`;
                
            } catch (error) {
                console.warn(`⚠️  Could not read file ${filePath}: ${error.message}`);
            }
        }
    }
    
    console.log(`📁 Concatenated ${getAllFiles(inputFolders, fileFilters).length} files`);
    return concatenatedContent;
}

/**
 * Recursively gets all files from a directory that match the file filters
 * @param {string|string[]} folders - Folder path or array of folder paths
 * @param {string[]} fileFilters - Array of file extensions to include
 * @returns {string[]} Array of file paths
 */
function getAllFiles(folders, fileFilters = []) {
    const allFiles = [];
    const foldersArray = Array.isArray(folders) ? folders : [folders];
    
    for (const folder of foldersArray) {
        if (!fs.existsSync(folder)) {
            continue;
        }
        
        const files = getAllFilesRecursive(folder);
        
        // Apply file filters if provided
        let filteredFiles;
        if (fileFilters.length > 0) {
            filteredFiles = files.filter(file => {
                const ext = path.extname(file);
                return fileFilters.some(filter => {
                    // Convert glob pattern to regex (simple implementation)
                    const pattern = filter.replace(/\*/g, '.*');
                    return new RegExp(pattern + '$').test(ext) || new RegExp(pattern + '$').test(path.basename(file));
                });
            });
        } else {
            filteredFiles = files;
        }
        // Exclude package-lock.json by filename
        filteredFiles = filteredFiles.filter(file => path.basename(file) !== 'package-lock.json');
        allFiles.push(...filteredFiles);
    }
    
    return allFiles;
}

/**
 * Recursively gets all files from a directory
 * @param {string} dir - Directory path
 * @returns {string[]} Array of file paths
 */
function getAllFilesRecursive(dir) {
    const files = [];
    
    try {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            // Exclude playwright-report folders
            if (stat.isDirectory()) {
                if (item === 'playwright-report') continue;
                files.push(...getAllFilesRecursive(fullPath));
            } else if (stat.isFile()) {
                files.push(fullPath);
            }
        }
    } catch (error) {
        console.warn(`⚠️  Could not read directory ${dir}: ${error.message}`);
    }
    
    return files;
}

/**
 * Splits concatenated content into chunks while respecting file boundaries
 * @param {string} concatenatedString - The concatenated file content
 * @param {number} chunkSize - Maximum characters per chunk (default: 9000)
 * @returns {string[]} Array of content chunks
 */
function chunkString(concatenatedString, chunkSize = 9000) {
    if (!concatenatedString || concatenatedString.length === 0) {
        return [];
    }
    
    const chunks = [];
    const files = extractFiles(concatenatedString);
    
    let currentChunk = '';
    
    for (const file of files) {
        const fileContent = `\n--- FILE_START: ${file.path} ---\n${file.content}\n--- FILE_END: ${file.path} ---\n`;
        
        // If adding this file would exceed chunk size and current chunk is not empty
        if (currentChunk.length + fileContent.length > chunkSize && currentChunk.length > 0) {
            // Save current chunk and start new one
            chunks.push(currentChunk.trim());
            currentChunk = fileContent;
        } else {
            // Add to current chunk
            currentChunk += fileContent;
        }
    }
    
    // Add the last chunk if it has content
    if (currentChunk.trim().length > 0) {
        chunks.push(currentChunk.trim());
    }
    
    console.log(`📦 Split content into ${chunks.length} chunks`);
    return chunks;
}

/**
 * Extracts individual files from concatenated content
 * @param {string} concatenatedString - The concatenated file content
 * @returns {Array} Array of {path, content} objects
 */
function extractFiles(concatenatedString) {
    const files = [];
    const fileRegex = /--- FILE_START: (.+?) ---\n([\s\S]*?)\n--- FILE_END: \1 ---/g;
    let match;
    
    while ((match = fileRegex.exec(concatenatedString)) !== null) {
        files.push({
            path: match[1],
            content: match[2]
        });
    }
    
    return files;
}

/**
 * Applies file operations based on LLM JSON response
 * @param {Array} operations - Array of {operation, file_path, file_content} objects
 * @param {string} outputFolder - Base output folder path
 */
function applyFileOperations(operations, outputFolder) {
    // Ensure output folder exists
    if (!fs.existsSync(outputFolder)) {
        fs.mkdirSync(outputFolder, { recursive: true });
        console.log(`📁 Created output folder: ${outputFolder}`);
    }
    
    let created = 0, updated = 0, deleted = 0;
    
    for (const operation of operations) {
        const fullPath = path.join(outputFolder, operation.file_path);
        
        try {
            switch (operation.operation) {
                case 'create':
                    // Ensure directory exists
                    const createDir = path.dirname(fullPath);
                    if (!fs.existsSync(createDir)) {
                        fs.mkdirSync(createDir, { recursive: true });
                    }
                    
                    fs.writeFileSync(fullPath, operation.file_content);
                    console.log(`✅ Created: ${operation.file_path}`);
                    created++;
                    break;
                    
                case 'update':
                    // Update is delete + create
                    if (fs.existsSync(fullPath)) {
                        fs.unlinkSync(fullPath);
                    }
                    
                    // Ensure directory exists
                    const updateDir = path.dirname(fullPath);
                    if (!fs.existsSync(updateDir)) {
                        fs.mkdirSync(updateDir, { recursive: true });
                    }
                    
                    fs.writeFileSync(fullPath, operation.file_content);
                    console.log(`🔄 Updated: ${operation.file_path}`);
                    updated++;
                    break;
                    
                case 'delete':
                    if (fs.existsSync(fullPath)) {
                        fs.unlinkSync(fullPath);
                        console.log(`🗑️  Deleted: ${operation.file_path}`);
                        deleted++;
                    } else {
                        console.warn(`⚠️  File to delete not found: ${operation.file_path}`);
                    }
                    break;
                    
                default:
                    console.warn(`⚠️  Unknown operation: ${operation.operation} for file: ${operation.file_path}`);
            }
        } catch (error) {
            console.error(`❌ Error processing ${operation.operation} for ${operation.file_path}: ${error.message}`);
        }
    }
    
    console.log(`📊 File operations completed: ${created} created, ${updated} updated, ${deleted} deleted`);
}

module.exports = {
    readAndConcatenateFiles,
    chunkString,
    applyFileOperations
}; 