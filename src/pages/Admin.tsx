import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, FileText, MessageSquare, CheckCircle, XCircle, Clock, 
  Wallet, PiggyBank, ArrowDownToLine, Eye, EyeOff, Search, 
  Filter, Activity, BarChart3, Users, CheckSquare, Download, Megaphone
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Import components
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminStats } from "@/components/admin/AdminStats";
import { DepositsTab } from "@/components/admin/DepositsTab";
import { SupportChat } from "@/components/admin/SupportChat";
import { ActivityLog } from "@/components/admin/ActivityLog";
import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard";
import { UserManagement } from "@/components/admin/UserManagement";
import { BulkActions } from "@/components/admin/BulkActions";
import { ExportReports } from "@/components/admin/ExportReports";
import { BroadcastMessaging } from "@/components/admin/BroadcastMessaging";

const Admin = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [supportRequests, setSupportRequests] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [disbursements, setDisbursements] = useState<any[]>([]);
  const [expandedApp, setExpandedApp] = useState<string | null>(null);
  const [withdrawalConfirm, setWithdrawalConfirm] = useState<{ id: string; action: 'approve' | 'reject'; amount: number; phone: string } | null>(null);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [appStatusFilter, setAppStatusFilter] = useState("all");
  
  const [stats, setStats] = useState({
    totalApplications: 0,
    pendingApplications: 0,
    approvedLoans: 0,
    pendingSupport: 0,
    pendingWithdrawals: 0,
    unverifiedDeposits: 0,
    pendingDisbursements: 0,
    totalMembers: 0,
  });

  useEffect(() => {
    checkAdminAccess();

    // Set up real-time subscriptions
    const channels: any[] = [];

    const appsChannel = supabase
      .channel('admin-applications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loan_applications' }, () => {
        fetchAllData();
      })
      .subscribe();
    channels.push(appsChannel);

    const supportChannel = supabase
      .channel('admin-support')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_requests' }, () => {
        fetchAllData();
      })
      .subscribe();
    channels.push(supportChannel);

    const withdrawalsChannel = supabase
      .channel('admin-withdrawals')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawals' }, () => {
        fetchAllData();
      })
      .subscribe();
    channels.push(withdrawalsChannel);

    const depositsChannel = supabase
      .channel('admin-deposits')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'savings_deposits' }, () => {
        fetchAllData();
      })
      .subscribe();
    channels.push(depositsChannel);

    const disbChannel = supabase
      .channel('admin-disbursements')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loan_disbursements' }, () => {
        fetchAllData();
      })
      .subscribe();
    channels.push(disbChannel);

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      setUser(user);

      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (error) throw error;

      if (!roles) {
        toast.error("Access denied. Admin privileges required.");
        navigate("/dashboard");
        return;
      }

      setIsAdmin(true);
      fetchAllData();
    } catch (error: any) {
      console.error("Error checking admin access:", error);
      toast.error("Failed to verify admin access");
      navigate("/dashboard");
    }
  };

  const fetchAllData = async () => {
    try {
      const [appsRes, supportRes, withdrawalsRes, depositsRes, disbursementsRes] = await Promise.all([
        supabase.from("loan_applications").select("*").order("created_at", { ascending: false }),
        supabase.from("support_requests").select("*").order("created_at", { ascending: false }),
        supabase.from("withdrawals").select("*").order("created_at", { ascending: false }),
        supabase.from("savings_deposits").select("*").order("created_at", { ascending: false }),
        supabase.from("loan_disbursements").select("*, loan_applications(full_name, whatsapp_number)").order("created_at", { ascending: false }),
      ]);

      if (appsRes.error) throw appsRes.error;
      if (supportRes.error) throw supportRes.error;
      if (withdrawalsRes.error) throw withdrawalsRes.error;
      if (depositsRes.error) throw depositsRes.error;
      if (disbursementsRes.error) throw disbursementsRes.error;

      setApplications(appsRes.data || []);
      setSupportRequests(supportRes.data || []);
      setWithdrawals(withdrawalsRes.data || []);
      setDeposits(depositsRes.data || []);
      setDisbursements(disbursementsRes.data || []);

      // Calculate stats
      const uniqueUsers = new Set(appsRes.data?.map(app => app.user_id)).size;
      const pending = appsRes.data?.filter(app => app.status === "pending").length || 0;
      const approved = appsRes.data?.filter(app => app.status === "approved").length || 0;
      const pendingSupport = supportRes.data?.filter(req => req.status === "pending").length || 0;
      const pendingWithdrawals = withdrawalsRes.data?.filter(w => w.status === "pending").length || 0;
      const unverifiedDeposits = depositsRes.data?.filter(d => !d.verified).length || 0;
      const pendingDisbursements = disbursementsRes.data?.filter(d => !d.disbursed).length || 0;

      setStats({
        totalApplications: appsRes.data?.length || 0,
        pendingApplications: pending,
        approvedLoans: approved,
        pendingSupport,
        pendingWithdrawals,
        unverifiedDeposits,
        pendingDisbursements,
        totalMembers: uniqueUsers,
      });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter applications based on search and status
  const filteredApplications = applications.filter(app => {
    const matchesSearch = searchQuery === "" || 
      app.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.id_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.whatsapp_number?.includes(searchQuery);
    
    const matchesStatus = appStatusFilter === "all" || app.status === appStatusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const updateApplicationStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase.from("loan_applications").update({ status }).eq("id", id);
      if (error) throw error;
      toast.success(`Application ${status}!`);
      fetchAllData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleWithdrawalAction = (w: any, action: 'approve' | 'reject') => {
    setWithdrawalConfirm({ id: w.id, action, amount: w.amount, phone: w.phone_number });
  };

  const confirmWithdrawalAction = async () => {
    if (!withdrawalConfirm) return;
    
    const status = withdrawalConfirm.action === 'approve' ? 'completed' : 'rejected';
    try {
      const { error } = await supabase.from("withdrawals").update({ status }).eq("id", withdrawalConfirm.id);
      if (error) throw error;
      toast.success(`Withdrawal ${status}!`);
      fetchAllData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setWithdrawalConfirm(null);
    }
  };

  const markDisbursed = async (id: string) => {
    try {
      const { error } = await supabase.from("loan_disbursements").update({ disbursed: true }).eq("id", id);
      if (error) throw error;
      toast.success("Loan marked as disbursed!");
      fetchAllData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
      case "completed":
      case "resolved":
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> {status}</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> {status}</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> {status}</Badge>;
    }
  };

  const pendingCount = stats.pendingApplications + stats.pendingSupport + stats.pendingWithdrawals + stats.unverifiedDeposits + stats.pendingDisbursements;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gradient-soft p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <AdminHeader user={user} onRefresh={fetchAllData} pendingCount={pendingCount} />

        {/* Stats Grid */}
        <AdminStats stats={stats} />

        {/* Tabs */}
        <Tabs defaultValue="analytics" className="space-y-4">
          <TabsList className="flex flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="analytics" className="text-xs py-2 px-3">
              <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="text-xs py-2 px-3">
              <Activity className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
              <span className="hidden sm:inline">Activity</span>
            </TabsTrigger>
            <TabsTrigger value="applications" className="text-xs py-2 px-3">
              <FileText className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
              <span className="hidden sm:inline">Apps</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="text-xs py-2 px-3">
              <Users className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="support" className="text-xs py-2 px-3">
              <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
              <span className="hidden sm:inline">Support</span>
            </TabsTrigger>
            <TabsTrigger value="deposits" className="text-xs py-2 px-3">
              <PiggyBank className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
              <span className="hidden sm:inline">Deposits</span>
            </TabsTrigger>
            <TabsTrigger value="withdrawals" className="text-xs py-2 px-3">
              <Wallet className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
              <span className="hidden sm:inline">Withdraw</span>
            </TabsTrigger>
            <TabsTrigger value="disbursements" className="text-xs py-2 px-3">
              <ArrowDownToLine className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
              <span className="hidden sm:inline">Disburse</span>
            </TabsTrigger>
            <TabsTrigger value="bulk" className="text-xs py-2 px-3">
              <CheckSquare className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
              <span className="hidden sm:inline">Bulk</span>
            </TabsTrigger>
            <TabsTrigger value="export" className="text-xs py-2 px-3">
              <Download className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
              <span className="hidden sm:inline">Export</span>
            </TabsTrigger>
            <TabsTrigger value="broadcast" className="text-xs py-2 px-3">
              <Megaphone className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
              <span className="hidden sm:inline">Broadcast</span>
            </TabsTrigger>
          </TabsList>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <AnalyticsDashboard 
              applications={applications}
              deposits={deposits}
              withdrawals={withdrawals}
              disbursements={disbursements}
            />
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <ActivityLog 
              applications={applications}
              deposits={deposits}
              withdrawals={withdrawals}
              supportRequests={supportRequests}
              disbursements={disbursements}
            />
          </TabsContent>

          {/* Applications Tab */}
          <TabsContent value="applications" className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by name, ID, or phone..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={appStatusFilter} onValueChange={setAppStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <p className="text-sm text-muted-foreground">Showing {filteredApplications.length} of {applications.length} applications</p>

            {filteredApplications.length === 0 ? (
              <Card><CardContent className="p-6 text-center text-muted-foreground">No applications match your search</CardContent></Card>
            ) : (
              filteredApplications.map((app) => (
                <Card key={app.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{app.full_name}</p>
                        <p className="text-xs text-muted-foreground">ID: {app.id_number} | {app.whatsapp_number} | KES {app.loan_limit.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(app.status)}
                        <Button variant="ghost" size="sm" onClick={() => setExpandedApp(expandedApp === app.id ? null : app.id)}>
                          {expandedApp === app.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    {expandedApp === app.id && (
                      <div className="space-y-3 pt-3 border-t">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div><span className="text-muted-foreground">ID:</span> {app.id_number}</div>
                          <div><span className="text-muted-foreground">Employment:</span> {app.employment_status}</div>
                          <div><span className="text-muted-foreground">Occupation:</span> {app.occupation}</div>
                          <div><span className="text-muted-foreground">Income:</span> {app.income_level}</div>
                          <div className="col-span-2"><span className="text-muted-foreground">Next of Kin:</span> {app.next_of_kin_name} - {app.next_of_kin_contact}</div>
                          <div className="col-span-2"><span className="text-muted-foreground">Contact Person:</span> {app.contact_person_name} - {app.contact_person_phone}</div>
                          {app.loan_reason && <div className="col-span-2"><span className="text-muted-foreground">Reason:</span> {app.loan_reason}</div>}
                        </div>
                        {app.status === "pending" && (
                          <div className="flex gap-2 pt-2">
                            <Button size="sm" onClick={() => updateApplicationStatus(app.id, "approved")} className="flex-1"><CheckCircle className="w-4 h-4 mr-1" />Approve</Button>
                            <Button size="sm" variant="destructive" onClick={() => updateApplicationStatus(app.id, "rejected")} className="flex-1"><XCircle className="w-4 h-4 mr-1" />Reject</Button>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <UserManagement 
              applications={applications}
              deposits={deposits}
              withdrawals={withdrawals}
              supportRequests={supportRequests}
            />
          </TabsContent>

          {/* Support Tab */}
          <TabsContent value="support">
            <SupportChat supportRequests={supportRequests} onRefresh={fetchAllData} />
          </TabsContent>

          {/* Deposits Tab */}
          <TabsContent value="deposits">
            <DepositsTab deposits={deposits} onRefresh={fetchAllData} />
          </TabsContent>

          {/* Withdrawals Tab */}
          <TabsContent value="withdrawals" className="space-y-3">
            {withdrawals.length === 0 ? (
              <Card><CardContent className="p-6 text-center text-muted-foreground">No withdrawals</CardContent></Card>
            ) : (
              withdrawals.map((w) => (
                <Card key={w.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">KES {w.amount.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">Phone: {w.phone_number}</p>
                        <p className="text-xs text-muted-foreground">{new Date(w.created_at).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(w.status === "completed" ? "approved" : w.status)}
                        {w.status === "pending" && (
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleWithdrawalAction(w, 'approve')}><CheckCircle className="w-4 h-4 mr-1" />Approve</Button>
                            <Button size="sm" variant="destructive" onClick={() => handleWithdrawalAction(w, 'reject')}><XCircle className="w-4 h-4" /></Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Disbursements Tab */}
          <TabsContent value="disbursements" className="space-y-3">
            {disbursements.length === 0 ? (
              <Card><CardContent className="p-6 text-center text-muted-foreground">No disbursements</CardContent></Card>
            ) : (
              disbursements.map((d: any) => (
                <Card key={d.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">{d.loan_applications?.full_name || "Unknown"}</p>
                        <p className="text-sm">Loan: KES {d.loan_amount.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Phone: {d.loan_applications?.whatsapp_number}</p>
                        <p className="text-xs text-muted-foreground">Code: {d.transaction_code}</p>
                        <p className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {d.disbursed ? (
                          <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Disbursed</Badge>
                        ) : (
                          <Button size="sm" onClick={() => markDisbursed(d.id)}><ArrowDownToLine className="w-4 h-4 mr-1" />Mark Disbursed</Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Bulk Actions Tab */}
          <TabsContent value="bulk">
            <BulkActions 
              applications={applications}
              deposits={deposits}
              withdrawals={withdrawals}
              onRefresh={fetchAllData}
            />
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export">
            <ExportReports 
              applications={applications}
              deposits={deposits}
              withdrawals={withdrawals}
              disbursements={disbursements}
              supportRequests={supportRequests}
            />
          </TabsContent>

          {/* Broadcast Tab */}
          <TabsContent value="broadcast">
            <BroadcastMessaging applications={applications} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Withdrawal Confirmation Dialog */}
      <AlertDialog open={!!withdrawalConfirm} onOpenChange={() => setWithdrawalConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {withdrawalConfirm?.action === 'approve' ? 'Approve Withdrawal' : 'Reject Withdrawal'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {withdrawalConfirm?.action === 'approve' ? (
                <>
                  Are you sure you want to approve this withdrawal of <strong>KES {withdrawalConfirm?.amount.toLocaleString()}</strong> to <strong>{withdrawalConfirm?.phone}</strong>?
                  <br /><br />
                  This will deduct the amount from the user's savings balance.
                </>
              ) : (
                <>
                  Are you sure you want to reject this withdrawal request of <strong>KES {withdrawalConfirm?.amount.toLocaleString()}</strong>?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmWithdrawalAction}
              className={withdrawalConfirm?.action === 'reject' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {withdrawalConfirm?.action === 'approve' ? 'Approve' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Admin;
