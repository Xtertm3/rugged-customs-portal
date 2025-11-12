import { GoogleGenAI } from "@google/genai";

// Per coding guidelines, initialize directly with process.env.API_KEY
// and assume it is always available.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });
    
    // Trim any leading/trailing whitespace from the response for a cleaner look
    return response.text.trim();
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Gemini API Error: ${error.message}`);
    }
    throw new Error("An unknown error occurred while communicating with the Gemini API.");
  }
};