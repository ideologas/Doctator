require('dotenv').config();
const gitUtils = require('./src/gitUtils');
const chunkGenerator = require('./src/chunkGenerator');

async function main() {
  // Hardcoded values for Stage 1
  const repoUrl = 'https://github.com/ideologas/Carrot.git';
  const branch = 'main';
  const destinationPath = 'my_project_repo';
  const chunkOutputFolder = 'chunks';
  const fileFilters = [
    '*.ts', '*.js', '*.html', '*.md', '*.json', '*.py', '*.java', '*.cpp', '*.c', '*.h', '*.cs', '*.php', '*.rb', '*.go', '*.rs', '*.swift', '*.kt'
  ];
  const chunkSize = 9000;

  try {
    console.log('🚀 [Stage 1] Cloning repo and generating chunks...');
    // Only clone the repo, do not check out the first commit
    await gitUtils.cloneRepoAtBranch({ repoUrl, branch, destinationPath });
    await chunkGenerator.generateChunks({
      inputFolders: [destinationPath],
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