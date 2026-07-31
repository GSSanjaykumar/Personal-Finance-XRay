import {
    CircularProgressbar,
    buildStyles,
} from "react-circular-progressbar";

import "react-circular-progressbar/dist/styles.css";

export default function HeroCard({ health }) {

    if (!health) return null;

    return (

<div className="hero-card">

    <div className="health-left">

        <h3>Financial Health</h3>

        <p>
            Overall financial wellness based on
            income, expenses and savings.
        </p>

        <div className="health-metrics">

            <div>

                <span>Income</span>

                <h4>
                    ₹{health.income.toLocaleString()}
                </h4>

            </div>

            <div>

                <span>Expense</span>

                <h4>
                    ₹{health.expense.toLocaleString()}
                </h4>

            </div>

            <div>

                <span>Savings</span>

                <h4>
                    ₹{health.savings.toLocaleString()}
                </h4>

            </div>

        </div>

    </div>

    <div className="health-right">

        <div className="gauge">

            <CircularProgressbar

                value={health.score}

                text={`${health.score}`}

                styles={buildStyles({

                    pathColor: "#22C55E",

                    trailColor: "rgba(255,255,255,.08)",

                    textColor: "#fff",

                    textSize: "18px",

                })}

            />

        </div>

        <h3>Excellent 🎉</h3>

    </div>

</div>

);

}