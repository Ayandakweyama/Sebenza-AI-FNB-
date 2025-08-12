import { getDocument, type PDFDocumentProxy } from 'pdfjs-dist';

// Set the worker source for pdf.js
const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.entry');
const pdfjs = await import('pdfjs-dist');

// Set the worker source
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

export const parsePdf = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();

    fileReader.onload = async () => {
      try {
        // Convert file to ArrayBuffer
        const typedArray = new Uint8Array(fileReader.result as ArrayBuffer);
        
        // Load the PDF document
        const pdf = await getDocument(typedArray).promise;
        let text = '';

        // Extract text from each page
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const strings = content.items.map((item: any) => item.str);
          text += strings.join(' ') + '\n';
        }

        resolve(text.trim());
      } catch (error) {
        console.error('Error parsing PDF:', error);
        reject(error);
      }
    };

    fileReader.onerror = (error) => {
      console.error('Error reading file:', error);
      reject(error);
    };

    // Read the file as ArrayBuffer
    fileReader.readAsArrayBuffer(file);
  });
};
