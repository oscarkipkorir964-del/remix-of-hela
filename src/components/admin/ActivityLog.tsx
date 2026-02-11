import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Activity, FileText, PiggyBank, Wallet, 
  MessageSquare, ArrowDownToLine, CheckCircle, XCircle, Clock
} from "lucide-react";

interface ActivityItem {
  id: string;
  type: 'application' | 'deposit' | 'withdrawal' | 'support' | 'disbursement';
  action: string;
  details: string;
  status?: string;
  timestamp: string;
}

interface ActivityLogProps {
  applications: any[];
  deposits: any[];
  withdrawals: any[];
  supportRequests: any[];
  disbursements: any[];
}

export const ActivityLog = ({ 
  applications, 
  deposits, 
  withdrawals, 
  supportRequests, 
  disbursements 
}: ActivityLogProps) => {
  
  // Combine and sort all activities by timestamp
  const activities: ActivityItem[] = [
    ...applications.slice(0, 10).map(app => ({
      id: `app-${app.id}`,
      type: 'application' as const,
      action: 'Loan Application',
      details: `${app.full_name} - KES ${app.loan_limit?.toLocaleString()}`,
      status: app.status,
      timestamp: app.created_at
    })),
    ...deposits.slice(0, 10).map(d => ({
      id: `dep-${d.id}`,
      type: 'deposit' as const,
      action: 'Savings Deposit',
      details: `KES ${d.amount?.toLocaleString()} - ${d.transaction_code || 'No code'}`,
      status: d.verified ? 'verified' : d.mpesa_message?.includes('[REJECTED:') ? 'rejected' : 'pending',
      timestamp: d.created_at
    })),
    ...withdrawals.slice(0, 10).map(w => ({
      id: `wit-${w.id}`,
      type: 'withdrawal' as const,
      action: 'Withdrawal Request',
      details: `KES ${w.amount?.toLocaleString()} to ${w.phone_number}`,
      status: w.status,
      timestamp: w.created_at
    })),
    ...supportRequests.slice(0, 10).map(s => ({
      id: `sup-${s.id}`,
      type: 'support' as const,
      action: 'Support Request',
      details: `${s.user_name}: ${s.message?.substring(0, 50)}...`,
      status: s.status,
      timestamp: s.created_at
    })),
    ...disbursements.slice(0, 10).map(d => ({
      id: `dis-${d.id}`,
      type: 'disbursement' as const,
      action: 'Loan Disbursement',
      details: `KES ${d.loan_amount?.toLocaleString()} - ${d.transaction_code}`,
      status: d.disbursed ? 'disbursed' : 'pending',
      timestamp: d.created_at
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
   .slice(0, 20);

  const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'application': return <FileText className="w-4 h-4" />;
      case 'deposit': return <PiggyBank className="w-4 h-4" />;
      case 'withdrawal': return <Wallet className="w-4 h-4" />;
      case 'support': return <MessageSquare className="w-4 h-4" />;
      case 'disbursement': return <ArrowDownToLine className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'application': return 'bg-blue-500';
      case 'deposit': return 'bg-purple-500';
      case 'withdrawal': return 'bg-orange-500';
      case 'support': return 'bg-teal-500';
      case 'disbursement': return 'bg-green-500';
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'approved':
      case 'completed':
      case 'resolved':
      case 'verified':
      case 'disbursed':
        return <Badge className="bg-green-500 text-xs"><CheckCircle className="w-3 h-3 mr-1" />{status}</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="text-xs"><XCircle className="w-3 h-3 mr-1" />{status}</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs"><Clock className="w-3 h-3 mr-1" />{status}</Badge>;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-3 pr-4">
            {activities.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No recent activity</p>
            ) : (
              activities.map((activity) => (
                <div 
                  key={activity.id} 
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className={`p-2 rounded-full text-white ${getTypeColor(activity.type)}`}>
                    {getIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm">{activity.action}</p>
                      {getStatusBadge(activity.status)}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {activity.details}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTime(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
