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
    const model = 'gemini-2.5-flash';

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
      model: 'gemini-2.5-flash',
      contents: finalPrompt,
    });

    return response.text || "No response generated.";
  } catch (error) {
    console.error("Gemini Text Gen Error:", error);
    throw new Error("Failed to generate text.");
  }
};

export const validateFieldWithAI = async (value: string, type: 'CNIC' | 'PASSPORT' | 'DOB' | 'DATE_ISSUE' | 'DATE_EXPIRY'): Promise<{ isValid: boolean, message: string, suggestion?: string }> => {
  try {
    const ai = getClient();
    const today = new Date().toISOString().split('T')[0];
    
    const prompt = `
      You are a strict Data Validation Officer.
      Analyze the following input value for a Pakistani citizen's document.
      
      **Input Type**: ${type}
      **Input Value**: "${value}"
      **Current Date**: ${today}
      
      **Rules**:
      - **CNIC**: Must be 13 digits. Standard format: 12345-1234567-1. If hyphens missing, suggest them.
      - **PASSPORT**: Pakistani Passports typically start with 1-2 alphabets followed by 7 digits (e.g., AB1234567).
      - **DOB**: Must be a plausible date of birth (user must be between 18 and 100 years old).
      - **DATE_ISSUE**: Must be in the past, but not more than 10 years ago (standard validity).
      - **DATE_EXPIRY**: Must be in the future (usually 5 or 10 years from issue).
      
      **Return JSON ONLY**:
      {
        "isValid": boolean,
        "message": "Short error explanation or 'Valid'",
        "suggestion": "Corrected format if applicable, else null"
      }
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });

    const text = response.text || "{}";
    return JSON.parse(text);
  } catch (e) {
    return { isValid: false, message: "AI Validation Failed", suggestion: "" };
  }
};

// Deprecated alias for backward compatibility
export const validateIdentityFormat = async (value: string, type: 'CNIC' | 'PASSPORT') => {
    return validateFieldWithAI(value, type);
};

export const generateImageDescription = async (base64Image: string, mimeType: string): Promise<string> => {
   try {
    const ai = getClient();
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
           { inlineData: { mimeType, data: base64Image } },
           { text: "Describe this image in detail." }
        ]
      }
    });
    return response.text || "Could not describe image.";
   } catch (error) {
     console.error("Image Description Error", error);
     throw error;
   }
}

export const generateIdentityPhoto = async (base64Image: string, mimeType: string): Promise<string> => {
  try {
    const ai = getClient();
    // Using Nano Banana Pro for speed and quality
    const model = 'gemini-3-pro-image-preview';
    
    const prompt = `
    Edit this user's photo to be a perfect professional passport-style headshot.
    
    Strict Requirements:
    1. **Background**: CHANGE background to pure #FFFFFF (White).
    2. **Attire**: CHANGE clothing to a high-end, dark navy or black business suit with a white shirt and a random professional tie.
    3. **Composition**: Crop to standard Passport proportions (Head and shoulders only). Face should be centered.
    4. **Realism**: The image MUST look like a real DSLR photo, NOT an AI cartoon.
    
    Output ONLY the edited image.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Image } },
          { text: prompt }
        ]
      }
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return part.inlineData.data;
        }
      }
    }

    const textOutput = response.text;
    if (textOutput) {
        throw new Error(`The model returned text instead of an image.`);
    }

    throw new Error("No image generated by the model.");
  } catch (error) {
    console.error("Identity Lab Error:", error);
    throw error;
  }
};

export const generateEnhancedDocument = async (base64Image: string, mimeType: string): Promise<string[]> => {
  try {
    const ai = getClient();
    // Using Nano Banana Pro for speed and quality
    const model = 'gemini-3-pro-image-preview';
    
    const prompt = `
    You are an advanced Computer Vision AI specializing in Document Extraction.
    
    **CRITICAL TASK**: Detect and Extract the *Identity Document* (Passport, CNIC, ID Card) from the image.
    
    **STRICT RULES FOR BACKGROUNDS**:
    - **Passport on White Paper**: If a passport is placed on a piece of white paper, the white paper is **BACKGROUND TRASH**. You must CROP ONLY the Passport Booklet. Ignore the white paper completely.
    - **Table/Bed Surfaces**: Remove all surrounding surfaces.
    
    **ACTION PLAN**:
    1. **DETECT**: Find the boundaries of the specific ID document (Green/Blue Passport Booklet or Plastic ID Card).
    2. **CROP**: Crop tightly to the edges of that document. Do NOT leave any margin or surrounding paper.
    3. **WARP**: Correct perspective to a flat, top-down view (0-degree scan angle).
    4. **NO MARGINS**: The output image must be the document itself, edge-to-edge.
    
    **OUTPUT**:
    - Return isolated image(s) of the documents found.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Image } },
          { text: prompt }
        ]
      }
    });

    const images: string[] = [];

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          images.push(part.inlineData.data);
        }
      }
    }

    if (images.length === 0) {
        throw new Error("No document generated.");
    }

    return images;
  } catch (error) {
    console.error("DocuScan Error:", error);
    throw error;
  }
};

export const convertPdfToWordHtml = async (base64Pdf: string): Promise<string> => {
    try {
        const ai = getClient();
        const model = 'gemini-2.5-flash';
        
        const prompt = `
        You are a high-end Document Layout Analysis engine.
        Reconstruct the attached PDF document with 100% fidelity to the original layout as HTML.
        Use HTML Tables for layout. Return a SINGLE valid HTML string.
        `;

        const response = await ai.models.generateContent({
            model,
            contents: {
                parts: [
                    { inlineData: { mimeType: 'application/pdf', data: base64Pdf } },
                    { text: prompt }
                ]
            }
        });
        
        let text = response.text || "";
        text = text.replace(/^```html/, "").replace(/```$/, "").trim();
        return text;
    } catch (error) {
        console.error("PDF to Word Error", error);
        throw new Error("Failed to convert PDF to Word.");
    }
};

export const enhanceHtmlForPdf = async (rawHtml: string): Promise<string> => {
    try {
        const ai = getClient();
        const model = 'gemini-2.5-flash';
        
        const imgMap = new Map<string, string>();
        let imgCounter = 0;
        
        const htmlWithPlaceholders = rawHtml.replace(/<img\s+[^>]*src=["']data:image\/[^;]+;base64,[^"']+["'][^>]*>/gi, (match) => {
             const placeholder = `___IMG_${imgCounter++}___`; 
             imgMap.set(placeholder, match);
             return `<div id="${placeholder}">${placeholder}</div>`; 
        });

        const prompt = `
        You are a Professional Document Formatter. 
        Style the provided HTML for a high-quality PDF export (Fonts, Margins, Table Borders).
        Preserve the image placeholders like <div id="___IMG_0___">...</div>.
        Raw HTML Input:
        ${htmlWithPlaceholders.substring(0, 45000)} 
        `;
        
        const response = await ai.models.generateContent({
            model,
            contents: prompt
        });
        
        let text = response.text || "";
        text = text.replace(/```html/g, '').replace(/```/g, '');

        imgMap.forEach((originalTag, token) => {
            const divRegex = new RegExp(`<div[^>]*id="${token}"[^>]*>.*?</div>`, 's');
            if (divRegex.test(text)) {
                 text = text.replace(divRegex, originalTag);
            } else {
                 text = text.split(token).join(originalTag);
            }
        });

        return text;
    } catch (e) {
        return rawHtml; 
    }
};

export const generateCvHtml = async (cvData: any, userInstruction: string = ""): Promise<string> => {
  const ai = getClient();
  
  const { photoBase64, ...dataWithoutPhoto } = cvData;
  const layoutId = cvData.layoutId || Math.floor(Math.random() * 10000);
  const jobRole = cvData.jobRole || "Professional";
  
  const aiAnalysisData = { 
      ...dataWithoutPhoto, 
      photoBase64: photoBase64 ? "EXISTS" : null 
  };

  const prompt = `
  You are an elite AI CV Architect & Renderer with a master-level understanding of CSS Grid, Typography, and Color Theory.

  **CORE OBJECTIVE**: 
  Transform the provided User Data (JSON) into a visually flawless, high-contrast, professional HTML5 CV for a PDF export.
  
  **DESIGN SEED**: ${layoutId} (Use this to deterministically select a UNIQUE layout structure).
  **TARGET ROLE**: ${jobRole}
  **USER REQUEST**: "${userInstruction}"

  **CRITICAL CONTRAST & READABILITY RULES (AI MUST VALIDATE)**:
  1. **Background/Text Contrast**: 
     - IF background is DARK (e.g., #1a202c, #003366), text MUST be WHITE (#ffffff).
     - IF background is LIGHT (e.g., #ffffff, #f7fafc), text MUST be DARK (#1a202c).
     - **NEVER** place gray text on a colored background.
  2. **Section Distinctiveness**: Use clear headers with distinct colors or background bands to separate Contact, Education, and Experience.
  3. **No Overflow**: Ensure the layout fits comfortably on an A4 page. Adjust font sizes (10pt-12pt for body) automatically to fit content.

  **TEMPLATE ENGINE LOGIC (MASTER LAYOUTS)**:
  Based on the Seed, choose one of these styles but ensure it's **COMPLETE**:
  - **Modern Split**: 1/3 Left Sidebar (Dark background, White Text) for Contact/Skills, 2/3 Right (White background, Dark Text) for Experience.
  - **Classic Header**: Top full-width header (accent color), body content in clean single or double columns.
  - **Minimalist Grid**: Clean whitespace, subtle borders, elegant serif fonts for headings.
  - **Executive**: Dark Navy or Charcoal accents, highly structured, very formal.

  **CONTENT RULES**:
  - **Render EVERY item** in Experience/Education. Do not summarize or skip.
  - If details are empty, generate 3 professional bullet points relevant to the role.
  - **Photo**: Render the photo as a circle or rounded square with a border.

  **TECHNICAL OUTPUT**:
  - Return **ONLY** raw HTML string.
  - Embed CSS in \`<style>\` tags.
  - Use \`@page { size: A4; margin: 0; }\` in CSS.
  - Body width must be 210mm. Min-height 297mm.
  - Image Src: Use \`[[PHOTO_PLACEHOLDER]]\` for the user photo.

  **INPUT DATA**:
  ${JSON.stringify(aiAnalysisData, null, 2)}
  `;

  let text = "";
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });
    text = response.text || "";
  } catch (error) {
    console.warn("Gemini 3 Pro failed, falling back to Flash", error);
    try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });
        text = response.text || "";
    } catch (finalError) {
        console.error("CV Generation Final Error:", finalError);
        throw new Error("Failed to generate CV. Please check your internet or API limits.");
    }
  }

  text = text.replace(/^```html/, '').replace(/```$/, '').trim();
  
  const placeholderRegex = /\[\[PHOTO_PLACEHOLDER\]\]|"%5B%5BPHOTO_PLACEHOLDER%5D%5D"|%5B%5BPHOTO_PLACEHOLDER%5D%5D/g;

  if (photoBase64) {
      const dataUri = `data:image/jpeg;base64,${photoBase64}`;
      text = text.replace(placeholderRegex, dataUri);
      text = text.replace(/src=["']EXISTS["']/gi, `src="${dataUri}"`);
      text = text.replace(/data:image\/[a-zA-Z]+;base64,EXISTS/g, dataUri);
  } else {
      const fallback = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI1MCIgZmlsbD0iI2UzZTNlMyIvPjwvc3ZnPg==";
      text = text.replace(placeholderRegex, fallback);
      text = text.replace(/src=["']EXISTS["']/gi, `src="${fallback}"`);
      text = text.replace(/data:image\/[a-zA-Z]+;base64,EXISTS/g, fallback);
  }
  
  return text;
};

export const generateAdHtml = async (adData: any, customInstruction: string = ""): Promise<string> => {
  const ai = getClient();
  const seed = Date.now();
  const jobCount = adData.jobs.length;
  
  const prompt = `
  You are a World-Class Graphic Designer for Social Media Advertising.
  
  **TASK**: Create a High-Impact, **SQUARE (1080x1080px)** Recruitment Ad in HTML.
  
  **DYNAMIC TEMPLATE SEED**: ${seed} (CRITICAL: Use this to create a COMPELTELY DIFFERENT LAYOUT from previous generations).
  **USER CUSTOM INSTRUCTION**: "${customInstruction}"
  
  **DESIGN VARIATION RULES (MANDATORY)**:
  - **Layout**: Do NOT always use a standard grid. Randomize between:
    - **Split Screen**: Image on left/top, text on right/bottom.
    - **Overlay**: Full background image with semi-transparent text blocks.
    - **Asymmetric**: Header diagonal, job list floating.
    - **Card Grid**: Classic grid but with unique card shapes (rounded, skewed).
  - **Color Palette**: Select a professional palette based on the "Company" or random (e.g., Deep Blue/Gold, Red/Black, Teal/White).
  - **Typography**: Vary font pairings (Serif headers with Sans body, or Bold Condensed headers).

  **STRICT CONSTRAINT**: The ad MUST be exactly 1080px height x 1080px width. **NO OVERFLOW OR SCROLLING**. Everything must fit perfectly.

  **CONTENT REQUIREMENTS**:
  1. **Header**: "URGENT REQUIREMENT FOR ${adData.country.toUpperCase()}" + "${adData.company}".
  2. **Job List**: Display ${jobCount} jobs.
     - For each job, show Title, Salary, Count.
     - Include a high-quality Action Shot Image.
  3. **Footer**: "BRING DOCUMENTS TO OFFICE", "Rana Trade Test Center – Attock", "0572603447".

  **DATA TO RENDER**:
  ${JSON.stringify(adData.jobs)}

  **IMAGE GENERATION**:
  For EACH job card, generate a custom <img> tag using Pollinations AI:
  \`https://image.pollinations.ai/prompt/cinematic%20photo%20of%20{ACTION_DESCRIPTION}%20professional%20uniform%20high%20detail?width=600&height=600&nologo=true&seed=${seed}&model=flux\`
  
  - Replace {ACTION_DESCRIPTION} with a person actively doing the job (e.g. "plumber fixing pipe").

  **TECHNICAL OUTPUT**:
  - Return **ONLY** raw HTML with embedded CSS.
  - Container \`#ad-container\` must have \`width: 1080px; height: 1080px; overflow: hidden;\`.
  `;

  let text = "";
  try {
     const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
     });
     text = response.text || "";
  } catch (e) {
     console.warn("Ad Generation fallback", e);
     const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
     });
     text = response.text || "";
  }

  text = text.replace(/^```html/, '').replace(/```$/, '').trim();
  return text;
};

export const helperFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};