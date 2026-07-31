import { formatTooltipValue } from "../../utils/formatters";

/**
 * Professional SaaS-grade tooltip for Recharts.
 * No raw JSON, no raw decimals.
 */
export default function CustomTooltip({ active, payload, label }) {
    if (!active || !payload || payload.length === 0) return null;

    return (
        <div className="custom-tooltip" style={{
            background: "#101827",
            border: "1px solid rgba(255,255,255,0.05)",
            borderRadius: "12px",
            padding: "16px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
            minWidth: "160px",
            color: "white"
        }}>
            {label && (
                <div style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#9CA3AF",
                    marginBottom: "12px",
                    borderBottom: "1px solid rgba(255,255,255,0.1)",
                    paddingBottom: "8px"
                }}>
                    {label}
                </div>
            )}
            
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {payload.map((entry, index) => {
                    const color = entry.color || entry.fill;
                    const value = formatTooltipValue(entry.value);
                    const name = entry.name.charAt(0).toUpperCase() + entry.name.slice(1);

                    return (
                        <div key={index} style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            fontSize: "14px",
                            gap: "16px"
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{
                                    width: "8px",
                                    height: "8px",
                                    borderRadius: "50%",
                                    background: color,
                                    display: "inline-block"
                                }} />
                                <span style={{ color: "#D1D5DB" }}>{name}</span>
                            </div>
                            <strong style={{ fontWeight: 600 }}>{value}</strong>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
