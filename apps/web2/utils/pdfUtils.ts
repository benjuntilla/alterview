import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js to use local worker file from public directory
if (typeof window !== 'undefined') {
  // In browser, point to our local worker file in the public directory
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/js/pdf/pdf.worker.mjs';
}

/**
 * Extracts text from a PDF file
 * @param file The PDF file to extract text from
 * @returns Promise with the extracted text
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  try {
    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load PDF document with custom parameters to make it more tolerant
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      // @ts-ignore - These properties exist in PDF.js but aren't properly typed
      nativeImageDecoderSupport: 'display',
      ignoreErrors: true,
      // Use local cMaps for better character support
      cMapUrl: '/js/pdf/cmaps/',
      cMapPacked: true,
    });
    
    const pdf = await loadingTask.promise;
    
    // Initialize empty text string
    let extractedText = '';
    
    // Process each page
    for (let i = 1; i <= pdf.numPages; i++) {
      try {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // Extract text from page
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        // Add page text to extracted text
        extractedText += pageText + '\n\n';
      } catch (pageError) {
        console.warn(`Error extracting text from page ${i}:`, pageError);
        // Continue with next page instead of failing completely
      }
    }
    
    return extractedText.trim();
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

/**
 * Validates if a file is a PDF
 * @param file The file to validate
 * @returns Boolean indicating if the file is a valid PDF
 */
export function isPdfFile(file: File): boolean {
  // Check file type
  return file.type === 'application/pdf';
} 