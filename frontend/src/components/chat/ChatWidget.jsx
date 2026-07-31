/**
 * ChatWidget
 * ==========
 * A factory component that renders specific rich UI widgets inside the chat bubble
 * based on the widget type returned by the Copilot API.
 */

import React from "react";
import "../../styles/chat.css";

export default function ChatWidget({ widget }) {
  if (!widget || !widget.type) return null;

  const { type, data } = widget;

  switch (type) {
    case "budget_progress":
      return <BudgetProgressWidget data={data} />;
    case "category_breakdown":
      return <CategoryBreakdownWidget data={data} />;
    case "recurring":
      return <RecurringWidget data={data} />;
    default:
      console.warn("Unknown widget type:", type);
      return null;
  }
}

// ── Specific Widgets ─────────────────────────────────────────────────────────

function BudgetProgressWidget({ data }) {
  const { category, spent = 0, budget = 1 } = data;
  const percentage = Math.min((spent / budget) * 100, 100).toFixed(0);
  const isOver = spent > budget;
  const remaining = budget - spent;
  
  // Status Chip Logic
  let statusText = "Healthy";
  let statusClass = "status-healthy";
  let barClass = "bg-primary";
  
  if (isOver) {
    statusText = "Exceeded";
    statusClass = "status-exceeded";
    barClass = "bg-danger";
  } else if (percentage >= 80) {
    statusText = "Near Limit";
    statusClass = "status-warning";
    barClass = "bg-warning";
  }

  return (
    <div className="chat-widget-card budget-widget">
      <div className="widget-header" style={{ alignItems: 'center' }}>
        <h4 style={{ margin: 0 }}>{category} Budget</h4>
        <div className={`status-chip ${statusClass}`}>
          {statusText}
        </div>
      </div>
      
      <div className="budget-metrics" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
        <span>Spent: <strong>₹{spent.toLocaleString()}</strong></span>
        <span>Left: <strong>₹{remaining > 0 ? remaining.toLocaleString() : 0}</strong></span>
      </div>

      <div className="progress-bar-bg" style={{ position: 'relative' }}>
        <div 
          className={`progress-bar-fill ${barClass}`} 
          style={{ width: `${percentage}%` }} 
        />
        <div style={{ position: 'absolute', right: '4px', top: '-1px', fontSize: '9px', fontWeight: 'bold', mixBlendMode: 'difference', color: '#fff' }}>
          {percentage}%
        </div>
      </div>
      
      <div className="widget-footer">
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>Monthly Limit: ₹{budget.toLocaleString()}</span>
      </div>
    </div>
  );
}

function CategoryBreakdownWidget({ data }) {
  const { categories = [] } = data;
  
  if (categories.length === 0) return null;
  
  const total = categories.reduce((sum, c) => sum + (c.amount || 0), 0) || 1;

  return (
    <div className="chat-widget-card category-widget">
      <h4>Category Breakdown</h4>
      <div className="category-list">
        {categories.map((cat, i) => (
          <div key={i} className="category-row">
            <span className="cat-name">{cat.name}</span>
            <span className="cat-amount">₹{(cat.amount || 0).toLocaleString()}</span>
            <span className="cat-pct">
              {(((cat.amount || 0) / total) * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecurringWidget({ data }) {
  const { subscriptions = [] } = data;

  if (subscriptions.length === 0) return null;

  return (
    <div className="chat-widget-card recurring-widget">
      <h4>Active Subscriptions</h4>
      <div className="subscription-list">
        {subscriptions.map((sub, i) => (
          <div key={i} className="subscription-row">
            <div className="sub-info">
              <strong>{sub.name}</strong>
              <small>Recurring</small>
            </div>
            <div className="sub-amount">
              ₹{(sub.amount || 0).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
