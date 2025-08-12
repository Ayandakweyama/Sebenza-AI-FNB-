import { analyzeText } from './textAnalyzer';
import { generateATSAnalysisWithDeepSeek } from './deepseek';

// System message to guide the AI's analysis
const SYSTEM_PROMPT = `You are an expert ATS (Applicant Tracking System) analyst. 
Analyze the provided CV and provide a detailed assessment with the following structure:
1. Overall score (0-100) based on ATS optimization
2. Breakdown of scores for different sections (formatting, keywords, content, length, sections)
3. List of strengths
4. List of improvements
5. Keyword analysis (found and missing keywords)
6. ATS compatibility issues

Format your response as a JSON object.`;

// Function to analyze CV text using AI (DeepSeek for ATS analysis or local fallback)
export async function analyzeCVWithAI(cvText: string, preferredModel: 'deepseek' | 'auto' = 'auto', jobKeywords?: string[]): Promise<any> {
  try {
    // Try DeepSeek if available
    if (process.env.DEEPSEEK_API_KEY && (preferredModel === 'deepseek' || preferredModel === 'auto')) {
      try {
        console.log('Attempting ATS analysis with DeepSeek...');
        return await generateATSAnalysisWithDeepSeek(cvText, jobKeywords);
      } catch (error) {
        console.warn('DeepSeek analysis failed:', error);
        if (preferredModel === 'deepseek') {
          throw error; // If specifically requested DeepSeek, don't fallback
        }
        // For auto mode, continue to fallback
      }
    }

    // Fallback to local analysis if DeepSeek failed or not available
    console.log('Using local text analysis as fallback');
    return analyzeText(cvText);
  } catch (error) {
    console.error('Error analyzing CV:', error);
    throw new Error('Failed to analyze CV. Please try again later.');
  }
}

// Function to extract text from different file types
export async function extractTextFromFile(file: File): Promise<string> {
  if (!file) throw new Error('No file provided');

  try {
    if (file.type === 'application/pdf') {
      const pdfjs = await import('pdfjs-dist');
      const arrayBuffer = await file.arrayBuffer();
      // @ts-ignore - pdfjs types are not fully compatible with ESM
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      let text = '';
      
      // Extract text from all pages
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map((item: any) => item.str);
        text += strings.join(' ') + '\n';
      }
      
      return text;
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const mammoth = await import('mammoth');
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    } else if (file.type === 'application/msword' || file.type === 'text/plain') {
      return await file.text();
    } else {
      throw new Error('Unsupported file type');
    }
  } catch (error) {
    console.error('Error extracting text from file:', error);
    throw new Error('Failed to extract text from file');
  }
}
