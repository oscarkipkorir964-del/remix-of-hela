import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, XCircle, Trash2, Download, 
  CheckSquare, Square, Loader2
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BulkActionsProps {
  applications: any[];
  deposits: any[];
  withdrawals: any[];
  onRefresh: () => void;
}

export const BulkActions = ({
  applications,
  deposits,
  withdrawals,
  onRefresh
}: BulkActionsProps) => {
  const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set());
  const [selectedDeposits, setSelectedDeposits] = useState<Set<string>>(new Set());
  const [selectedWithdrawals, setSelectedWithdrawals] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'approve_apps' | 'reject_apps' | 'verify_deposits' | 'approve_withdrawals';
    count: number;
  } | null>(null);

  const pendingApps = applications.filter(a => a.status === 'pending');
  const unverifiedDeposits = deposits.filter(d => !d.verified);
  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');

  const toggleApp = (id: string) => {
    const newSet = new Set(selectedApps);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedApps(newSet);
  };

  const toggleDeposit = (id: string) => {
    const newSet = new Set(selectedDeposits);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedDeposits(newSet);
  };

  const toggleWithdrawal = (id: string) => {
    const newSet = new Set(selectedWithdrawals);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedWithdrawals(newSet);
  };

  const selectAllApps = () => {
    if (selectedApps.size === pendingApps.length) {
      setSelectedApps(new Set());
    } else {
      setSelectedApps(new Set(pendingApps.map(a => a.id)));
    }
  };

  const selectAllDeposits = () => {
    if (selectedDeposits.size === unverifiedDeposits.length) {
      setSelectedDeposits(new Set());
    } else {
      setSelectedDeposits(new Set(unverifiedDeposits.map(d => d.id)));
    }
  };

  const selectAllWithdrawals = () => {
    if (selectedWithdrawals.size === pendingWithdrawals.length) {
      setSelectedWithdrawals(new Set());
    } else {
      setSelectedWithdrawals(new Set(pendingWithdrawals.map(w => w.id)));
    }
  };

  const executeBulkAction = async () => {
    if (!confirmAction) return;
    setIsProcessing(true);

    try {
      switch (confirmAction.type) {
        case 'approve_apps':
          await supabase.from('loan_applications').update({ status: 'approved' }).in('id', Array.from(selectedApps));
          toast.success(`${selectedApps.size} applications approved`);
          setSelectedApps(new Set());
          break;
        case 'reject_apps':
          await supabase.from('loan_applications').update({ status: 'rejected' }).in('id', Array.from(selectedApps));
          toast.success(`${selectedApps.size} applications rejected`);
          setSelectedApps(new Set());
          break;
        case 'verify_deposits':
          // Update deposits and add to savings
          for (const id of selectedDeposits) {
            const deposit = deposits.find(d => d.id === id);
            if (deposit) {
              await supabase.from('savings_deposits').update({ verified: true }).eq('id', id);
              
              const { data: existing } = await supabase
                .from('user_savings')
                .select('*')
                .eq('user_id', deposit.user_id)
                .maybeSingle();
              
              if (existing) {
                await supabase.from('user_savings')
                  .update({ balance: existing.balance + deposit.amount })
                  .eq('user_id', deposit.user_id);
              } else {
                await supabase.from('user_savings')
                  .insert({ user_id: deposit.user_id, balance: deposit.amount });
              }
            }
          }
          toast.success(`${selectedDeposits.size} deposits verified`);
          setSelectedDeposits(new Set());
          break;
        case 'approve_withdrawals':
          await supabase.from('withdrawals').update({ status: 'completed' }).in('id', Array.from(selectedWithdrawals));
          toast.success(`${selectedWithdrawals.size} withdrawals approved`);
          setSelectedWithdrawals(new Set());
          break;
      }
      onRefresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsProcessing(false);
      setConfirmAction(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Pending Applications */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={selectAllApps}>
                {selectedApps.size === pendingApps.length && pendingApps.length > 0 ? (
                  <CheckSquare className="w-4 h-4" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
              </Button>
              <h3 className="font-medium">Pending Applications ({pendingApps.length})</h3>
              {selectedApps.size > 0 && (
                <Badge variant="secondary">{selectedApps.size} selected</Badge>
              )}
            </div>
            {selectedApps.size > 0 && (
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={() => setConfirmAction({ type: 'approve_apps', count: selectedApps.size })}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Approve All
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => setConfirmAction({ type: 'reject_apps', count: selectedApps.size })}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Reject All
                </Button>
              </div>
            )}
          </div>
          
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {pendingApps.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No pending applications</p>
            ) : (
              pendingApps.map((app) => (
                <div 
                  key={app.id} 
                  className={`flex items-center gap-3 p-2 rounded ${selectedApps.has(app.id) ? 'bg-primary/10' : 'bg-muted/50'}`}
                >
                  <Checkbox 
                    checked={selectedApps.has(app.id)} 
                    onCheckedChange={() => toggleApp(app.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{app.full_name}</p>
                    <p className="text-xs text-muted-foreground">KES {app.loan_limit.toLocaleString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Unverified Deposits */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={selectAllDeposits}>
                {selectedDeposits.size === unverifiedDeposits.length && unverifiedDeposits.length > 0 ? (
                  <CheckSquare className="w-4 h-4" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
              </Button>
              <h3 className="font-medium">Unverified Deposits ({unverifiedDeposits.length})</h3>
              {selectedDeposits.size > 0 && (
                <Badge variant="secondary">{selectedDeposits.size} selected</Badge>
              )}
            </div>
            {selectedDeposits.size > 0 && (
              <Button 
                size="sm"
                onClick={() => setConfirmAction({ type: 'verify_deposits', count: selectedDeposits.size })}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Verify All
              </Button>
            )}
          </div>
          
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {unverifiedDeposits.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No unverified deposits</p>
            ) : (
              unverifiedDeposits.map((dep) => (
                <div 
                  key={dep.id} 
                  className={`flex items-center gap-3 p-2 rounded ${selectedDeposits.has(dep.id) ? 'bg-primary/10' : 'bg-muted/50'}`}
                >
                  <Checkbox 
                    checked={selectedDeposits.has(dep.id)} 
                    onCheckedChange={() => toggleDeposit(dep.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">KES {dep.amount.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground truncate">{dep.transaction_code || 'No code'}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pending Withdrawals */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={selectAllWithdrawals}>
                {selectedWithdrawals.size === pendingWithdrawals.length && pendingWithdrawals.length > 0 ? (
                  <CheckSquare className="w-4 h-4" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
              </Button>
              <h3 className="font-medium">Pending Withdrawals ({pendingWithdrawals.length})</h3>
              {selectedWithdrawals.size > 0 && (
                <Badge variant="secondary">{selectedWithdrawals.size} selected</Badge>
              )}
            </div>
            {selectedWithdrawals.size > 0 && (
              <Button 
                size="sm"
                onClick={() => setConfirmAction({ type: 'approve_withdrawals', count: selectedWithdrawals.size })}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Approve All
              </Button>
            )}
          </div>
          
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {pendingWithdrawals.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No pending withdrawals</p>
            ) : (
              pendingWithdrawals.map((w) => (
                <div 
                  key={w.id} 
                  className={`flex items-center gap-3 p-2 rounded ${selectedWithdrawals.has(w.id) ? 'bg-primary/10' : 'bg-muted/50'}`}
                >
                  <Checkbox 
                    checked={selectedWithdrawals.has(w.id)} 
                    onCheckedChange={() => toggleWithdrawal(w.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">KES {w.amount.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{w.phone_number}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Bulk Action</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {confirmAction?.type.replace('_', ' ')} <strong>{confirmAction?.count}</strong> items?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeBulkAction} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
