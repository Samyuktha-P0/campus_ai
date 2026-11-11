/**
 * Text Chunker Service for Campus AI
 * Splits extracted document text into semantically cohesive passages for high-precision retrieval,
 * tagging each chunk with page number metadata when available.
 */

export function splitIntoChunks(input, maxChars = 500, overlap = 80) {
  if (!input) return [];

  // Check if input is an object with pages array
  if (typeof input === 'object' && input.pages && Array.isArray(input.pages)) {
    const allChunks = [];
    let globalIndex = 0;

    for (const page of input.pages) {
      const pageChunks = splitTextIntoChunks(page.text, maxChars, overlap);
      for (const chunk of pageChunks) {
        allChunks.push({
          chunk_index: globalIndex++,
          content: chunk.content,
          char_count: chunk.char_count,
          page_number: page.pageNumber || 1,
          metadata: { pageNumber: page.pageNumber || 1 }
        });
      }
    }
    return allChunks;
  }

  // Plain string or single document text
  const text = typeof input === 'string' ? input : (input.text || String(input));
  return splitTextIntoChunks(text, maxChars, overlap);
}

function splitTextIntoChunks(text, maxChars = 500, overlap = 80) {
  if (!text || typeof text !== 'string') return [];

  // Normalize line endings and whitespace
  const normalized = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (normalized.length <= maxChars) {
    return [
      {
        chunk_index: 0,
        content: normalized,
        char_count: normalized.length,
        page_number: 1,
        metadata: { pageNumber: 1 }
      }
    ];
  }

  // Split primarily by double newlines (paragraphs/notices sections)
  const paragraphs = normalized.split(/\n\n+/);
  const chunks = [];
  let currentChunk = '';
  let chunkIndex = 0;

  for (const para of paragraphs) {
    const trimmedPara = para.trim();
    if (!trimmedPara) continue;

    if (currentChunk.length + trimmedPara.length + 2 <= maxChars) {
      currentChunk = currentChunk ? `${currentChunk}\n\n${trimmedPara}` : trimmedPara;
    } else {
      if (currentChunk) {
        chunks.push({
          chunk_index: chunkIndex++,
          content: currentChunk.trim(),
          char_count: currentChunk.length,
          page_number: 1,
          metadata: { pageNumber: 1 }
        });
      }

      if (trimmedPara.length > maxChars) {
        const linesOrSentences = trimmedPara.split(/(?<=[.!?\n])\s+/);
        let subChunk = '';

        for (const unit of linesOrSentences) {
          if (subChunk.length + unit.length + 1 <= maxChars) {
            subChunk = subChunk ? `${subChunk} ${unit}` : unit;
          } else {
            if (subChunk) {
              chunks.push({
                chunk_index: chunkIndex++,
                content: subChunk.trim(),
                char_count: subChunk.length,
                page_number: 1,
                metadata: { pageNumber: 1 }
              });
            }
            subChunk = unit;
          }
        }

        if (subChunk) {
          currentChunk = subChunk;
        } else {
          currentChunk = '';
        }
      } else {
        currentChunk = trimmedPara;
      }
    }
  }

  if (currentChunk) {
    chunks.push({
      chunk_index: chunkIndex++,
      content: currentChunk.trim(),
      char_count: currentChunk.length,
      page_number: 1,
      metadata: { pageNumber: 1 }
    });
  }

  return chunks;
}
