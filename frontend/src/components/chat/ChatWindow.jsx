/**
 * ChatWindow
 * ==========
 * Renders the scrollable list of conversation messages.
 * Auto-scrolls to the latest message whenever messages change.
 *
 * Props:
 *   messages  — array of { id, role, content, timestamp, intent }
 *   isTyping  — bool: show the typing indicator
 *   onChipSelect(q) — forward chip click to parent
 */

import { useEffect, useRef } from "react";
import ChatBubble from "./ChatBubble";
import AILoader from "./AILoader";
import SuggestionChips from "./SuggestionChips";

export default function ChatWindow({ messages, isTyping, onChipSelect }) {
  const bottomRef = useRef(null);

  // Auto-scroll to bottom on new messages or typing change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const isEmpty = messages.length === 0;

  return (
    <div className="chat-window" role="log" aria-live="polite" aria-label="Conversation">
      {isEmpty ? (
        /* Welcome screen */
        <div className="chat-welcome">
          <div className="chat-welcome-icon">🤖</div>
          <h2>Hi, I&apos;m Finance X-Ray AI</h2>
          <p>
            Ask me anything about your finances — budget, spending, subscriptions,
            savings goals, or forecasts. I only use your actual data.
          </p>
        </div>
      ) : (
        /* Messages */
        messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))
      )}

      {/* Typing indicator */}
      {isTyping && <AILoader />}

      {/* Suggestion chips (shown when empty) */}
      {isEmpty && <SuggestionChips onSelect={onChipSelect} />}

      {/* Scroll anchor */}
      <div ref={bottomRef} />
    </div>
  );
}
