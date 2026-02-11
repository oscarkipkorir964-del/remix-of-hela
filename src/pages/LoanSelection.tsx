import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { useNavigate } from "react-router-dom";
import { Banknote, CreditCard, PiggyBank, FileText, ArrowRight, Info, Eye, EyeOff, Wallet, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import zenkaLogo from "@/assets/zenka-logo.png";

const MIN_LOAN_AMOUNT = 2000;
const MAX_LOAN_AMOUNT = 30000;
const MIN_SAVINGS = 100;
const MAX_SAVINGS = 1500;

// Calculate required savings based on loan amount (100 for 2000 KES, up to 1500 for 30000 KES)
const calculateRequiredSavings = (loanAmount: number): number => {
  if (loanAmount <= MIN_LOAN_AMOUNT) return MIN_SAVINGS;
  if (loanAmount >= MAX_LOAN_AMOUNT) return MAX_SAVINGS;
  return Math.ceil(MIN_SAVINGS + ((loanAmount - MIN_LOAN_AMOUNT) / (MAX_LOAN_AMOUNT - MIN_LOAN_AMOUNT)) * (MAX_SAVINGS - MIN_SAVINGS));
};

const LoanSelection = () => {
  const [loanLimit, setLoanLimit] = useState(0);
  const [selectedAmount, setSelectedAmount] = useState(0);
  const [showBalance, setShowBalance] = useState(true);
  const [savingsBalance, setSavingsBalance] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkLoanApplication = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Check if user has an approved loan application in the database
      const { data: applications, error } = await supabase
        .from("loan_applications")
        .select("loan_limit")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error || !applications || applications.length === 0) {
        // No loan application found, redirect to application page
        localStorage.removeItem("zenkaLoanLimit");
        navigate("/application");
        return;
      }

      const limitAmount = applications[0].loan_limit;
      setLoanLimit(limitAmount);
      localStorage.setItem("zenkaLoanLimit", limitAmount.toString());
      // Default to minimum loan amount or half of limit, whichever is greater
      setSelectedAmount(Math.max(MIN_LOAN_AMOUNT, Math.floor(limitAmount / 2)));
      
      fetchSavingsBalance();
    };

    checkLoanApplication();
  }, [navigate]);

  const fetchSavingsBalance = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("user_savings")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      setSavingsBalance(data.balance);
    }
  };

  const handleSliderChange = (value: number[]) => {
    setSelectedAmount(value[0]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    if (value <= loanLimit) {
      setSelectedAmount(value);
    }
  };

  const handleProceed = () => {
    if (selectedAmount < MIN_LOAN_AMOUNT) {
      toast({
        title: "Amount Too Low",
        description: `Minimum loan amount is KES ${MIN_LOAN_AMOUNT.toLocaleString()}`,
        variant: "destructive",
      });
      return;
    }

    localStorage.setItem("selectedLoanAmount", selectedAmount.toString());
    navigate("/payment");
  };

  const requiredSavings = calculateRequiredSavings(selectedAmount);
  const hasSufficientSavings = savingsBalance >= requiredSavings;

  const quickActions = [
    { icon: PiggyBank, label: "Savings", active: false, onClick: () => navigate("/payment") },
    { icon: CreditCard, label: "Pay", active: false, onClick: () => navigate("/dashboard", { state: { openRepay: true } }) },
    { icon: FileText, label: "History", active: false, onClick: () => navigate("/dashboard", { state: { scrollToHistory: true } }) },
  ];

  

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-br from-primary via-primary to-primary/80 rounded-b-[2.5rem] pb-8 pt-6 px-4">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate("/dashboard")}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center overflow-hidden p-2">
              <img src={zenkaLogo} alt="Zenka" className="w-full h-full object-contain" />
            </div>
            <div className="text-white">
              <p className="text-sm opacity-80">Welcome,</p>
              <p className="font-bold">User</p>
            </div>
          </div>
        </div>

        {/* Balance Display */}
        <div className="text-center text-white mb-6">
          <p className="text-sm opacity-80 mb-2">Your Loan Limit (KES)</p>
          <div className="flex items-center justify-center gap-3">
            <p className="text-3xl font-bold tracking-wide">
              {showBalance ? `KES ${loanLimit.toLocaleString()}` : "****"}
            </p>
            <button 
              onClick={() => setShowBalance(!showBalance)}
              className="p-1 hover:bg-white/10 rounded-full transition-colors"
            >
              {showBalance ? (
                <EyeOff className="w-5 h-5 text-white/80" />
              ) : (
                <Eye className="w-5 h-5 text-white/80" />
              )}
            </button>
          </div>
          <div className="flex items-center justify-center gap-2 mt-2 text-sm opacity-80">
            <Wallet className="w-4 h-4" />
            <span>Savings: KES {savingsBalance.toLocaleString()}</span>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex justify-center gap-6">
          {quickActions.map((action, index) => (
            <button 
              key={index} 
              className="flex flex-col items-center gap-2"
              onClick={action.onClick}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                action.active 
                  ? "bg-white shadow-lg" 
                  : "bg-white/20 hover:bg-white/30"
              }`}>
                <action.icon className={`w-6 h-6 ${action.active ? "text-primary" : "text-white"}`} />
              </div>
              <span className={`text-xs font-medium ${action.active ? "text-white" : "text-white/70"}`}>
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 -mt-4">
        {/* Loan Amount Selection Card */}
        <Card className="shadow-card border-0 mb-4">
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-4">Select Loan Amount</h3>
            
            {/* Amount Input */}
            <div className="bg-muted/50 rounded-2xl p-4 mb-6">
              <p className="text-xs text-muted-foreground mb-2 text-center">Enter Amount (KES)</p>
              <Input
                type="number"
                value={selectedAmount}
                onChange={handleInputChange}
                max={loanLimit}
                min={MIN_LOAN_AMOUNT}
                className="text-3xl font-bold h-16 text-center border-0 bg-transparent focus-visible:ring-0"
              />
            </div>

            {/* Slider */}
            <div className="space-y-3 mb-6">
              <Slider
                value={[selectedAmount]}
                onValueChange={handleSliderChange}
                max={loanLimit}
                min={MIN_LOAN_AMOUNT}
                step={100}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>KES {MIN_LOAN_AMOUNT.toLocaleString()}</span>
                <span>KES {loanLimit.toLocaleString()}</span>
              </div>
            </div>

            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-4 gap-2 mb-6">
              {[0.25, 0.5, 0.75, 1].map((percent) => (
                <Button
                  key={percent}
                  variant={selectedAmount === Math.floor(loanLimit * percent) ? "default" : "outline"}
                  size="sm"
                  className="text-xs"
                  onClick={() => setSelectedAmount(Math.floor(loanLimit * percent))}
                >
                  {percent === 1 ? "Max" : `${percent * 100}%`}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Loan Summary Card */}
        <Card className="shadow-card border-0 mb-4">
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-4">Loan Summary</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-muted-foreground">Loan Amount</span>
                <span className="font-semibold">KES {selectedAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-muted-foreground">Required Savings</span>
                <span className="font-semibold">KES {requiredSavings.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="font-semibold">You'll Receive</span>
                <span className="font-bold text-xl text-primary">KES {selectedAmount.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Savings Requirement Info */}
        <div className={`flex items-start gap-3 p-4 rounded-xl mb-6 ${
          hasSufficientSavings 
            ? "bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800" 
            : "bg-accent/20"
        }`}>
          <Wallet className={`w-5 h-5 mt-0.5 flex-shrink-0 ${hasSufficientSavings ? "text-green-600" : "text-primary"}`} />
          <div>
            {hasSufficientSavings ? (
              <p className="text-sm text-green-700 dark:text-green-400">
                Your savings balance qualifies you for loan disbursement.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                You need at least <strong>KES {requiredSavings.toLocaleString()}</strong> in savings for a loan of KES {selectedAmount.toLocaleString()}. 
                Current balance: <strong>KES {savingsBalance.toLocaleString()}</strong>
              </p>
            )}
          </div>
        </div>

        {/* Proceed Button */}
        <Button 
          variant="cute" 
          size="lg"
          className="w-full mb-8"
          onClick={handleProceed}
          disabled={selectedAmount < MIN_LOAN_AMOUNT}
        >
          <span>{hasSufficientSavings ? "Proceed to Disbursement" : "Proceed to Fund Savings"}</span>
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default LoanSelection;
