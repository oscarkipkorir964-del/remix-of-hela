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
    const { phoneNumber, amount, applicationId, depositType } = await req.json();

    console.log('Lipwa STK Push request received:', { phoneNumber, amount, applicationId, depositType });

    // Validate input
    if (!phoneNumber || !amount) {
      throw new Error('Missing required fields: phoneNumber or amount');
    }

    // Format phone number for Lipwa (must be in format +254XXXXXXXXX)
    let formattedPhone = phoneNumber.replace(/\D/g, ''); // Remove non-digits
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '+254' + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith('254')) {
      formattedPhone = '+' + formattedPhone;
    } else if (!formattedPhone.startsWith('+254')) {
      formattedPhone = '+254' + formattedPhone;
    }

    console.log('Formatted phone:', formattedPhone);

    // Get Lipwa credentials
    const lipwaApiKey = (Deno.env.get('LIPWA_API_KEY') ?? '').trim();
    const lipwaChannelId = (Deno.env.get('LIPWA_CHANNEL_ID') ?? '').trim();

    console.log('Lipwa channel id:', { value: lipwaChannelId, length: lipwaChannelId.length });

    if (!lipwaApiKey || !lipwaChannelId) {
      throw new Error('Lipwa credentials not configured');
    }

    // Generate unique reference
    const reference = depositType === 'savings' 
      ? `savings_${Date.now()}_${Math.random().toString(36).substring(7)}`
      : `loan_${applicationId}_${Date.now()}`;

    // Get the Supabase URL for callback
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const callbackUrl = `${supabaseUrl}/functions/v1/lipwa-callback`;

    // Lipwa API payload
    const lipwaPayload = {
      amount: Math.floor(amount),
      callback_url: callbackUrl,
      channel_id: lipwaChannelId,
      phone_number: formattedPhone,
      api_ref: reference,
    };

    console.log('Lipwa payload:', { ...lipwaPayload, api_ref: reference });

    // Send STK push request to Lipwa
    const lipwaResponse = await fetch(
      'https://pay.lipwa.app/api/payments',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lipwaApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(lipwaPayload),
      }
    );

    const lipwaResult = await lipwaResponse.json();
    console.log('Lipwa response:', lipwaResult);

    if (!lipwaResponse.ok) {
      throw new Error(lipwaResult.message || lipwaResult.error || 'Failed to initiate payment');
    }

    // Store the reference for tracking
    const supabase = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user ID from authorization header
    const authHeader = req.headers.get('Authorization');
    let userId = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id;
    }

    if (depositType === 'savings' && userId) {
      // Create savings deposit record
      await supabase.from('savings_deposits').insert({
        user_id: userId,
        amount: Math.floor(amount),
        mpesa_message: `STK Push initiated - Reference: ${reference}`,
        transaction_code: reference,
        verified: false,
      });
    } else if (applicationId) {
      // Create loan disbursement record
      await supabase.from('loan_disbursements').insert({
        application_id: applicationId,
        loan_amount: amount,
        processing_fee: amount,
        transaction_code: reference,
        payment_verified: false,
        disbursed: false,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'STK Push sent successfully. Check your phone for the M-Pesa prompt.',
        reference: reference,
        displayText: 'Please enter your M-Pesa PIN when prompted',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in Lipwa STK Push:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
