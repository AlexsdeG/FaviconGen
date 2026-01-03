import { GoogleGenerativeAI } from "@google/generative-ai";
import { GradientConfig } from "../../types";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Initialize Gemini
let genAI: GoogleGenerativeAI | null = null;
if (API_KEY) {
  genAI = new GoogleGenerativeAI(API_KEY);
}

const MODEL_NAME = "gemini-2.5-flash-lite"; // Fast and cheap model

/**
 * Checks if AI is configured (API Key present)
 */
export const isAIConfigured = () => !!API_KEY;

/**
 * Suggests a gradient based on a user prompt or context
 */
export const suggestGradient = async (context: string): Promise<GradientConfig | null> => {
  if (!genAI) return null;

  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const prompt = `You are a professional UI designer. 
    Suggest a beautiful 2-color linear gradient based on this context: "${context}".
    Return ONLY a JSON object with this shape:
    { "angle": number, "startColor": "hex string", "endColor": "hex string" }
    Make sure colors are vibrant and modern.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean up potential markdown formatting in response
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(jsonStr);

    return {
      type: 'linear',
      angle: data.angle || 135,
      stops: [
        { id: Math.random().toString(), offset: 0, color: data.startColor },
        { id: Math.random().toString(), offset: 1, color: data.endColor }
      ]
    };
  } catch (error) {
    console.error("Gemini Suggest Gradient Error:", error);
    return null;
  }
};

/**
 * Generates an icon shape (SVG path) based on a prompt
 */
export const generateIconShape = async (userPrompt: string): Promise<{ path: string, viewBox: string } | null> => {
  if (!genAI) return null;

  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const prompt = `Generate a simple, flat, single-path SVG icon for: "${userPrompt}".
    Return ONLY a JSON object with this shape:
    { "path": "svg path string", "viewBox": "0 0 24 24" }
    The path should be simple and valid. Do not include <svg> tags.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(jsonStr);

    return {
      path: data.path,
      viewBox: data.viewBox || "0 0 24 24"
    };

  } catch (error) {
    console.error("Gemini Icon Gen Error:", error);
    return null;
  }
};
