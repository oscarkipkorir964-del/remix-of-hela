import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Wallet, CheckCircle, Loader2, ArrowLeft, DollarSign, Sparkles, Phone, XCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";

const MIN_DEPOSIT_AMOUNT = 100;

// Calculate required savings based on loan amount
// Formula: 100 for KES 2000 loan, scaling up to 1500 for KES 30000 loan
const calculateRequiredSavings = (loanAmount: number): number => {
  const minLoan = 2000;
  const maxLoan = 30000;
  const minSavings = 100;
  const maxSavings = 1500;
  
  if (loanAmount <= minLoan) return minSavings;
  if (loanAmount >= maxLoan) return maxSavings;
  
  // Linear scaling: savings = 100 + (loanAmount - 2000) * (1400/28000)
  return Math.ceil(minSavings + ((loanAmount - minLoan) / (maxLoan - minLoan)) * (maxSavings - minSavings));
};

type PaymentStatus = 'idle' | 'processing' | 'waiting' | 'success' | 'failed';

const Payment = () => {
  const [loanAmount, setLoanAmount] = useState<number | null>(null);
  const [savingsBalance, setSavingsBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [pendingReference, setPendingReference] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if this is a loan disbursement flow or just savings deposit
  const isLoanFlow = loanAmount !== null && loanAmount > 0;

  useEffect(() => {
    const amount = localStorage.getItem("selectedLoanAmount");
    if (amount) {
      setLoanAmount(parseInt(amount));
    }
    fetchSavingsBalance();
    fetchPhoneNumber();
  }, []);

  // Real-time listener for deposit verification
  useEffect(() => {
    if (!pendingReference) return;

    console.log('Setting up real-time listener for reference:', pendingReference);

    // Subscribe to all updates on savings_deposits table
    const channel = supabase
      .channel(`savings-deposit-${pendingReference}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'savings_deposits',
        },
        async (payload) => {
          console.log('Deposit change received:', payload);
          const newRecord = payload.new as { verified: boolean | null; amount: number; transaction_code: string };
          
          // Check if this update is for our pending reference
          if (newRecord.transaction_code !== pendingReference) return;
          
          console.log('Matching deposit found:', newRecord);
          
          if (newRecord.verified === true) {
            setPaymentStatus('success');
            await fetchSavingsBalance();
            toast({
              title: "Payment Confirmed!",
              description: `KES ${newRecord.amount.toLocaleString()} has been added to your savings.`,
            });
            setPendingReference(null);
            setDepositAmount("");
          } else if (newRecord.verified === false) {
            // Only treat as failed if explicitly set to false (not null)
            setPaymentStatus('failed');
            toast({
              title: "Payment Failed",
              description: "The payment was not completed. Please try again.",
              variant: "destructive",
            });
            setPendingReference(null);
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    // Timeout after 2 minutes
    const timeout = setTimeout(() => {
      if (paymentStatus === 'waiting') {
        setPaymentStatus('failed');
        toast({
          title: "Payment Timeout",
          description: "We didn't receive confirmation. If you completed the payment, please contact support.",
          variant: "destructive",
        });
        setPendingReference(null);
      }
    }, 120000);

    return () => {
      supabase.removeChannel(channel);
      clearTimeout(timeout);
    };
  }, [pendingReference, paymentStatus, toast]);

  const fetchPhoneNumber = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("loan_applications")
        .select("whatsapp_number")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data?.whatsapp_number) {
        setPhoneNumber(data.whatsapp_number);
      }
    } catch (error) {
      console.error("Error fetching phone:", error);
    }
  };

  const fetchSavingsBalance = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("user_savings")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching savings:", error);
        setSavingsBalance(0);
      } else {
        setSavingsBalance(data?.balance || 0);
      }
    } catch (error) {
      console.error("Error:", error);
      setSavingsBalance(0);
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  const handlePayNow = async () => {
    const amount = parseInt(depositAmount);
    
    if (!phoneNumber.trim()) {
      toast({
        title: "Phone Required",
        description: "Please enter your M-Pesa phone number",
        variant: "destructive",
      });
      return;
    }

    if (!amount || amount < 100) {
      toast({
        title: "Invalid Amount",
        description: "Please enter at least KES 100",
        variant: "destructive",
      });
      return;
    }

    setPaymentStatus('processing');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      // Call the Lipwa STK Push function
      const { data, error } = await supabase.functions.invoke("mpesa-stk-push", {
        body: {
          phoneNumber: phoneNumber,
          amount: amount,
          depositType: 'savings',
        },
      });

      if (error) {
        throw new Error(error.message || "Failed to initiate payment");
      }

      if (!data?.success) {
        throw new Error(data?.error || "Failed to initiate payment");
      }

      // The edge function creates the deposit record, just track the reference

      setPendingReference(data.reference);
      setPaymentStatus('waiting');

      toast({
        title: "Check Your Phone",
        description: data.displayText || "Enter your M-Pesa PIN when prompted to complete the payment",
      });

    } catch (error) {
      console.error("Payment error:", error);
      setPaymentStatus('failed');
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleProceedWithLoan = async () => {
    const requiredSavings = loanAmount ? calculateRequiredSavings(loanAmount) : MIN_DEPOSIT_AMOUNT;
    if (savingsBalance === null || savingsBalance < requiredSavings) {
      toast({
        title: "Insufficient Savings",
        description: `You need at least KES ${requiredSavings.toLocaleString()} in savings to proceed with a loan of KES ${loanAmount?.toLocaleString()}`,
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const applicationId = localStorage.getItem("currentApplicationId");
      
      if (!user || !applicationId) {
        toast({
          title: "Error",
          description: "Session expired. Please start over.",
          variant: "destructive",
        });
        navigate("/application");
        return;
      }

      // Update application status to approved
      const { error: updateError } = await supabase
        .from("loan_applications")
        .update({ status: "approved" })
        .eq("id", applicationId)
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Update error:", updateError);
        toast({
          title: "Error",
          description: "Failed to process loan. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Create disbursement record
      const { error: disbursementError } = await supabase
        .from("loan_disbursements")
        .insert({
          application_id: applicationId,
          loan_amount: loanAmount,
          processing_fee: 0,
          transaction_code: `LOAN-${Date.now()}`,
          payment_verified: true,
        });

      if (disbursementError) {
        console.error("Disbursement error:", disbursementError);
      }

      // Clear localStorage
      localStorage.removeItem("currentApplicationId");
      localStorage.removeItem("zenkaLoanLimit");
      localStorage.removeItem("selectedLoanAmount");
      localStorage.removeItem("processingFee");

      toast({
        title: "Loan Approved!",
        description: "Your loan is being disbursed to your M-Pesa number.",
      });

      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);

    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetPayment = () => {
    setPaymentStatus('idle');
    setPendingReference(null);
  };

  const requiredSavings = loanAmount ? calculateRequiredSavings(loanAmount) : MIN_DEPOSIT_AMOUNT;
  const hasSufficientSavings = savingsBalance !== null && savingsBalance >= requiredSavings;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft py-8 px-4">
      <div className="container max-w-2xl mx-auto space-y-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Card className="shadow-card">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">
              {isLoanFlow ? "Secure Your Loan" : "Grow Your Savings"}
            </CardTitle>
            <CardDescription>
              {isLoanFlow 
                ? "A small savings deposit unlocks your loan instantly"
                : "Your savings journey starts here. Every shilling counts!"
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Savings Balance Card */}
            <div className="bg-gradient-to-br from-primary to-primary/80 p-6 rounded-xl text-white">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4" />
                <p className="text-sm opacity-90">Your Savings Balance</p>
              </div>
              <p className="text-3xl font-bold">KES {(savingsBalance || 0).toLocaleString()}</p>
              {isLoanFlow && (
                <div className="mt-3 flex items-center gap-2">
                  {hasSufficientSavings ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">Ready for your loan!</span>
                    </>
                  ) : (
                    <span className="text-sm opacity-80">Add KES {Math.max(0, requiredSavings - (savingsBalance || 0)).toLocaleString()} more to unlock</span>
                  )}
                </div>
              )}
            </div>

            {/* Loan Details - only show if in loan flow */}
            {isLoanFlow && (
              <div className="bg-muted/50 p-4 rounded-xl">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Loan Amount:</span>
                  <span className="font-bold">KES {loanAmount?.toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* Payment Status Display */}
            {paymentStatus === 'waiting' && (
              <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-xl border-2 border-amber-200 dark:border-amber-800 text-center space-y-4">
                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-800/40 rounded-full flex items-center justify-center mx-auto">
                  <Clock className="w-8 h-8 text-amber-600 dark:text-amber-400 animate-pulse" />
                </div>
                <div>
                  <p className="font-semibold text-amber-700 dark:text-amber-400">Waiting for Payment</p>
                  <p className="text-sm text-amber-600 dark:text-amber-500 mt-1">
                    Please enter your M-Pesa PIN on your phone to complete the payment.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-amber-600 dark:text-amber-500">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>We'll notify you once payment is confirmed</span>
                </div>
              </div>
            )}

            {paymentStatus === 'success' && (
              <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl border-2 border-green-200 dark:border-green-800 text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-800/40 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-semibold text-green-700 dark:text-green-400">Payment Successful!</p>
                  <p className="text-sm text-green-600 dark:text-green-500 mt-1">
                    Your savings have been updated.
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Button variant="cute" size="sm" onClick={() => navigate("/dashboard")}>
                    Go to Dashboard
                  </Button>
                  <Button variant="outline" size="sm" onClick={resetPayment}>
                    Make Another Deposit
                  </Button>
                </div>
              </div>
            )}

            {paymentStatus === 'failed' && (
              <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-xl border-2 border-red-200 dark:border-red-800 text-center space-y-4">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-800/40 rounded-full flex items-center justify-center mx-auto">
                  <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="font-semibold text-red-700 dark:text-red-400">Payment Failed</p>
                  <p className="text-sm text-red-600 dark:text-red-500 mt-1">
                    The payment was not completed. Please try again.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={resetPayment}>
                  Try Again
                </Button>
              </div>
            )}

            {/* Show deposit form if idle and not enough savings OR not in loan flow */}
            {paymentStatus === 'idle' && (!hasSufficientSavings || !isLoanFlow) && (
              <>
                {/* Friendly Message */}
                <div className="text-center p-4 bg-primary/5 rounded-xl border border-primary/10">
                  <p className="text-sm text-muted-foreground">
                    {isLoanFlow 
                      ? "Just a quick deposit and you're all set! We'll send a prompt to your phone."
                      : "Save effortlessly with M-Pesa. We'll send a payment prompt right to your phone."
                    }
                  </p>
                </div>

                {/* Phone Number Input */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium">M-Pesa Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="tel"
                      placeholder="0712345678"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Enter the number registered with M-Pesa</p>
                </div>

                {/* Amount Input */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Amount to Save (KES)</label>
                  <Input
                    type="number"
                    placeholder={isLoanFlow && !hasSufficientSavings 
                      ? `Minimum KES ${Math.max(0, requiredSavings - (savingsBalance || 0)).toLocaleString()}` 
                      : "Enter amount (min KES 100)"
                    }
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    min={100}
                  />
                </div>

                <Button 
                  variant="cute" 
                  size="lg"
                  className="w-full"
                  onClick={handlePayNow}
                  disabled={!phoneNumber.trim() || !depositAmount}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Pay Now
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  You'll receive an M-Pesa prompt on your phone. Just enter your PIN to complete.
                </p>
              </>
            )}

            {/* Show processing state */}
            {paymentStatus === 'processing' && (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Initiating payment...</p>
              </div>
            )}

            {/* Show proceed button only in loan flow with sufficient savings */}
            {isLoanFlow && hasSufficientSavings && paymentStatus === 'idle' && (
              <div className="space-y-4">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border-2 border-green-200 dark:border-green-800 flex gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-700 dark:text-green-400">You're All Set!</p>
                    <p className="text-sm text-green-600 dark:text-green-500">
                      Your savings are ready. Tap below to get your loan disbursed instantly.
                    </p>
                  </div>
                </div>

                <Button 
                  variant="cute" 
                  size="lg"
                  className="w-full"
                  onClick={handleProceedWithLoan}
                >
                  Get My Loan - KES {loanAmount?.toLocaleString()}
                </Button>
              </div>
            )}

            {/* Apply for Loan button - only show when not in loan flow and idle */}
            {!isLoanFlow && paymentStatus === 'idle' && (
              <Button 
                variant="cute"
                className="w-full"
                onClick={() => navigate("/application")}
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Apply for a Loan
              </Button>
            )}

            {paymentStatus === 'idle' && (
              <Button 
                variant="outline"
                className="w-full"
                onClick={() => navigate(isLoanFlow ? "/loan-selection" : "/dashboard")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {isLoanFlow ? "Back to Loan Selection" : "Back to Dashboard"}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Help Card */}
        <Card className="bg-card/50">
          <CardContent className="py-6">
            <p className="text-sm text-center text-muted-foreground">
              Need help? Contact us on WhatsApp: <strong className="text-foreground">0755440358</strong>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Payment;
