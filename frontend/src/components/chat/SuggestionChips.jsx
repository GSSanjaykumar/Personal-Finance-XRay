/**
 * SuggestionChips
 * ===============
 * Displays clickable question chips to help users get started.
 * Shown on the welcome screen and when the chat is empty.
 *
 * Props:
 *   onSelect(question: string) — called when a chip is clicked
 */

const SUGGESTIONS = [
  "📊 Summarize my finances",
  "🛍️ Where am I overspending?",
  "💻 Can I afford a ₹1,20,000 laptop?",
  "🔁 Show my subscriptions",
  "❤️ How healthy are my finances?",
  "📂 What category wastes the most money?",
  "💰 Can I save ₹20,000 every month?",
  "🔮 If I continue this pattern, how much will I save this year?",
  "📉 What should I improve?",
  "🍕 How much did I spend on food?",
];

export default function SuggestionChips({ onSelect }) {
  return (
    <div className="suggestion-chips">
      <span className="suggestion-chips-label">✨ Suggested questions</span>
      <div className="chips-row">
        {SUGGESTIONS.map((q) => (
          <button
            key={q}
            className="suggestion-chip"
            onClick={() => onSelect(q.replace(/^[^\s]+\s/, ""))}
            aria-label={`Ask: ${q}`}
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
