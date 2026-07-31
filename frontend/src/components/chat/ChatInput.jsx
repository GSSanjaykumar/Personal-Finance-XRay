/**
 * ChatInput
 * =========
 * Sticky input bar at the bottom of the chat window.
 *
 * Features:
 * - Auto-growing textarea (up to 5 lines)
 * - Send on Enter (Shift+Enter for newline)
 * - Disabled while AI is responding
 * - Quick Actions row above the input
 *
 * Props:
 *   value(string)           — controlled input value
 *   onChange(e)             — input change handler
 *   onSend()                — called to submit the message
 *   onQuickAction(question) — called when a quick action button is clicked
 *   disabled(bool)          — disables input & send button while loading
 */

import { useRef, useEffect } from "react";
import { FaPaperPlane } from "react-icons/fa";
import QuickActions from "./QuickActions";

export default function ChatInput({ value, onChange, onSend, onQuickAction, disabled }) {
  const textareaRef = useRef(null);

  // Auto-grow textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 140) + "px";
  }, [value]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) {
        onSend();
      }
    }
  };

  return (
    <div className="chat-input-area">
      {/* Quick Actions */}
      <div style={{ marginBottom: "10px" }}>
        <QuickActions onSelect={onQuickAction} />
      </div>

      {/* Input row */}
      <div className="chat-input-row">
        <div className="chat-input-wrapper">
          <textarea
            id="chat-message-input"
            ref={textareaRef}
            className="chat-input"
            value={value}
            onChange={onChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask me about your finances… (Enter to send, Shift+Enter for newline)"
            disabled={disabled}
            rows={1}
            aria-label="Type your financial question"
            autoComplete="off"
          />
        </div>

        <button
          id="chat-send-btn"
          className="chat-send-btn"
          onClick={onSend}
          disabled={disabled || !value.trim()}
          aria-label="Send message"
          title="Send message"
        >
          <FaPaperPlane size={16} />
        </button>
      </div>

      {/* Hint */}
      <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.2)", textAlign: "center", marginTop: "8px" }}>
        Finance X-Ray AI · Answers grounded in your actual data · Not financial advice
      </p>
    </div>
  );
}
