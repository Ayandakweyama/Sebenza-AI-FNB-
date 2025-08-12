# ATS Checker with AI Analysis

This guide will help you set up the ATS Checker with AI-powered analysis using DeepSeek for ATS checking and OpenAI for career advice features.

## Prerequisites

1. Node.js (v18 or later)
2. npm or yarn
3. AI API keys (see configuration below)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the root of your project and add your AI API keys:

```env
# AI API Keys
DEEPSEEK_API_KEY=your_deepseek_api_key_here          # Required for ATS analysis
DEEPSEEK_CHAT_API_KEY=your_deepseek_chat_key_here    # Required for career advice (Afrigter)
OPENAI_API_KEY=your_openai_api_key_here              # Fallback for career advice
```

**API Key Configuration:**

- **DeepSeek (ATS)**: Used exclusively for ATS CV analysis
  - Get your API key from [DeepSeek Platform](https://platform.deepseek.com/)
  - Advanced reasoning capabilities for detailed ATS feedback
  - Cost-effective and specialized for analysis tasks

- **DeepSeek Chat (Career Advice)**: Primary for Afrigter career features
  - Get your chat API key from [DeepSeek Platform](https://platform.deepseek.com/)
  - Powers career advice, skill gap analysis, and roadmap generation
  - Advanced conversational AI for career guidance

- **OpenAI**: Fallback for career advice features
  - Get your API key from [OpenAI Platform](https://platform.openai.com/)
  - Used when DeepSeek Chat is unavailable

### 3. Running the Application

Start the development server:

```bash
npm run dev
```

The ATS Checker will be available at `http://localhost:3000/ats-checker`

## How It Works

1. **AI Model Selection**: Choose between DeepSeek (recommended), OpenAI, or Auto mode.
2. **File Upload**: Upload a DOC or DOCX file containing your CV/resume.
3. **Text Extraction**: The system extracts text from your document.
4. **AI Analysis**: The extracted text is sent to your selected AI model for analysis.
5. **Results Display**: The analysis results are displayed, including:
   - Overall ATS score
   - Section-wise breakdown
   - Strengths and areas for improvement
   - Keyword analysis
   - ATS compatibility assessment

## AI Model Usage

**ATS Checker:**
- **Auto Mode (Default)**: Uses DeepSeek if available, otherwise local analysis
- **DeepSeek Only**: Forces DeepSeek usage for advanced ATS analysis
- **Local Fallback**: Rule-based analysis when DeepSeek is unavailable

**Afrigter (Career Features):**
- **Primary**: DeepSeek Chat for career advice, skill gap analysis, roadmaps
- **Fallback**: OpenAI GPT-3.5 if DeepSeek Chat fails
- **Final Fallback**: Base LangChain service

## Customization

You can modify the AI's analysis criteria by updating the system prompts in:
- `src/lib/cvAnalyzer.ts` (main analysis logic)
- `src/lib/deepseek.ts` (DeepSeek-specific prompts)

## Troubleshooting

- **API Key Issues**: Ensure your AI API keys are correctly set in the `.env.local` file.
- **ATS Analysis Fails**: Check that `DEEPSEEK_API_KEY` is configured correctly.
- **Career Advice Fails**: Check that `DEEPSEEK_CHAT_API_KEY` is configured correctly.
- **File Upload Problems**: The system supports PDF and DOCX files. Ensure your file is not password protected.
- **Analysis Errors**: If the analysis fails, check the browser console for error messages.
- **Model Unavailable**: The system will automatically fallback to available alternatives.

## Security Note

Never commit your `.env.local` file or expose your API keys in client-side code.
