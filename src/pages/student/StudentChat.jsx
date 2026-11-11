import React, { useState, useRef, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import { useDocuments } from '../../context/DocumentContext';
import { 
  Bot, 
  User, 
  Send, 
  PlusCircle, 
  FileText, 
  Sparkles, 
  MessageSquare, 
  Clock, 
  ChevronRight,
  Trash2,
  RotateCcw
} from 'lucide-react';

export default function StudentChat() {
  const { user } = useAuth();
  const { 
    documents, 
    messages, 
    isAnswering, 
    sendStudentMessage, 
    startNewChat, 
    conversations, 
    activeConversationId, 
    selectConversation,
    deleteConversation,
    clearAllConversations,
    clearCurrentChat
  } = useDocuments();

  const [inputQuestion, setInputQuestion] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAnswering]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputQuestion.trim() || isAnswering) return;
    const q = inputQuestion;
    setInputQuestion('');
    sendStudentMessage(q);
  };

  const handleQuickPrompt = (promptText) => {
    if (isAnswering) return;
    setInputQuestion('');
    sendStudentMessage(promptText);
  };

  const samplePrompts = [
    "When is the Onam celebration?",
    "What is the dress code?",
    "Where is the event held?",
    "What time should students report?"
  ];

  const activeDocumentsCount = documents.filter(d => d.status === 'Completed').length;

  const handleDeleteConv = (e, convId) => {
    e.stopPropagation();
    if (window.confirm("Delete this inquiry thread?")) {
      deleteConversation(convId);
    }
  };

  const handleClearAllHistory = () => {
    if (window.confirm("Are you sure you want to delete all your inquiry history?")) {
      clearAllConversations();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col h-screen overflow-hidden">
      <Navbar role="student" />

      <div className="flex-1 flex overflow-hidden max-w-7xl mx-auto w-full">
        
        {/* Left Sidebar: Conversations & Indexed Documents Status */}
        <aside className="w-72 bg-white border-r border-slate-200 hidden md:flex flex-col justify-between">
          
          <div className="p-4 flex flex-col flex-1 overflow-hidden">
            
            {/* New Chat Button */}
            <button
              onClick={startNewChat}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-xs text-white bg-academic-600 hover:bg-academic-700 shadow-md shadow-academic-600/20 transition-all mb-4"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Start New Inquiry</span>
            </button>

            {/* Conversation History */}
            <div className="flex-1 overflow-y-auto">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Recent Inquiries
                </span>
                {conversations.length > 0 && (
                  <button
                    onClick={handleClearAllHistory}
                    className="text-[10px] text-rose-500 hover:text-rose-700 underline font-medium"
                    title="Clear all chat history"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div className="space-y-1">
                {conversations.map((conv) => {
                  const isActive = conv.id === activeConversationId;
                  return (
                    <div
                      key={conv.id}
                      onClick={() => selectConversation(conv.id)}
                      className={`
                        w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center justify-between gap-2 transition-all cursor-pointer group
                        ${isActive
                          ? 'bg-academic-50 text-academic-900 font-semibold border border-academic-200'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }
                      `}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-academic-600' : 'text-slate-400'}`} />
                        <span className="truncate">{conv.title || 'Campus Inquiry'}</span>
                      </div>
                      <button
                        onClick={(e) => handleDeleteConv(e, conv.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition"
                        title="Delete this inquiry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Knowledge Base Status (Read-Only) */}
            <div className="pt-4 border-t border-slate-100 mt-2">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <FileText className="w-3.5 h-3.5 text-academic-600" />
                    <span>Knowledge Base</span>
                  </div>
                  <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${activeDocumentsCount > 0 ? 'bg-academic-100 text-academic-700' : 'bg-slate-200 text-slate-600'}`}>
                    {activeDocumentsCount} active
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  {activeDocumentsCount > 0 
                    ? 'Answers are grounded in circulars uploaded by college administration.'
                    : 'No documents uploaded yet. Ask admin to upload notices.'}
                </p>
              </div>
            </div>

          </div>

          {/* Student Footer info */}
          <div className="p-3 border-t border-slate-100 text-[11px] text-slate-400 text-center">
            Role: Enrolled Student • Document Access
          </div>

        </aside>

        {/* Right Main Chat Area */}
        <main className="flex-1 flex flex-col bg-slate-50 relative overflow-hidden">
          
          {/* Optional Chat Header with Clear Messages Option */}
          {messages.length > 0 && (
            <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium text-slate-700">
                {conversations.find(c => c.id === activeConversationId)?.title || 'Campus Inquiry'}
              </span>
              <button
                onClick={clearCurrentChat}
                className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-rose-600 font-medium transition"
                title="Clear messages in this conversation"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear Messages</span>
              </button>
            </div>
          )}

          {/* Chat Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
            
            {/* Initial Welcome Banner if no messages */}
            {messages.length === 0 && (
              <div className="max-w-2xl mx-auto py-8 sm:py-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-academic-500/10 border border-academic-200 flex items-center justify-center text-academic-600 mx-auto mb-4">
                  <Bot className="w-8 h-8" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Hello, {user?.full_name || 'Student'}!
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
                  I can answer your questions regarding college notices, event dates, dress codes, schedules, and regulations.
                </p>

                {/* Quick Prompts */}
                <div className="mt-8 text-left max-w-lg mx-auto">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 text-center">
                    Sample Inquiries (Click to Ask)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {samplePrompts.map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQuickPrompt(prompt)}
                        className="text-left p-3 rounded-xl bg-white border border-slate-200 hover:border-academic-400 hover:bg-academic-50/50 text-xs font-medium text-slate-700 transition shadow-sm flex items-center justify-between group"
                      >
                        <span className="truncate">{prompt}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-academic-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* Rendered Messages */}
            {messages.map((msg) => {
              const isBot = msg.sender === 'assistant';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 sm:gap-4 max-w-3xl ${isBot ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
                >
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-xs font-bold shadow-sm ${
                    isBot ? 'bg-academic-600' : 'bg-slate-700'
                  }`}>
                    {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>

                  {/* Message Bubble Content */}
                  <div className={`flex flex-col ${isBot ? 'items-start' : 'items-end'} max-w-[85%]`}>
                    
                    <div className={`rounded-2xl px-4 py-3 text-sm shadow-sm leading-relaxed ${
                      isBot 
                        ? 'bg-white border border-slate-200 text-slate-800'
                        : 'bg-academic-600 text-white font-medium'
                    }`}>
                      {msg.content}
                    </div>

                    {/* Source Citations for Assistant Responses */}
                    {isBot && msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-400">Source:</span>
                        {msg.sources.map((src, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-medium"
                          >
                            <FileText className="w-3 h-3 text-academic-600" />
                            <span>{src.document_name}</span>
                            {src.page_number && (
                              <span className="text-slate-500 font-medium"> (Page {src.page_number})</span>
                            )}
                          </span>
                        ))}
                      </div>
                    )}

                    <span className="text-[10px] text-slate-400 mt-1 px-1">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>

                  </div>
                </div>
              );
            })}

            {/* Answering / Thinking Loading Indicator */}
            {isAnswering && (
              <div className="flex gap-3 max-w-2xl mr-auto">
                <div className="w-8 h-8 rounded-xl bg-academic-600 flex items-center justify-center text-white text-xs flex-shrink-0 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 flex items-center gap-2 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-academic-500 animate-bounce"></span>
                  <span className="w-2 h-2 rounded-full bg-academic-500 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-2 h-2 rounded-full bg-academic-500 animate-bounce [animation-delay:0.4s]"></span>
                  <span className="text-xs text-slate-500 font-medium ml-1">
                    Searching verified campus notices...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Fixed Bottom Input Area */}
          <div className="border-t border-slate-200 bg-white p-3 sm:p-4">
            <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputQuestion}
                onChange={(e) => setInputQuestion(e.target.value)}
                placeholder="Ask about event dates, dress code, venue, or circular instructions..."
                disabled={isAnswering}
                className="flex-1 py-3 px-4 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-academic-500/20 focus:border-academic-500 transition-colors disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputQuestion.trim() || isAnswering}
                className="p-3 rounded-xl bg-academic-600 hover:bg-academic-700 text-white font-semibold transition-all shadow-md shadow-academic-600/20 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                title="Send inquiry"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <p className="text-[11px] text-slate-400 text-center mt-2">
              Campus AI retrieves information exclusively from official documents uploaded by the administration.
            </p>
          </div>

        </main>

      </div>

    </div>
  );
}
