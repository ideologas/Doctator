const fs = require('fs');
const path = require('path');
const fileUtils = require('./fileUtils');

/**
 * Generates chunks from input folders and saves them to a specified output folder
 * @param {Object} params - Parameters object
 * @param {string[]} params.inputFolders - Array of input folder paths
 * @param {string[]} params.fileFilters - Array of file extensions to include
 * @param {string} params.outputFolder - Folder to save chunks
 * @param {number} params.chunkSize - Maximum characters per chunk (default: 9000)
 * @returns {Object} Information about the generated chunks
 */
async function generateChunks({ inputFolders, fileFilters, outputFolder, chunkSize = 9000 }) {
    try {
        console.log('📦 Starting chunk generation...');
        console.log(`📁 Input folders: ${inputFolders.join(', ')}`);
        console.log(`🔍 File filters: ${fileFilters.join(', ')}`);
        console.log(`📂 Output folder: ${outputFolder}`);
        console.log(`📏 Chunk size: ${chunkSize} characters`);

        // 1. Ensure output folder exists
        if (!fs.existsSync(outputFolder)) {
            fs.mkdirSync(outputFolder, { recursive: true });
            console.log(`📁 Created output folder: ${outputFolder}`);
        } else {
            // Clean existing chunks
            const existingFiles = fs.readdirSync(outputFolder);
            existingFiles.forEach(file => {
                if (file.startsWith('chunk_') && file.endsWith('.txt')) {
                    fs.unlinkSync(path.join(outputFolder, file));
                }
            });
            console.log(`🧹 Cleaned existing chunks from: ${outputFolder}`);
        }

        // 2. Read and concatenate files
        console.log('📖 Reading and concatenating files...');
        // Exclude package-lock.json from fileFilters
        const effectiveFileFilters = fileFilters.filter(f => f !== 'package-lock.json');
        const concatenatedContentRaw = fileUtils.readAndConcatenateFiles(inputFolders, effectiveFileFilters);
        // Replace my_project_repo/ with project_for_documentation/ in content
        const concatenatedContent = concatenatedContentRaw.replace(/my_project_repo\//g, 'project_for_documentation/');
        
        if (!concatenatedContent || concatenatedContent.trim().length === 0) {
            throw new Error('No content found in input folders');
        }

        console.log(`📊 Total concatenated content: ${concatenatedContent.length} characters`);

        // 3. Generate chunks
        console.log('✂️ Generating chunks...');
        const chunks = fileUtils.chunkString(concatenatedContent, chunkSize);
        
        console.log(`📦 Generated ${chunks.length} chunks`);

        // 4. Save chunks to files
        console.log('💾 Saving chunks to files...');
        const chunkFiles = [];
        
        for (let i = 0; i < chunks.length; i++) {
            const chunkNumber = i + 1;
            const chunkFileName = `code_part_${chunkNumber.toString().padStart(3, '0')}.txt`;
            const chunkFilePath = path.join(outputFolder, chunkFileName);
            
            // Save chunk content
            fs.writeFileSync(chunkFilePath, chunks[i], 'utf8');
            
            chunkFiles.push({
                number: chunkNumber,
                fileName: chunkFileName,
                filePath: chunkFilePath,
                size: chunks[i].length,
                characterCount: chunks[i].length
            });
            
            console.log(`✅ Saved chunk ${chunkNumber}: ${chunkFileName} (${chunks[i].length} chars)`);
        }

        // Generate code_folder_structure.txt
        function getFolderStructure(rootDir, prefix = '') {
            let structure = '';
            const items = fs.readdirSync(rootDir, { withFileTypes: true });
            const folders = items.filter(item => item.isDirectory());
            const files = items.filter(item => item.isFile() && item.name !== 'package-lock.json');
            for (const folder of folders) {
                structure += `${prefix}${folder.name}/\n`;
                structure += getFolderStructure(path.join(rootDir, folder.name), prefix + '  ');
            }
            for (const file of files) {
                structure += `${prefix}${file.name}\n`;
            }
            return structure;
        }
        let folderStructure = '';
        for (const inputFolder of inputFolders) {
            if (fs.existsSync(inputFolder)) {
                // Replace my_project_repo/ with project_for_documentation/ in folder structure
                const baseName = path.basename(inputFolder) === 'my_project_repo' ? 'project_for_documentation' : path.basename(inputFolder);
                folderStructure += `${baseName}/\n`;
                let structure = getFolderStructure(inputFolder, '  ');
                structure = structure.replace(/my_project_repo\//g, 'project_for_documentation/');
                folderStructure += structure;
            }
        }
        const structureFilePath = path.join(outputFolder, 'code_folder_structure.txt');
        fs.writeFileSync(structureFilePath, folderStructure, 'utf8');
        console.log(`📁 Saved folder structure: ${structureFilePath}`);

        // 5. Create metadata file
        // const metadata = {
        //     generatedAt: new Date().toISOString(),
        //     totalChunks: chunks.length,
        //     totalCharacters: concatenatedContent.length,
        //     chunkSize: chunkSize,
        //     inputFolders: inputFolders,
        //     fileFilters: fileFilters,
        //     chunks: chunkFiles
        // };

        // const metadataPath = path.join(outputFolder, 'chunks_metadata.json');
        // fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
        // console.log(`📋 Saved metadata: ${metadataPath}`);

        // 6. Create summary file
        // const summaryPath = path.join(outputFolder, 'chunks_summary.txt');
        // const summary = [
        //     `Chunk Generation Summary`,
        //     `======================`,
        //     `Generated at: ${metadata.generatedAt}`,
        //     `Total chunks: ${metadata.totalChunks}`,
        //     `Total characters: ${metadata.totalCharacters.toLocaleString()}`,
        //     `Chunk size: ${chunkSize.toLocaleString()} characters`,
        //     `Input folders: ${inputFolders.join(', ')}`,
        //     `File filters: ${fileFilters.join(', ')}`,
        //     ``,
        //     `Chunk Files:`,
        //     ...chunkFiles.map(chunk => 
        //         `  ${chunk.fileName} - ${chunk.characterCount.toLocaleString()} characters`
        //     )
        // ].join('\n');

        // fs.writeFileSync(summaryPath, summary, 'utf8');
        // console.log(`📝 Saved summary: ${summaryPath}`);

        console.log('🎉 Chunk generation completed successfully!');
        console.log(`📊 Generated ${chunks.length} chunks in: ${outputFolder}`);
        
        return {
            success: true,
            outputFolder: outputFolder,
            totalChunks: chunks.length,
            totalCharacters: concatenatedContent.length,
            chunkFiles: chunkFiles,
            // metadataPath: metadataPath,
            // summaryPath: summaryPath
        };

    } catch (error) {
        console.error('❌ Chunk generation failed:', error.message);
        throw error;
    }
}

/**
 * Reads chunks from a folder
 * @param {string} chunksFolder - Folder containing chunk files
 * @returns {Array} Array of chunk objects with content
 */
function readChunksFromFolder(chunksFolder) {
    try {
        console.log(`📖 Reading chunks from: ${chunksFolder}`);
        
        if (!fs.existsSync(chunksFolder)) {
            throw new Error(`Chunks folder not found: ${chunksFolder}`);
        }

        // Read metadata if available
        const metadataPath = path.join(chunksFolder, 'chunks_metadata.json');
        let metadata = null;
        if (fs.existsSync(metadataPath)) {
            metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
            console.log(`📋 Found metadata: ${metadata.totalChunks} chunks`);
        }

        // Read chunk files
        const files = fs.readdirSync(chunksFolder)
            .filter(file => file.startsWith('chunk_') && file.endsWith('.txt'))
            .sort(); // Ensure proper order

        const chunks = [];
        
        for (const fileName of files) {
            const filePath = path.join(chunksFolder, fileName);
            const content = fs.readFileSync(filePath, 'utf8');
            
            chunks.push({
                fileName: fileName,
                filePath: filePath,
                content: content,
                size: content.length
            });
            
            console.log(`📄 Read chunk: ${fileName} (${content.length} chars)`);
        }

        console.log(`✅ Read ${chunks.length} chunks from folder`);
        
        return {
            chunks: chunks,
            metadata: metadata,
            totalChunks: chunks.length
        };

    } catch (error) {
        console.error('❌ Failed to read chunks from folder:', error.message);
        throw error;
    }
}

module.exports = {
    generateChunks,
    readChunksFromFolder
}; 