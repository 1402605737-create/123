import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined");
  }
  return new GoogleGenAI({ apiKey });
};

export const identifyPlant = async (base64Image: string): Promise<string> => {
  const ai = getAI();
  const model = "gemini-3.1-pro-preview";
  
  const prompt = `
    Identify this plant and provide detailed care instructions.
    Format your response in Markdown with the following sections:
    # [Plant Name]
    ## Scientific Name
    [Scientific Name]
    
    ## Overview
    [A brief, poetic description of the plant in the style of a high-end botanical journal]
    
    ## Care Instructions
    - **Light**: [Instructions]
    - **Water**: [Instructions]
    - **Soil**: [Instructions]
    - **Temperature**: [Instructions]
    
    ## Chef's Tip (Botanical Edition)
    [A unique tip for this specific plant]
  `;

  const imagePart = {
    inlineData: {
      mimeType: "image/jpeg",
      data: base64Image.split(",")[1] || base64Image,
    },
  };

  const response: GenerateContentResponse = await ai.models.generateContent({
    model,
    contents: [{ parts: [{ text: prompt }, imagePart] }],
  });

  return response.text || "I couldn't identify this plant. Please try another photo.";
};

export const chatWithGardener = async (message: string, history: { role: string; parts: { text: string }[] }[]): Promise<string> => {
  const ai = getAI();
  const model = "gemini-3.1-pro-preview";

  const chat = ai.chats.create({
    model,
    config: {
      systemInstruction: "You are an expert botanical assistant at 'The Botanical Atelier'. Your tone is sophisticated, helpful, and poetic, similar to a high-end gardening journal. You provide expert advice on plant care, identification, and sustainable gardening practices.",
    },
    // Note: sendMessage doesn't take history directly in this SDK version's create call, 
    // but we can pass it if the SDK supports it. Actually, chats.create takes history.
    history: history.length > 0 ? history : undefined,
  });

  const response = await chat.sendMessage({ message });
  return response.text || "I'm sorry, I couldn't process that request.";
};
