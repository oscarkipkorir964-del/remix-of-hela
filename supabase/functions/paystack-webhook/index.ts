import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-paystack-signature',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecretKey) {
      throw new Error('Paystack credentials not configured');
    }

    // Get the raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get('x-paystack-signature');

    // Verify webhook signature
    if (signature) {
      const hash = createHmac('sha512', paystackSecretKey)
        .update(body)
        .digest('hex');
      
      if (hash !== signature) {
        console.error('Invalid webhook signature');
        return new Response('Invalid signature', { status: 401 });
      }
    }

    const payload = JSON.parse(body);
    console.log('Paystack webhook received:', payload.event);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Handle different event types
    if (payload.event === 'charge.success') {
      const data = payload.data;
      const reference = data.reference;
      const amount = data.amount / 100; // Convert from kobo/cents to main currency
      const status = data.status;

      console.log('Payment successful:', { reference, amount, status });

      // Check if this is a savings deposit (reference starts with "zenka_savings_")
      if (reference.startsWith('zenka_savings_') || reference.startsWith('hela_savings_')) {
        // Extract user_id from reference (format: zenka_savings_{user_id}_{timestamp}_{timestamp2})
        const parts = reference.split('_');
        const userId = parts.slice(2, 7).join('-'); // Reconstruct UUID

        console.log('Processing savings deposit for user:', userId);

        // Update the deposit as verified
        const { error: depositError } = await supabase
          .from('savings_deposits')
          .update({ verified: true })
          .eq('transaction_code', reference);

        if (depositError) {
          console.error('Error updating deposit:', depositError);
        }

        // Update user savings balance
        const { data: existingSavings } = await supabase
          .from('user_savings')
          .select('id, balance')
          .eq('user_id', userId)
          .maybeSingle();

        if (existingSavings) {
          await supabase
            .from('user_savings')
            .update({ balance: existingSavings.balance + amount })
            .eq('user_id', userId);
        } else {
          await supabase
            .from('user_savings')
            .insert({ user_id: userId, balance: amount });
        }

        console.log('Savings updated successfully');
      }

      // Check if this is a loan disbursement payment
      const { data: disbursement } = await supabase
        .from('loan_disbursements')
        .select('*')
        .eq('transaction_code', reference)
        .maybeSingle();

      if (disbursement) {
        await supabase
          .from('loan_disbursements')
          .update({ payment_verified: true })
          .eq('id', disbursement.id);

        console.log('Loan disbursement payment verified');
      }
    } else if (payload.event === 'charge.failed') {
      const data = payload.data;
      const reference = data.reference;

      console.log('Payment failed:', { reference, reason: data.gateway_response });

      // Mark the deposit as unverified/failed
      await supabase
        .from('savings_deposits')
        .update({ verified: false })
        .eq('transaction_code', reference);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
