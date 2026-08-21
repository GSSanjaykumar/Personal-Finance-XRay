import { useState } from "react";
import { X } from "lucide-react";

export default function BudgetModal({ budget, onSave, onClose }) {
    const [values, setValues] = useState(budget);

    function handleChange(category, value) {
        setValues({
            ...values,
            [category]: Number(value),
        });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
                <div className="flex items-center justify-between border-b border-[var(--border)] p-4">
                    <h2 className="text-lg font-semibold tracking-tight text-foreground">Edit Monthly Budget</h2>
                    <button 
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-[var(--surface-2)] hover:text-foreground"
                    >
                        <X className="size-5" />
                    </button>
                </div>
                
                <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
                    {Object.entries(values).map(([category, amount]) => (
                        <div key={category} className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-foreground">{category}</label>
                            <div className="relative flex items-center">
                                <span className="absolute left-3 text-muted-foreground">₹</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={amount}
                                    onChange={(e) => handleChange(category, e.target.value)}
                                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] py-2 pl-7 pr-3 text-sm text-foreground transition-colors focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] bg-[var(--surface-2)]/50 p-4">
                    <button
                        onClick={onClose}
                        className="rounded-lg px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-[var(--surface-3)]"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onSave(values)}
                        className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent)]/90"
                    >
                        Save Budget
                    </button>
                </div>
            </div>
        </div>
    );
}