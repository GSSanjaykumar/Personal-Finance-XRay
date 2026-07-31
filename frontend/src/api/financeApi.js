import { API } from "./client";

export async function uploadStatement(file) {

    const formData = new FormData();

    formData.append("file", file);

    const response = await API.post(
        "/upload",
        formData,
        {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        }
    );

    return response.data;
}

export async function getBudget() {
    const response = await API.get("/budget");
    return response.data;
}

export async function updateBudget(budget) {
    const response = await API.put("/budget", budget);
    return response.data;
}

export async function getBudgetAnalysis() {

    const response = await API.get("/budget-analysis");

    return response.data;

}

export async function getDashboard() {
    const response = await API.get("/dashboard");
    return response.data;
}

export async function getForecast() {
    const response = await API.get("/forecast");
    return response.data;
}

export async function getReport() {
    const response = await API.get("/report", {
        responseType: "blob",
        params: { format: "pdf" },
    });
    return response.data;  // Blob
}

export async function getTransactions() {
    const response = await API.get("/transactions");
    return response.data;
}
