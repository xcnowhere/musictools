
import { GoogleGenAI } from "@google/genai";

// 懒加载 AI 实例的辅助函数
const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    throw new Error("API_KEY_MISSING");
  }
  return new GoogleGenAI({ apiKey });
};

export const getGuitarInsights = async (guitarName: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Provide 3 fascinating historical facts and technical characteristics about the ${guitarName}. Format as a clear list.`,
    });
    return response.text;
  } catch (error) {
    if (error.message === "API_KEY_MISSING") return "Please configure your Gemini API Key to see insights.";
    throw error;
  }
};

export const getFMPresetExplanation = async (carrier: number, modulator: number, index: number) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Explain the sonic characteristics of an FM synthesizer with a carrier frequency of ${carrier}Hz, a modulator frequency of ${modulator}Hz, and a modulation index of ${index}. What kind of instrument does this sound like?`,
    });
    return response.text;
  } catch (error) {
    if (error.message === "API_KEY_MISSING") return "API Key missing. AI analysis unavailable.";
    throw error;
  }
};

export const getEffectChainAdvice = async (effects: string[]) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `I am using an audio effect chain with: ${effects.join(', ')}. Briefly describe how this combination transforms a clean signal and suggest one creative use case.`,
    });
    return response.text;
  } catch (error) {
    if (error.message === "API_KEY_MISSING") return "Connect your API key to get signal chain advice.";
    throw error;
  }
};
