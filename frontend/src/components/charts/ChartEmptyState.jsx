export default function ChartEmptyState({ title = "No Data", message = "Not enough data to generate this chart." }) {
    return (
        <div className="chart-empty-state" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            minHeight: '250px',
            color: '#6b7280',
            textAlign: 'center',
            background: 'rgba(255,255,255,0.02)',
            borderRadius: '12px'
        }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📊</div>
            <h4 style={{ margin: '0 0 8px 0', color: '#9CA3AF', fontSize: '16px' }}>{title}</h4>
            <p style={{ margin: 0, fontSize: '13px' }}>{message}</p>
        </div>
    );
}
