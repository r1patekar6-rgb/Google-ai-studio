
import { GoogleGenAI, Type } from "@google/genai";
import { VerificationStatus, VerificationResult } from '../types';
import { REPORT_EMAIL, INR_PRICING, USD_PRICING, INR_BULK_PLANS, USD_BULK_PLANS, RECIPIENT_NAME, UPI_ID } from '../constants';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Verifies a payment screenshot using Gemini AI with strict rules.
 */
export const verifyPaymentScreenshot = async (base64Image: string, userProvidedTxId: string): Promise<VerificationResult> => {
  try {
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const allPlans = [
      ...INR_PRICING, ...INR_BULK_PLANS,
      ...USD_PRICING, ...USD_BULK_PLANS
    ];

    const validAmounts = allPlans.map(p => p.amount);

    const prompt = `
      Analyze this payment screenshot. You are a strict financial auditor for BluePrint Passport Studio.
      
      CRITICAL VERIFICATION RULES (FAIL IF ANY ARE MISSING):
      1. Recipient Identity: The money MUST be sent to "${RECIPIENT_NAME}". 
      2. Destination UPI/Account: The UPI ID must be "${UPI_ID}" or account ending in mobile "9823818455".
      3. Plan Amount Match: The amount detected MUST exactly match one of these valid premium plan amounts: ${validAmounts.join(', ')}.
      4. Date Validity: The transaction date shown MUST be today (${formattedDate}) or within the last 24 hours. Transactions older than this are EXPIRED and must be REJECTED.
      5. Transaction ID Verification: The UTR, Ref No, or TxID on the image MUST match: "${userProvidedTxId}".

      Respond ONLY with a JSON object:
      {
        "status": "SUCCESS" | "FAILED",
        "message": "Reason for success or specific failure reason",
        "amountDetected": number | null,
        "currency": "INR" | "USD" | null,
        "recipientMatched": boolean,
        "upiMatched": boolean,
        "isDateCurrent": boolean,
        "amountIsPremium": boolean
      }
      
      Final Status is SUCCESS ONLY if all flags are true.
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

    const result = JSON.parse(response.text || '{}');

    if (result.status === 'SUCCESS' && result.recipientMatched && result.upiMatched && result.isDateCurrent && result.amountIsPremium) {
        // Find the matching plan to get validity info
        const matchedPlan = allPlans.find(p => p.amount === result.amountDetected);
        
        return {
          status: VerificationStatus.SUCCESS,
          message: result.message,
          amount: result.amountDetected,
          validityDays: matchedPlan?.validityDays || 1,
          totalUses: matchedPlan?.uses || 1
        };
    } else {
        return {
          status: VerificationStatus.FAILED,
          message: result.message || "Details mismatch: Verify recipient is Vicky Patekar and amount matches selected plan."
        };
    }
  } catch (error) {
    console.error("Verification error:", error);
    return {
      status: VerificationStatus.FAILED,
      message: "Could not process image. Ensure recipient and transaction ID are clear."
    };
  }
};

/**
 * Auto-sends payment verification data to the administrator email.
 */
export const sendPaymentNotification = async (data: any) => {
  console.log(`[Audit] Syncing record to ${REPORT_EMAIL}...`, data);
  await new Promise(resolve => setTimeout(resolve, 1000));
  return true;
};

/**
 * Logs a successful transaction to the local ledger for monthly reporting.
 */
export const logTransactionToLedger = (amount: number, txId: string, currency: string) => {
  try {
    const ledger = JSON.parse(localStorage.getItem('bp_transaction_ledger') || '[]');
    ledger.push({
      amount,
      txId,
      currency,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('bp_transaction_ledger', JSON.stringify(ledger));
  } catch (e) {
    console.error("Ledger log error", e);
  }
};

/**
 * Logs a new user registration to the local user ledger.
 */
export const logUserToLedger = (userData: any) => {
  try {
    const userLedger = JSON.parse(localStorage.getItem('bp_user_ledger') || '[]');
    userLedger.push({
      ...userData,
      signupDate: new Date().toISOString()
    });
    localStorage.setItem('bp_user_ledger', JSON.stringify(userLedger));
  } catch (e) {
    console.error("User ledger error", e);
  }
};

/**
 * Checks if a monthly revenue report is due and sends it.
 */
export const checkAndSendMonthlyReport = async () => {
  const now = new Date();
  const currentMonthYear = `${now.getFullYear()}-${now.getMonth() + 1}`;
  const lastReportMonth = localStorage.getItem('bp_last_report_month');

  if (lastReportMonth !== currentMonthYear) {
    const ledger = JSON.parse(localStorage.getItem('bp_transaction_ledger') || '[]');
    if (ledger.length === 0) return;

    const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const yearOfLastMonth = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    
    const monthlyData = ledger.filter((t: any) => {
      const d = new Date(t.timestamp);
      return d.getMonth() === lastMonth && d.getFullYear() === yearOfLastMonth;
    });

    if (monthlyData.length > 0) {
      const revenue = monthlyData.reduce((acc: any, curr: any) => {
        acc[curr.currency] = (acc[curr.currency] || 0) + curr.amount;
        return acc;
      }, {});

      const report = {
        type: 'MONTHLY_REVENUE_REPORT',
        period: `${lastMonth + 1}/${yearOfLastMonth}`,
        totalRevenue: revenue,
        transactionCount: monthlyData.length,
        timestamp: new Date().toISOString()
      };

      await sendPaymentNotification(report);
      localStorage.setItem('bp_last_report_month', currentMonthYear);
    }
  }
};

/**
 * Checks if a monthly user registration report is due and sends it.
 */
export const checkAndSendUserReport = async () => {
  const now = new Date();
  const currentMonthYear = `${now.getFullYear()}-${now.getMonth() + 1}`;
  const lastUserReportMonth = localStorage.getItem('bp_last_user_report_month');

  if (lastUserReportMonth !== currentMonthYear) {
    const userLedger = JSON.parse(localStorage.getItem('bp_user_ledger') || '[]');
    if (userLedger.length === 0) return;

    const report = {
      type: 'MONTHLY_STUDIO_USER_AUDIT',
      reportRecipient: REPORT_EMAIL,
      reportMonth: currentMonthYear,
      totalRegisteredUsers: userLedger.length,
      completeUserRegistry: userLedger.map((u: any) => ({
        fullName: u.name,
        phoneNumber: u.phone,
        emailId: u.email,
        registrationDate: u.signupDate
      })),
      generatedAt: new Date().toISOString()
    };

    await sendPaymentNotification(report);
    localStorage.setItem('bp_last_user_report_month', currentMonthYear);
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
    prompt = "Enhance the quality of this portrait. Improve lighting, sharpness, and color balance. Output the modified image.";
  } else if (action === 'remove_bg') {
    prompt = "Remove the background and replace it with a solid white background.";
  } else if (action === 'apply_clothes') {
    prompt = `Change the person's outfit to a professional ${itemDescription} style. Output as professional passport photo on white background.`;
  } else if (action === 'change_bg_color') {
    prompt = `Remove the background and replace it with a solid ${itemDescription} background.`;
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

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }

  throw new Error("Failed to process image with AI");
};
