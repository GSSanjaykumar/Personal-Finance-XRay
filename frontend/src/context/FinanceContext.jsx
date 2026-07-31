import { createContext, useContext, useState } from "react";

const FinanceContext = createContext();

export function FinanceProvider({ children }) {

    const [financeData, setFinanceData] = useState(null);

    return (

        <FinanceContext.Provider
            value={{
                financeData,
                setFinanceData,
            }}
        >

            {children}

        </FinanceContext.Provider>

    );

}

export function useFinance() {

    return useContext(FinanceContext);

}