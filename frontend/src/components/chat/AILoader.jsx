import { useState, useEffect } from "react";
import "../../styles/chat.css";

const STATUS_MESSAGES = [
  "Analyzing your finances...",
  "Running budget engine...",
  "Generating insights...",
  "Finalizing recommendations..."
];

export default function AILoader() {
  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="ai-loader-container">
      <div className="ai-loader-dots">
        <div className="typing-dot" />
        <div className="typing-dot" />
        <div className="typing-dot" />
      </div>
      <div className="ai-loader-text">
        {STATUS_MESSAGES[statusIndex]}
      </div>
    </div>
  );
}
