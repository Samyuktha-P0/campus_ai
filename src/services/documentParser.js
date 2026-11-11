import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Configure PDF.js worker
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  // Use official CDN worker matching pdfjs-dist version
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '3.11.174'}/pdf.worker.min.js`;
}

export const SUPPORTED_EXTENSIONS = ['pdf', 'docx', 'txt'];
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Validates file type and size
 */
export function validateDocumentFile(file) {
  if (!file) {
    return { valid: false, error: 'No file provided.' };
  }

  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  if (!SUPPORTED_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error: `Unsupported file format ".${extension}". Only PDF, DOCX, and TXT are supported.`
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds the 10 MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`
    };
  }

  return { valid: true, extension };
}

/**
 * Extracts plain text from a TXT file
 */
async function extractTxt(file) {
  const text = (await file.text()).trim();
  return { text, pages: [{ pageNumber: 1, text }] };
}

/**
 * Extracts plain text and page metadata from a PDF file using pdfjs-dist
 */
async function extractPdf(file) {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  
  let fullText = '';
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();

    // Join text items intelligently: use newline when y-coordinate changes
    // (new visual line in PDF) so structured facts don't merge into one blob.
    let pageText = '';
    for (let k = 0; k < textContent.items.length; k++) {
      const item = textContent.items[k];
      const str = item.str || '';
      if (!str) continue;
      if (pageText === '') {
        pageText = str;
      } else {
        const prevItem = textContent.items[k - 1];
        const prevY = prevItem?.transform?.[5] ?? null;
        const currY = item?.transform?.[5] ?? null;
        const yDiff = prevY !== null && currY !== null ? Math.abs(currY - prevY) : 0;
        if (yDiff > 2) {
          pageText += '\n' + str;
        } else {
          pageText += (str.startsWith(' ') || pageText.endsWith(' ') ? '' : ' ') + str;
        }
      }
    }
    pageText = pageText.trim();

    if (pageText) {
      pages.push({ pageNumber: i, text: pageText });
      fullText += (fullText ? '\n\n' : '') + pageText;
    }
  }

  return { text: fullText.trim(), pages };
}

/**
 * Extracts plain text from a DOCX file using mammoth
 */
async function extractDocx(file) {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  const text = result.value.trim();
  return { text, pages: [{ pageNumber: 1, text }] };
}

/**
 * Unified text extraction dispatcher
 */
export async function extractDocumentText(file) {
  const validation = validateDocumentFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const ext = validation.extension;
  try {
    let result = null;
    if (ext === 'txt') {
      result = await extractTxt(file);
    } else if (ext === 'pdf') {
      result = await extractPdf(file);
    } else if (ext === 'docx') {
      result = await extractDocx(file);
    }

    if (!result || !result.text || result.text.trim().length === 0) {
      throw new Error('Extracted document content is empty or contains no readable text.');
    }

    const text = result.text.trim();
    return {
      text,
      pages: result.pages || [{ pageNumber: 1, text }],
      toString() { return text; },
      trim() { return text.trim(); }
    };
  } catch (err) {
    console.error(`Extraction failed for ${file.name}:`, err);
    throw new Error(`Failed to extract text from ${file.name}: ${err.message || 'Unknown parsing error'}`);
  }
}
