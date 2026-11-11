# 🎓 Campus AI — Intelligent Campus Document Assistant

> **A full-stack college mini-project featuring separate, role-protected Admin and Student portals, client-side document processing, semantic text chunking, and grounded question answering.**

---

## 📌 1. Project Overview

**Campus AI** is an intelligent academic document assistant designed for universities and colleges. It bridges the gap between voluminous official circulars (PDFs, DOCX, TXT) and student queries by allowing institutional administrators to upload official notices, automatically extracting and indexing passages, and enabling students to query the documents via a dedicated AI chatbot.

### Key Highlights:
- **Strict Role Separation**: Dedicated `/admin/*` and `/student/*` portals with independent navigation, layouts, and route guards.
- **Protected Admin Provisioning**: Administrator registration is protected with a secure institutional authorization key (`CAMPUS_ADMIN_2025`) to prevent unauthorized escalation.
- **Client-Side Document Extraction**: Extracts raw text from `.pdf` (using `pdfjs-dist`), `.docx` (using `mammoth`), and `.txt` files directly in the browser with type, size, and page-level metadata.
- **Lightweight Neural Semantic Search Model**: 64-dimensional dense sentence embeddings with subword character n-grams and 2-layer neural projection, making the chatbot resilient to typos (e.g. `onm`, `dres`), abbreviations (`rep time`, `aud`, `clg`, `sem`), and rephrased questions.
- **Concise Fact Retrieval**: Pinpoints only the specific factual answer or notice clause, avoiding paragraph dumping and duplicate text.
- **Source & Page Citation**: Shows source document filename and page number (e.g., `Onam_Celebration_Notice.pdf (Page 1)`).
- **Dual-Mode Architecture**: Works out-of-the-box in local demo/offline mode with `localStorage` persistence, and connects seamlessly to **Supabase** (Auth + PostgreSQL + Storage + RLS) with environment variables.
- **Conflicting Data Detection**: Identifies conflicting information across multiple circulars and flags the discrepancies to the user.

---

## 🛠️ 2. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend Framework** | React 18, Vite |
| **Language & Routing** | JavaScript (ES6+), React Router DOM v6 |
| **Styling & UI** | Tailwind CSS, Lucide React Icons |
| **Authentication** | Supabase Auth (with offline mock fallback) |
| **Database & Security**| Supabase PostgreSQL, Row Level Security (RLS) policies |
| **Storage** | Supabase Storage (`campus-documents` bucket) |
| **Document Processing**| `pdfjs-dist` (PDF), `mammoth` (DOCX), `FileReader` (TXT) |
| **Retrieval Engine** | Custom TF-IDF, Keyword matching, Intent Classifier, Fact Synthesizer |
| **Deployment** | Vercel (`vercel.json` rewrites included) |

---

## 📂 3. Project Structure

```
campus/
├── dist/                          # Production build output
├── public/                        # Static assets
├── sample_documents/              # Demonstration documents
│   ├── Onam_Celebration_Notice.txt
│   └── Semester_Exam_Guidelines.txt
├── src/
│   ├── components/
│   │   ├── AuthTabs.jsx           # Role switcher tabs (Admin / Student)
│   │   ├── Navbar.jsx             # Academic header with status indicators & logout
│   │   └── ProtectedRoute.jsx     # Role-based route guard
│   ├── context/
│   │   ├── AuthContext.jsx        # Dual-mode Auth provider
│   │   └── DocumentContext.jsx    # Dual-mode document & chat store
│   ├── pages/
│   │   ├── admin/
│   │   │   ├── AdminDashboard.jsx # Document upload, status, list, preview & delete
│   │   │   ├── AdminSignIn.jsx    # Admin login form
│   │   │   └── AdminSignUp.jsx    # Protected admin account provisioning
│   │   ├── student/
│   │   │   ├── StudentChat.jsx     # Clean student AI chat interface
│   │   │   ├── StudentSignIn.jsx  # Student login form
│   │   │   └── StudentSignUp.jsx  # Student registration form
│   │   ├── NotFound.jsx           # 404 handler
│   │   └── Welcome.jsx            # First screen - Dual portal welcome page
│   ├── services/
│   │   ├── documentParser.js      # PDF, DOCX, TXT extraction
│   │   ├── retrievalEngine.js     # QA retrieval & intent matching engine
│   │   ├── supabaseClient.js      # Supabase client initializer
│   │   └── textChunker.js         # Semantic text passage chunker
│   ├── App.jsx                    # Route declarations
│   ├── index.css                  # Tailwind styles
│   └── main.jsx                   # Application entry point
├── supabase/
│   └── schema.sql                 # PostgreSQL tables & RLS security policies
├── test/
│   └── retrievalEngine.test.js    # 10/10 automated retrieval test suite
├── .env.example                   # Environment variable template
├── package.json                   # Dependencies and scripts
├── tailwind.config.js             # Academic theme configuration
├── vercel.json                    # Vercel SPA routing rules
└── vite.config.js                 # Vite bundler configuration
```

---

## 🚀 4. Quick Start & Local Execution

### Prerequisites:
- **Node.js** (v18 or v20+ recommended)
- **npm** or **pnpm**

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Run Automated Tests
Verify that the question answering engine passes all 10 benchmark tests:
```bash
npm test
```

### Step 3: Start the Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## 🔐 5. Default Credentials (Demo / Offline Mode)

When running locally without a Supabase project, Campus AI uses safe `localStorage` demo accounts:

### Admin Portal (`/admin/signin`):
- **Email:** `admin@campus.edu`
- **Password:** `AdminPassword123!`
- *(Click "Auto-fill Demo Admin Credentials" on the login screen for 1-click login)*
- **Admin Setup Key (for provisioning new admins):** `CAMPUS_ADMIN_2025`

### Student Portal (`/student/signin`):
- **Email:** `student@campus.edu`
- **Password:** `StudentPassword123!`
- *(Click "Auto-fill Demo Student Credentials" or click "Create Student Account")*

---

## 🗄️ 6. Connecting Live Supabase Backend (Optional)

To connect your project to a live production database:

1. Create a free account and project at [Supabase](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard and run the entire SQL script from:
   ```
   supabase/schema.sql
   ```
3. Go to **Storage** and create a new bucket named:
   ```
   campus-documents
   ```
4. Copy your project credentials from **Project Settings ➔ API** and create a `.env` file in the project root:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   VITE_ADMIN_INVITE_CODE=CAMPUS_ADMIN_2025
   ```
5. Restart your Vite development server (`npm run dev`). Campus AI will automatically detect the credentials and display the **Supabase Live** badge in the navigation bar!

---

## 🧪 7. End-to-End Demonstration Walkthrough

Follow this step-by-step test script during your project evaluation:

### Step 1: Administrator Upload
1. Open `http://localhost:5173`.
2. Click **Admin Portal** or **Admin Sign In**.
3. Sign in using `admin@campus.edu` / `AdminPassword123!`.
4. You are directed to `/admin/dashboard`.
5. Upload a document:
   - Drag & drop `sample_documents/Onam_Celebration_Notice.txt` (or click **"Load Demo Notice (Onam)"**).
   - The status updates dynamically: `Uploading` ➔ `Extracting Text...` ➔ `Completed`.
6. Click the 👁️ (eye icon) to preview the extracted text and verify that all details were parsed accurately.
7. Click **Logout**.

### Step 2: Student Inquiries
1. Return to the Welcome screen and click **Student Portal**.
2. Click **Create Student Account** or use the demo login (`student@campus.edu` / `StudentPassword123!`).
3. You are redirected to `/student/chat`. Notice that document management, deletion, and admin controls are completely hidden.
4. Ask the following questions:

| Student Query | Grounded AI Response | Source Cited |
|---|---|---|
| *"When is the Onam celebration?"* | **"The Onam celebration is scheduled for 5 September."** | `Onam_Celebration_Notice.pdf` |
| *"What is the dress code?"* | **"The dress code is traditional Kerala attire."** | `Onam_Celebration_Notice.pdf` |
| *"Where is the event?"* | **"The event will be held in the College Auditorium."** | `Onam_Celebration_Notice.pdf` |
| *"What time should students report?"* | **"The reporting time is 9:00 AM."** | `Onam_Celebration_Notice.pdf` |
| *"What is the NASA trip fee?"* | **"I couldn't find this information in the uploaded campus documents. Please contact the college administration for clarification."** | None (Zero hallucination) |

---

## 🔒 8. Security & Database Design

### Database Tables:
1. `profiles`: User IDs, emails, roles (`'admin'` or `'student'`), linked directly to Supabase Auth.
2. `documents`: Filenames, storage paths, file sizes, processing status (`'Uploading'`, `'Processing'`, `'Completed'`, `'Failed'`), and raw content.
3. `document_chunks`: Document chunks with passage text and JSON metadata.
4. `conversations`: Student inquiry threads.
5. `messages`: Individual user queries and assistant responses with grounded citations.

### Row Level Security (RLS) Policies:
- **Admins only** can insert, update, or delete records in `documents` and `document_chunks`.
- **Students** can only read chunks from documents where `status = 'Completed'`.
- **Students** can only read, write, and access their own conversations and messages (`student_id = auth.uid()`).
- Role elevation is blocked: students cannot modify the `role` column in their profile.

---

## 🚢 9. Deploying to Vercel

1. Push your repository to GitHub.
2. Go to [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Import this repository.
4. In the Environment Variables section, add:
   - `VITE_SUPABASE_URL` (optional for live Supabase)
   - `VITE_SUPABASE_ANON_KEY` (optional for live Supabase)
   - `VITE_ADMIN_INVITE_CODE` (`CAMPUS_ADMIN_2025`)
5. Click **Deploy**. Vercel will build the project using the included `vercel.json` rewrite rules.

---
https://campus-ai-cyan-three.vercel.app ---> click

## 👥 Contributors & Academic License

Developed for the **College Mini-Project Evaluation — Intelligent Campus Systems**.
Built with React, Vite, Tailwind CSS, and Supabase.
All rights reserved © 2025 Campus AI.
