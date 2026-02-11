import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  TrendingUp, TrendingDown, DollarSign, Users, 
  FileText, PiggyBank, Wallet, ArrowDownToLine
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from "recharts";

interface AnalyticsDashboardProps {
  applications: any[];
  deposits: any[];
  withdrawals: any[];
  disbursements: any[];
}

export const AnalyticsDashboard = ({
  applications,
  deposits,
  withdrawals,
  disbursements
}: AnalyticsDashboardProps) => {
  
  // Calculate summary stats
  const totalDeposits = deposits.reduce((sum, d) => sum + (d.verified ? d.amount : 0), 0);
  const totalWithdrawals = withdrawals.reduce((sum, w) => sum + (w.status === 'completed' ? w.amount : 0), 0);
  const totalDisbursed = disbursements.reduce((sum, d) => sum + (d.disbursed ? d.loan_amount : 0), 0);
  const approvalRate = applications.length > 0 
    ? Math.round((applications.filter(a => a.status === 'approved').length / applications.length) * 100) 
    : 0;

  // Group by date for trend chart
  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date.toISOString().split('T')[0]);
    }
    return days;
  };

  const last7Days = getLast7Days();
  
  const trendData = last7Days.map(day => {
    const dayDeposits = deposits.filter(d => d.created_at?.startsWith(day) && d.verified).reduce((s, d) => s + d.amount, 0);
    const dayWithdrawals = withdrawals.filter(w => w.created_at?.startsWith(day) && w.status === 'completed').reduce((s, w) => s + w.amount, 0);
    const dayApps = applications.filter(a => a.created_at?.startsWith(day)).length;
    
    return {
      name: new Date(day).toLocaleDateString('en-US', { weekday: 'short' }),
      deposits: dayDeposits,
      withdrawals: dayWithdrawals,
      applications: dayApps
    };
  });

  // Application status breakdown
  const statusData = [
    { name: 'Pending', value: applications.filter(a => a.status === 'pending').length, color: '#fbbf24' },
    { name: 'Approved', value: applications.filter(a => a.status === 'approved').length, color: '#22c55e' },
    { name: 'Rejected', value: applications.filter(a => a.status === 'rejected').length, color: '#ef4444' },
  ].filter(item => item.value > 0);

  // Loan amounts by income level
  const incomeData = applications.reduce((acc: any[], app) => {
    const existing = acc.find(a => a.income === app.income_level);
    if (existing) {
      existing.amount += app.loan_limit;
      existing.count += 1;
    } else {
      acc.push({ income: app.income_level, amount: app.loan_limit, count: 1 });
    }
    return acc;
  }, []);

  const summaryCards = [
    { 
      title: "Total Deposits", 
      value: `KES ${totalDeposits.toLocaleString()}`, 
      icon: PiggyBank, 
      trend: "+12%",
      trendUp: true,
      color: "text-green-600"
    },
    { 
      title: "Total Withdrawals", 
      value: `KES ${totalWithdrawals.toLocaleString()}`, 
      icon: Wallet, 
      trend: "-5%",
      trendUp: false,
      color: "text-orange-600"
    },
    { 
      title: "Loans Disbursed", 
      value: `KES ${totalDisbursed.toLocaleString()}`, 
      icon: ArrowDownToLine, 
      trend: "+8%",
      trendUp: true,
      color: "text-blue-600"
    },
    { 
      title: "Approval Rate", 
      value: `${approvalRate}%`, 
      icon: FileText, 
      trend: approvalRate > 50 ? "Good" : "Low",
      trendUp: approvalRate > 50,
      color: "text-primary"
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <Card key={card.title}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                  <div className={`text-xs flex items-center gap-1 mt-1 ${card.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                    {card.trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {card.trend}
                  </div>
                </div>
                <div className={`p-3 rounded-full bg-muted`}>
                  <card.icon className={`w-6 h-6 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">7-Day Activity Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="deposits" 
                  stackId="1"
                  stroke="#22c55e" 
                  fill="#22c55e" 
                  fillOpacity={0.6}
                  name="Deposits (KES)"
                />
                <Area 
                  type="monotone" 
                  dataKey="withdrawals" 
                  stackId="2"
                  stroke="#f97316" 
                  fill="#f97316" 
                  fillOpacity={0.6}
                  name="Withdrawals (KES)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Application Status Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Application Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No application data
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Income Level Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Loan Requests by Income Level</CardTitle>
        </CardHeader>
        <CardContent>
          {incomeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={incomeData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="income" fontSize={10} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar dataKey="amount" fill="hsl(var(--primary))" name="Total Amount (KES)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="count" fill="hsl(var(--muted-foreground))" name="Applications" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              No data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
