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
      - **DATE_ISSUE**: Must be in the past, but not more than 10 years ago.
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

export const validateProfileData = async (nationality: string, phone: string, email: string): Promise<{
    phoneValid: boolean;
    phoneMessage: string;
    emailValid: boolean;
    emailMessage: string;
}> => {
    try {
        const ai = getClient();
        const prompt = `
        Validate the consistency of this user profile data:
        Nationality: "${nationality}"
        Phone Number: "${phone}"
        Email: "${email}"

        Rules:
        1. Check if the Phone Number format matches the country standard for the given Nationality.
        2. Check if the Email address appears valid (syntax check).

        Return JSON ONLY:
        {
            "phoneValid": boolean,
            "phoneMessage": "Explanation if invalid, otherwise 'Valid'",
            "emailValid": boolean,
            "emailMessage": "Explanation if invalid, otherwise 'Valid'"
        }
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        
        return JSON.parse(response.text || "{}");
    } catch (e) {
        return { phoneValid: true, phoneMessage: "", emailValid: true, emailMessage: "" };
    }
};

export const validateNominationDetails = async (gmail: string, bankName: string, iban: string): Promise<{
  gmail: { isValid: boolean; message: string };
  bank: { isValid: boolean; correctedName: string; message: string };
  iban: { isValid: boolean; message: string };
}> => {
  try {
      const ai = getClient();
      const prompt = `
      You are a Banking Data Validator. Analyze these 3 fields:
      
      1. **Gmail**: "${gmail}"
         - Check if it is a valid Gmail address format.
      
      2. **Bank Name**: "${bankName}"
         - Fix grammar or spelling (e.g., "hbl bank" -> "HBL", "meezaan" -> "Meezan Bank").
         - If it looks completely invalid, mark invalid.
      
      3. **IBAN**: "${iban}"
         - Check if the length and format look plausible for an International Bank Account Number (usually 24 chars for PK).
         - Ignore spaces in your validation logic, just check the alphanumeric structure.

      **Return JSON ONLY**:
      {
        "gmail": { "isValid": boolean, "message": "string" },
        "bank": { "isValid": boolean, "correctedName": "string", "message": "string" },
        "iban": { "isValid": boolean, "message": "string" }
      }
      `;

      const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: { responseMimeType: 'application/json' }
      });

      return JSON.parse(response.text || "{}");
  } catch (e) {
      console.error(e);
      return {
          gmail: { isValid: true, message: "Skipped" },
          bank: { isValid: true, correctedName: bankName, message: "Skipped" },
          iban: { isValid: true, message: "Skipped" }
      };
  }
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
    // Using gemini-2.5-flash-image
    const model = 'gemini-2.5-flash-image';
    
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
        throw new Error(`The model returned text instead of an image. Try again.`);
    }

    throw new Error("No image generated by the model.");
  } catch (error) {
    console.error("Identity Lab Error:", error);
    throw error;
  }
};

export const generateEnhancedDocument = async (base64Image: string, mimeType: string, instruction: string = ""): Promise<string[]> => {
  try {
    const ai = getClient();
    const model = 'gemini-2.5-flash-image';
    
    const prompt = `
    You are an advanced Computer Vision AI specializing in Intelligent Document Scanning.
    
    **TASK**: Isolate, Crop, and Enhance the specific document from the image.
    **USER FOCUS INSTRUCTION**: "${instruction || 'Main Identity Document'}"
    
    **EXECUTION STEPS**:
    1. **DETECT**: Locate the document specified by the user. If generic, find the main ID card, Passport, or Paper.
    2. **CROP & CLEAN**: 
       - Remove ALL background surfaces (tables, beds, hands).
       - The output must ONLY contain the document.
       - **MARGINS**: Add a clean white padding of approximately 2cm equivalent around the document.
    3. **ENHANCE**: 
       - Fix perspective (dewarp to flat 90-degree view).
       - Enhance text contrast for readability.
       - Ensure lighting is even.
    
    **OUTPUT**:
    - Return the processed image.
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
  You are an elite AI CV Architect & Renderer.

  **CORE OBJECTIVE**: 
  Transform User Data into a flawless, High-Contrast HTML5 CV for PDF export.
  
  **VISUAL & CONTRAST RULES (CRITICAL)**:
  1. **Backgrounds vs Text**: 
     - If a background is DARK (e.g., #1e293b, #000, #003366), text MUST be WHITE (#FFF).
     - If a background is LIGHT (e.g., #FFF, #f0f0f0), text MUST be DARK (#000, #333).
     - **NEVER** place gray text on a dark background or dark text on a dark background.
  2. **Structure**: Use HTML TABLES (\`<table>\`) or FLEXBOX (\`display: flex\`) for layout solidity. Avoid complex CSS Grids that break in PDF converters.
  3. **Margins**: Ensure standard A4 margins (padding: 10mm).
  
  **DESIGN TEMPLATE**:
  Based on Seed ID: **${layoutId}**, fetch and replicate a MODERN, PROFESSIONAL CV style (e.g., Harvard, Minimalist, Tech, Creative).
  - Vary the layout significantly based on the seed.
  - *Sidebar Layout* vs *Single Column* vs *Header Heavy*.
  - Use high-quality typography (Inter, Roboto, Lato).

  **USER REQUEST**: "${userInstruction}"

  **CONTENT AUTO-GENERATION**:
  1. **CAREER OBJECTIVE**: Auto-write tailored to "${jobRole}".
  2. **RESPONSIBILITIES**: Auto-fill bullet points for Experience if empty.
  3. **SKILLS**: Auto-fill if empty.
  
  **TECHNICAL OUTPUT**:
  - Return **ONLY** raw HTML string with embedded CSS.
  - Use \`@page { size: A4; margin: 0; }\`
  - Body width must be 210mm. Min-height 297mm.
  - Image Src: \`[[PHOTO_PLACEHOLDER]]\`
  - **IMPORTANT**: CSS must be inline or in <style> block.

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
  
  const jobsList = adData.jobs.map((j: any) => {
    const benefits = [];
    if (j.iqama) benefits.push("Iqama/Akama");
    if (j.accommodation) benefits.push("Accommodation");
    if (j.medical) benefits.push("Medical");
    if (j.transport) benefits.push("Transport");
    
    // Add License Info if present
    if (j.license) benefits.push(`${j.license} License Required`);

    return `
    Job: ${j.title}
    Salary: ${j.salary} ${adData.currency}
    Duty Hours: ${j.dutyHours ? j.dutyHours + ' Hours' : 'Standard'}
    Count: ${j.count || 'Umlimited'}
    Benefits Included: ${benefits.join(', ') || 'Standard'}
    `;
  }).join('\n----------------\n');

  const footerPhoneHtml = adData.showSecondaryPhone 
      ? `
        <div style="font-size: 1.8em; font-weight: 800; color: #fff; line-height: 1.2;">0572603447</div>
        <div style="font-size: 1.2em; color: #4ade80; margin-top: 5px; font-weight: bold;">
            <span style="background: rgba(0,0,0,0.5); padding: 2px 8px; border-radius: 4px;">0317 5674676</span> 
            <span style="font-size: 0.7em; color: #fff; display: block;">(For sending documents only)</span>
        </div>
      `
      : `<div style="font-size: 2.5em; font-weight: 800; color: #fff;">0572603447</div>`;

  // Construction of Interview Details for Prompt
  let interviewPromptDetails = "";
  if (adData.showInterviewMode) {
      interviewPromptDetails += `\n- **Interview Mode**: ${adData.interviewMode}`;
  }
  if (adData.showInterviewDate) {
      interviewPromptDetails += `\n- **Interview Date**: ${adData.interviewDate}`;
  }

  const prompt = `
  You are an Elite Digital Marketing Art Director & Senior Frontend Developer.
  
  **TASK**: 
  Create a **LUXURY, HIGH-IMPACT, SQUARE (1080x1080px)** Recruitment Ad in pure HTML/CSS.
  
  **DESIGN LANGUAGE**:
  - **Style**: Ultra-Modern, Premium, High-Contrast. Think "Black & Gold" or "Deep Navy & Neon Cyan".
  - **Aesthetics**: Glassmorphism cards, glowing gradients, bold typography (Roboto/Montserrat).
  - **Layout**: Use a powerful CSS Grid layout. Ensure it looks like a professional Photoshop poster.
  
  **CONTENT DATA**:
  - **Header**: "URGENT HIRING FOR ${adData.country.toUpperCase()}"
  - **Company**: ${adData.company || ""}
  - **Currency**: ${adData.currency}
  - **Positions**:
  ${jobsList}
  ${interviewPromptDetails ? `\n- **Interview Details**: ${interviewPromptDetails}` : ''}
  - **Footer**: 
    - "IF YOU ARE INTERESTED BRING DOCUMENTS TO RANA OFFICE ATTOCK" (Translate if language is Urdu)
    - Phones: (Insert the phone HTML block provided below)
  
  **LANGUAGE RULES**:
  - User requested: **${adData.language}**.
  - If "Urdu": Translate Header, Job Titles, Benefits, and Footer instructions to Urdu.
  - If "Both": Show English Heading, then Urdu Subheading.
  
  **STRICT VISUAL RULES (DO NOT BREAK)**:
  1. **Dimensions**: Root container MUST be \`width: 1080px; height: 1080px;\` fixed. No percentage widths for root.
  2. **Margins**: Main content must have 50px padding.
  3. **Typography**: Large, readable, bold fonts.
  4. **Job Cards**: Each job should be a distinct card with a glass effect background.
  
  **IMAGE GENERATION RULES (CRITICAL)**:
  - For EACH job, generate an \`<img>\` tag using Pollinations AI.
  - **PROMPT ENGINEERING**: You MUST enforce "YOUNG MAN" in the prompt.
  - **URL Structure**: \`https://image.pollinations.ai/prompt/cinematic%20portrait%20of%20a%20young%20handsome%2025%20year%20old%20${adData.country}%20{JOB_TITLE_HERE}%20worker%20man%20professional%20uniform%20site%204k%20lighting?width=400&height=400&nologo=true&seed=${seed}\`
  - **FORBIDDEN**: Do not generate images of old men, sketches, or cartoons. Realism only.
  
  **USER OVERRIDE**:
  ${customInstruction ? `User Custom Instructions (Highest Priority): "${customInstruction}"` : ''}

  **OUTPUT FORMAT**:
  - Return **ONLY** raw HTML code.
  - CSS must be embedded in \`<style>\`.
  - Root div must have ID \`ad-container\`.
  - Footer Phone HTML to insert: ${footerPhoneHtml}
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