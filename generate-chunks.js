require('dotenv').config();
const gitUtils = require('./src/gitUtils');
const chunkGenerator = require('./src/chunkGenerator');

async function main() {
  // Hardcoded values for Stage 1
  // const repoUrl = 'https://github.com/ideologas/Carrot.git';
  // const branch = 'main';
  // const destinationPath = 'my_project_repo';
  const chunkOutputFolder = 'chunks';
  const fileFilters = [
    '*.ts', '*.js', '*.html', '*.md', '*.json', '*.py', '*.java', '*.cpp', '*.c', '*.h', '*.cs', '*.php', '*.rb', '*.go', '*.rs', '*.swift', '*.kt'
  ];
  const chunkSize = 9000;
  const inputFolder = 'my_project_repo'; // User will upload files here

  try {
    // 🚀 [Stage 1] Skipping repo download. Using uploaded files in inputFolder.
    await chunkGenerator.generateChunks({
      inputFolders: [inputFolder],
      fileFilters,
      outputFolder: chunkOutputFolder,
      chunkSize
    });
    console.log('✅ Chunks generated in:', chunkOutputFolder);
  } catch (error) {
    console.error('❌ Stage 1 failed:', error.message);
    process.exit(1);
  }
}

main(); 