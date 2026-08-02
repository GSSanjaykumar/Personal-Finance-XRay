import { API } from "./client";

export async function login(email, password) {
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);
    
    const response = await API.post("/api/auth/login", formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
    });
    return response.data;
}

export async function register(email, password) {
    const response = await API.post("/api/auth/register", { email, password });
    return response.data;
}

export async function getMe() {
    const response = await API.get("/api/auth/me");
    return response.data;
}

export async function loginWithGoogle(credential) {
    const response = await API.post("/api/auth/google", { credential });
    return response.data;
}

