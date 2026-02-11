import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Loader2, User, Wallet, ArrowUpRight, ArrowDownRight,
  CreditCard, History, Home, PiggyBank,
  LayoutGrid, CheckCircle, FileX, ChevronRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ChatBot } from "@/components/ChatBot";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationsCenter } from "@/components/NotificationsCenter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import zenkaLogo from "@/assets/zenka-logo.png";

interface SavingsDeposit {
  id: string;
  amount: number;
  transaction_code: string | null;
  verified: boolean;
  created_at: string;
}

interface Withdrawal {
  id: string;
  amount: number;
  phone_number: string;
  status: string;
  created_at: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const historyRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [loanApplications, setLoanApplications] = useState<any[]>([]);
  const [disbursements, setDisbursements] = useState<any[]>([]);
  const [savingsBalance, setSavingsBalance] = useState(0);
  const [savingsDeposits, setSavingsDeposits] = useState<SavingsDeposit[]>([]);
  const [showBalance, setShowBalance] = useState(true);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawPhone, setWithdrawPhone] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [showRepayDialog, setShowRepayDialog] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState<string>("");
  const [repayAmount, setRepayAmount] = useState("");
  const [activeTab, setActiveTab] = useState("home");

  useEffect(() => {
    checkUser();
    fetchData();

    const channels: any[] = [];

    const savingsChannel = supabase
      .channel('dashboard-savings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_savings' }, () => {
        fetchData();
      })
      .subscribe();
    channels.push(savingsChannel);

    const depositsChannel = supabase
      .channel('dashboard-deposits')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'savings_deposits' }, () => {
        fetchData();
      })
      .subscribe();
    channels.push(depositsChannel);

    const withdrawalsChannel = supabase
      .channel('dashboard-withdrawals')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawals' }, () => {
        fetchData();
      })
      .subscribe();
    channels.push(withdrawalsChannel);

    const appsChannel = supabase
      .channel('dashboard-applications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loan_applications' }, () => {
        fetchData();
      })
      .subscribe();
    channels.push(appsChannel);

    const disbChannel = supabase
      .channel('dashboard-disbursements')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loan_disbursements' }, () => {
        fetchData();
      })
      .subscribe();
    channels.push(disbChannel);

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, []);

  useEffect(() => {
    const state = location.state as { openRepay?: boolean; scrollToHistory?: boolean } | null;
    if (state?.openRepay) {
      setShowRepayDialog(true);
      navigate(location.pathname, { replace: true });
    }
    if (state?.scrollToHistory && historyRef.current) {
      setTimeout(() => {
        historyRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      navigate(location.pathname, { replace: true });
    }
  }, [location.state]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUser(user);
  };

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: applications, error: appError } = await supabase
        .from("loan_applications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (appError) throw appError;
      setLoanApplications(applications || []);

      if (applications && applications.length > 0) {
        const { data: disb, error: disbError } = await supabase
          .from("loan_disbursements")
          .select("*, loan_applications!inner(*)")
          .eq("loan_applications.user_id", user.id)
          .order("created_at", { ascending: false });

        if (disbError) throw disbError;
        setDisbursements(disb || []);
      }

      const { data: savings, error: savingsError } = await supabase
        .from("user_savings")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!savingsError && savings) {
        setSavingsBalance(savings.balance);
      }

      const { data: deposits, error: depositsError } = await supabase
        .from("savings_deposits")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!depositsError && deposits) {
        setSavingsDeposits(deposits);
      }

      const { data: withdrawalData, error: withdrawalError } = await supabase
        .from("withdrawals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!withdrawalError && withdrawalData) {
        setWithdrawals(withdrawalData as Withdrawal[]);
      }

      if (applications && applications.length > 0) {
        setWithdrawPhone(applications[0].whatsapp_number || "");
      }

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseInt(withdrawAmount);
    
    if (!amount || amount < 500) {
      toast.error("Minimum withdrawal amount is KES 500");
      return;
    }
    
    if (amount > savingsBalance) {
      toast.error("Insufficient balance. Your available balance is KES " + savingsBalance.toLocaleString());
      return;
    }
    
    if (!withdrawPhone || withdrawPhone.length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }

    setIsWithdrawing(true);
    try {
      const { error } = await supabase
        .from("withdrawals")
        .insert({
          user_id: user.id,
          amount: amount,
          phone_number: withdrawPhone,
          status: "pending"
        });

      if (error) throw error;

      toast.success("Withdrawal request submitted successfully!");
      setShowWithdrawDialog(false);
      setWithdrawAmount("");
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsWithdrawing(false);
    }
  };

  const activeDisbursements = disbursements.filter(d => d.disbursed);
  const latestLoan = activeDisbursements[0];
  const latestApplication = loanApplications[0];
  const loanLimit = latestApplication?.loan_limit || 50000;
  
  const totalLoanAmount = latestLoan?.loan_amount || 24000;
  const amountPaid = Math.floor(totalLoanAmount * 0.6);
  const amountDue = totalLoanAmount - amountPaid;
  const progressPercentage = (amountPaid / totalLoanAmount) * 100;
  
  const nextPaymentDate = new Date();
  nextPaymentDate.setDate(nextPaymentDate.getDate() + 15);

  const userName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'User';

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <img src={zenkaLogo} alt="Zenka" className="h-12 w-12 object-contain" />
          </div>
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 pb-24">
      {/* Header */}
      <header className="bg-card sticky top-0 z-50 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
            <span className="font-bold text-xl text-foreground">Zenka</span>
            <NotificationsCenter />
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5 space-y-5">
        {/* Greeting */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">
            Hello, {userName}!
          </h1>
          <p className="text-muted-foreground text-sm">Welcome back to Zenka</p>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {/* Repay Loan */}
            <Card 
              className="cursor-pointer hover:shadow-md active:scale-[0.98] transition-all bg-card border-0 shadow-sm"
              onClick={() => setShowRepayDialog(true)}
            >
              <CardContent className="p-4">
                <div className="w-10 h-10 mb-3 rounded-xl bg-[hsl(217,91%,60%)]/10 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-[hsl(217,91%,60%)]" />
                </div>
                <h3 className="font-semibold text-foreground">Repay Loan</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Clear your balance</p>
              </CardContent>
            </Card>

            {/* History */}
            <Card 
              className="cursor-pointer hover:shadow-md active:scale-[0.98] transition-all bg-card border-0 shadow-sm"
              onClick={() => historyRef.current?.scrollIntoView({ behavior: 'smooth' })}
            >
              <CardContent className="p-4">
                <div className="w-10 h-10 mb-3 rounded-xl bg-muted flex items-center justify-center">
                  <History className="w-5 h-5 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground">History</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Past transactions</p>
              </CardContent>
            </Card>

            {/* Withdraw */}
            <Card 
              className="cursor-pointer hover:shadow-md active:scale-[0.98] transition-all bg-card border-0 shadow-sm"
              onClick={() => setShowWithdrawDialog(true)}
            >
              <CardContent className="p-4">
                <div className="w-10 h-10 mb-3 rounded-xl bg-primary/10 flex items-center justify-center">
                  <ArrowUpRight className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">Withdraw</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Access savings</p>
              </CardContent>
            </Card>

            {/* Apply Now */}
            <Card 
              className="cursor-pointer hover:shadow-md active:scale-[0.98] transition-all bg-card border-0 shadow-sm"
              onClick={() => navigate("/application")}
            >
              <CardContent className="p-4">
                <div className="w-10 h-10 mb-3 rounded-xl bg-[hsl(217,91%,60%)]/10 flex items-center justify-center">
                  <ArrowUpRight className="w-5 h-5 text-[hsl(217,91%,60%)]" />
                </div>
                <h3 className="font-semibold text-foreground">Apply Now</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Get a new loan</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Savings Balance Card - Green Gradient */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-br from-primary via-primary to-[hsl(174,65%,40%)] p-5 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <PiggyBank className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-semibold text-white/90 uppercase tracking-wide">Savings Balance</span>
              </div>
              <Button 
                onClick={() => {
                  localStorage.removeItem("selectedLoanAmount");
                  localStorage.removeItem("currentApplicationId");
                  localStorage.removeItem("zenkaLoanLimit");
                  navigate("/payment");
                }}
                size="sm"
                className="bg-white text-primary hover:bg-white/90 font-bold shadow-md px-4"
              >
                Save Now <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-4xl font-bold text-white">KSh {savingsBalance.toLocaleString()}</span>
              <span className="text-primary-foreground/80 text-sm font-medium">+2.4%</span>
            </div>
            <p className="text-white/70 text-sm">Earning 10% APY daily</p>
          </div>
        </Card>

        {/* Loan Limit Card - Only show limit after user has applied */}
        <Card className="bg-card border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {loanApplications.length > 0 ? "Available Loan Limit" : "Get a Loan"}
              </span>
              <div className="w-10 h-10 rounded-xl bg-[hsl(217,91%,60%)]/10 flex items-center justify-center">
                <LayoutGrid className="w-5 h-5 text-[hsl(217,91%,60%)]" />
              </div>
            </div>
            {loanApplications.length > 0 ? (
              <>
                <p className="text-4xl font-bold text-foreground mb-4">KSh {loanLimit.toLocaleString()}</p>
                <div className="flex items-center gap-2 mb-4 p-3 bg-muted/50 rounded-xl">
                  <CheckCircle className="w-5 h-5 text-[hsl(217,91%,60%)]" />
                  <span className="text-sm text-muted-foreground">Your account is eligible for an instant loan</span>
                </div>
                <Button 
                  onClick={() => navigate("/loan-selection")}
                  className="w-full h-12 bg-[hsl(217,91%,60%)] hover:bg-[hsl(217,91%,55%)] text-white rounded-xl shadow-md font-semibold"
                >
                  Borrow Now
                </Button>
              </>
            ) : (
              <>
                <p className="text-xl font-semibold text-foreground mb-2">Discover your loan limit</p>
                <p className="text-sm text-muted-foreground mb-4">Apply now to see how much you can borrow instantly</p>
                <Button 
                  onClick={() => navigate("/application")}
                  className="w-full h-12 bg-[hsl(217,91%,60%)] hover:bg-[hsl(217,91%,55%)] text-white rounded-xl shadow-md font-semibold"
                >
                  Apply Now
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Loan Status */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">Loan Status</h2>
          <Card className="bg-card border-0 shadow-sm">
            <CardContent className="p-6 text-center">
              {activeDisbursements.length === 0 ? (
                <>
                  <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                    <FileX className="w-7 h-7 text-muted-foreground" />
                  </div>
                  <h3 className="font-bold text-foreground text-lg mb-1">No active loan</h3>
                  <p className="text-muted-foreground text-sm mb-4">You're all clear! Ready for a new loan?</p>
                  <Button 
                    variant="outline"
                    onClick={() => navigate("/loan-selection")}
                    className="rounded-xl px-6 border-2"
                  >
                    Check Limit
                  </Button>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <CreditCard className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground text-lg mb-1">Active Loan</h3>
                  <p className="text-3xl font-bold text-primary mb-1">KSh {amountDue.toLocaleString()}</p>
                  <p className="text-muted-foreground text-sm mb-4">Balance remaining</p>
                  <Button 
                    onClick={() => navigate("/payment", { state: { isRepayment: true } })}
                    className="rounded-xl px-6 bg-primary hover:bg-primary/90"
                  >
                    Repay Now
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div ref={historyRef} className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">Recent Activity</h2>
          <Card className="bg-card border-0 shadow-sm">
            <CardContent className="p-4">
              {savingsDeposits.length === 0 && withdrawals.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
                    <History className="w-7 h-7 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground font-medium">No recent activity</p>
                  <p className="text-sm text-muted-foreground mt-1">Your transactions will appear here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {[
                    ...savingsDeposits.slice(0, 3).map(d => ({ ...d, type: 'deposit' as const })),
                    ...withdrawals.slice(0, 2).map(w => ({ ...w, type: 'withdrawal' as const })),
                  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5).map((item) => (
                    <div 
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          item.type === 'deposit' 
                            ? 'bg-primary/15' 
                            : 'bg-[hsl(25,80%,92%)]'
                        }`}>
                          {item.type === 'deposit' ? (
                            <ArrowUpRight className="w-5 h-5 text-primary" />
                          ) : (
                            <ArrowDownRight className="w-5 h-5 text-[hsl(25,70%,50%)]" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-foreground">
                            {item.type === 'deposit' ? 'Savings Deposit' : 'Withdrawal'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-sm ${
                          item.type === 'deposit' ? 'text-primary' : 'text-[hsl(25,70%,50%)]'
                        }`}>
                          {item.type === 'deposit' ? '+' : '-'}KSh {item.amount.toLocaleString()}
                        </p>
                        <Badge 
                          variant="secondary" 
                          className={`text-[10px] px-2 py-0 h-5 ${
                            (item.type === 'deposit' && (item as SavingsDeposit).verified) || (item.type === 'withdrawal' && (item as Withdrawal).status === 'completed')
                              ? 'bg-primary/15 text-primary' 
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {item.type === 'deposit' 
                            ? ((item as SavingsDeposit).verified ? 'Complete' : 'Pending')
                            : ((item as Withdrawal).status === 'completed' ? 'Complete' : 'Pending')
                          }
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border/50 z-50 shadow-lg">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-around py-3">
            <button 
              onClick={() => setActiveTab("home")}
              className={`flex flex-col items-center gap-1 px-4 py-1 transition-colors ${
                activeTab === "home" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Home className={`w-6 h-6 ${activeTab === "home" ? "stroke-[2.5]" : ""}`} />
              <span className="text-xs font-medium">Home</span>
            </button>
            <button 
              onClick={() => {
                setActiveTab("loans");
                navigate("/loan-selection");
              }}
              className={`flex flex-col items-center gap-1 px-4 py-1 transition-colors ${
                activeTab === "loans" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <CreditCard className={`w-6 h-6 ${activeTab === "loans" ? "stroke-[2.5]" : ""}`} />
              <span className="text-xs font-medium">Loans</span>
            </button>
            <button 
              onClick={() => {
                setActiveTab("savings");
                navigate("/payment");
              }}
              className={`flex flex-col items-center gap-1 px-4 py-1 transition-colors ${
                activeTab === "savings" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Wallet className={`w-6 h-6 ${activeTab === "savings" ? "stroke-[2.5]" : ""}`} />
              <span className="text-xs font-medium">Savings</span>
            </button>
            <button 
              onClick={() => {
                setActiveTab("profile");
                navigate("/profile");
              }}
              className={`flex flex-col items-center gap-1 px-4 py-1 transition-colors ${
                activeTab === "profile" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <User className={`w-6 h-6 ${activeTab === "profile" ? "stroke-[2.5]" : ""}`} />
              <span className="text-xs font-medium">Profile</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Repay Dialog */}
      <Dialog open={showRepayDialog} onOpenChange={setShowRepayDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Repay Loan</DialogTitle>
            <DialogDescription>
              Select a loan and enter the amount you want to repay.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {activeDisbursements.length === 0 ? (
              <div className="text-center py-4 space-y-3">
                <p className="text-muted-foreground">You have no active loans to repay.</p>
                <Button 
                  onClick={() => {
                    setShowRepayDialog(false);
                    navigate("/application");
                  }}
                  className="rounded-xl"
                >
                  Apply Now
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Select Loan</Label>
                  <Select value={selectedLoanId} onValueChange={setSelectedLoanId}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Choose a loan to repay" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeDisbursements.map((loan) => (
                        <SelectItem key={loan.id} value={loan.id}>
                          KES {loan.loan_amount.toLocaleString()} - {new Date(loan.created_at).toLocaleDateString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="repayAmount">Repayment Amount (KES)</Label>
                  <Input
                    id="repayAmount"
                    type="number"
                    placeholder="Enter amount to repay"
                    value={repayAmount}
                    onChange={(e) => setRepayAmount(e.target.value)}
                    min={1}
                    className="rounded-xl"
                  />
                </div>
                <Button 
                  onClick={() => {
                    if (!selectedLoanId) {
                      toast.error("Please select a loan to repay");
                      return;
                    }
                    if (!repayAmount || parseInt(repayAmount) < 1) {
                      toast.error("Please enter a valid repayment amount");
                      return;
                    }
                    localStorage.setItem("repayLoanId", selectedLoanId);
                    localStorage.setItem("repayAmount", repayAmount);
                    setShowRepayDialog(false);
                    navigate("/payment", { state: { isRepayment: true } });
                  }} 
                  className="w-full h-12 rounded-xl"
                  disabled={!selectedLoanId || !repayAmount}
                >
                  Proceed to Payment
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Withdrawal Dialog */}
      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Withdraw Savings</DialogTitle>
            <DialogDescription>
              Enter the amount you want to withdraw. Minimum KES 500.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-center p-5 bg-primary/10 rounded-2xl">
              <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
              <p className="text-3xl font-bold text-primary">KES {savingsBalance.toLocaleString()}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Withdrawal Amount (KES)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount (min 500)"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                min={500}
                max={savingsBalance}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">M-Pesa Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="e.g. 0712345678"
                value={withdrawPhone}
                onChange={(e) => setWithdrawPhone(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <Button 
              onClick={handleWithdraw} 
              className="w-full h-12 rounded-xl"
              disabled={isWithdrawing}
            >
              {isWithdrawing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Submit Withdrawal Request"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ChatBot />
    </div>
  );
};

export default Dashboard;
