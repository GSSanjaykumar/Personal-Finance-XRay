/**
 * Chat API Client
 * ===============
 * Wraps the POST /chat endpoint.
 * Uses the same axios base URL as financeApi.js (http://127.0.0.1:8000).
 */

import { API } from "./client";

/**
 * Send a message to the AI Financial Assistant.
 *
 * @param {string} message - The user's question.
 * @param {Array<{role: string, content: string}>} history - Prior conversation turns.
 * @returns {Promise<{answer: string, intent: string}>}
 */
export async function sendChatMessage(message, history = []) {
  const response = await API.post("/chat", { message, history });
  return response.data;
}

/**
 * Upload a PDF to extract text for the AI chat context.
 *
 * @param {File} file - The PDF file object.
 * @returns {Promise<string>} - The extracted text.
 */
export async function uploadChatPdf(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await API.post("/chat/upload-pdf", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data.extracted_text;
}
