import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: `You are Zenka AI assistant - a friendly, professional, and knowledgeable virtual assistant for Zenka, a mobile loan application service in Kenya.

ABOUT ZENKA:
- Zenka provides quick mobile loans ranging from KES 3,450 to KES 14,600
- Loans are disbursed directly to M-Pesa within minutes after approval
- First-time users need to complete a simple application process
- Loan limits are calculated based on user profile and financial information

LOAN APPLICATION PROCESS:
1. Sign up/Login with phone number
2. Complete the loan application form (personal details, employment info, next of kin)
3. System calculates your personalized loan limit
4. Select your desired loan amount
5. Meet savings requirement (minimum KES 500 verified savings balance)
6. Receive funds via M-Pesa

SAVINGS & DEPOSITS:
- Users deposit via M-Pesa to Till Number: 6933589 (NOVARA INVESTMENTS)
- After deposit, paste the M-Pesa confirmation message in the app
- Admin verifies the deposit
- Minimum KES 500 savings required before loan disbursement
- Withdrawals available after first loan is repaid

LOAN REPAYMENT:
- Repay via M-Pesa using the provided paybill/till number
- Can make partial or full repayments
- Timely repayment improves loan limit for future loans

SAVINGS REQUIREMENT:
- Minimum savings of KES 500 required before loan disbursement
- Interest rates are competitive and disclosed before accepting the loan
- No hidden charges

SUPPORT:
- For account-specific issues, transaction problems, or urgent matters, users should click "Talk to Support" to reach a human agent
- Support email: support@zenka.co.ke
- WhatsApp support: 0755440358

GUIDELINES:
- Be friendly, professional, and helpful
- Keep answers concise but informative
- For sensitive information (account balances, transaction details, personal data), advise users to check their dashboard or contact support
- Never share or ask for passwords, PINs, or OTPs
- If you don't know something specific, guide users to contact support
- Use Kenyan Shilling (KES or KSh) for currency references` 
          },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});