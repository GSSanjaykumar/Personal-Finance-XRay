export default function TopCategories({ categories = {} }) {

    const data = Object.entries(categories)
        .sort((a, b) => b[1] - a[1]);

    const max = data.length ? data[0][1] : 1;

    return (

        <div className="table-card">

            <h3>Top Spending Categories</h3>

            {data.map(([name, amount], index) => (

                <div
                    key={index}
                    className="category-item"
                >

                    <div className="category-header">

                        <span>{name}</span>

                        <strong>
                            ₹{amount.toLocaleString()}
                        </strong>

                    </div>

                    <div className="progress-track">

                        <div
                            className="progress-fill"
                            style={{
                                width: `${amount / max * 100}%`
                            }}
                        />

                    </div>

                </div>

            ))}

        </div>

    );

}