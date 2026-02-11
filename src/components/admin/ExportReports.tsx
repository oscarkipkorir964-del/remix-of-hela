import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Download, FileSpreadsheet, FileText, 
  Calendar, CheckCircle
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface ExportReportsProps {
  applications: any[];
  deposits: any[];
  withdrawals: any[];
  disbursements: any[];
  supportRequests: any[];
}

export const ExportReports = ({
  applications,
  deposits,
  withdrawals,
  disbursements,
  supportRequests
}: ExportReportsProps) => {
  const [dateRange, setDateRange] = useState("all");

  const filterByDate = (items: any[], dateField: string = 'created_at') => {
    if (dateRange === "all") return items;
    
    const now = new Date();
    let startDate = new Date();
    
    switch (dateRange) {
      case "today":
        startDate.setHours(0, 0, 0, 0);
        break;
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "year":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    return items.filter(item => new Date(item[dateField]) >= startDate);
  };

  const downloadCSV = (data: any[], filename: string, columns: { key: string; label: string }[]) => {
    if (data.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = columns.map(c => c.label).join(',');
    const rows = data.map(item => 
      columns.map(c => {
        const value = item[c.key];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string' && value.includes(',')) return `"${value}"`;
        return value;
      }).join(',')
    );
    
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${filename} exported successfully`);
  };

  const exportApplications = () => {
    const data = filterByDate(applications);
    downloadCSV(data, 'loan_applications', [
      { key: 'full_name', label: 'Full Name' },
      { key: 'id_number', label: 'ID Number' },
      { key: 'whatsapp_number', label: 'Phone' },
      { key: 'loan_limit', label: 'Loan Amount' },
      { key: 'status', label: 'Status' },
      { key: 'employment_status', label: 'Employment' },
      { key: 'occupation', label: 'Occupation' },
      { key: 'income_level', label: 'Income Level' },
      { key: 'next_of_kin_name', label: 'Next of Kin' },
      { key: 'next_of_kin_contact', label: 'NOK Contact' },
      { key: 'created_at', label: 'Date Applied' },
    ]);
  };

  const exportDeposits = () => {
    const data = filterByDate(deposits);
    downloadCSV(data, 'savings_deposits', [
      { key: 'amount', label: 'Amount (KES)' },
      { key: 'transaction_code', label: 'Transaction Code' },
      { key: 'verified', label: 'Verified' },
      { key: 'mpesa_message', label: 'M-Pesa Message' },
      { key: 'created_at', label: 'Date' },
    ]);
  };

  const exportWithdrawals = () => {
    const data = filterByDate(withdrawals);
    downloadCSV(data, 'withdrawals', [
      { key: 'amount', label: 'Amount (KES)' },
      { key: 'phone_number', label: 'Phone Number' },
      { key: 'status', label: 'Status' },
      { key: 'created_at', label: 'Date Requested' },
      { key: 'updated_at', label: 'Date Processed' },
    ]);
  };

  const exportDisbursements = () => {
    const data = filterByDate(disbursements);
    downloadCSV(data, 'loan_disbursements', [
      { key: 'loan_amount', label: 'Loan Amount (KES)' },
      { key: 'processing_fee', label: 'Processing Fee' },
      { key: 'transaction_code', label: 'Transaction Code' },
      { key: 'payment_verified', label: 'Payment Verified' },
      { key: 'disbursed', label: 'Disbursed' },
      { key: 'created_at', label: 'Date' },
    ]);
  };

  const exportSupport = () => {
    const data = filterByDate(supportRequests);
    downloadCSV(data, 'support_requests', [
      { key: 'user_name', label: 'User Name' },
      { key: 'user_email', label: 'User Email' },
      { key: 'message', label: 'Message' },
      { key: 'status', label: 'Status' },
      { key: 'admin_reply', label: 'Admin Reply' },
      { key: 'created_at', label: 'Date' },
    ]);
  };

  const exportAll = () => {
    exportApplications();
    setTimeout(exportDeposits, 500);
    setTimeout(exportWithdrawals, 1000);
    setTimeout(exportDisbursements, 1500);
    setTimeout(exportSupport, 2000);
  };

  const exportOptions = [
    { 
      title: "Loan Applications", 
      description: `${filterByDate(applications).length} records`,
      icon: FileText,
      action: exportApplications,
      color: "text-blue-600"
    },
    { 
      title: "Savings Deposits", 
      description: `${filterByDate(deposits).length} records`,
      icon: FileSpreadsheet,
      action: exportDeposits,
      color: "text-green-600"
    },
    { 
      title: "Withdrawals", 
      description: `${filterByDate(withdrawals).length} records`,
      icon: FileSpreadsheet,
      action: exportWithdrawals,
      color: "text-orange-600"
    },
    { 
      title: "Loan Disbursements", 
      description: `${filterByDate(disbursements).length} records`,
      icon: FileSpreadsheet,
      action: exportDisbursements,
      color: "text-purple-600"
    },
    { 
      title: "Support Requests", 
      description: `${filterByDate(supportRequests).length} records`,
      icon: FileText,
      action: exportSupport,
      color: "text-teal-600"
    },
  ];

  return (
    <div className="space-y-6">
      {/* Date Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Export Period</span>
            </div>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
                <SelectItem value="year">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {exportOptions.map((option) => (
          <Card key={option.title} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full bg-muted`}>
                    <option.icon className={`w-5 h-5 ${option.color}`} />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{option.title}</p>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={option.action}>
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Export All Button */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Export All Reports</p>
              <p className="text-sm text-muted-foreground">Download all data as separate CSV files</p>
            </div>
            <Button onClick={exportAll}>
              <Download className="w-4 h-4 mr-2" />
              Export All
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
