
import { GoogleGenAI, Type } from "@google/genai";
import { VerificationStatus, VerificationResult } from '../types';

// Always use named parameter for apiKey and use process.env.API_KEY directly as per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const verifyPaymentScreenshot = async (base64Image: string): Promise<VerificationResult> => {
  try {
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const prompt = `
      Analyze this UPI payment screenshot. You MUST verify the following details:
      1. Recipient Name: Must be exactly "Vicky Patekar" or similar (e.g., "Vicky").
      2. UPI ID: Must be "r1patekar6@oksbi".
      3. Date: Check if the transaction date matches today's date (${formattedDate}) or is very recent (within 24 hours). 
      4. Amount: Detect if the amount matches one of the expected plan prices (₹37, ₹47, ₹49, or ₹60).
      5. Transaction/UTR ID: Locate the unique transaction ID or UTR number if present.
      
      Respond ONLY with a JSON object:
      {
        "status": "SUCCESS" | "FAILED",
        "message": "A detailed explanation of what was found or what is missing",
        "amountDetected": number | null,
        "transactionId": string | null
      }
      If any of the first 3 items (Name, UPI ID, Date) are missing or clearly incorrect, status MUST be FAILED.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { data: base64Image.split(',')[1], mimeType: 'image/png' } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json"
      }
    });

    // Directly access .text property as it is a getter, not a method.
    const result = JSON.parse(response.text || '{}');
    return {
      status: result.status === 'SUCCESS' ? VerificationStatus.SUCCESS : VerificationStatus.FAILED,
      message: result.message,
      amount: result.amountDetected
    };
  } catch (error) {
    console.error("Verification error:", error);
    return {
      status: VerificationStatus.FAILED,
      message: "AI could not process the image. Please upload a clear screenshot of your UPI transaction."
    };
  }
};

/**
 * AI Image Editing Service
 */
export const editUserPhoto = async (
  base64Image: string, 
  action: 'enhance' | 'remove_bg' | 'apply_clothes' | 'change_bg_color',
  itemDescription?: string
): Promise<string> => {
  const mimeType = base64Image.split(';')[0].split(':')[1];
  const data = base64Image.split(',')[1];

  let prompt = "";
  if (action === 'enhance') {
    prompt = "Enhance the quality of this portrait. Improve lighting, sharpness, and color balance for a professional look. Output the modified image.";
  } else if (action === 'remove_bg') {
    prompt = "Remove the background and replace it with a clean solid white background. Keep the person's face and hair perfectly intact.";
  } else if (action === 'apply_clothes') {
    // Handling numbered items like "Suit 1"
    prompt = `Keep the person's face, neck, and hair exactly as they are. Change their current outfit to a professional ${itemDescription} style. The new outfit must be perfectly aligned with their body and neck. The final image should be a professional passport photo on a clean white background.`;
  } else if (action === 'change_bg_color') {
    prompt = `Remove the background and replace it with a solid ${itemDescription} background. Keep the subject unchanged.`;
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data, mimeType } },
        { text: prompt }
      ]
    }
  });

  // Iterate through parts to find the image part, as per guidelines.
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }

  throw new Error("Failed to process image with AI");
};
