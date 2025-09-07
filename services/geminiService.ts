import { GoogleGenAI, Modality } from "@google/genai";
import type { UploadedFile } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateDesign = async (
  roomImage: UploadedFile,
  furnitureImages: UploadedFile[],
  coreDescription: string,
  specifics: string,
): Promise<string> => {
  const model = 'gemini-2.5-flash-image-preview';

  const systemInstruction = `You are a world-class interior designer AI. Your purpose is to create stunning, photo-realistic interior design concepts. You will receive an image of a room, along with images of specific furniture and a text description. Your task is to seamlessly integrate the provided elements into the room to produce a beautiful, cohesive, and customized design. Generate a single, high-resolution image that shows the original room redesigned according to the user's instructions. The output should look like a professional photograph of a completed interior space. The furniture provided by the user must be seamlessly integrated and look as if it belongs naturally within the new design. DO NOT generate text descriptions, just the image. The primary image is the room to be redesigned. The subsequent images are furniture pieces to incorporate.`;

  const userPrompt = `Core Description: ${coreDescription}\n\nSpecifics/Constraints: ${specifics}`;

  const parts = [
    { text: userPrompt },
    {
      inlineData: {
        data: roomImage.base64,
        mimeType: roomImage.type,
      },
    },
    ...furnitureImages.map(img => ({
      inlineData: {
        data: img.base64,
        mimeType: img.type,
      },
    })),
  ];

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: parts },
      config: {
        systemInstruction: systemInstruction,
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    if (response.candidates && response.candidates.length > 0) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return part.inlineData.data;
        }
      }
    }
    
    throw new Error("No image was generated in the response.");

  } catch (error) {
    console.error("Error calling Gemini API for design generation:", error);
    throw new Error("The AI model failed to generate a design. Please try again.");
  }
};

export const generateFurnitureImage = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: `A photorealistic image of a single piece of furniture, "${prompt}", on a plain white background. The image should be a clean product shot, suitable for being placed into another scene.`,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/png',
          aspectRatio: '1:1',
        },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
        return response.generatedImages[0].image.imageBytes;
    }

    throw new Error("No image was generated for the furniture.");

  } catch (error) {
    console.error("Error calling Gemini API for furniture generation:", error);
    throw new Error("The AI model failed to generate a furniture image.");
  }
}

export const transcribeAudio = async (audioBase64: string, mimeType: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { text: "Transcribe the following audio recording." },
                    { inlineData: { data: audioBase64, mimeType } }
                ]
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API for transcription:", error);
        throw new Error("The AI model failed to transcribe the audio.");
    }
}