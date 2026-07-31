import "../../styles/layout.css";
import "../../styles/report.css";
import "../../styles/shared.css";


export default function Navbar() {
  return (
    <header className="navbar">

      <div className="navbar-left">
        <h2>Personal Finance X-Ray</h2>
        <span className="subtitle">
          AI Powered Financial Intelligence
        </span>
      </div>

      <div className="navbar-right">

        <button className="nav-icon">
          🔔
        </button>

        <button className="nav-icon">
          ⚙
        </button>

        <div className="profile">
          <div className="avatar">S</div>

          <div>
            <h4>Sanjay</h4>
            <p>Premium</p>
          </div>

        </div>

      </div>

    </header>
  );
}