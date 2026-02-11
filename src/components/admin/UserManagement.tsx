import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { 
  Users, Search, User, Phone, FileText, 
  PiggyBank, Clock, Ban, CheckCircle, Eye,
  MessageSquare, StickyNote
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserManagementProps {
  applications: any[];
  deposits: any[];
  withdrawals: any[];
  supportRequests: any[];
}

interface UserSummary {
  user_id: string;
  name: string;
  phone: string;
  totalApplications: number;
  approvedLoans: number;
  totalDeposits: number;
  totalWithdrawals: number;
  supportRequests: number;
  lastActivity: string;
  applications: any[];
  userDeposits: any[];
  userWithdrawals: any[];
  userSupport: any[];
}

export const UserManagement = ({
  applications,
  deposits,
  withdrawals,
  supportRequests
}: UserManagementProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserSummary | null>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [userNotes, setUserNotes] = useState<Record<string, string>>({});
  const [noteInput, setNoteInput] = useState("");

  // Build user summaries from applications (since that's where we have user info)
  const userSummaries: UserSummary[] = applications.reduce((acc: UserSummary[], app) => {
    const existing = acc.find(u => u.user_id === app.user_id);
    
    if (existing) {
      existing.totalApplications++;
      if (app.status === 'approved') existing.approvedLoans++;
      existing.applications.push(app);
      if (new Date(app.created_at) > new Date(existing.lastActivity)) {
        existing.lastActivity = app.created_at;
      }
    } else {
      const userDeposits = deposits.filter(d => d.user_id === app.user_id);
      const userWithdrawals = withdrawals.filter(w => w.user_id === app.user_id);
      const userSupport = supportRequests.filter(s => s.user_id === app.user_id);
      
      acc.push({
        user_id: app.user_id,
        name: app.full_name,
        phone: app.whatsapp_number,
        totalApplications: 1,
        approvedLoans: app.status === 'approved' ? 1 : 0,
        totalDeposits: userDeposits.reduce((s, d) => s + (d.verified ? d.amount : 0), 0),
        totalWithdrawals: userWithdrawals.reduce((s, w) => s + (w.status === 'completed' ? w.amount : 0), 0),
        supportRequests: userSupport.length,
        lastActivity: app.created_at,
        applications: [app],
        userDeposits,
        userWithdrawals,
        userSupport
      });
    }
    return acc;
  }, []);

  // Filter users
  const filteredUsers = userSummaries.filter(user => {
    return searchQuery === "" ||
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone?.includes(searchQuery) ||
      user.user_id?.includes(searchQuery);
  });

  const viewUserDetails = (user: UserSummary) => {
    setSelectedUser(user);
    setNoteInput(userNotes[user.user_id] || "");
    setShowUserDialog(true);
  };

  const saveNote = () => {
    if (selectedUser) {
      setUserNotes(prev => ({ ...prev, [selectedUser.user_id]: noteInput }));
      toast.success("Note saved");
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, or user ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="outline" className="whitespace-nowrap">
          <Users className="w-3 h-3 mr-1" />
          {filteredUsers.length} users
        </Badge>
      </div>

      {/* User List */}
      <ScrollArea className="h-[500px]">
        <div className="space-y-2 pr-4">
          {filteredUsers.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No users found
              </CardContent>
            </Card>
          ) : (
            filteredUsers.map((user) => (
              <Card 
                key={user.user_id} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => viewUserDetails(user)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {user.phone}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs">
                      <div className="text-center hidden sm:block">
                        <p className="font-semibold">{user.totalApplications}</p>
                        <p className="text-muted-foreground">Apps</p>
                      </div>
                      <div className="text-center hidden sm:block">
                        <p className="font-semibold text-green-600">KES {user.totalDeposits.toLocaleString()}</p>
                        <p className="text-muted-foreground">Deposits</p>
                      </div>
                      <div className="text-center hidden md:block">
                        <p className="font-semibold text-orange-600">KES {user.totalWithdrawals.toLocaleString()}</p>
                        <p className="text-muted-foreground">Withdrawn</p>
                      </div>
                      <Button variant="ghost" size="icon">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {userNotes[user.user_id] && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs flex items-start gap-1">
                      <StickyNote className="w-3 h-3 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <span className="text-yellow-800 line-clamp-1">{userNotes[user.user_id]}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      {/* User Detail Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              {selectedUser?.name}
            </DialogTitle>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              {/* User Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card>
                  <CardContent className="p-3 text-center">
                    <FileText className="w-4 h-4 mx-auto mb-1 text-primary" />
                    <p className="text-lg font-bold">{selectedUser.totalApplications}</p>
                    <p className="text-xs text-muted-foreground">Applications</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <CheckCircle className="w-4 h-4 mx-auto mb-1 text-green-600" />
                    <p className="text-lg font-bold">{selectedUser.approvedLoans}</p>
                    <p className="text-xs text-muted-foreground">Approved</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <PiggyBank className="w-4 h-4 mx-auto mb-1 text-purple-600" />
                    <p className="text-lg font-bold text-green-600">KES {selectedUser.totalDeposits.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Deposits</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <MessageSquare className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                    <p className="text-lg font-bold">{selectedUser.supportRequests}</p>
                    <p className="text-xs text-muted-foreground">Support</p>
                  </CardContent>
                </Card>
              </div>

              {/* Contact Info */}
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-2">Contact Information</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Phone:</span> {selectedUser.phone}</div>
                    <div><span className="text-muted-foreground">Last Activity:</span> {formatDate(selectedUser.lastActivity)}</div>
                    <div className="col-span-2"><span className="text-muted-foreground">User ID:</span> <code className="text-xs bg-muted p-1 rounded">{selectedUser.user_id}</code></div>
                  </div>
                </CardContent>
              </Card>

              {/* Application History */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Application History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {selectedUser.applications.map((app, i) => (
                      <div key={i} className="flex items-center justify-between text-sm p-2 bg-muted rounded">
                        <span>KES {app.loan_limit.toLocaleString()}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant={app.status === 'approved' ? 'default' : app.status === 'rejected' ? 'destructive' : 'secondary'}>
                            {app.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{formatDate(app.created_at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Admin Notes */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <StickyNote className="w-4 h-4" />
                    Admin Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    placeholder="Add notes about this user (only visible to admins)..."
                    className="min-h-[80px]"
                  />
                  <Button size="sm" onClick={saveNote} className="mt-2">
                    Save Note
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
