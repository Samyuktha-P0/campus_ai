import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { extractDocumentText, validateDocumentFile } from '../services/documentParser';
import { splitIntoChunks } from '../services/textChunker';
import { answerQuestion } from '../services/retrievalEngine';
import { useAuth } from './AuthContext';

const DocumentContext = createContext(null);

const LOCAL_STORAGE_DOCS = 'campus_ai_documents';
const LOCAL_STORAGE_CONVERSATIONS = 'campus_ai_conversations';

// Sample notice text matching the user's example
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

export function DocumentProvider({ children }) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isAnswering, setIsAnswering] = useState(false);

  // Load documents on mount
  useEffect(() => {
    fetchDocuments();
  }, [user]);

  // Load conversations when user changes
  useEffect(() => {
    if (user && user.role === 'student') {
      fetchConversations();
    }
  }, [user]);

  /**
   * Fetch all documents
   */
  async function fetchDocuments() {
    setLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('documents')
          .select(`
            *,
            document_chunks (
              id,
              chunk_index,
              content
            )
          `)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Supabase fetchDocuments error:', error);
        } else {
          setDocuments(data || []);
        }
      } else {
        // Load from LocalStorage
        const saved = localStorage.getItem(LOCAL_STORAGE_DOCS);
        if (saved !== null) {
          setDocuments(JSON.parse(saved));
        } else {
          // Initialize clean empty knowledge base
          setDocuments([]);
          localStorage.setItem(LOCAL_STORAGE_DOCS, JSON.stringify([]));
        }
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  }

  function createSampleDocument() {
    const chunks = splitIntoChunks(SAMPLE_ONAM_NOTICE);
    return {
      id: 'doc-onam-sample-01',
      name: 'Onam_Celebration_Notice.pdf',
      file_path: 'campus-documents/Onam_Celebration_Notice.pdf',
      file_type: 'pdf',
      file_size: 14520,
      raw_content: SAMPLE_ONAM_NOTICE,
      status: 'Completed',
      created_at: new Date().toISOString(),
      chunks: chunks.map((c, i) => ({
        id: `chunk-onam-${i}`,
        chunk_index: c.chunk_index,
        content: c.content,
        page_number: c.page_number || 1,
        metadata: { pageNumber: c.page_number || 1 }
      }))
    };
  }

  /**
   * Upload and process a new document
   */
  async function uploadDocument(file) {
    const validation = validateDocumentFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const docId = 'doc-' + Date.now();
    const newDocPlaceholder = {
      id: docId,
      name: file.name,
      file_path: `campus-documents/${file.name}`,
      file_type: validation.extension,
      file_size: file.size,
      status: 'Uploading',
      created_at: new Date().toISOString()
    };

    // Update state to show Uploading immediately
    setDocuments(prev => [newDocPlaceholder, ...prev]);

    try {
      // 1. Upload original file to Supabase Storage if configured
      if (isSupabaseConfigured && supabase) {
        const filePath = `${user?.id || 'admin'}/${Date.now()}_${file.name}`;
        const { error: storageError } = await supabase.storage
          .from('campus-documents')
          .upload(filePath, file);

        if (storageError) {
          console.warn('Storage upload notice (bucket might need public/auth policy):', storageError.message);
        }
      }

      // 2. Mark Processing
      setDocuments(prev =>
        prev.map(d => d.id === docId ? { ...d, status: 'Processing' } : d)
      );

      // 3. Extract text and page metadata
      const extractionResult = await extractDocumentText(file);
      const extractedText = extractionResult.text || String(extractionResult);

      // 4. Chunk text with page number stamps
      const rawChunks = splitIntoChunks(extractionResult);

      // 5. Store in Supabase or LocalStorage
      if (isSupabaseConfigured && supabase) {
        const { data: insertedDoc, error: insertDocErr } = await supabase
          .from('documents')
          .insert([
            {
              uploaded_by: user?.id,
              name: file.name,
              file_path: `campus-documents/${file.name}`,
              file_type: validation.extension,
              file_size: file.size,
              raw_content: extractedText,
              status: 'Completed'
            }
          ])
          .select()
          .single();

        if (insertDocErr) throw insertDocErr;

        // Insert chunks with metadata
        const chunksToInsert = rawChunks.map(c => ({
          document_id: insertedDoc.id,
          chunk_index: c.chunk_index,
          content: c.content,
          metadata: { pageNumber: c.page_number || 1 }
        }));

        await supabase.from('document_chunks').insert(chunksToInsert);

        // Refresh
        await fetchDocuments();
      } else {
        // Save in LocalStorage
        const completedDoc = {
          ...newDocPlaceholder,
          status: 'Completed',
          raw_content: extractedText,
          chunks: rawChunks.map((c, i) => ({
            id: `chunk-${docId}-${i}`,
            chunk_index: c.chunk_index,
            content: c.content,
            page_number: c.page_number || 1,
            metadata: { pageNumber: c.page_number || 1 }
          }))
        };

        const updatedDocs = [completedDoc, ...documents.filter(d => d.id !== docId)];
        setDocuments(updatedDocs);
        localStorage.setItem(LOCAL_STORAGE_DOCS, JSON.stringify(updatedDocs));
      }

      return true;
    } catch (err) {
      console.error('Document processing failed:', err);
      // Mark Failed
      const failedDoc = {
        ...newDocPlaceholder,
        status: 'Failed',
        error_message: err.message
      };

      setDocuments(prev =>
        prev.map(d => d.id === docId ? failedDoc : d)
      );

      if (!isSupabaseConfigured) {
        const updatedDocs = [failedDoc, ...documents.filter(d => d.id !== docId)];
        localStorage.setItem(LOCAL_STORAGE_DOCS, JSON.stringify(updatedDocs));
      }

      throw err;
    }
  }

  /**
   * Delete a document
   */
  async function deleteDocument(docId) {
    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase
          .from('documents')
          .delete()
          .eq('id', docId);

        if (error) throw error;
      }

      const updated = documents.filter(d => d.id !== docId);
      setDocuments(updated);
      if (!isSupabaseConfigured) {
        localStorage.setItem(LOCAL_STORAGE_DOCS, JSON.stringify(updated));
      }
    } catch (err) {
      console.error('Delete document failed:', err);
      throw err;
    }
  }

  /**
   * Delete multiple documents in batch
   */
  async function deleteMultipleDocuments(docIds) {
    if (!docIds || docIds.length === 0) return;
    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase
          .from('documents')
          .delete()
          .in('id', docIds);

        if (error) throw error;
      }

      const updated = documents.filter(d => !docIds.includes(d.id));
      setDocuments(updated);
      if (!isSupabaseConfigured) {
        localStorage.setItem(LOCAL_STORAGE_DOCS, JSON.stringify(updated));
      }
    } catch (err) {
      console.error('Batch delete failed:', err);
      throw err;
    }
  }

  /**
   * Clear ALL documents (Delete all previous files from knowledge base)
   */
  async function clearAllDocuments() {
    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase
          .from('documents')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');

        if (error) throw error;
      }

      setDocuments([]);
      if (!isSupabaseConfigured) {
        localStorage.setItem(LOCAL_STORAGE_DOCS, JSON.stringify([]));
      }
    } catch (err) {
      console.error('Clear all documents failed:', err);
      throw err;
    }
  }

  /**
   * Reset / Seed Sample Document
   */
  function seedSampleNotice() {
    const sample = createSampleDocument();
    // remove existing if any
    const filtered = documents.filter(d => d.name !== sample.name);
    const updated = [sample, ...filtered];
    setDocuments(updated);
    if (!isSupabaseConfigured) {
      localStorage.setItem(LOCAL_STORAGE_DOCS, JSON.stringify(updated));
    }
    return sample;
  }

  // -------------------------------------------------------------
  // Student Chat and Conversations Management
  // -------------------------------------------------------------

  async function fetchConversations() {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase
        .from('conversations')
        .select('*')
        .eq('student_id', user.id)
        .order('updated_at', { ascending: false });

      if (data && data.length > 0) {
        setConversations(data);
        setActiveConversationId(data[0].id);
        fetchMessages(data[0].id);
      } else {
        startNewChat();
      }
    } else {
      const saved = JSON.parse(localStorage.getItem(LOCAL_STORAGE_CONVERSATIONS) || '[]');
      const userConvs = saved.filter(c => c.student_id === user?.id);
      if (userConvs.length > 0) {
        setConversations(userConvs);
        setActiveConversationId(userConvs[0].id);
        setMessages(userConvs[0].messages || []);
      } else {
        startNewChat();
      }
    }
  }

  async function fetchMessages(convId) {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      setMessages(data || []);
    }
  }

  function startNewChat() {
    const newConvId = 'conv-' + Date.now();
    const newConv = {
      id: newConvId,
      student_id: user?.id,
      title: 'New Campus Query',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      messages: []
    };

    setActiveConversationId(newConvId);
    setMessages([]);
    setConversations(prev => [newConv, ...prev.filter(c => c.id !== newConvId)]);

    if (!isSupabaseConfigured) {
      const saved = JSON.parse(localStorage.getItem(LOCAL_STORAGE_CONVERSATIONS) || '[]');
      localStorage.setItem(LOCAL_STORAGE_CONVERSATIONS, JSON.stringify([newConv, ...saved]));
    }
  }

  function selectConversation(convId) {
    setActiveConversationId(convId);
    if (isSupabaseConfigured && supabase) {
      fetchMessages(convId);
    } else {
      const saved = JSON.parse(localStorage.getItem(LOCAL_STORAGE_CONVERSATIONS) || '[]');
      const found = saved.find(c => c.id === convId);
      if (found) {
        setMessages(found.messages || []);
      }
    }
  }

  /**
   * Delete an individual conversation
   */
  async function deleteConversation(convId) {
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.from('conversations').delete().eq('id', convId);
      }

      const updated = conversations.filter(c => c.id !== convId);
      setConversations(updated);

      if (!isSupabaseConfigured) {
        const saved = JSON.parse(localStorage.getItem(LOCAL_STORAGE_CONVERSATIONS) || '[]');
        const filtered = saved.filter(c => c.id !== convId);
        localStorage.setItem(LOCAL_STORAGE_CONVERSATIONS, JSON.stringify(filtered));
      }

      if (activeConversationId === convId) {
        if (updated.length > 0) {
          selectConversation(updated[0].id);
        } else {
          startNewChat();
        }
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  }

  /**
   * Clear all conversations for current student
   */
  async function clearAllConversations() {
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.from('conversations').delete().eq('student_id', user.id);
      }

      setConversations([]);
      setMessages([]);

      if (!isSupabaseConfigured) {
        const saved = JSON.parse(localStorage.getItem(LOCAL_STORAGE_CONVERSATIONS) || '[]');
        const filtered = saved.filter(c => c.student_id !== user?.id);
        localStorage.setItem(LOCAL_STORAGE_CONVERSATIONS, JSON.stringify(filtered));
      }

      startNewChat();
    } catch (err) {
      console.error('Failed to clear conversations:', err);
    }
  }

  /**
   * Clear current chat messages
   */
  function clearCurrentChat() {
    setMessages([]);
    if (!isSupabaseConfigured) {
      const saved = JSON.parse(localStorage.getItem(LOCAL_STORAGE_CONVERSATIONS) || '[]');
      const updated = saved.map(c => {
        if (c.id === activeConversationId) {
          return { ...c, messages: [] };
        }
        return c;
      });
      localStorage.setItem(LOCAL_STORAGE_CONVERSATIONS, JSON.stringify(updated));
    }
  }

  /**
   * Send question and trigger document retrieval engine
   */
  async function sendStudentMessage(questionText) {
    if (!questionText.trim()) return;

    const userMsg = {
      id: 'msg-user-' + Date.now(),
      sender: 'user',
      content: questionText.trim(),
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsAnswering(true);

    try {
      // Run local document retrieval engine across verified documents
      const result = await answerQuestion(questionText, documents);

      const botMsg = {
        id: 'msg-bot-' + Date.now(),
        sender: 'assistant',
        content: result.answer,
        sources: result.sources || [],
        confidence: result.confidence,
        created_at: new Date().toISOString()
      };

      setMessages(prev => {
        const next = [...prev, botMsg];
        // Save conversation state
        saveConversationMessages(activeConversationId, next, questionText);
        return next;
      });
    } catch (err) {
      console.error('Answer retrieval error:', err);
      const errMsg = {
        id: 'msg-err-' + Date.now(),
        sender: 'assistant',
        content: "An error occurred while analyzing campus documents. Please try again or ask the college helpdesk.",
        sources: [],
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsAnswering(false);
    }
  }

  function saveConversationMessages(convId, allMsgs, firstQuestion = '') {
    if (isSupabaseConfigured && supabase) {
      // Insert user & assistant messages into Supabase messages table
      const lastTwo = allMsgs.slice(-2);
      for (const m of lastTwo) {
        supabase.from('messages').insert([
          {
            conversation_id: convId,
            sender: m.sender,
            content: m.content,
            sources: m.sources || []
          }
        ]).then();
      }
    } else {
      const saved = JSON.parse(localStorage.getItem(LOCAL_STORAGE_CONVERSATIONS) || '[]');
      const updated = saved.map(c => {
        if (c.id === convId) {
          return {
            ...c,
            title: c.title === 'New Campus Query' && firstQuestion ? firstQuestion.slice(0, 32) : c.title,
            messages: allMsgs,
            updated_at: new Date().toISOString()
          };
        }
        return c;
      });

      // If conv not found in saved, add it
      if (!saved.some(c => c.id === convId)) {
        updated.unshift({
          id: convId,
          student_id: user?.id,
          title: firstQuestion ? firstQuestion.slice(0, 32) : 'Campus Query',
          messages: allMsgs,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }

      localStorage.setItem(LOCAL_STORAGE_CONVERSATIONS, JSON.stringify(updated));
      setConversations(updated.filter(c => c.student_id === user?.id));
    }
  }

  return (
    <DocumentContext.Provider
      value={{
        documents,
        loading,
        uploadDocument,
        deleteDocument,
        deleteMultipleDocuments,
        clearAllDocuments,
        seedSampleNotice,
        conversations,
        activeConversationId,
        messages,
        isAnswering,
        sendStudentMessage,
        startNewChat,
        selectConversation,
        deleteConversation,
        clearAllConversations,
        clearCurrentChat
      }}
    >
      {children}
    </DocumentContext.Provider>
  );
}

export function useDocuments() {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error('useDocuments must be used within a DocumentProvider');
  }
  return context;
}
