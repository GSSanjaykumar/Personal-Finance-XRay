import { useState, useCallback, useEffect, useRef } from "react";
import { sendChatMessage, uploadChatPdf } from "../api/chatApi";
import { Copy, Plus, Menu, Paperclip, X, Bot, Send, Trash2, Loader2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "finance_chat_sessions";

function uuid() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

function loadSessions() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveSessions(sessions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    // ignore
  }
}

function deriveTitle(messages) {
  const firstUser = messages.find((m) => m.role === "user");
  if (!firstUser) return "New Chat";
  return firstUser.content.slice(0, 30) + (firstUser.content.length > 30 ? "…" : "");
}

const SUGGESTIONS = [
  { icon: "💰", text: "How much did I spend this month?" },
  { icon: "📊", text: "What are my biggest spending categories?" },
  { icon: "🔍", text: "Analyze my recent transactions." },
  { icon: "📈", text: "How can I improve my savings?" },
];

export default function ChatAssistant() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(() => uuid());
  const [sessions, setSessions] = useState(loadSessions);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  }, [inputValue]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, uploadStatus]);

  useEffect(() => {
    if (messages.length === 0) return;

    const session = {
      id: sessionId,
      title: deriveTitle(messages),
      timestamp: new Date().toISOString(),
      messages,
    };

    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== sessionId);
      const updated = [session, ...filtered].slice(0, 30);
      saveSessions(updated);
      return updated;
    });
  }, [messages, sessionId]);

  const sendMessage = useCallback(async (text) => {
    const question = (text || inputValue).trim();
    if (!question || isTyping) return;

    setError(null);
    setInputValue("");
    const fileToUpload = selectedFile;
    setSelectedFile(null);
    setSidebarOpen(false);

    const userMsg = { id: uuid(), role: "user", content: question, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    const historyContext = messages.slice(-12).map((m) => ({ role: m.role, content: m.content }));

    try {
      let payloadMessage = question;
      if (fileToUpload) {
        setUploadStatus("Processing PDF attachment...");
        try {
          const extractedText = await uploadChatPdf(fileToUpload);
          payloadMessage = `[Attached PDF Content:\n${extractedText}]\n\nUser Question: ${question}`;
        } catch (uploadErr) {
          throw new Error(uploadErr.response?.data?.detail || "Failed to extract text from PDF");
        }
      }

      setUploadStatus("Analyzing finances...");
      const result = await sendChatMessage(payloadMessage, historyContext);
      
      const assistantMsg = {
        id: uuid(),
        role: "assistant",
        content: result.answer,
        timestamp: new Date().toISOString(),
        intent: result.intent,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error("Chat error:", err);
      setError(err?.response?.data?.detail || err.message || "Unable to reach Finance X-Ray AI. Please try again.");
      setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
    } finally {
      setIsTyping(false);
      setUploadStatus("");
    }
  }, [inputValue, isTyping, messages, selectedFile]);

  const handleClear = useCallback(() => {
    setMessages([]);
    setError(null);
    setSessionId(uuid());
    setSidebarOpen(false);
  }, []);

  const handleLoadSession = useCallback((session) => {
    setMessages(session.messages || []);
    setSessionId(session.id);
    setError(null);
    setSidebarOpen(false);
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isTyping && inputValue.trim()) sendMessage();
    }
  };

  return (
    <div className="flex h-full min-h-[calc(100vh-6rem)] w-full flex-col space-y-6 pb-6">
      
      <header className="flex shrink-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">AI Assistant</h1>
          <p className="mt-1.5 text-muted-foreground">Analyze your financial data and attached statements.</p>
        </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
        
        {/* Sidebar */}
        <div className={`absolute z-20 h-full w-64 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface-2)] transition-transform duration-300 md:relative md:flex ${sidebarOpen ? 'flex translate-x-0' : 'hidden -translate-x-full md:translate-x-0'}`}>
          <div className="flex items-center justify-between border-b border-[var(--border)] p-4">
            <span className="font-semibold tracking-tight text-foreground">Chat History</span>
            <button 
              onClick={handleClear}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
              title="New Chat"
            >
              <Plus className="size-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {sessions.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">No recent chats.</div>
            ) : (
              <div className="space-y-1">
                {sessions.map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleLoadSession(s)}
                    className={`w-full overflow-hidden text-ellipsis whitespace-nowrap rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                      s.id === sessionId ? "bg-[var(--accent)]/10 text-[var(--accent)] font-medium" : "text-muted-foreground hover:bg-[var(--surface-3)] hover:text-foreground"
                    }`}
                  >
                    {s.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex flex-1 flex-col bg-[var(--surface)] relative">
          
          {/* Mobile Overlay */}
          {sidebarOpen && (
            <div className="absolute inset-0 z-10 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />
          )}

          {/* Internal Chat Header */}
          <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface-2)]/50 px-4 py-2.5 shrink-0">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-[var(--surface-3)] md:hidden"
            >
              <Menu className="size-5" />
            </button>
            <div className="flex-1 md:hidden" />
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-[var(--negative-soft)] hover:text-[var(--negative)]"
            >
              <Trash2 className="size-3.5" />
              <span>Clear Chat</span>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center p-4 text-center">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-[var(--accent-soft)] border border-[var(--accent)]/20 shadow-[var(--shadow-lift)]"
                >
                  <Bot className="size-8 text-[var(--accent)]" />
                </motion.div>
                <h2 className="mb-2 text-xl font-semibold tracking-tight text-foreground">Hi, I'm Finance AI</h2>
                <p className="mb-8 max-w-md text-sm text-muted-foreground">
                  I can analyze your financial data and attached statements. Ask me anything to get started.
                </p>
                
                <div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
                  {SUGGESTIONS.map((s, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => sendMessage(s.text)}
                      className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-left shadow-[var(--shadow-card)] transition-colors hover:border-[var(--accent)]/50 hover:bg-[var(--surface-2)]"
                    >
                      <span className="text-xl">{s.icon}</span>
                      <span className="text-sm font-medium text-foreground leading-snug">{s.text}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mx-auto max-w-3xl space-y-6">
                <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div 
                    key={msg.id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`relative max-w-[90%] rounded-2xl px-5 py-4 text-sm shadow-sm md:max-w-[80%] ${
                      msg.role === "user" 
                        ? "bg-[var(--surface-3)] text-foreground rounded-br-sm border border-[var(--border)]" 
                        : "bg-[var(--accent-soft)] text-foreground rounded-bl-sm border border-[var(--accent)]/20"
                    }`}>
                      {msg.role === "assistant" && (
                        <div className="mb-3 flex items-center justify-between">
                          <span className="flex items-center gap-2 text-xs font-semibold text-[var(--accent)]">
                            <Bot className="size-4" />
                            Finance AI
                          </span>
                          {msg.intent && (
                            <span className="rounded-md bg-[var(--surface)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border border-[var(--border)]">
                              {msg.intent}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                      
                      {msg.role === "assistant" && (
                        <button 
                          onClick={() => navigator.clipboard.writeText(msg.content)}
                          className="absolute -right-3 -bottom-3 rounded-full border border-[var(--border)] bg-[var(--surface)] p-2 text-muted-foreground shadow-sm transition-colors hover:text-foreground hover:bg-[var(--surface-2)]"
                          title="Copy to clipboard"
                        >
                          <Copy className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
                </AnimatePresence>
                
                {isTyping && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex w-full justify-start">
                    <div className="flex max-w-[85%] flex-col gap-2 rounded-2xl rounded-bl-sm bg-[var(--accent-soft)] px-5 py-4 border border-[var(--accent)]/20 shadow-sm">
                        <div className="flex items-center gap-3">
                          <Bot className="size-4 text-[var(--accent)]" />
                          <div className="flex items-center gap-1.5">
                            <span className="size-1.5 animate-bounce rounded-full bg-[var(--accent)]" style={{ animationDelay: "0ms" }}></span>
                            <span className="size-1.5 animate-bounce rounded-full bg-[var(--accent)]" style={{ animationDelay: "150ms" }}></span>
                            <span className="size-1.5 animate-bounce rounded-full bg-[var(--accent)]" style={{ animationDelay: "300ms" }}></span>
                          </div>
                        </div>
                        {uploadStatus && (
                          <span className="text-[11px] font-medium text-[var(--accent)]">{uploadStatus}</span>
                        )}
                    </div>
                  </motion.div>
                )}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="shrink-0 border-t border-[var(--border)] bg-[var(--surface)] p-4 md:p-6">
            <div className="mx-auto max-w-3xl">
              <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-4 flex items-center gap-2 rounded-xl border border-[var(--negative)]/30 bg-[var(--negative-soft)] p-3 text-sm text-[var(--negative)]">
                  <AlertCircle className="size-4 shrink-0" />
                  <span className="flex-1">{error}</span>
                </motion.div>
              )}
              
              {selectedFile && (
                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="mb-3 inline-flex items-center gap-2 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-3 py-2 text-sm shadow-sm">
                  <span className="truncate max-w-[200px] font-medium text-foreground">{selectedFile.name}</span>
                  <span className="text-xs text-muted-foreground">({Math.round(selectedFile.size / 1024)} KB)</span>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="ml-1 flex size-5 items-center justify-center rounded-full bg-[var(--surface-3)] text-muted-foreground transition-colors hover:bg-[var(--negative-soft)] hover:text-[var(--negative)]"
                  >
                    <X className="size-3" />
                  </button>
                </motion.div>
              )}
              </AnimatePresence>

              <div className="relative flex items-end gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-[var(--shadow-card)] transition-colors focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent)]/20">
                
                <label className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-[var(--surface-2)] hover:text-foreground">
                  <Paperclip className="size-5" />
                  <input 
                    type="file" 
                    accept="application/pdf" 
                    className="hidden" 
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setSelectedFile(e.target.files[0]);
                      }
                      e.target.value = '';
                    }} 
                  />
                </label>

                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message Finance AI..."
                  disabled={isTyping}
                  rows={1}
                  className="max-h-32 min-h-[40px] w-full resize-none bg-transparent px-2 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-50"
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={isTyping || !inputValue.trim()}
                  className="mb-0.5 mr-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] text-white shadow-sm transition-all hover:bg-[var(--accent)]/90 disabled:opacity-50 disabled:hover:bg-[var(--accent)]"
                >
                  {isTyping ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4 -ml-0.5" />}
                </button>
              </div>
              <p className="mt-3 text-center text-[11px] font-medium text-muted-foreground">
                AI can make mistakes. Verify important financial information.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
