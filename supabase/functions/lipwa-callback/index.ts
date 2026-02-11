import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log('Lipwa callback received:', JSON.stringify(payload, null, 2));

    // Lipwa callback structure
    const { 
      api_ref,
      checkout_id,
      transaction_id,
      status,
      amount,
      phone_number,
      mpesa_code,
      result_desc,
      payment_date
    } = payload;

    console.log('Processing callback:', { api_ref, status, amount, mpesa_code });

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Lipwa sends "payment.success" for successful payments
    const isSuccess = status === 'payment.success' || status === 'success' || status === 'Success' || status === 'COMPLETED';
    const reference = api_ref;

    if (reference?.startsWith('savings_')) {
      // Handle savings deposit
      console.log('Processing savings deposit callback, isSuccess:', isSuccess);

      if (isSuccess) {
        // Update savings deposit as verified
        const { data: deposit, error: updateError } = await supabase
          .from('savings_deposits')
          .update({
            verified: true,
            mpesa_message: `M-Pesa Receipt: ${mpesa_code || 'N/A'}. Paid on ${payment_date || 'N/A'}`,
          })
          .eq('transaction_code', reference)
          .select('user_id, amount')
          .single();

        if (updateError) {
          console.error('Error updating deposit:', updateError);
        } else if (deposit) {
          console.log('Deposit verified:', deposit);

          // Update user savings balance
          const { data: existingSavings } = await supabase
            .from('user_savings')
            .select('balance')
            .eq('user_id', deposit.user_id)
            .single();

          if (existingSavings) {
            await supabase
              .from('user_savings')
              .update({
                balance: existingSavings.balance + deposit.amount,
                updated_at: new Date().toISOString(),
              })
              .eq('user_id', deposit.user_id);
          } else {
            await supabase
              .from('user_savings')
              .insert({
                user_id: deposit.user_id,
                balance: deposit.amount,
              });
          }

          console.log('User savings balance updated');
        }
      } else {
        // Mark deposit as failed
        await supabase
          .from('savings_deposits')
          .update({
            verified: false,
            mpesa_message: `Payment failed: ${result_desc || 'Unknown error'}`,
          })
          .eq('transaction_code', reference);

        console.log('Deposit marked as failed');
      }
    } else if (reference?.startsWith('loan_')) {
      // Handle loan disbursement payment
      console.log('Processing loan payment callback');

      if (isSuccess) {
        await supabase
          .from('loan_disbursements')
          .update({
            payment_verified: true,
            transaction_code: mpesa_code || reference,
          })
          .eq('transaction_code', reference);

        console.log('Loan payment verified');
      } else {
        await supabase
          .from('loan_disbursements')
          .update({
            payment_verified: false,
          })
          .eq('transaction_code', reference);

        console.log('Loan payment marked as failed');
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Callback processed' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error processing Lipwa callback:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Callback processing failed' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
