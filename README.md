# AI-DocGen: AI-Powered Auto-Documentation Engine

🚀 **AI-DocGen** is a robust orchestration engine that automates documentation generation based on codebase analysis using Google Gemini AI.

## 🎯 Overview

AI-DocGen analyzes your source code and existing documentation, then uses Google Gemini's advanced AI capabilities to generate comprehensive, up-to-date documentation automatically. It's designed to:

- **Analyze codebases** and understand structure, functionality, and relationships
- **Process existing documentation** to identify gaps and outdated information  
- **Generate high-quality documentation** in HTML format
- **Support multi-step pipelines** with configurable dependencies and parallel execution
- **Provide flexible configuration** for different documentation needs

## 🏗️ Architecture

The system operates through a series of configurable steps:

1. **File Reading**: Recursively reads source code and documentation files
2. **Content Processing**: Concatenates and chunks content to fit within AI token limits
3. **AI Analysis**: Sends structured prompts to Google Gemini for analysis
4. **Documentation Generation**: Processes AI responses to create/update/delete documentation files
5. **Orchestration**: Manages step dependencies and parallel execution

## 🚀 Quick Start

### Prerequisites

- Node.js 16.0.0 or higher
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

### Installation

1. **Clone or download the project**
2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up your API key:**
   Create a `.env` file in the project root:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

### Running the Engine

**Basic usage:**
```bash
npm start
```

**With custom configuration:**
```bash
npm start path/to/your/config.json
```

**Test with included example:**
```bash
npm test
```

## 📁 Project Structure

```
ai-docgen/
├── src/                    # Core engine modules
│   ├── orchestrator.js     # Main orchestration logic
│   ├── configLoader.js     # Configuration file parser
│   ├── fileUtils.js        # File operations and chunking
│   └── llmClient.js        # Google Gemini API client
├── config/                 # Configuration files
│   └── config.json         # Main configuration
├── instructions/           # AI prompt templates
│   ├── initial_instruction.txt
│   └── post_instruction.txt
├── data/                   # Example/test data
│   ├── StringProcessor.ts  # Sample TypeScript code
│   ├── User.ts            # Sample interface definitions
│   └── existing-docs/     # Sample existing documentation
├── docs/                   # Generated documentation output
└── index.js               # Main entry point
```

## ⚙️ Configuration

The engine is configured via JSON files. Here's the structure:

```json
{
  "project_root_folder": ".",
  "llm_api_key_env_var": "GEMINI_API_KEY",
  "steps": [
    {
      "name": "TechnicalOverview",
      "depends_on": [],
      "parallel": false,
      "model": "gemini-2.5-flash",
      "temperature": 0.3,
      "initial_instruction_file": "instructions/initial_instruction.txt",
      "post_instruction_file": "instructions/post_instruction.txt",
      "input_folders": ["src", "docs/existing"],
      "file_filters": ["*.ts", "*.js", "*.md"],
      "output_folder": "docs/generated"
    }
  ]
}
```

### Configuration Parameters

- **project_root_folder**: Base directory for relative paths
- **llm_api_key_env_var**: Environment variable containing your API key
- **steps**: Array of documentation generation steps

#### Step Configuration

- **name**: Descriptive name for the step
- **depends_on**: Array of step names that must complete first
- **parallel**: Whether this step can run in parallel with others
- **model**: Gemini model to use (e.g., "gemini-2.5-flash")
- **temperature**: AI creativity level (0.0-1.0)
- **initial_instruction_file**: Path to initial prompt file
- **post_instruction_file**: Path to response format instruction file
- **input_folders**: Directories to scan for input files
- **file_filters**: File extensions to include (e.g., ["*.ts", "*.js"])
- **output_folder**: Where to save generated documentation

## 🔧 Advanced Usage

### Multi-Step Configuration

Create complex documentation pipelines with dependencies:

```json
{
  "steps": [
    {
      "name": "BusinessOverview",
      "depends_on": [],
      "parallel": false,
      "model": "gemini-2.5-flash",
      "temperature": 0.3,
      "input_folders": ["src", "docs/business"],
      "output_folder": "docs/business-overview"
    },
    {
      "name": "TechnicalDocs",
      "depends_on": ["BusinessOverview"],
      "parallel": true,
      "model": "gemini-2.5-flash",
      "temperature": 0.2,
      "input_folders": ["src", "docs/technical"],
      "output_folder": "docs/technical-docs"
    },
    {
      "name": "APIReference",
      "depends_on": ["BusinessOverview"],
      "parallel": true,
      "model": "gemini-2.5-flash",
      "temperature": 0.1,
      "input_folders": ["src/api"],
      "output_folder": "docs/api-reference"
    }
  ]
}
```

### Custom Instructions

Create specialized prompts by modifying the instruction files:

- **initial_instruction.txt**: Defines the analysis task and goals
- **post_instruction.txt**: Specifies the exact JSON response format

### File Filtering

Control which files are processed:

```json
{
  "file_filters": ["*.ts", "*.tsx", "*.js", "*.jsx", "*.md", "*.html"]
}
```

## 🤖 AI Response Format

The AI generates responses in this JSON format:

```json
[
  {
    "operation": "create",
    "file_path": "overview.html",
    "file_content": "<html>...</html>"
  },
  {
    "operation": "update", 
    "file_path": "existing-doc.html",
    "file_content": "<html>...</html>"
  },
  {
    "operation": "delete",
    "file_path": "outdated-doc.html"
  }
]
```

## 🛠️ Development

### Testing Components

Test individual components:

```bash
# Test configuration loading
node -e "console.log(require('./src/configLoader').loadConfig('./config/config.json'))"

# Test file operations
node -e "const fu = require('./src/fileUtils'); console.log(fu.readAndConcatenateFiles(['data'], ['*.ts']))"

# Test API connection
node -e "require('./src/llmClient').testGeminiConnection()"
```

### Error Handling

The engine handles common scenarios:

- **Missing API key**: Clear error message with setup instructions
- **Invalid configuration**: Detailed validation error messages
- **File not found**: Graceful handling with warnings
- **API rate limits**: Automatic retry with exponential backoff
- **Invalid AI responses**: JSON parsing with fallback strategies

## 🔍 Troubleshooting

### Common Issues

**"GEMINI_API_KEY not set"**
- Create a `.env` file with your API key
- Ensure the file is in the project root directory

**"Configuration file not found"**
- Check the path to your config.json file
- Ensure the file exists and is valid JSON

**"Failed to connect to Gemini API"**
- Verify your API key is correct
- Check your internet connection
- Ensure you haven't exceeded API quotas

**"No content found in input folders"**
- Verify your input folder paths are correct
- Check that your file filters match existing files
- Ensure the folders contain the expected file types

## 📊 Output

Generated documentation will be saved to the specified output folders as HTML files. The AI determines:

- **File names** based on content and purpose
- **File structure** for logical organization  
- **Content quality** with proper formatting and examples
- **Cross-references** between related documentation

## 🚀 Future Enhancements

- Support for additional AI models
- Integration with version control systems
- Real-time documentation updates
- Custom output formats (Markdown, PDF, etc.)
- Advanced dependency management
- Documentation quality metrics

## 📄 License

MIT License - feel free to use this project for your documentation needs!

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

---

**Happy documenting!** 🎉 