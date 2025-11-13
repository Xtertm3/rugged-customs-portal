import { GoogleGenAI } from "@google/genai";

// Initialize with the Vite environment variable or use demo mode
const apiKey = import.meta.env.VITE_API_KEY;
let ai: GoogleGenAI | null = null;

try {
  if (!apiKey) {
    console.warn('API key not found. Running in demo mode.');
  } else {
    ai = new GoogleGenAI({ apiKey });
  }
} catch (error) {
  console.warn('Failed to initialize Gemini API. Running in demo mode.');
}

export interface MaterialItem {
  id: string;
  name: string;
  units: string;
  used: string;
}

export interface PaymentRequestData {
  siteName: string;
  location: string;
  projectType: string;
  latitude?: string;
  longitude?: string;
  amount?: string;
  paymentFor?: string;
  reasons?: string;
}

/**
 * Calls the Gemini API to format payment request data into a professional summary.
 * @param data The payment request data from the form.
 * @returns A promise that resolves to the formatted summary string.
 */
export const generatePaymentRequestSummary = async (data: PaymentRequestData): Promise<string> => {
  
  const paymentDetailsSection = (data.amount && data.paymentFor) ? `
PAYMENT DETAILS:
      - Payment For: ${data.paymentFor}
      - Amount: ${data.amount}
      ${data.reasons ? `- Reasons: ${data.reasons}` : ''}`
 : '';

  const prompt = `
    Act as a professional administrative assistant for Rugged Customs, a construction company.
    Format the following site completion and final payment details into a clear and professional summary.
    The output must be plain text, suitable for copying into an email or an internal messaging system. Do not use Markdown or any special formatting.
    Ensure the summary is well-structured and easy to read.
    
    Site Completion Details:
    - Site Name: ${data.siteName}
    - Location: ${data.location}
    - Coordinates: ${data.latitude}, ${data.longitude}
    - Project Type: ${data.projectType}
    - Payment For: ${data.paymentFor}
    - Amount: ${data.amount}
    - Reasons: ${data.reasons}

    Generate a summary with the following exact structure:
    
    ==================================================
    SITE COMPLETION & PAYMENT NOTIFICATION
    ==================================================
    
    SUBJECT: Completion Submitted for Site: ${data.siteName}
    
    SITE DETAILS:
      - Site: ${data.siteName}
      - Location: ${data.location}
      ${data.latitude && data.longitude ? `- Coordinates: ${data.latitude}, ${data.longitude}` : ''}
      - Project Type: ${data.projectType}
    
    ${paymentDetailsSection ? paymentDetailsSection.trim() + '\n' : ''}
    --------------------------------------------------
    End of Notification
    --------------------------------------------------
  `;

  try {
    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt
        });
        
        const text = response.text;
        if (!text) {
          throw new Error('No response received from Gemini API');
        }
        return text.trim();
      } catch (apiError) {
        console.warn("Gemini API error, falling back to demo mode:", apiError);
        // Fall through to demo response
      }
    }

    // Demo/fallback response when API is not available or fails
    return `
==================================================
SITE COMPLETION & PAYMENT NOTIFICATION
==================================================

SUBJECT: Completion Submitted for Site: ${data.siteName}

SITE DETAILS:
  - Site: ${data.siteName}
  - Location: ${data.location}
  ${data.latitude && data.longitude ? `- Coordinates: ${data.latitude}, ${data.longitude}` : ''}
  - Project Type: ${data.projectType}

${data.amount && data.paymentFor ? `PAYMENT DETAILS:
  - Payment For: ${data.paymentFor}
  - Amount: ${data.amount}
  ${data.reasons ? `- Reasons: ${data.reasons}` : ''}
` : ''}
--------------------------------------------------
End of Notification
--------------------------------------------------`.trim();

  } catch (error) {
    console.error("Error generating summary:", error);
    if (error instanceof Error) {
      throw new Error(`Summary Generation Error: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating the summary.");
  }
};
