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
    console.log('M-Pesa callback received:', JSON.stringify(payload, null, 2));

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Extract callback data
    const { Body } = payload;
    const { stkCallback } = Body;

    const resultCode = stkCallback.ResultCode;
    const checkoutRequestId = stkCallback.CheckoutRequestID;
    const merchantRequestId = stkCallback.MerchantRequestID;

    console.log('Payment result:', { resultCode, checkoutRequestId, merchantRequestId });

    if (resultCode === 0) {
      // Payment successful
      const callbackMetadata = stkCallback.CallbackMetadata?.Item || [];
      
      // Extract payment details
      const amount = callbackMetadata.find((item: any) => item.Name === 'Amount')?.Value;
      const mpesaReceiptNumber = callbackMetadata.find((item: any) => item.Name === 'MpesaReceiptNumber')?.Value;
      const transactionDate = callbackMetadata.find((item: any) => item.Name === 'TransactionDate')?.Value;
      const phoneNumber = callbackMetadata.find((item: any) => item.Name === 'PhoneNumber')?.Value;

      console.log('Payment details:', { amount, mpesaReceiptNumber, transactionDate, phoneNumber });

      // Update loan disbursement record
      const { data: disbursement, error: fetchError } = await supabase
        .from('loan_disbursements')
        .select('*')
        .eq('transaction_code', checkoutRequestId)
        .single();

      if (fetchError) {
        console.error('Error fetching disbursement:', fetchError);
        throw new Error('Disbursement record not found');
      }

      // Update with payment verification
      const { error: updateError } = await supabase
        .from('loan_disbursements')
        .update({
          payment_verified: true,
          transaction_code: mpesaReceiptNumber || checkoutRequestId,
          updated_at: new Date().toISOString(),
        })
        .eq('transaction_code', checkoutRequestId);

      if (updateError) {
        console.error('Error updating disbursement:', updateError);
        throw new Error('Failed to update payment status');
      }

      // Update loan application status
      const { error: appUpdateError } = await supabase
        .from('loan_applications')
        .update({
          status: 'approved',
          updated_at: new Date().toISOString(),
        })
        .eq('id', disbursement.application_id);

      if (appUpdateError) {
        console.error('Error updating application:', appUpdateError);
      }

      console.log('Payment verified and records updated successfully');
    } else {
      // Payment failed
      console.log('Payment failed with result code:', resultCode);
      console.log('Result description:', stkCallback.ResultDesc);

      // Update record to reflect failure
      const { error: updateError } = await supabase
        .from('loan_disbursements')
        .update({
          payment_verified: false,
          updated_at: new Date().toISOString(),
        })
        .eq('transaction_code', checkoutRequestId);

      if (updateError) {
        console.error('Error updating failed payment:', updateError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Callback processed' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in M-Pesa callback:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
