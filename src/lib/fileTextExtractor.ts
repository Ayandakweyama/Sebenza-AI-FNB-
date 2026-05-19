if (typeof window !== 'undefined') {
  import('pdfjs-dist')
    .then((pdfjs) => {
      if (!pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc =
          'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
      }
    })
    .catch(() => {});
}

export async function extractTextFromFile(file: File): Promise<string> {
  if (!file) throw new Error('No file provided');
  if (file.size === 0) throw new Error('File is empty');

  const fileName = file.name || '';
  const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
  const type = file.type;

  if (type === 'application/pdf' || ext === '.pdf') {
    const pdfjs = await import('pdfjs-dist');
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc =
        'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
    }

    const arrayBuffer = await file.arrayBuffer();

    const pdfLoadPromise = pdfjs.getDocument({
      data: arrayBuffer,
      disableStream: true,
      disableAutoFetch: true
    }).promise;

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('PDF loading timeout')), 30000)
    );

    // @ts-ignore - pdfjs types are not fully compatible with ESM
    const pdf = (await Promise.race([pdfLoadPromise, timeoutPromise])) as any;

    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items
        .map((item: any) => (item.str || '').trim())
        .filter((str: string) => str);
      text += strings.join(' ') + '\n';
    }

    const extracted = text.trim();
    if (!extracted) {
      throw new Error('No text content found in PDF. The PDF might be image-based.');
    }
    return extracted;
  }

  if (type === 'application/msword' || ext === '.doc') {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch('/api/files/extract-text', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      let message = 'Failed to extract text from .doc file';
      try {
        const data = await response.json();
        message = data?.error?.message || data?.error || message;
      } catch {}
      throw new Error(message);
    }

    const data = await response.json();
    const extracted = (data?.text ?? '').trim();
    if (!extracted) throw new Error('No text content found in Word document');
    return extracted;
  }

  if (
    type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    ext === '.docx'
  ) {
    const mammoth = await import('mammoth');
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    const extracted = (result.value ?? '').trim();
    if (!extracted) throw new Error('No text content found in Word document');
    return extracted;
  }

  if (type === 'text/plain' || ext === '.txt') {
    const extracted = (await file.text()).trim();
    if (!extracted) throw new Error('No text content found in file');
    return extracted;
  }

  throw new Error('Unsupported file type. Please upload a PDF, DOC, DOCX, or TXT file.');
}
