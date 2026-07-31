/**
 * TypingIndicator
 * ===============
 * Three animated dots shown while the AI is generating a response.
 */
export default function TypingIndicator() {
  return (
    <div className="chat-message-row assistant">
      <div className="bubble-avatar">🤖</div>
      <div className="typing-indicator">
        <div className="typing-dots">
          <div className="typing-dot" />
          <div className="typing-dot" />
          <div className="typing-dot" />
        </div>
        <span className="typing-label">Finance X-Ray is thinking…</span>
      </div>
    </div>
  );
}
