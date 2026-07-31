export default function InsightCard({ insights = [] }) {
  return (
    <div className="insight-card">

      <div className="insight-icon">🧠</div>

      <div>

        <h4>AI Insights</h4>

        {insights.length > 0 ? (

          insights.map((item, index) => (

            <div key={index} className="insight-item">

              <strong>
                {item.icon} {item.title}
              </strong>

              <p>{item.value}</p>

              <small>{item.description}</small>

            </div>

          ))

        ) : (

          <p>Upload a statement to get AI insights.</p>

        )}

      </div>

    </div>
  );
}