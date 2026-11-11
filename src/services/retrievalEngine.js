/**
 * Enhanced Dynamic Question-Answering & Retrieval Engine for Campus AI
 * 
 * Works across ALL uploaded documents (PDF, DOCX, TXT):
 * 1. Semantic Unit Extraction: Parses all documents into factual units (sentences, key-values, lists) with page numbers.
 * 2. Context Inheritance: Inherits document subject metadata so key-values associate with their parent topic.
 * 3. Hybrid Neural + Keyword Scoring: Combines dense 64-D sentence embeddings with sparse BM25/fuzzy keyword matching.
 * 4. Specific Fact Extraction: Returns ONLY the concise answer requested (no paragraph dumping, no empty section headers).
 * 5. Grouped Conflict Detection: Dynamically flags conflicting details for identical keys across distinct documents.
 * 6. Strict Confidence Gating: Accurately identifies when information is absent and avoids guessing.
 */

import {
  embedSentence,
  cosineSimilarity,
  normalizeQuestion,
  fuzzyIncludes
} from './neuralSemanticSearch.js';

const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and',
  'any', 'are', 'aren\'t', 'as', 'at', 'be', 'because', 'been', 'before', 'being',
  'below', 'between', 'both', 'but', 'by', 'can', 'can\'t', 'cannot', 'could',
  'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t',
  'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t',
  'has', 'hasn\'t', 'have', 'haven\'t', 'having', 'he', 'her', 'here', 'hers',
  'herself', 'him', 'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is',
  'isn\'t', 'it', 'it\'s', 'its', 'itself', 'let\'s', 'me', 'more', 'most',
  'mustn\'t', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once',
  'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over',
  'own', 'same', 'shan\'t', 'she', 'she\'d', 'she\'ll', 'she\'s', 'should',
  'shouldn\'t', 'so', 'some', 'such', 'than', 'that', 'that\'s', 'the', 'their',
  'theirs', 'them', 'themselves', 'then', 'there', 'there\'s', 'these', 'they',
  'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very',
  'was', 'wasn\'t', 'we', 'were', 'weren\'t', 'what', 'when', 'where', 'which',
  'while', 'who', 'whom', 'why', 'with', 'won\'t', 'would', 'wouldn\'t', 'you',
  'your', 'yours', 'yourself', 'yourselves', 'tell', 'please', 'know', 'give'
]);

export function extractKeywords(text) {
  if (!text) return [];
  const normalized = normalizeQuestion(text);
  const words = normalized
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .map(w => w.trim())
    .filter(w => w.length > 1 && !STOP_WORDS.has(w));
  return Array.from(new Set(words));
}

/**
 * Detect query intent dynamically across all academic topics
 */
function detectIntent(question) {
  const q = normalizeQuestion(question);
  
  if (/\b(when|date|day|which day|schedule|calendar|commence|starts|starts on|held on|deadline)\b/i.test(q)) {
    return { type: 'DATE', synonyms: ['date', 'day', 'held on', 'scheduled', 'commence', 'starts on', 'from', 'deadline'] };
  }
  if (/\b(where|venue|location|place|hall|auditorium|room|building|block|foyer|counters|center)\b/i.test(q)) {
    return { type: 'VENUE', synonyms: ['venue', 'location', 'place', 'auditorium', 'hall', 'held at', 'room', 'foyer', 'counters'] };
  }
  if (/\b(dress|dress code|attire|wear|outfit|uniform|costume|clothes|saree|mundu)\b/i.test(q)) {
    return { type: 'DRESS_CODE', synonyms: ['dress code', 'attire', 'wear', 'outfit', 'traditional', 'costume', 'saree', 'mundu'] };
  }
  if (/\b(time|timing|timings|reporting time|start time|hour|hours|am|pm|arrive|report|session)\b/i.test(q)) {
    return { type: 'TIME', synonyms: ['time', 'reporting time', 'timings', 'am', 'pm', 'clock', 'commence', 'arrive', 'session'] };
  }
  if (/\b(who|eligible|eligibility|attend|participate|attendance|percentage)\b/i.test(q)) {
    return { type: 'ELIGIBILITY', synonyms: ['eligible', 'attendance', 'students', 'all', 'open to', 'participation', 'percentage', 'criteria'] };
  }
  if (/\b(item|items|carry|prohibited|permitted|allowed|bring|calculator|phone|watch|gadgets)\b/i.test(q)) {
    return { type: 'ITEMS', synonyms: ['permitted', 'prohibited', 'carry', 'bring', 'allowed', 'id card', 'calculator', 'mobile', 'possession'] };
  }
  if (/\b(fee|fine|fines|overdue|charge|cost|penalty|pay|payment)\b/i.test(q)) {
    return { type: 'FINE', synonyms: ['fine', 'fines', 'overdue', 'fee', 'charge', 'charged', 'penalty', 'per day'] };
  }
  if (/\b(books|borrow|borrowing|issue|limit|return|period|library)\b/i.test(q)) {
    return { type: 'LIBRARY', synonyms: ['books', 'borrow', 'borrowing', 'issue', 'period', 'limit', 'days', 'undergraduate', 'postgraduate'] };
  }
  
  return { type: 'GENERAL', synonyms: [] };
}

/**
 * Extract document subject / title
 */
function extractDocumentSubject(fullText, docName = '') {
  const match = fullText.match(/(?:subject|event):\s*([^\r\n]+)/i);
  if (match && match[1]) {
    return match[1].trim();
  }
  if (docName) {
    return docName.replace(/\.[a-z0-9]+$/i, '').replace(/[_-]/g, ' ').trim();
  }
  return '';
}

/**
 * Extract semantic units from any document (key-values, list items, sentences)
 */
function extractSemanticUnits(doc) {
  const units = [];
  const chunks = doc.chunks && doc.chunks.length > 0 ? doc.chunks : [];

  const rawChunks = chunks.length > 0
    ? chunks
    : [{ content: doc.raw_content || '', page_number: 1, metadata: { pageNumber: 1 } }];

  const fullDocText = doc.raw_content || chunks.map(c => c.content).join('\n\n');
  const docSubject = extractDocumentSubject(fullDocText, doc.name);

  for (const ch of rawChunks) {
    const pageNum = ch.page_number || ch.metadata?.pageNumber || 1;
    const chunkContent = ch.content || '';

    // --- Split chunk content into raw lines using multiple delimiters ---
    // First split on real newlines, then further split any long line on
    // sentence boundaries and bullet markers so PDF/DOCX blobs (which often
    // have no newlines) still get broken into individual factual units.
    const rawLines = chunkContent.split(/\r?\n/);
    const expandedLines = [];

    for (const rawLine of rawLines) {
      const trimmed = rawLine.trim();
      if (!trimmed) continue;

      // If the line is short enough to be a single fact, keep it as-is.
      if (trimmed.length <= 120) {
        expandedLines.push(trimmed);
      } else {
        // Long line: split further on sentence terminators and bullet markers
        const subLines = trimmed
          .split(/(?<=[.!?])\s+|(?<=[;])\s+|(?=[-•*]\s)|(?<=\n)/)
          .map(s => s.trim())
          .filter(s => s.length > 3);
        expandedLines.push(...subLines);
      }
    }

    for (const line of expandedLines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.length < 4) continue;

      const lower = trimmed.toLowerCase();
      // Skip generic boilerplate headers or signatures
      if (
        lower.startsWith('dear students') ||
        lower.startsWith('issued by') ||
        lower.startsWith('circular no:') ||
        lower.startsWith('to: all') ||
        lower.startsWith('college of engineering') ||
        lower.startsWith('college examination cell') ||
        lower.startsWith('subject:') ||
        lower.startsWith('please find below')
      ) {
        continue;
      }

      // Strip leading bullet / list markers (handles "- ", "* ", "• ", "1. ", "2) " etc.)
      const cleanLine = trimmed.replace(/^(?:[-*•]\s+|\d+[.)]\s+)/, '').trim();
      if (!cleanLine || cleanLine.length < 4) continue;

      const colonIndex = cleanLine.indexOf(':');

      // Key-Value detection:
      //   colonIndex must be > 1 and < 55 (long enough key, not a time like "9:00")
      //   The character immediately BEFORE the colon must NOT be a digit — this
      //   prevents false splits on embedded time values like "report at 9:00 AM"
      //   where "9" would become the "key" and "00 AM" the "value".
      const charBeforeColon = colonIndex > 0 ? cleanLine[colonIndex - 1] : '';
      const isTimeColon = /\d/.test(charBeforeColon);

      if (colonIndex > 1 && colonIndex < 55 && !isTimeColon) {
        const key = cleanLine.substring(0, colonIndex).trim();
        const rawValue = cleanLine.substring(colonIndex + 1).trim();

        // value must be non-empty; reject bare section headers like "2. Timings:"
        // and reject purely numeric keys (e.g. "1" from "1. Item")
        if (key && rawValue && rawValue.length > 0 && !/^\d+$/.test(key)) {
          units.push({
            type: 'key-value',
            key,
            value: rawValue,
            text: cleanLine,
            contextText: `${docSubject} ${key}: ${rawValue}`,
            docName: doc.name,
            docSubject,
            pageNumber: pageNum
          });
        }
      }

      // Always also push as a sentence unit (unless it's a bare header like "Details:")
      if (!cleanLine.endsWith(':') && cleanLine.length >= 8) {
        units.push({
          type: 'sentence',
          text: cleanLine,
          contextText: `${docSubject} ${cleanLine}`,
          docName: doc.name,
          docSubject,
          pageNumber: pageNum
        });
      }
    }
  }

  return units;
}

/**
 * Score relevance between query keywords and candidate text
 */
function scoreCandidate(queryKeywords, candidateText, intentSynonyms = []) {
  const textLower = candidateText.toLowerCase();
  let score = 0;
  let matches = 0;

  for (const kw of queryKeywords) {
    if (textLower.includes(kw)) {
      matches++;
      score += 4;
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      if (regex.test(textLower)) {
        score += 2;
      }
    }
  }

  // Fuzzy match for typos
  const fuzzyHits = fuzzyIncludes(candidateText, queryKeywords, 2);
  if (fuzzyHits > matches) {
    score += (fuzzyHits - matches) * 3;
    matches = fuzzyHits;
  }

  // Intent match bonus
  for (const syn of intentSynonyms) {
    if (textLower.includes(syn.toLowerCase())) {
      score += 3;
    }
  }

  return { score, matches };
}

/**
 * Dynamically formats and extracts strictly the requested answer
 */
function formatSpecificAnswer(bestCandidate, queryKeywords, intent) {
  if (bestCandidate.type === 'key-value') {
    const key = bestCandidate.key;
    const value = bestCandidate.value;
    const kLower = key.toLowerCase();

    // 1. Dress Code
    if (kLower.includes('dress') || kLower.includes('attire')) {
      const vClean = value.toLowerCase().startsWith('traditional') ? value.toLowerCase() : value;
      return `The dress code is ${vClean}.`;
    }

    // 2. Venue / Location
    if (kLower.includes('venue') || kLower.includes('location')) {
      return `The event will be held in the ${value}.`;
    }

    // 3. Reporting Time
    if (kLower.includes('reporting time')) {
      return `The reporting time is ${value}.`;
    }

    // 4. Date
    if (kLower.includes('date') || kLower.includes('day')) {
      let subject = '';
      for (const kw of queryKeywords) {
        if (!['date', 'when', 'day', 'time', 'wat', 'wn', 'what', 'which', 'event', 'held', 'celebration', 'celebrating'].includes(kw)) {
          subject = kw.charAt(0).toUpperCase() + kw.slice(1);
          break;
        }
      }
      if (subject) {
        return `The ${subject} celebration is scheduled for ${value}.`;
      }
      if (bestCandidate.docSubject) {
        return `The ${bestCandidate.docSubject.replace(/\d{4}/g, '').trim()} is scheduled for ${value}.`;
      }
      return `The event is scheduled for ${value}.`;
    }

    // 5. Timings & Working Hours
    if (kLower.includes('timing') || kLower.includes('hours') || kLower.includes('session')) {
      return `${key}: ${value}`;
    }

    // 6. Prohibited / Permitted
    if (kLower.includes('prohibited') || kLower.includes('permitted')) {
      return `${key}: ${value}`;
    }

    // General Key-Value formatting
    return `${key}: ${value}`;
  }

  // If candidate is a sentence
  let text = bestCandidate.text.replace(/^[-*•\d.]+\s*/, '').trim();

  // Split into sub-sentences — but NEVER split at abbreviations like Dr., Mr., Prof.,
  // St., Jr., Sr., vs., etc. so "Dr. Priya Nair" stays intact.
  // Strategy: temporarily replace known abbreviation periods with a placeholder,
  // split on real sentence terminators, then restore the placeholders.
  const ABBREV_PLACEHOLDER = '\x00';
  const ABBREVS = /\b(Dr|Mr|Mrs|Ms|Prof|Sr|Jr|St|vs|etc|approx|dept|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\./gi;
  const protected_text = text.replace(ABBREVS, (m) => m.slice(0, -1) + ABBREV_PLACEHOLDER);

  const rawSubSentences = protected_text.split(/(?<=[.!?])\s+/).map(s => s.replace(new RegExp(ABBREV_PLACEHOLDER, 'g'), '.'));
  const subSentences = rawSubSentences.filter(s => s.trim().length > 6);

  if (subSentences.length > 1) {
    let bestSub = subSentences[0];
    let maxMatch = -1;
    for (const sub of subSentences) {
      const subLower = sub.toLowerCase();
      let count = 0;
      for (const kw of queryKeywords) {
        if (subLower.includes(kw)) count++;
      }
      if (count > maxMatch) {
        maxMatch = count;
        bestSub = sub;
      }
    }
    text = bestSub;
  }

  if (!text.endsWith('.') && !text.endsWith('!') && !text.endsWith('?')) {
    text += '.';
  }

  return text;
}

/**
 * Main Question Answering function
 * Supports all document types (PDF, DOCX, TXT)
 */
export async function answerQuestion(question, documents = []) {
  const STANDARD_FALLBACK = "I couldn't find this information in the uploaded campus documents. Please contact the college administration for clarification.";

  if (!question || !question.trim()) {
    return {
      answer: "Please ask a question about campus events, notices, or regulations.",
      sources: [],
      confidence: 0
    };
  }

  const trimmedQuestion = question.trim();
  const normalizedQ = normalizeQuestion(trimmedQuestion);
  const queryKeywords = extractKeywords(normalizedQ);
  const intent = detectIntent(trimmedQuestion);

  const activeDocs = documents.filter(d =>
    d.status === 'Completed' && (d.raw_content || (d.chunks && d.chunks.length > 0))
  );

  if (activeDocs.length === 0) {
    return {
      answer: STANDARD_FALLBACK,
      sources: [],
      confidence: 0
    };
  }

  // Check global keyword relevance across all active documents
  const allDocText = activeDocs
    .map(d => `${d.name} ${d.raw_content || (d.chunks ? d.chunks.map(c => c.content).join(' ') : '')}`)
    .join(' ');

  // Query content words excluding generic query terms
  const nonGenericKeywords = queryKeywords.filter(k =>
    !['when', 'where', 'what', 'time', 'date', 'day', 'event', 'info', 'which', 'held', 'occur', 'place'].includes(k)
  );

  const globalHits = fuzzyIncludes(allDocText, nonGenericKeywords.length > 0 ? nonGenericKeywords : queryKeywords, 2);

  if (nonGenericKeywords.length > 0 && globalHits === 0) {
    return {
      answer: STANDARD_FALLBACK,
      sources: [],
      confidence: 0
    };
  }

  // Compute neural embedding for query
  const queryEmbedding = embedSentence(normalizedQ);

  // Extract all semantic units across all uploaded documents
  const allUnits = [];
  for (const doc of activeDocs) {
    allUnits.push(...extractSemanticUnits(doc));
  }

  // Score each unit with hybrid neural semantic + keyword relevance
  const scoredCandidates = [];

  for (const unit of allUnits) {
    const textToMatch = unit.contextText || unit.text;
    
    // Keyword scoring
    const { score: kwScore, matches } = scoreCandidate(queryKeywords, `${unit.docName} ${textToMatch}`, intent.synonyms);
    
    // Neural semantic scoring
    const unitEmbedding = embedSentence(textToMatch);
    const semSim = cosineSimilarity(queryEmbedding, unitEmbedding);

    // Specific entity match bonus: terms in query matching unit text
    let specificEntityBonus = 0;
    if (nonGenericKeywords.length > 0) {
      const specificMatches = fuzzyIncludes(textToMatch, nonGenericKeywords, 2);
      specificEntityBonus = specificMatches * 5.0;
    }

    // Intent match bonus
    let intentBonus = 0;
    const lowerUnitText = textToMatch.toLowerCase();
    if (intent.type === 'DATE' && (lowerUnitText.includes('date') || lowerUnitText.includes('day') || lowerUnitText.includes('october') || lowerUnitText.includes('september'))) intentBonus = 3.5;
    if (intent.type === 'VENUE') {
      if (unit.type === 'key-value' && unit.key.toLowerCase().includes('venue')) {
        intentBonus = 6.0; // Strong bonus for explicit venue field
      } else if (lowerUnitText.includes('venue') || lowerUnitText.includes('auditorium') || lowerUnitText.includes('location') || lowerUnitText.includes('hall') || lowerUnitText.includes('block')) {
        intentBonus = 3.5;
      }
    }
    if (intent.type === 'DRESS_CODE' && (lowerUnitText.includes('dress') || lowerUnitText.includes('attire') || lowerUnitText.includes('wear'))) intentBonus = 4.0;
    if (intent.type === 'TIME' && (lowerUnitText.includes('time') || lowerUnitText.includes('timing') || lowerUnitText.includes('hours') || lowerUnitText.includes('am') || lowerUnitText.includes('pm'))) intentBonus = 3.5;
    if (intent.type === 'ITEMS' && (lowerUnitText.includes('prohibited') || lowerUnitText.includes('permitted') || lowerUnitText.includes('carry') || lowerUnitText.includes('bring'))) intentBonus = 4.0;
    if (intent.type === 'ELIGIBILITY' && (lowerUnitText.includes('attendance') || lowerUnitText.includes('eligible') || lowerUnitText.includes('percentage'))) intentBonus = 4.0;
    if (intent.type === 'FINE' && (lowerUnitText.includes('fine') || lowerUnitText.includes('fee') || lowerUnitText.includes('overdue'))) intentBonus = 4.0;
    if (intent.type === 'LIBRARY' && (lowerUnitText.includes('borrow') || lowerUnitText.includes('books') || lowerUnitText.includes('issue'))) intentBonus = 4.0;

    const hybridScore = (0.45 * semSim) + (0.35 * Math.min(kwScore / 12, 1.0)) + (0.20 * Math.min((specificEntityBonus + intentBonus) / 10, 1.0));

    if (hybridScore >= 0.35 || semSim >= 0.65 || (matches > 0 && kwScore >= 4)) {
      scoredCandidates.push({
        ...unit,
        score: hybridScore + specificEntityBonus + intentBonus,
        semSim,
        kwScore,
        matches
      });
    }
  }

  scoredCandidates.sort((a, b) => b.score - a.score);

  // Check for conflicting documents on the top-ranking Key-Value match
  if (scoredCandidates.length > 0 && scoredCandidates[0].type === 'key-value') {
    const topKV = scoredCandidates[0];
    const topKeyNorm = topKV.key.toLowerCase().trim();

    // Find ALL key-values with the identical key across any document (no score gate)
    // so that a lower-scored conflicting document is still detected.
    const sameKeyCandidates = scoredCandidates.filter(
      c => c.type === 'key-value' && c.key.toLowerCase().trim() === topKeyNorm
    );

    const distinctDocs = Array.from(new Set(sameKeyCandidates.map(c => c.docName)));
    if (distinctDocs.length > 1) {
      const distinctVals = Array.from(new Set(sameKeyCandidates.map(c => c.value.toLowerCase().replace(/[^a-z0-9]/g, ''))));
      if (distinctVals.length > 1) {
        const conflictDetails = sameKeyCandidates
          .filter((c, idx, arr) => arr.findIndex(x => x.docName === c.docName) === idx)
          .slice(0, 3)
          .map(c => `"${c.docName}" (Page ${c.pageNumber}): ${c.key} is specified as ${c.value}`)
          .join('; and ');
        return {
          answer: `The uploaded campus documents contain conflicting details regarding this query: ${conflictDetails}. Please verify with the college administrative office.`,
          sources: sameKeyCandidates.map(c => ({
            document_name: c.docName,
            page_number: c.pageNumber
          })),
          confidence: 0.95
        };
      }
    }
  }

  // If candidate units found above threshold
  if (scoredCandidates.length > 0 && scoredCandidates[0].score >= 0.40) {
    const best = scoredCandidates[0];
    const specificAnswer = formatSpecificAnswer(best, queryKeywords, intent);

    return {
      answer: specificAnswer,
      sources: [{
        document_name: best.docName,
        page_number: best.pageNumber || 1
      }],
      confidence: Math.min(best.score / 10, 0.98)
    };
  }

  // Fallback when not found or low confidence
  return {
    answer: STANDARD_FALLBACK,
    sources: [],
    confidence: 0
  };
}
