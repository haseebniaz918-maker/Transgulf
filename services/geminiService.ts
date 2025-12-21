
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const getClient = (): GoogleGenAI => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzePdfContent = async (
  base64Data: string,
  prompt: string
): Promise<string> => {
  try {
    const ai = getClient();
    const model = 'gemini-3-flash-preview';

    const response: GenerateContentResponse = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: base64Data
            }
          },
          { text: prompt }
        ]
      }
    });

    return response.text || "No analysis could be generated.";
  } catch (error) {
    console.error("Gemini PDF Analysis Error:", error);
    throw new Error("Failed to analyze PDF content.");
  }
};

export const generateText = async (prompt: string, context?: string): Promise<string> => {
  try {
    const ai = getClient();
    const finalPrompt = context 
      ? `Context: ${context}\n\nTask: ${prompt}`
      : prompt;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: finalPrompt,
    });

    return response.text || "No response generated.";
  } catch (error) {
    console.error("Gemini Text Gen Error:", error);
    throw new Error("Failed to generate text.");
  }
};

export const generateImageDescription = async (base64: string, mimeType: string): Promise<string> => {
  try {
    const ai = getClient();
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: base64, mimeType } },
          { text: "Describe this image in detail and extract any text found via OCR." }
        ]
      }
    });
    return response.text || "No description could be generated.";
  } catch (error) {
    console.error("Gemini Image Analysis Error:", error);
    throw new Error("Failed to analyze image.");
  }
};

export const generateEnhancedDocument = async (base64: string, mimeType: string, instruction: string): Promise<string[]> => {
  try {
    const ai = getClient();
    const prompt = `Enhance this document image. Mission: ${instruction || "remove background, fix orientation, and improve clarity"}. Return the result as an image part.`;
    
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: base64, mimeType } },
          { text: prompt }
        ]
      }
    });

    const results: string[] = [];
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          results.push(part.inlineData.data);
        }
      }
    }
    return results.length > 0 ? results : [base64];
  } catch (error) {
    console.error("Gemini Document Enhancement Error:", error);
    throw new Error("Failed to enhance document image.");
  }
};

export const validateFieldWithAI = async (value: string, type: 'CNIC' | 'PASSPORT' | 'DOB' | 'DATE_ISSUE' | 'DATE_EXPIRY'): Promise<{ isValid: boolean, message: string, suggestion?: string }> => {
  try {
    const ai = getClient();
    const today = new Date().toISOString().split('T')[0];
    
    const prompt = `
      Analyze the following input value for a Pakistani document.
      Type: ${type}, Value: "${value}", Today's Date: ${today}
      Rules:
      - CNIC: Must be 13 digits plus dashes (12345-12345678-1). Format 5-8-1.
      - PASSPORT: EXACTLY 2 Capital Alphas + 7 Digits (e.g. FB3174001).
      - DOB: Must be between 18 and 65 years ago.
      Return JSON: { "isValid": boolean, "message": "error msg if invalid", "suggestion": "proper format example" }
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });

    return JSON.parse(response.text || "{}");
  } catch (e) {
    return { isValid: true, message: "", suggestion: "" };
  }
};

export const validateProfileData = async (nationality: string, phone: string, email: string): Promise<{
    phoneValid: boolean;
    phoneMessage: string;
    emailValid: boolean;
    emailMessage: string;
}> => {
    try {
        const ai = getClient();
        const prompt = `
        Validate: Nationality: "${nationality}", Phone: "${phone}", Email: "${email}"
        Rules: Phone must be 11 digits starting with 03. Email must be valid format.
        Return JSON: { "phoneValid": bool, "phoneMessage": "msg", "emailValid": bool, "emailMessage": "msg" }
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        
        return JSON.parse(response.text || "{}");
    } catch (e) {
        return { phoneValid: true, phoneMessage: "", emailValid: true, emailMessage: "" };
    }
};

export const generateCvHtml = async (cvData: any, userInstruction: string = ""): Promise<string> => {
  const ai = getClient();
  const { photoBase64, ...dataWithoutPhoto } = cvData;

  const prompt = `
  ACT AS A WORLD-CLASS RESUME ARCHITECT.
  MISSION: Forge a high-end, modern, and high-fidelity CV.
  
  **WORD COMPATIBILITY (CRITICAL)**:
  - You MUST use HTML TABLES for the layout. This is the ONLY way to ensure columns and shapes remain perfect when converted to MS Word.
  - Avoid complex CSS Flex/Grid for the final layout if possible; prefer nested tables.
  - Use inline styles for EVERYTHING.
  
  **FIDELITY**: 
  - Ensure the document fits perfectly on A4 (210mm x 297mm).
  - Background shapes should use table cell background colors.
  - Image placeholder: [[PHOTO_PLACEHOLDER]].

  DATA: ${JSON.stringify(dataWithoutPhoto)}
  INSTRUCTION: ${userInstruction}
  
  RETURN RAW HTML STRING ONLY.
  `;

  let text = "";
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });
    text = response.text || "";
  } catch (error) {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    text = response.text || "";
  }

  text = text.replace(/^```html/, '').replace(/```$/, '').trim();
  const finalPhoto = photoBase64 ? `data:image/jpeg;base64,${photoBase64}` : "https://via.placeholder.com/150";
  return text.replace(/\[\[PHOTO_PLACEHOLDER\]\]/g, finalPhoto);
};

export const generateAdHtml = async (adData: any, customPrompt: string): Promise<string> => {
  try {
    const ai = getClient();
    
    // Step 1: Generate a professional image for the role using gemini-2.5-flash-image
    const primaryRole = adData.jobs[0]?.title || adData.country;
    const imagePrompt = `A high-quality, professional, and photorealistic recruitment image of a ${primaryRole} in a modern workspace. 1080p, square aspect ratio, recruitment agency style, clean background.`;
    
    const imgResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: imagePrompt,
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    let base64Image = '';
    if (imgResponse.candidates?.[0]?.content?.parts) {
      for (const part of imgResponse.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          base64Image = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    // Step 2: Generate the Ad HTML with the injected image
    const htmlPrompt = `
      ACT AS A PROFESSIONAL GRAPHIC DESIGNER.
      MISSION: Create a high-fidelity recruitment ad in HTML format.
      DATA: ${JSON.stringify(adData)}
      INJECTED IMAGE: Use the placeholder [[BG_IMAGE]] for the background/hero image.
      USER CUSTOM INSTRUCTION: ${customPrompt}

      GUIDELINES:
      - 1080px x 1080px (Square).
      - SELECT A UNIQUE, MODERN TEMPLATE (Vary layout, typography, and color schemes based on a seed).
      - Ensure all ad data (positions, salary, benefits) is presented in high-contrast blocks.
      - Use inline styles for everything.
      - IF LANGUAGE IS "Both", include both English and Urdu translations for all job details.
      - RETURN RAW HTML STRING ONLY.
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: htmlPrompt,
    });

    let html = (response.text || "").replace(/^```html/, "").replace(/```$/, "").trim();
    return html.replace(/\[\[BG_IMAGE\]\]/g, base64Image || 'https://via.placeholder.com/1080x1080?text=Recruitment+Ad');
  } catch (error) {
    console.error("Gemini Ad Gen Error:", error);
    throw new Error("Failed to generate ad HTML.");
  }
};

export const convertPdfToWordHtml = async (base64Pdf: string): Promise<string> => {
    try {
        const ai = getClient();
        const prompt = `
        Act as a Professional Document Engineer. Convert this PDF to High-Fidelity HTML for MS Word.
        CRITICAL RULES:
        1. Use HTML TABLES for structure to maintain exact layout in Word.
        2. Preserve all font styles, table borders, and spacing.
        3. Use absolute positioning inside relative table cells if needed for fidelity.
        4. Optimize for editing.
        Return raw HTML only.
        `;
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
                parts: [{ inlineData: { mimeType: 'application/pdf', data: base64Pdf } }, { text: prompt }]
            }
        });
        return (response.text || "").replace(/^```html/, "").replace(/```$/, "").trim();
    } catch (error) {
        throw new Error("Failed to convert PDF to Word.");
    }
};

export const helperFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
  });
};

export const generateIdentityPhoto = async (base64Image: string, mimeType: string): Promise<string> => {
  try {
    const ai = getClient();
    const prompt = `Professional passport headshot. White background. Navy suit. DSLR quality. Face centered.`;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ inlineData: { mimeType, data: base64Image } }, { text: prompt }]
      }
    });
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.data) return part.inlineData.data;
      }
    }
    throw new Error("No image generated.");
  } catch (error) {
    throw error;
  }
};

export const generateNominationDetails = async (gmail: string, bankName: string, iban: string): Promise<any> => {
    // Basic wrapper
    return {};
};

export const validateNominationDetails = async (gmail: string, bankName: string, iban: string): Promise<{
  gmail: { isValid: boolean; message: string };
  bank: { isValid: boolean; correctedName: string; message: string };
  iban: { isValid: boolean; message: string };
}> => {
  try {
      const ai = getClient();
      const prompt = `
      Validate: Gmail: "${gmail}", Bank: "${bankName}", IBAN: "${iban}"
      Return JSON: { "gmail": { "isValid": bool, "message": "str" }, "bank": { "isValid": bool, "correctedName": "str", "message": "str" }, "iban": { "isValid": bool, "message": "str" } }
      `;

      const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
          config: { responseMimeType: 'application/json' }
      });

      return JSON.parse(response.text || "{}");
  } catch (e) {
      return {
          gmail: { isValid: true, message: "Skipped" },
          bank: { isValid: true, correctedName: bankName, message: "Skipped" },
          iban: { isValid: true, message: "Skipped" }
      };
  }
};
