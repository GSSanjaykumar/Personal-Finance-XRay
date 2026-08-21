import { useState, useCallback, useEffect, useRef } from "react";
import { FaTrash, FaRobot, FaPaperPlane } from "react-icons/fa";
import { sendChatMessage, uploadChatPdf } from "../api/chatApi";
import { Copy, Plus, Menu, Paperclip, X } from "lucide-react";

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
  { icon: "📊", text: "Summarize my finances" },
  { icon: "🛍️", text: "Where am I overspending?" },
  { icon: "🔁", text: "Show my subscriptions" },
  { icon: "❤️", text: "How healthy are my finances?" },
  { icon: "💻", text: "Can I afford a ₹10,000 laptop?" },
  { icon: "🔮", text: "Show my spending forecast" },
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
  
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-grow textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  }, [inputValue]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

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
    setSelectedFile(null);
    setError(null);
    setSidebarOpen(false); // Close sidebar on mobile

    const userMsg = { id: uuid(), role: "user", content: question, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    const historyContext = messages.slice(-12).map((m) => ({ role: m.role, content: m.content }));

    try {
      let payloadMessage = question;
      if (selectedFile) {
        // Only append text if there is actually a selected file
        try {
          const extractedText = await uploadChatPdf(selectedFile);
          payloadMessage = `[Attached PDF Content:\n${extractedText}]\n\nUser Question: ${question}`;
        } catch (uploadErr) {
          throw new Error(uploadErr.response?.data?.detail || "Failed to extract text from PDF");
        }
      }

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
      setError(err?.response?.data?.detail || "Unable to reach Finance X-Ray AI. Please try again.");
      setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
    } finally {
      setIsTyping(false);
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
      if (!isTyping && (inputValue.trim() || selectedFile)) sendMessage();
    }
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
      
      {/* Sidebar for chat history */}
      <div className={`absolute z-10 h-full w-64 flex-col border-r border-[var(--border)] bg-[var(--surface-2)] transition-transform duration-300 md:relative md:flex ${sidebarOpen ? 'flex translate-x-0' : 'hidden -translate-x-full md:translate-x-0'}`}>
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <span className="font-semibold tracking-tight text-foreground">Chat History</span>
          <button 
            onClick={handleClear}
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-[var(--surface-3)] hover:text-foreground"
            title="New Chat"
          >
            <Plus className="size-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
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
      <div className="flex flex-1 flex-col bg-[var(--surface)]">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-[var(--surface-2)] md:hidden"
            >
              <Menu className="size-5" />
            </button>
            <div className="flex size-8 items-center justify-center rounded-lg bg-[var(--accent)]">
              <FaRobot className="size-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-foreground">AI Assistant</h1>
              <p className="text-xs text-muted-foreground">Powered by Gemini • Grounded in your financial data</p>
            </div>
          </div>
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--negative)]"
          >
            <FaTrash className="size-3" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </header>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-[var(--surface-2)] shadow-[var(--shadow-lift)]">
                <FaRobot className="size-8 text-[var(--accent)]" />
              </div>
              <h2 className="mb-2 text-xl font-semibold tracking-tight text-foreground">Hi, I'm Finance X-Ray AI</h2>
              <p className="mb-8 max-w-md text-sm text-muted-foreground">
                Ask me anything about your finances — budget, spending, subscriptions, savings goals, or forecasts.
              </p>
              
              <div className="grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(s.text)}
                    className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-left transition-colors hover:border-[var(--accent-soft)] hover:bg-[var(--surface-3)]"
                  >
                    <span className="text-lg">{s.icon}</span>
                    <span className="text-sm font-medium text-foreground">{s.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-6">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`relative max-w-[85%] rounded-2xl px-5 py-3.5 text-sm shadow-sm sm:max-w-[75%] ${
                    msg.role === "user" 
                      ? "bg-[var(--surface-3)] text-foreground rounded-br-sm" 
                      : "bg-[var(--accent-soft)]/20 border border-[var(--accent)]/10 text-foreground rounded-bl-sm"
                  }`}>
                    {msg.role === "assistant" && (
                      <div className="mb-2 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)]">
                          <FaRobot className="size-3" />
                          Finance AI
                        </span>
                        {msg.intent && (
                          <span className="rounded-md bg-[var(--surface)] px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground border border-[var(--border)]">
                            {msg.intent}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                    
                    {msg.role === "assistant" && (
                      <button 
                        onClick={() => navigator.clipboard.writeText(msg.content)}
                        className="absolute -right-8 bottom-0 p-1.5 text-muted-foreground hover:text-foreground"
                        title="Copy to clipboard"
                      >
                        <Copy className="size-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex w-full justify-start">
                  <div className="flex max-w-[85%] items-center gap-2 rounded-2xl rounded-bl-sm bg-[var(--accent-soft)]/20 px-5 py-4 border border-[var(--accent)]/10">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)]">
                      <FaRobot className="size-3" />
                      <div className="flex items-center gap-1">
                        <span className="size-1.5 animate-bounce rounded-full bg-[var(--accent)]" style={{ animationDelay: "0ms" }}></span>
                        <span className="size-1.5 animate-bounce rounded-full bg-[var(--accent)]" style={{ animationDelay: "150ms" }}></span>
                        <span className="size-1.5 animate-bounce rounded-full bg-[var(--accent)]" style={{ animationDelay: "300ms" }}></span>
                      </div>
                    </span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 md:px-6 md:pb-6">
          <div className="mx-auto max-w-3xl">
            {error && (
              <div className="mb-4 rounded-xl border border-[var(--negative)]/30 bg-[var(--negative-soft)] p-3 text-sm text-[var(--negative)]">
                {error}
              </div>
            )}
            
            {selectedFile && (
              <div className="mb-2 inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-sm shadow-sm">
                <span className="truncate max-w-[200px] font-medium text-foreground">{selectedFile.name}</span>
                <span className="text-xs text-muted-foreground">({Math.round(selectedFile.size / 1024)} KB)</span>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="ml-1 rounded-full p-0.5 text-muted-foreground hover:bg-[var(--surface-3)] hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>
            )}

            <div className="relative flex items-end gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-1.5 shadow-sm focus-within:border-[var(--accent)] focus-within:ring-1 focus-within:ring-[var(--accent)]">
              
              <label className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-[var(--surface-3)] hover:text-foreground">
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
                className="max-h-32 min-h-[44px] w-full resize-none bg-transparent px-3 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              <button
                onClick={() => sendMessage()}
                disabled={isTyping || !inputValue.trim()}
                className="mb-1 mr-1 flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)] text-white transition-colors hover:bg-[var(--accent)]/90 disabled:opacity-50"
              >
                <FaPaperPlane className="size-3.5" />
              </button>
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              AI can make mistakes. Verify important financial information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
