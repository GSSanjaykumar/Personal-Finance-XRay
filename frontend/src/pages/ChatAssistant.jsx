/**
 * ChatAssistant — AI Financial Assistant Page
 * ============================================
 * Full-page chat interface accessible at /chat.
 *
 * Architecture:
 *   User → ChatInput → sendChatMessage() → POST /chat
 *        ← answer + intent ← chat_service (intent_classifier → financial_context → Gemini)
 *
 * State:
 *   messages[]      — current conversation (user + assistant turns)
 *   inputValue      — controlled textarea value
 *   isTyping        — show typing indicator
 *   error           — error message string | null
 *   sessions[]      — past sessions from localStorage
 *   sessionId       — current session UUID
 *
 * Features:
 *   ✓ Conversation memory (history passed to backend per request)
 *   ✓ Suggestion chips on welcome screen
 *   ✓ Quick action buttons
 *   ✓ Typing indicator
 *   ✓ Copy response to clipboard
 *   ✓ Intent badge on each assistant reply
 *   ✓ Clear chat
 *   ✓ Session history (localStorage) with load / delete
 *   ✓ Auto-scroll to latest message
 *   ✓ Error handling with retry
 */

import { useState, useCallback, useEffect } from "react";
import { FaTrash, FaRobot } from "react-icons/fa";

import Navbar from "../components/layout/Navbar";
import ChatWindow from "../components/chat/ChatWindow";
import ChatInput from "../components/chat/ChatInput";
import ConversationHistory from "../components/chat/ConversationHistory";

import { sendChatMessage } from "../api/chatApi";
import "../styles/chat.css";

// ── Helpers ───────────────────────────────────────────────────────────────────
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
    // localStorage may be unavailable
  }
}

function deriveTitle(messages) {
  const firstUser = messages.find((m) => m.role === "user");
  if (!firstUser) return "New Chat";
  return firstUser.content.slice(0, 45) + (firstUser.content.length > 45 ? "…" : "");
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ChatAssistant() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(() => uuid());
  const [sessions, setSessions] = useState(loadSessions);
  const [dynamicChips, setDynamicChips] = useState([]);

  // Persist current session whenever messages change
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

  // ── Send message ────────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (text) => {
      const question = (text || inputValue).trim();
      if (!question || isTyping) return;

      setError(null);
      setInputValue("");

      // Append user bubble immediately
      const userMsg = {
        id: uuid(),
        role: "user",
        content: question,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsTyping(true);

      // Build history for the API (last 6 assistant/user turns excluding current)
      const historyForApi = messages
        .slice(-12)
        .map((m) => ({ role: m.role, content: m.content }));

      try {
        const result = await sendChatMessage(question, historyForApi);

        const assistantMsg = {
          id: uuid(),
          role: "assistant",
          content: result.answer,
          timestamp: new Date().toISOString(),
          intent: result.intent,
          confidence: result.confidence,
          reasoning: result.reasoning,
          recommendations: result.recommendations,
          widgets: result.widgets,
          provider_metadata: result.provider_metadata,
        };

        setMessages((prev) => [...prev, assistantMsg]);
        setDynamicChips(result.follow_up_questions || []);
      } catch (err) {
        console.error("Chat error:", err);
        setError(
          err?.response?.data?.detail ||
            "Unable to reach Finance X-Ray AI. Please try again."
        );
        // Remove the optimistic user bubble so user can retry
        setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
      } finally {
        setIsTyping(false);
      }
    },
    [inputValue, isTyping, messages]
  );

  // ── Clear chat ───────────────────────────────────────────────────────────────
  const handleClear = useCallback(() => {
    setMessages([]);
    setError(null);
    setDynamicChips([]);
    setSessionId(uuid());
  }, []);

  // ── Load session ─────────────────────────────────────────────────────────────
  const handleLoadSession = useCallback((session) => {
    setMessages(session.messages || []);
    setSessionId(session.id);
    setError(null);
    setDynamicChips([]);
  }, []);

  // ── Delete session ────────────────────────────────────────────────────────────
  const handleDeleteSession = useCallback((id) => {
    setSessions((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      saveSessions(updated);
      return updated;
    });
    if (id === sessionId) handleClear();
  }, [sessionId, handleClear]);

  // ── Quick action / chip select ────────────────────────────────────────────────
  const handleChipSelect = useCallback(
    (question) => {
      sendMessage(question);
    },
    [sendMessage]
  );

  // ── Input change ─────────────────────────────────────────────────────────────
  const handleInputChange = (e) => setInputValue(e.target.value);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      <Navbar />

      {/* Page Header */}
      <div className="chat-page-header" style={{ marginTop: "4px" }}>
        <div className="chat-page-title">
          <div className="chat-avatar-icon">
            <FaRobot size={20} color="white" />
          </div>
          <div>
            <h1>AI Financial Assistant</h1>
            <p className="chat-page-subtitle">
              Powered by Gemini · Grounded in your financial data
            </p>
          </div>
        </div>

        <div className="chat-header-actions">
          <button
            id="chat-clear-btn"
            className="chat-clear-btn"
            onClick={handleClear}
            aria-label="Clear conversation"
            title="Clear conversation"
          >
            <FaTrash size={11} />
            Clear Chat
          </button>
        </div>
      </div>

      {/* Main layout: History panel + Chat body */}
      <div
        style={{
          display: "flex",
          gap: "20px",
          flex: 1,
          minHeight: 0,
          height: "calc(100vh - 160px)",
        }}
      >
        {/* Conversation History Sidebar (hidden below 1024px via CSS) */}
        <div
          style={{
            display: "none",
          }}
          className="chat-history-wrapper"
        >
          <ConversationHistory
            sessions={sessions}
            activeId={sessionId}
            onLoad={handleLoadSession}
            onDelete={handleDeleteSession}
            onNew={handleClear}
          />
        </div>

        {/* Chat Body */}
        <div className="chat-body" style={{ flex: 1, minWidth: 0 }}>
          {/* Suggestion chips (always visible above messages when empty) */}
          {messages.length === 0 && (
            <div style={{ padding: "16px 16px 0" }}>
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  flexWrap: "wrap",
                }}
              >
                {[
                  "📊 Summarize my finances",
                  "🛍️ Where am I overspending?",
                  "🔁 Show my subscriptions",
                  "❤️ How healthy are my finances?",
                  "💻 Can I afford a ₹1,20,000 laptop?",
                  "🔮 Show my spending forecast",
                ].map((q) => (
                  <button
                    key={q}
                    className="suggestion-chip"
                    onClick={() => handleChipSelect(q.replace(/^[^\s]+\s/, ""))}
                    aria-label={`Ask: ${q}`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error toast */}
          {error && (
            <div className="chat-error-toast" role="alert">
              ⚠️ {error}
              <button
                onClick={() => setError(null)}
                style={{
                  marginLeft: "auto",
                  background: "none",
                  border: "none",
                  color: "inherit",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
                aria-label="Dismiss error"
              >
                ✕
              </button>
            </div>
          )}

          {/* Chat Window */}
          <ChatWindow
            messages={messages}
            isTyping={isTyping}
            onChipSelect={handleChipSelect}
          />

          {/* Dynamic Follow-up Chips */}
          {dynamicChips.length > 0 && messages.length > 0 && !isTyping && (
            <div className="dynamic-chips-row">
              {dynamicChips.map((q, i) => (
                <button
                  key={i}
                  className="dynamic-chip"
                  onClick={() => handleChipSelect(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input Bar */}
          <ChatInput
            value={inputValue}
            onChange={handleInputChange}
            onSend={() => sendMessage()}
            onQuickAction={handleChipSelect}
            disabled={isTyping}
          />
        </div>
      </div>
    </>
  );
}
