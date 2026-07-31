export default function StatCard({
    title,
    value,
    color,
    icon,
    trend = "+12%",
    subtitle = "vs last month",
}) {

    return (

        <div
            className="stat-card"
            style={{ background: color }}
        >

            <div className="stat-top">

                <div className="stat-icon">
                    {icon}
                </div>

                <div className="trend">
                    {trend}
                </div>

            </div>

            <div className="stat-body">

                <p>{title}</p>

                <h2>{value}</h2>

                <span>{subtitle}</span>

            </div>

        </div>

    );

}