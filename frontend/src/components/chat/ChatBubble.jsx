/**
 * ChatBubble
 * ==========
 * Renders a single conversation message (user or assistant).
 *
 * Features:
 * - Right-aligned gradient bubble for user messages.
 * - Left-aligned glass card for assistant messages.
 * - Lightweight inline markdown rendering (bold, italic, code, bullets, headings, hr).
 * - Copy button (appears on hover for assistant messages).
 * - Timestamp display.
 * - Intent badge under assistant messages.
 */

import { useState } from "react";
import { FaCopy, FaCheck, FaLightbulb, FaInfoCircle, FaShieldAlt, FaDatabase } from "react-icons/fa";
import ChatWidget from "./ChatWidget";

// ── Lightweight Markdown Renderer ──────────────────────────────────────────────
function renderMarkdown(text) {
  if (!text) return null;

  // Split on double newlines (paragraphs) and single newlines
  const lines = text.split("\n");
  const elements = [];
  let ulBuffer = [];
  let key = 0;

  const flushList = () => {
    if (ulBuffer.length > 0) {
      elements.push(
        <ul key={key++} className="md-ul">
          {ulBuffer.map((item, i) => (
            <li key={i} className="md-li" dangerouslySetInnerHTML={{ __html: inlineFormat(item) }} />
          ))}
        </ul>
      );
      ulBuffer = [];
    }
  };

  lines.forEach((line) => {
    // Heading ##
    if (/^##\s+/.test(line)) {
      flushList();
      elements.push(<div key={key++} className="md-h2" dangerouslySetInnerHTML={{ __html: inlineFormat(line.replace(/^##\s+/, "")) }} />);
      return;
    }
    // Heading ###
    if (/^###\s+/.test(line)) {
      flushList();
      elements.push(<div key={key++} className="md-h3" dangerouslySetInnerHTML={{ __html: inlineFormat(line.replace(/^###\s+/, "")) }} />);
      return;
    }
    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      flushList();
      elements.push(<hr key={key++} className="md-hr" />);
      return;
    }
    // Bullet list
    if (/^[-*]\s+/.test(line)) {
      ulBuffer.push(line.replace(/^[-*]\s+/, ""));
      return;
    }
    // Numbered list
    if (/^\d+\.\s+/.test(line)) {
      ulBuffer.push(line.replace(/^\d+\.\s+/, ""));
      return;
    }

    flushList();

    if (line.trim() === "") {
      elements.push(<br key={key++} />);
    } else {
      elements.push(
        <span key={key++} style={{ display: "block", marginBottom: "4px" }}
          dangerouslySetInnerHTML={{ __html: inlineFormat(line) }} />
      );
    }
  });

  flushList();
  
  // Table handling is complex in simple regex, but we can do a quick pass if they are formatted properly.
  // We'll leave it as inline formatted for now as a real markdown parser like react-markdown is usually better,
  // but we applied currency highlighting in inlineFormat!
  
  return elements;
}

/** Apply inline markdown: **bold**, *italic*, `code` and currency highlighting */
function inlineFormat(text) {
  return text
    .replace(/`([^`]+)`/g, '<span class="md-code">$1</span>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/_([^_]+)_/g, "<em>$1</em>")
    .replace(/(₹[\d,]+(\.\d{1,2})?)/g, '<span class="currency-highlight">$1</span>');
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatTime(isoString) {
  const d = new Date(isoString);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatIntent(intent) {
  if (!intent) return null;
  return intent.replace(/_/g, " ");
}

function getProvenance(intent) {
  switch(intent) {
    case 'budget_advice': return "Budget Engine";
    case 'forecast': return "Forecast Engine";
    case 'subscription_review': return "Recurring Analysis";
    case 'financial_health': return "Analytics Engine";
    default: return "Transaction Analysis";
  }
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function ChatBubble({ message }) {
  const { role, content, timestamp, intent, confidence, provider_metadata } = message;
  const isUser = role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API may be blocked
    }
  };

  return (
    <div className={`chat-message-row ${role}`}>
      {/* Avatar */}
      {!isUser && <div className="bubble-avatar">🤖</div>}

      <div style={{ display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start", gap: "3px" }}>
        {/* Bubble */}
        <div className={`chat-bubble ${role}`}>
          {isUser ? (
            <span>{content}</span>
          ) : (
            <>
              <button
                id={`copy-btn-${timestamp}`}
                className={`bubble-copy-btn ${copied ? "copied" : ""}`}
                onClick={handleCopy}
                title="Copy response"
                aria-label="Copy response"
              >
                {copied ? <FaCheck size={10} /> : <FaCopy size={10} />}
              </button>
              
              <div className="chat-bubble-content">
                {renderMarkdown(content)}
              </div>

              {/* Widgets rendering */}
              {message.widgets && message.widgets.length > 0 && (
                <div className="chat-widgets-container">
                  {message.widgets.map((w, i) => (
                    <ChatWidget key={i} widget={w} />
                  ))}
                </div>
              )}

              {/* Reasoning section */}
              {message.reasoning && message.reasoning.length > 0 && (
                <div className="chat-reasoning">
                  <div className="reasoning-header">
                    <FaInfoCircle size={12} /> Explainable AI
                  </div>
                  <ul>
                    {message.reasoning.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations section */}
              {message.recommendations && message.recommendations.length > 0 && (
                <div className="chat-recommendations">
                  <div className="recommendations-header">
                    <FaLightbulb size={13} color="#FFC107" /> Recommendations
                  </div>
                  <div className="recommendations-list">
                    {message.recommendations.map((rec, i) => (
                      <div key={i} className="recommendation-card">
                        <span dangerouslySetInnerHTML={{ __html: inlineFormat(rec) }} />
                      </div>
                    ))}
                  </div>
                  
                  {/* Data Provenance Footer */}
                  <div className="data-provenance">
                    <FaDatabase size={10} /> Powered by {getProvenance(intent)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Timestamp */}
        {timestamp && (
          <div className="bubble-timestamp">{formatTime(timestamp)}</div>
        )}

        {/* Intent & Confidence badges (assistant only) */}
        {!isUser && (intent || confidence) && (
          <div className="badge-row">
            {intent && (
              <div className="intent-badge">
                🎯 {formatIntent(intent)}
              </div>
            )}
            {confidence && (
              <div className="confidence-badge" title="AI Confidence Score">
                <FaShieldAlt size={9} /> {Math.round(confidence * 100)}% Match
              </div>
            )}
          </div>
        )}

        {/* Provider Transparency Badge */}
        {!isUser && provider_metadata && (
          <div className="provider-metadata-container">
            <div className={`provider-badge provider-${provider_metadata.provider_name.replace(/[^a-zA-Z0-9]/g, '-')}`}>
              <div className="provider-dot" />
              <div className="provider-info">
                <span className="provider-name">{provider_metadata.provider_name === 'gemini' ? 'Gemini' : provider_metadata.provider_name === 'groq' ? 'Groq' : 'Local Rule Engine'}</span>
                <span className="provider-model">• {provider_metadata.model_name}</span>
              </div>
            </div>
            
            <div className="provider-details">
              <span className="provider-latency">Generated in {(provider_metadata.latency_ms / 1000).toFixed(2)}s</span>
              
              {provider_metadata.is_fallback && (
                <span className="provider-fallback" title={provider_metadata.fallback_reason || "Fallback triggered"}>
                  ⚠️ Fallback Provider
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {isUser && <div className="bubble-avatar user-avatar">👤</div>}
    </div>
  );
}
