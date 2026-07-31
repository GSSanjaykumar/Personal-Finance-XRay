import { useState } from "react";

export default function BudgetModal({
    budget,
    onSave,
    onClose,
}) {

    const [values, setValues] = useState(budget);

    function handleChange(category, value) {

        setValues({
            ...values,
            [category]: Number(value),
        });

    }

    return (

        <div className="modal-overlay">

            <div className="modal">

                <h2>💰 Edit Monthly Budget</h2>

                {Object.entries(values).map(([category, amount]) => (

                    <div
                        key={category}
                        className="modal-row"
                    >

                        <label>{category}</label>

                        <input
                            type="number"
                            min="0"
                            value={amount}
                            onChange={(e) =>
                                handleChange(
                                    category,
                                    e.target.value
                                )
                            }
                        />

                    </div>

                ))}

                <div className="modal-buttons">

                    <button
                        className="save-btn"
                        onClick={() => onSave(values)}
                    >
                        Save
                    </button>

                    <button
                        className="cancel-btn"
                        onClick={onClose}
                    >
                        Cancel
                    </button>

                </div>

            </div>

        </div>

    );

}