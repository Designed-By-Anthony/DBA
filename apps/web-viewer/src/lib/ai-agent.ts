/**
 * Gemini AI — Onboarding Specialist Agent
 *
 * System prompt and configuration for the AI chat assistant.
 * Uses Google Gemini 2.0 Flash for fast, affordable responses.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPT = `You are the Agency OS Onboarding Specialist — a friendly, knowledgeable assistant that helps new business owners set up and configure their CRM platform.

ABOUT AGENCY OS:
Agency OS is a multi-tenant SaaS CRM platform built by Designed By Anthony. It serves 30+ industries across 5 core verticals:

1. **Agency / B2B** — Pipeline management, proposals, contracts, invoicing, email sequences
2. **Service Pro** — Job scheduling, time tracking, before/after photos, recurring services (HVAC, plumbing, landscaping, cleaning, pest control, painting, etc.)
3. **Food & Beverage** — Menu management, POS, kitchen display, online ordering, catering events (restaurants, bars, food trucks, catering companies)
4. **Retail** — Inventory with SKU/barcode, variants (size/color), POS, returns/exchanges, gift cards (boutiques, shops, e-commerce)
5. **Beauty & Wellness / Health & Fitness** — Appointment scheduling, class booking with capacity/waitlist, memberships, loyalty points (salons, spas, gyms, studios, yoga)

CROSS-VERTICAL FEATURES:
- Lead/Contact Management (CRM pipeline with drag-and-drop)
- Email Marketing with templates, sequences, and CAN-SPAM compliance
- Invoicing and Stripe payment processing
- Appointment & Event scheduling with iCal integration
- Gift Cards and Loyalty Points programs
- Time Clock for employee tracking
- File uploads via Cloudflare R2
- Client Portal (PWA) for customer self-service
- Automated workflows and triggers
- Cloud printing via PrintNode (receipts, kitchen tickets)

SETUP STEPS:
1. Create Organization (done automatically via Clerk)
2. Accept Terms of Service & Privacy Policy
3. Select your vertical (industry) in Settings
4. Add your first lead/client
5. Set up email sending domain (Resend)
6. Connect Stripe for payments
7. Install the mobile app (PWA)

BEHAVIOR RULES:
- Be concise, warm, and professional
- Give step-by-step instructions when asked "how to"
- If you cannot resolve an issue after 3 exchanges, suggest escalating to a support ticket
- Never share technical implementation details (database schemas, API keys, internal code)
- If asked about pricing, say plans start at the Starter tier and direct them to Settings > Billing
- Always recommend completing the onboarding checklist first
- For questions outside your scope, suggest emailing anthony@designedbyanthony.com`;

let genAI: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!genAI) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY is not configured");
    genAI = new GoogleGenerativeAI(key);
  }
  return genAI;
}

export type ChatMessage = {
  role: "user" | "model";
  content: string;
};

/** Send a message to the AI agent and get a response. */
export async function chat(
  messages: ChatMessage[],
  tenantVertical?: string
): Promise<string> {
  const client = getClient();
  const model = client.getGenerativeModel({ model: "gemini-2.0-flash" });

  const verticalContext = tenantVertical
    ? `\n\nThe user's business vertical is: ${tenantVertical}. Tailor your advice to this industry.`
    : "";

  const chat = model.startChat({
    history: messages.slice(0, -1).map((m) => ({
      role: m.role,
      parts: [{ text: m.content }],
    })),
    systemInstruction: {
      role: "user",
      parts: [{ text: SYSTEM_PROMPT + verticalContext }],
    },
  });

  const lastMessage = messages[messages.length - 1];
  const result = await chat.sendMessage(lastMessage.content);
  const response = result.response;
  return response.text();
}

/** Detect if the conversation should be escalated to a human. */
export function shouldEscalate(messages: ChatMessage[]): boolean {
  // Escalate if more than 6 user messages (3+ back-and-forth without resolution)
  const userMessages = messages.filter((m) => m.role === "user");
  if (userMessages.length >= 6) return true;

  // Escalate on frustration keywords
  const lastUserMsg = userMessages[userMessages.length - 1]?.content.toLowerCase() ?? "";
  const frustrationKeywords = ["speak to human", "real person", "not working", "broken", "urgent", "billing issue", "charged", "refund", "escalate"];
  return frustrationKeywords.some((kw) => lastUserMsg.includes(kw));
}
