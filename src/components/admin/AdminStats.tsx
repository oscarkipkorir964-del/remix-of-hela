import { Card, CardContent } from "@/components/ui/card";
import { 
  Users, FileText, MessageSquare, Wallet, 
  PiggyBank, ArrowDownToLine, TrendingUp, AlertTriangle
} from "lucide-react";

interface AdminStatsProps {
  stats: {
    totalMembers: number;
    totalApplications: number;
    pendingApplications: number;
    approvedLoans: number;
    pendingSupport: number;
    pendingWithdrawals: number;
    unverifiedDeposits: number;
    pendingDisbursements: number;
    failedDeposits?: number;
  };
}

export const AdminStats = ({ stats }: AdminStatsProps) => {
  const statItems = [
    { label: "Members", value: stats.totalMembers, icon: Users, color: "text-primary" },
    { label: "Applications", value: stats.totalApplications, icon: FileText, color: "text-foreground" },
    { label: "Pending Apps", value: stats.pendingApplications, icon: TrendingUp, color: "text-yellow-600" },
    { label: "Approved", value: stats.approvedLoans, icon: FileText, color: "text-green-600" },
    { label: "Support", value: stats.pendingSupport, icon: MessageSquare, color: "text-blue-600" },
    { label: "Withdrawals", value: stats.pendingWithdrawals, icon: Wallet, color: "text-orange-600" },
    { label: "Deposits", value: stats.unverifiedDeposits, icon: PiggyBank, color: "text-purple-600" },
    { label: "Disburse", value: stats.pendingDisbursements, icon: ArrowDownToLine, color: "text-teal-600" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-3">
      {statItems.map((item) => (
        <Card key={item.label} className="hover:shadow-md transition-shadow">
          <CardContent className="p-3 text-center">
            <item.icon className={`w-4 h-4 mx-auto mb-1 ${item.color}`} />
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
