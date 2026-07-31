/**
 * QuickActions
 * ============
 * Icon-button shortcuts that populate the chat with a preset question.
 * Displayed above the input bar for instant access to common queries.
 *
 * Props:
 *   onSelect(question: string) — called with the preset question text
 */

const QUICK_ACTIONS = [
  { emoji: "📊", label: "Summary",       question: "Summarize my finances" },
  { emoji: "💰", label: "Budget",        question: "How is my budget doing?" },
  { emoji: "🔁", label: "Subscriptions", question: "Show my subscriptions" },
  { emoji: "❤️", label: "Health",        question: "How healthy are my finances?" },
  { emoji: "🔮", label: "Forecast",      question: "What is my spending forecast?" },
];

export default function QuickActions({ onSelect }) {
  return (
    <div className="quick-actions">
      {QUICK_ACTIONS.map(({ emoji, label, question }) => (
        <button
          key={label}
          className="quick-action-btn"
          onClick={() => onSelect(question)}
          title={question}
          aria-label={question}
          id={`quick-action-${label.toLowerCase()}`}
        >
          {emoji} {label}
        </button>
      ))}
    </div>
  );
}
