
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getGuitarInsights = async (guitarName: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Provide 3 fascinating historical facts and technical characteristics about the ${guitarName}. Format as a clear list.`,
  });
  return response.text;
};

export const getFMPresetExplanation = async (carrier: number, modulator: number, index: number) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Explain the sonic characteristics of an FM synthesizer with a carrier frequency of ${carrier}Hz, a modulator frequency of ${modulator}Hz, and a modulation index of ${index}. What kind of instrument does this sound like?`,
  });
  return response.text;
};

export const getEffectChainAdvice = async (effects: string[]) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `I am using an audio effect chain with: ${effects.join(', ')}. Briefly describe how this combination transforms a clean signal and suggest one creative use case.`,
  });
  return response.text;
};
