import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  CheckCircle, XCircle, BadgeCheck, AlertTriangle, 
  Search, Eye, MessageSquare, Clock
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Deposit {
  id: string;
  user_id: string;
  amount: number;
  mpesa_message: string;
  transaction_code: string | null;
  verified: boolean | null;
  created_at: string;
}

interface DepositsTabProps {
  deposits: Deposit[];
  onRefresh: () => void;
}

export const DepositsTab = ({ deposits, onRefresh }: DepositsTabProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const filteredDeposits = deposits.filter(d => {
    const matchesSearch = searchQuery === "" || 
      d.transaction_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.mpesa_message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.amount.toString().includes(searchQuery);
    
    let matchesStatus = true;
    if (statusFilter === "verified") matchesStatus = d.verified === true;
    else if (statusFilter === "pending") matchesStatus = d.verified === null || d.verified === false;
    else if (statusFilter === "failed") matchesStatus = d.verified === false;
    
    return matchesSearch && matchesStatus;
  });

  const verifyDeposit = async (id: string) => {
    try {
      // First get the deposit to find user_id and amount
      const deposit = deposits.find(d => d.id === id);
      if (!deposit) throw new Error("Deposit not found");

      const { error } = await supabase.from("savings_deposits").update({ verified: true }).eq("id", id);
      if (error) throw error;

      // Update user savings
      const { data: existingSavings } = await supabase
        .from("user_savings")
        .select("*")
        .eq("user_id", deposit.user_id)
        .maybeSingle();

      if (existingSavings) {
        await supabase
          .from("user_savings")
          .update({ balance: existingSavings.balance + deposit.amount })
          .eq("user_id", deposit.user_id);
      } else {
        await supabase
          .from("user_savings")
          .insert({ user_id: deposit.user_id, balance: deposit.amount });
      }

      toast.success("Deposit verified and balance updated!");
      onRefresh();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const rejectDeposit = async () => {
    if (!selectedDeposit) return;
    
    try {
      const { error } = await supabase
        .from("savings_deposits")
        .update({ 
          verified: false,
          mpesa_message: `${selectedDeposit.mpesa_message}\n\n[REJECTED: ${rejectReason || "No reason provided"}]`
        })
        .eq("id", selectedDeposit.id);
      
      if (error) throw error;
      toast.success("Deposit rejected with reason recorded");
      setShowRejectDialog(false);
      setSelectedDeposit(null);
      setRejectReason("");
      onRefresh();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getDepositStatus = (deposit: Deposit) => {
    if (deposit.verified === true) {
      return <Badge className="bg-green-500"><BadgeCheck className="w-3 h-3 mr-1" />Verified</Badge>;
    } else if (deposit.verified === false && deposit.mpesa_message.includes("[REJECTED:")) {
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
    } else {
      return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  const extractRejectionReason = (message: string) => {
    const match = message.match(/\[REJECTED: (.+?)\]/);
    return match ? match[1] : null;
  };

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by code, message, or amount..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="failed">Rejected/Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground">
        Showing {filteredDeposits.length} of {deposits.length} deposits
      </p>

      {filteredDeposits.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No deposits match your search
          </CardContent>
        </Card>
      ) : (
        filteredDeposits.map((d) => {
          const rejectionReason = extractRejectionReason(d.mpesa_message);
          return (
            <Card key={d.id} className={d.verified === false && rejectionReason ? "border-destructive/50" : ""}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-lg">KES {d.amount.toLocaleString()}</p>
                      {getDepositStatus(d)}
                    </div>
                    {d.transaction_code && (
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Transaction Code:</span> {d.transaction_code}
                      </p>
                    )}
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-xs font-medium text-muted-foreground mb-1">M-Pesa Message:</p>
                      <p className="text-sm break-all whitespace-pre-wrap">
                        {d.mpesa_message.replace(/\n\n\[REJECTED:.+?\]/, "")}
                      </p>
                    </div>
                    
                    {rejectionReason && (
                      <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
                        <p className="text-xs font-medium text-destructive flex items-center gap-1 mb-1">
                          <AlertTriangle className="w-3 h-3" />
                          Rejection Reason:
                        </p>
                        <p className="text-sm text-destructive">{rejectionReason}</p>
                      </div>
                    )}
                    
                    <p className="text-xs text-muted-foreground">
                      {new Date(d.created_at).toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    {d.verified !== true && !rejectionReason && (
                      <>
                        <Button size="sm" onClick={() => verifyDeposit(d.id)} className="bg-green-600 hover:bg-green-700">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Verify
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => {
                            setSelectedDeposit(d);
                            setShowRejectDialog(true);
                          }}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}

      {/* Rejection Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Reject Deposit
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this deposit of KES {selectedDeposit?.amount.toLocaleString()}.
              This will be recorded for future reference.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Rejection Reason</label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g., Invalid transaction code, Amount mismatch, Duplicate entry..."
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={rejectDeposit}>
              Reject Deposit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
