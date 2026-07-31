/**
 * ConversationHistory
 * ===================
 * Shows past conversation sessions stored in localStorage.
 * Rendered as a collapsible panel on the right side of the chat page
 * on wide screens (hidden on mobile via CSS media query).
 *
 * Each session stores: { id, title, timestamp, messages[] }
 *
 * Props:
 *   sessions      — array of session objects
 *   activeId      — currently active session id
 *   onLoad(session) — called when user clicks a past session
 *   onDelete(id)    — called when user deletes a session
 *   onNew()         — called when user starts a new chat
 */

import { FaTrash, FaPlus, FaHistory } from "react-icons/fa";

function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function ConversationHistory({
  sessions = [],
  activeId,
  onLoad,
  onDelete,
  onNew,
}) {
  return (
    <aside
      className="chat-history-panel"
      aria-label="Conversation history"
      style={{
        width: "230px",
        flexShrink: 0,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "20px",
        padding: "18px 14px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        overflowY: "auto",
        maxHeight: "calc(100vh - 160px)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "rgba(255,255,255,0.6)", fontSize: "13px", fontWeight: 600 }}>
          <FaHistory size={12} />
          History
        </div>
        <button
          onClick={onNew}
          title="Start new chat"
          aria-label="Start new chat"
          style={{
            background: "rgba(123,47,247,0.18)",
            border: "1px solid rgba(123,47,247,0.3)",
            color: "#c4b5fd",
            borderRadius: "8px",
            padding: "5px 10px",
            cursor: "pointer",
            fontSize: "12px",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            fontFamily: "Outfit, sans-serif",
          }}
        >
          <FaPlus size={10} /> New
        </button>
      </div>

      {/* Session list */}
      {sessions.length === 0 ? (
        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", textAlign: "center", padding: "20px 0" }}>
          No past sessions
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {sessions.slice(0, 30).map((session) => {
            const isActive = session.id === activeId;
            return (
              <div
                key={session.id}
                style={{
                  background: isActive ? "rgba(123,47,247,0.18)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${isActive ? "rgba(123,47,247,0.35)" : "rgba(255,255,255,0.07)"}`,
                  borderRadius: "12px",
                  padding: "10px 12px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  transition: "all 0.2s",
                  position: "relative",
                }}
                onClick={() => onLoad(session)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && onLoad(session)}
                aria-label={`Load session: ${session.title}`}
                aria-current={isActive ? "true" : undefined}
              >
                <div style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.8)", fontWeight: 500, paddingRight: "20px" }}>
                  {session.title || "Untitled Chat"}
                </div>
                <div style={{ fontSize: "10.5px", color: "rgba(255,255,255,0.3)" }}>
                  {timeAgo(session.timestamp)} · {session.messages?.length || 0} msgs
                </div>

                {/* Delete */}
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(session.id); }}
                  title="Delete session"
                  aria-label={`Delete session: ${session.title}`}
                  style={{
                    position: "absolute",
                    top: "8px",
                    right: "8px",
                    background: "none",
                    border: "none",
                    color: "rgba(255,255,255,0.25)",
                    cursor: "pointer",
                    padding: "2px",
                    borderRadius: "4px",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#F72585")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.25)")}
                >
                  <FaTrash size={10} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
}
