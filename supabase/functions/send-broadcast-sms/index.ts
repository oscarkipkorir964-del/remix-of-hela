import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendBroadcastRequest {
  recipients: Array<{ phone: string; name: string }>;
  subject: string;
  message: string;
}

interface AfricasTalkingRecipient {
  cost: string;
  messageId: string;
  number: string;
  status: string;
  statusCode: number;
}

interface AfricasTalkingResponse {
  SMSMessageData: {
    Message: string;
    Recipients: AfricasTalkingRecipient[];
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipients, subject, message }: SendBroadcastRequest = await req.json();
    
    console.log('Sending broadcast SMS to', recipients.length, 'recipients');

    if (!recipients || recipients.length === 0) {
      throw new Error('No recipients provided');
    }

    if (!message) {
      throw new Error('No message provided');
    }

    const apiKey = Deno.env.get('AFRICASTALKING_API_KEY');
    const username = Deno.env.get('AFRICASTALKING_USERNAME');

    if (!apiKey || !username) {
      throw new Error('Africa\'s Talking credentials not configured');
    }

    const results: Array<{ phone: string; success: boolean; error?: string; status?: string }> = [];

    // Send SMS to each recipient
    for (const recipient of recipients) {
      try {
        // Format phone number for Africa's Talking
        let formattedPhone = recipient.phone;
        if (formattedPhone.startsWith('0')) {
          formattedPhone = '254' + formattedPhone.substring(1);
        } else if (!formattedPhone.startsWith('254') && !formattedPhone.startsWith('+254')) {
          formattedPhone = '254' + formattedPhone;
        }
        
        // Remove any + prefix for the API
        formattedPhone = formattedPhone.replace(/^\+/, '');

        // Compose the message with subject
        const fullMessage = subject 
          ? `📢 ${subject}\n\n${message}\n\n- Zenka Loans`
          : `📢 ${message}\n\n- Zenka Loans`;

        const params = new URLSearchParams({
          username: username,
          to: `+${formattedPhone}`,
          message: fullMessage,
        });

        console.log('Sending SMS to:', formattedPhone);

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
        console.log('SMS API Response for', formattedPhone, ':', smsResponse.status, responseText);

        if (smsResponse.ok) {
          // Parse the response to check actual delivery status
          try {
            const atResponse: AfricasTalkingResponse = JSON.parse(responseText);
            const recipientStatus = atResponse.SMSMessageData?.Recipients?.[0];
            
            if (recipientStatus) {
              // Check for various failure statuses from Africa's Talking
              const failureStatuses = ['InsufficientBalance', 'InvalidPhoneNumber', 'RejectedByNetwork', 'UserInBlackList'];
              
              if (failureStatuses.includes(recipientStatus.status)) {
                console.log('SMS failed with status:', recipientStatus.status);
                results.push({ 
                  phone: recipient.phone, 
                  success: false, 
                  error: recipientStatus.status,
                  status: recipientStatus.status 
                });
              } else if (recipientStatus.status === 'Success' || recipientStatus.statusCode === 101) {
                results.push({ phone: recipient.phone, success: true, status: 'Sent' });
              } else {
                // Unknown status, treat as potential failure
                results.push({ 
                  phone: recipient.phone, 
                  success: false, 
                  error: recipientStatus.status || 'Unknown status',
                  status: recipientStatus.status 
                });
              }
            } else {
              // No recipient info in response, check message
              if (atResponse.SMSMessageData?.Message?.includes('Sent to 0/')) {
                results.push({ 
                  phone: recipient.phone, 
                  success: false, 
                  error: 'SMS not delivered - check Africa\'s Talking balance' 
                });
              } else {
                results.push({ phone: recipient.phone, success: true, status: 'Sent' });
              }
            }
          } catch (parseError) {
            // If we can't parse, assume success since HTTP was 200
            results.push({ phone: recipient.phone, success: true });
          }
        } else {
          results.push({ phone: recipient.phone, success: false, error: responseText });
        }
      } catch (error: any) {
        console.error('Error sending SMS to', recipient.phone, ':', error.message);
        results.push({ phone: recipient.phone, success: false, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    // Get the first error message for feedback
    const firstError = results.find(r => !r.success)?.error;

    console.log('Broadcast complete:', successCount, 'sent,', failCount, 'failed');

    return new Response(
      JSON.stringify({ 
        success: successCount > 0 || failCount === 0, 
        message: `SMS sent to ${successCount} recipients, ${failCount} failed`,
        results,
        successCount,
        failCount,
        errorMessage: firstError
      }), 
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error sending broadcast SMS:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to send broadcast SMS' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);
