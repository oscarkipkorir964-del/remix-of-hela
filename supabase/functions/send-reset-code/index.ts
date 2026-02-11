import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendResetCodeRequest {
  phoneNumber: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phoneNumber }: SendResetCodeRequest = await req.json();
    
    console.log('Sending reset code to:', phoneNumber);

    // Validate phone number
    if (!phoneNumber || phoneNumber.length < 10) {
      throw new Error('Invalid phone number');
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store code in memory with expiry (5 minutes)
    const expiryTime = Date.now() + 5 * 60 * 1000;
    
    // Format phone number for Africa's Talking (should start with country code)
    let formattedPhone = phoneNumber;
    if (phoneNumber.startsWith('0')) {
      formattedPhone = '254' + phoneNumber.substring(1);
    } else if (!phoneNumber.startsWith('254')) {
      formattedPhone = '254' + phoneNumber;
    }

    // Send SMS via Africa's Talking
    const apiKey = Deno.env.get('AFRICASTALKING_API_KEY');
    const username = Deno.env.get('AFRICASTALKING_USERNAME');

    if (!apiKey || !username) {
      throw new Error('Africa\'s Talking credentials not configured');
    }

    const params = new URLSearchParams({
      username: username,
      to: `+${formattedPhone}`,
      message: `Your Zenka password reset code is: ${verificationCode}. Valid for 5 minutes.`,
    });

    const smsResponse = await fetch('https://api.africastalking.com/version1/messaging', {
      method: 'POST',
      headers: {
        'apiKey': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: params.toString(),
    });

    const responseText = await smsResponse.text();
    console.log('SMS API Response Status:', smsResponse.status);
    console.log('SMS API Response:', responseText);

    if (!smsResponse.ok) {
      throw new Error(`Failed to send SMS (${smsResponse.status}): ${responseText}`);
    }

    let smsResult;
    try {
      smsResult = JSON.parse(responseText);
    } catch (e) {
      throw new Error(`Invalid API response: ${responseText}`);
    }

    // In a production app, store this in Redis or database
    // For now, we'll return the code (in production, don't do this!)
    console.log('Verification code generated:', verificationCode, 'Expires:', new Date(expiryTime));

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Verification code sent successfully',
        // ONLY FOR DEVELOPMENT - Remove in production!
        code: verificationCode,
        expiryTime 
      }), 
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error sending reset code:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to send verification code' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);
