-- ==============================================================================
-- CAMPUS AI - DATABASE SCHEMA & ROW LEVEL SECURITY POLICIES
-- ==============================================================================
-- Enables UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. PROFILES TABLE (Linked with Supabase auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'student')),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Index for role lookup
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- ------------------------------------------------------------------------------
-- 2. DOCUMENTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL, -- 'pdf', 'docx', 'txt'
    file_size BIGINT NOT NULL,
    raw_content TEXT, -- Full extracted text
    summary TEXT,
    status TEXT NOT NULL CHECK (status IN ('Uploading', 'Processing', 'Completed', 'Failed')) DEFAULT 'Uploading',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON public.documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents(status);

-- ------------------------------------------------------------------------------
-- 3. DOCUMENT CHUNKS TABLE (For granular search & retrieval)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.document_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON public.document_chunks(document_id);
-- Full text search index on chunk content
CREATE INDEX IF NOT EXISTS idx_chunks_content_fts ON public.document_chunks USING gin(to_tsvector('english', content));

-- ------------------------------------------------------------------------------
-- 4. CONVERSATIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'New Conversation',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_conversations_student_id ON public.conversations(student_id);

-- ------------------------------------------------------------------------------
-- 5. MESSAGES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender TEXT NOT NULL CHECK (sender IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    sources JSONB DEFAULT '[]'::jsonb, -- e.g. [{"document_name": "Onam_Celebration_Notice.pdf", "chunk_id": "..."}]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);

-- ------------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PROFILES POLICIES
-- Users can view their own profile, or admins can view all profiles
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_admin());

-- Users can update only their non-role fields
CREATE POLICY "Users can update own profile except role"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

-- Insert profile upon signup (usually via trigger or direct service role)
CREATE POLICY "Enable insert for authenticated users"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- DOCUMENTS POLICIES
-- Admins can do everything on documents
CREATE POLICY "Admins have full access to documents"
    ON public.documents FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Students can read completed documents
CREATE POLICY "Students can read completed documents"
    ON public.documents FOR SELECT
    USING (auth.role() = 'authenticated' AND status = 'Completed');

-- DOCUMENT CHUNKS POLICIES
-- Admins can manage all chunks
CREATE POLICY "Admins have full access to document chunks"
    ON public.document_chunks FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Students can read chunks of completed documents
CREATE POLICY "Students can read chunks from completed documents"
    ON public.document_chunks FOR SELECT
    USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM public.documents
            WHERE public.documents.id = public.document_chunks.document_id
            AND public.documents.status = 'Completed'
        )
    );

-- CONVERSATIONS POLICIES
-- Students can only manage their own conversations
CREATE POLICY "Students manage own conversations"
    ON public.conversations FOR ALL
    USING (auth.uid() = student_id)
    WITH CHECK (auth.uid() = student_id);

-- MESSAGES POLICIES
-- Students can only manage messages in their own conversations
CREATE POLICY "Students manage own messages"
    ON public.messages FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations
            WHERE public.conversations.id = public.messages.conversation_id
            AND public.conversations.student_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.conversations
            WHERE public.conversations.id = public.messages.conversation_id
            AND public.conversations.student_id = auth.uid()
        )
    );

-- ------------------------------------------------------------------------------
-- 7. SUPABASE STORAGE BUCKET CREATION (Run in Supabase SQL editor)
-- ------------------------------------------------------------------------------
-- INSERT INTO storage.buckets (id, name, public) VALUES ('campus-documents', 'campus-documents', false)
-- ON CONFLICT (id) DO NOTHING;

-- Storage policies:
-- Only admins can upload/delete documents
-- Authenticated users (admin/student) can view/download
