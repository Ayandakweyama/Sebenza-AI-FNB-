import { analyzeText } from './textAnalyzer';
import { generateATSAnalysisWithGLM } from './glm';

// Configure PDF.js worker synchronously
if (typeof window !== 'undefined') {
  // Set worker source immediately to avoid race conditions
  import('pdfjs-dist').then((pdfjs) => {
    // Use stable CDN version
    pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
    console.log('PDF.js worker configured globally');
  }).catch((error) => {
    console.warn('Failed to configure PDF.js worker globally:', error);
  });
}

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

// Function to analyze CV text using AI (GLM for ATS analysis or local fallback)
export async function analyzeCVWithAI(cvText: string, preferredModel: 'glm' | 'auto' = 'auto', jobKeywords?: string[]): Promise<any> {
  try {
    // Try GLM if available
    if (process.env.GLM_API_KEY && (preferredModel === 'glm' || preferredModel === 'auto')) {
      try {
        console.log('Attempting ATS analysis with GLM...');
        return await generateATSAnalysisWithGLM(cvText, jobKeywords);
      } catch (error) {
        console.warn('GLM analysis failed:', error);
        if (preferredModel === 'glm') {
          throw error; // If specifically requested GLM, don't fallback
        }
        // For auto mode, continue to fallback
      }
    }

    // Fallback to local analysis if GLM failed or not available
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
  if (file.size === 0) throw new Error('File is empty');

  console.log(`Processing file: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);

  try {
    if (file.type === 'application/pdf') {
      console.log('Processing PDF file...');

      // Add a small delay to ensure worker is loaded
      await new Promise(resolve => setTimeout(resolve, 100));

      const pdfjs = await import('pdfjs-dist');

      // Ensure worker is configured with retry
      let retries = 3;
      while (retries > 0 && !pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
        console.log('PDF.js worker configured (fallback)');
        await new Promise(resolve => setTimeout(resolve, 100));
        retries--;
      }

      if (!pdfjs.GlobalWorkerOptions.workerSrc) {
        throw new Error('Failed to configure PDF.js worker');
      }

      const arrayBuffer = await file.arrayBuffer();
      console.log(`PDF file loaded, size: ${arrayBuffer.byteLength} bytes`);

      // Set a timeout for PDF loading
      const pdfLoadPromise = pdfjs.getDocument({
        data: arrayBuffer,
        // Disable streaming to avoid some issues
        disableStream: true,
        disableAutoFetch: true
      }).promise;

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('PDF loading timeout')), 30000)
      );

      // @ts-ignore - pdfjs types are not fully compatible with ESM
      const pdf = await Promise.race([pdfLoadPromise, timeoutPromise]) as any;
      console.log(`PDF loaded successfully, ${pdf.numPages} pages`);

      let text = '';

      // Extract text from all pages
      for (let i = 1; i <= pdf.numPages; i++) {
        console.log(`Processing page ${i}/${pdf.numPages}`);
        try {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const strings = content.items.map((item: any) => (item.str || '').trim()).filter((str: string) => str);
          text += strings.join(' ') + '\n';
          console.log(`Page ${i} processed, extracted ${strings.length} text items`);
        } catch (pageError) {
          console.warn(`Failed to process page ${i}:`, pageError);
          // Continue with other pages
        }
      }

      const extractedText = text.trim();
      console.log(`Text extraction completed, extracted ${extractedText.length} characters`);

      if (!extractedText) {
        throw new Error('No text content found in PDF. The PDF might be image-based or corrupted.');
      }

      return extractedText;
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      console.log('Processing DOCX file...');
      const mammoth = await import('mammoth');
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });

      if (!result.value || !result.value.trim()) {
        throw new Error('No text content found in Word document');
      }

      console.log(`DOCX text extraction completed, extracted ${result.value.length} characters`);
      return result.value;
    } else if (file.type === 'application/msword' || file.type === 'text/plain') {
      console.log('Processing text-based file...');
      const text = await file.text();

      if (!text || !text.trim()) {
        throw new Error('No text content found in file');
      }

      console.log(`Text file processed, ${text.length} characters`);
      return text;
    } else {
      throw new Error(`Unsupported file type: ${file.type}. Supported types: PDF, DOCX, DOC, TXT`);
    }
  } catch (error) {
    console.error('Error extracting text from file:', error);

    // Provide more specific error messages based on the error type
    if (error instanceof Error) {
      if (error.message.includes('InvalidPDFException')) {
        throw new Error('Invalid or corrupted PDF file. Please ensure the file is a valid PDF.');
      } else if (error.message.includes('PasswordException')) {
        throw new Error('PDF is password-protected. Please remove the password and try again.');
      } else if (error.message.includes('MissingPDFException')) {
        throw new Error('PDF file appears to be corrupted or incomplete.');
      } else {
        throw new Error(`Failed to extract text: ${error.message}`);
      }
    }

    throw new Error('Failed to extract text from file. Please check the file format and try again.');
  }
}
