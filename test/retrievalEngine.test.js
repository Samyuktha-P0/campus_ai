import { answerQuestion, extractKeywords } from '../src/services/retrievalEngine.js';
import { splitIntoChunks } from '../src/services/textChunker.js';

// Document 1: Onam Circular
const SAMPLE_ONAM_NOTICE = `COLLEGE OF ENGINEERING & TECHNOLOGY
OFFICIAL NOTICE - STUDENT AFFAIRS CIRCULAR

Subject: Onam Celebration 2025

Dear Students and Faculty Members,

We are pleased to announce the upcoming College Onam Celebration. All departments are cordially invited to take part in the festivities.

Key Event Details:
- Event: Onam Celebration
- Date: 5 September
- Venue: College Auditorium
- Dress Code: Traditional Kerala attire
- Reporting Time: 9:00 AM

Important Instructions:
1. All students are required to wear traditional Kerala attire (Kasavu saree/set mundu for female students, and jubba/mundu for male students).
2. Students must carry their valid College ID cards at the entrance.
3. The floral carpet (Athapookkalam) competition will commence at 9:30 AM in the central foyer.
4. Traditional Onam Sadhya (grand feast) will be served in the College Dining Hall starting at 12:30 PM.
5. All students must report to the College Auditorium promptly by 9:00 AM for the inaugural ceremony.

Issued by,
Dean of Student Affairs
College Administrative Office`;

// Document 2: Examination Guidelines
const SAMPLE_EXAM_GUIDELINES = `COLLEGE EXAMINATION CELL
CIRCULAR NO: EXAM-2025/09

Subject: End Semester Examination Guidelines & Hall Ticket Instructions

To: All Undergraduate and Postgraduate Students

Please find below the official instructions for the upcoming End Semester Examinations:

1. Hall Tickets:
- Hall tickets will be issued at the Examination Cell counters from 15 October.
- Students with less than 75% attendance are not eligible to collect hall tickets without prior approval from the Head of Department.

2. Examination Timings:
- Morning Session: 10:00 AM to 1:00 PM
- Reporting Time: 9:30 AM
- No student will be permitted inside the examination hall after 10:15 AM.

3. Permitted & Prohibited Items:
- Permitted: College ID card, original Hall Ticket, non-programmable scientific calculator, pens, pencils, and clear water bottle.
- Prohibited: Mobile phones, smart watches, bluetooth devices, digital notes, and bags. Any possession of unauthorized devices will be treated as examination malpractice.

4. Venue & Seating:
- Seating arrangements will be displayed on the notice board outside Main Block B and on the student portal one day prior to each examination.

Controller of Examinations
College Examination Cell`;

// Document 3: Library Regulations
const SAMPLE_LIBRARY_RULES = `CENTRAL LIBRARY NOTICE
CIRCULAR NO: LIB-2025/04

Subject: Campus Central Library Regulations and Borrowing Policy

To: All Students and Faculty Members

1. Borrowing Privileges & Issue Limits:
- Undergraduate students can borrow up to 3 books for a period of 14 days.
- Postgraduate students can borrow up to 5 books for a period of 28 days.
- Reference books and rare journals cannot be taken out of the library.

2. Library Working Hours:
- Monday to Friday: 8:30 AM to 6:00 PM
- Saturday: 9:00 AM to 1:00 PM
- Sunday: Closed

3. Overdue Fines:
- An overdue fine of ₹2 per day per book will be charged for books returned after the due date.

Issued by,
Chief Librarian
Central Library Administrative Desk`;

const docs = [
  {
    id: 'doc-onam',
    name: 'Onam_Celebration_Notice.pdf',
    raw_content: SAMPLE_ONAM_NOTICE,
    status: 'Completed',
    chunks: splitIntoChunks({ pages: [{ pageNumber: 1, text: SAMPLE_ONAM_NOTICE }] })
  },
  {
    id: 'doc-exam',
    name: 'Semester_Exam_Guidelines.txt',
    raw_content: SAMPLE_EXAM_GUIDELINES,
    status: 'Completed',
    chunks: splitIntoChunks({ pages: [{ pageNumber: 1, text: SAMPLE_EXAM_GUIDELINES }] })
  },
  {
    id: 'doc-lib',
    name: 'Campus_Library_Regulations.docx',
    raw_content: SAMPLE_LIBRARY_RULES,
    status: 'Completed',
    chunks: splitIntoChunks({ pages: [{ pageNumber: 2, text: SAMPLE_LIBRARY_RULES }] })
  }
];

async function runTests() {
  console.log('=== RUNNING MULTI-DOCUMENT RETRIEVAL & ANSWER EXTRACTION TESTS ===\n');
  let passed = 0;
  let total = 0;

  function assert(condition, testName, details = '') {
    total++;
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} -> ${details}`);
    }
  }

  // --- Document 1 Tests (Onam Circular) ---
  const q1 = await answerQuestion("When is the Onam celebration?", docs);
  assert(
    q1.answer.toLowerCase().includes('5 september') && q1.sources[0]?.document_name === 'Onam_Celebration_Notice.pdf',
    'Doc 1: "When is the Onam celebration?" returns 5 September from Onam notice',
    `Got: "${q1.answer}" [Source: ${q1.sources[0]?.document_name}]`
  );

  const q2 = await answerQuestion("What is the dress code?", docs);
  assert(
    q2.answer.toLowerCase().includes('traditional kerala attire'),
    'Doc 1: "What is the dress code?" returns traditional Kerala attire',
    `Got: "${q2.answer}"`
  );

  const q3 = await answerQuestion("Where is the event?", docs);
  assert(
    q3.answer.toLowerCase().includes('college auditorium'),
    'Doc 1: "Where is the event?" returns College Auditorium',
    `Got: "${q3.answer}"`
  );

  const q4 = await answerQuestion("When does the floral carpet competition start?", docs);
  assert(
    q4.answer.includes('9:30 AM') && !q4.answer.includes('Dear Students and Faculty'),
    'Doc 1: Floral carpet timing returns concise 9:30 AM without header text',
    `Got: "${q4.answer}"`
  );

  const q5 = await answerQuestion("Where will the Onam feast be served?", docs);
  assert(
    q5.answer.toLowerCase().includes('college dining hall'),
    'Doc 1: Onam feast venue returns College Dining Hall',
    `Got: "${q5.answer}"`
  );

  // --- Document 2 Tests (Semester Exam Guidelines) ---
  const q6 = await answerQuestion("When will hall tickets be issued?", docs);
  assert(
    q6.answer.includes('15 October') && q6.sources[0]?.document_name === 'Semester_Exam_Guidelines.txt',
    'Doc 2: "When will hall tickets be issued?" retrieves 15 October from Exam circular',
    `Got: "${q6.answer}" [Source: ${q6.sources[0]?.document_name}]`
  );

  const q7 = await answerQuestion("What is the minimum attendance required for exams?", docs);
  assert(
    q7.answer.includes('75% attendance') && q7.sources[0]?.document_name === 'Semester_Exam_Guidelines.txt',
    'Doc 2: Minimum attendance requirement returns 75% rule concisely',
    `Got: "${q7.answer}"`
  );

  const q8 = await answerQuestion("What are the morning examination timings?", docs);
  assert(
    q8.answer.includes('10:00 AM to 1:00 PM'),
    'Doc 2: Morning exam timings returns 10:00 AM to 1:00 PM',
    `Got: "${q8.answer}"`
  );

  const q9 = await answerQuestion("What items are prohibited in the exam hall?", docs);
  assert(
    q9.answer.toLowerCase().includes('mobile phones') && q9.answer.toLowerCase().includes('prohibited'),
    'Doc 2: Prohibited exam items returns mobile phones and unauthorized devices',
    `Got: "${q9.answer}"`
  );

  const q10 = await answerQuestion("Where will seating arrangements be displayed?", docs);
  assert(
    q10.answer.toLowerCase().includes('main block b'),
    'Doc 2: Seating venue returns Main Block B',
    `Got: "${q10.answer}"`
  );

  // --- Document 3 Tests (Campus Library Regulations) ---
  const q11 = await answerQuestion("How many books can undergraduate students borrow?", docs);
  assert(
    q11.answer.includes('up to 3 books') && q11.sources[0]?.document_name === 'Campus_Library_Regulations.docx',
    'Doc 3: UG borrowing limit returns 3 books from Library circular',
    `Got: "${q11.answer}" [Source: ${q11.sources[0]?.document_name}]`
  );

  const q12 = await answerQuestion("What is the overdue fine for library books?", docs);
  assert(
    q12.answer.includes('₹2 per day'),
    'Doc 3: Library fine returns ₹2 per day per book',
    `Got: "${q12.answer}"`
  );

  const q13 = await answerQuestion("What are the library working hours on Saturday?", docs);
  assert(
    q13.answer.includes('9:00 AM to 1:00 PM'),
    'Doc 3: Saturday library hours returns 9:00 AM to 1:00 PM',
    `Got: "${q13.answer}"`
  );

  // --- Typo, Abbreviation & Semantic Robustness ---
  const q14 = await answerQuestion("Wn is onm?", docs);
  assert(
    q14.answer.toLowerCase().includes('5 september'),
    'Typos: "Wn is onm?" retrieves 5 September',
    `Got: "${q14.answer}"`
  );

  const q15 = await answerQuestion("wat is the dres code?", docs);
  assert(
    q15.answer.toLowerCase().includes('traditional kerala attire'),
    'Typos: "wat is the dres code?" retrieves dress code',
    `Got: "${q15.answer}"`
  );

  const q16 = await answerQuestion("min attend for sem exams?", docs);
  assert(
    q16.answer.includes('75% attendance'),
    'Abbreviations: "min attend for sem exams?" retrieves 75% attendance',
    `Got: "${q16.answer}"`
  );

  const q17 = await answerQuestion("lib fine per day?", docs);
  assert(
    q17.answer.includes('₹2 per day'),
    'Abbreviations: "lib fine per day?" retrieves ₹2 library fine',
    `Got: "${q17.answer}"`
  );

  // --- Strict Guardrails (Zero Guessing) ---
  const q18 = await answerQuestion("What is the flight schedule to Paris?", docs);
  const expectedFallback = "I couldn't find this information in the uploaded campus documents. Please contact the college administration for clarification.";
  assert(
    q18.answer === expectedFallback,
    'Guardrail: Completely unrelated flight question returns standard fallback',
    `Got: "${q18.answer}"`
  );

  const q19 = await answerQuestion("How to bake a chocolate cake?", docs);
  assert(
    q19.answer === expectedFallback,
    'Guardrail: Baking question returns standard fallback without hallucination',
    `Got: "${q19.answer}"`
  );

  // --- Multi-Document Conflict Detection ---
  const conflictingDoc = {
    id: 'doc-onam-revised',
    name: 'Revised_Onam_Schedule.pdf',
    raw_content: `Event: Onam Celebration\nDate: 12 September\nVenue: College Stadium`,
    status: 'Completed',
    chunks: [{ chunk_index: 0, content: 'Event: Onam Celebration\nDate: 12 September\nVenue: College Stadium', page_number: 1 }]
  };

  const q20 = await answerQuestion("What is the date of the Onam celebration?", [...docs, conflictingDoc]);
  assert(
    q20.answer.toLowerCase().includes('conflicting details') &&
    q20.answer.includes('Onam_Celebration_Notice.pdf') &&
    q20.answer.includes('Revised_Onam_Schedule.pdf'),
    'Multi-doc: Conflicting event date detects discrepancy and cites both sources',
    `Got: "${q20.answer}"`
  );

  console.log(`\nTEST RESULTS: ${passed}/${total} passed (${Math.round((passed/total)*100)}%)`);
  if (passed === total) {
    console.log('🎉 ALL MULTI-DOCUMENT DYNAMIC EXTRACTION TESTS PASSED (100%)!\n');
  } else {
    process.exit(1);
  }
}

runTests();
