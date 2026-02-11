import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Send, Users, CheckCircle,
  Loader2, Megaphone, Filter, Smartphone, MessageCircle, Search, FileText
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Message templates for common announcements
const MESSAGE_TEMPLATES = [
  {
    id: "loan_approved",
    name: "Loan Approved",
    subject: "Your Loan Has Been Approved!",
    message: "Great news! Your loan application has been approved. Please log in to your account to view the details and complete the disbursement process."
  },
  {
    id: "loan_rejected",
    name: "Loan Rejected",
    subject: "Loan Application Update",
    message: "We regret to inform you that your loan application was not approved at this time. Please contact our support team for more information or to discuss alternative options."
  },
  {
    id: "payment_reminder",
    name: "Payment Reminder",
    subject: "Payment Reminder",
    message: "This is a friendly reminder that your loan payment is due soon. Please ensure you have sufficient funds to avoid any late fees. Log in to your account to make a payment."
  },
  {
    id: "new_feature",
    name: "New Feature",
    subject: "Exciting New Features!",
    message: "We've just launched new features to improve your experience! Log in to explore what's new and how it can benefit you."
  },
  {
    id: "promotion",
    name: "Special Promotion",
    subject: "Special Offer Just For You!",
    message: "As a valued customer, you're eligible for our special promotional offer. Don't miss out - log in now to claim your exclusive benefits!"
  },
  {
    id: "maintenance",
    name: "System Maintenance",
    subject: "Scheduled Maintenance Notice",
    message: "We will be performing scheduled maintenance on our systems. During this time, some services may be temporarily unavailable. We apologize for any inconvenience."
  }
];

interface BroadcastMessagingProps {
  applications: any[];
}

export const BroadcastMessaging = ({ applications }: BroadcastMessagingProps) => {
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [targetGroup, setTargetGroup] = useState("all");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [isSending, setIsSending] = useState(false);
  const [sendSms, setSendSms] = useState(true);
  const [sendInApp, setSendInApp] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [sentMessages, setSentMessages] = useState<Array<{
    id: string;
    subject: string;
    message: string;
    recipients: number;
    smsCount: number;
    date: string;
  }>>([]);

  // Get unique users from applications with ID number
  const uniqueUsers = applications.reduce((acc: any[], app) => {
    if (!acc.find(u => u.user_id === app.user_id)) {
      acc.push({
        user_id: app.user_id,
        name: app.full_name,
        phone: app.whatsapp_number,
        id_number: app.id_number,
        status: app.status
      });
    }
    return acc;
  }, []);

  // Filter users based on target group and search query
  const filteredUsers = uniqueUsers.filter(user => {
    // First apply group filter
    let matchesGroup = true;
    switch (targetGroup) {
      case "approved":
        matchesGroup = applications.some(a => a.user_id === user.user_id && a.status === 'approved');
        break;
      case "pending":
        matchesGroup = applications.some(a => a.user_id === user.user_id && a.status === 'pending');
        break;
      case "rejected":
        matchesGroup = applications.some(a => a.user_id === user.user_id && a.status === 'rejected');
        break;
    }
    
    // Then apply search filter
    if (!matchesGroup) return false;
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase().trim();
    return (
      user.phone?.toLowerCase().includes(query) ||
      user.id_number?.toLowerCase().includes(query) ||
      user.name?.toLowerCase().includes(query)
    );
  });

  const toggleUser = (userId: string) => {
    const newSet = new Set(selectedUsers);
    if (newSet.has(userId)) newSet.delete(userId);
    else newSet.add(userId);
    setSelectedUsers(newSet);
  };

  const selectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.user_id)));
    }
  };

  const sendBroadcast = async () => {
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    if (selectedUsers.size === 0) {
      toast.error("Please select at least one recipient");
      return;
    }

    if (!sendSms && !sendInApp) {
      toast.error("Please select at least one delivery method");
      return;
    }

    setIsSending(true);

    try {
      const recipients = filteredUsers.filter(u => selectedUsers.has(u.user_id));
      let smsSuccessCount = 0;

      // Send SMS if enabled
      if (sendSms) {
        const smsRecipients = recipients.map(u => ({
          phone: u.phone,
          name: u.name
        }));

        const { data: smsResult, error: smsError } = await supabase.functions.invoke('send-broadcast-sms', {
          body: {
            recipients: smsRecipients,
            subject: subject || '',
            message: message
          }
        });

        if (smsError) {
          console.error('SMS error:', smsError);
          toast.error(`SMS sending failed: ${smsError.message}`);
        } else {
          smsSuccessCount = smsResult?.successCount || 0;
          if (smsResult?.failCount > 0) {
            const errorMsg = smsResult?.errorMessage || 'Unknown error';
            toast.error(`SMS failed: ${errorMsg}. ${smsResult.failCount} messages not delivered.`);
          } else if (smsSuccessCount > 0) {
            toast.success(`SMS delivered to ${smsSuccessCount} recipients`);
          }
        }
      }

      // Send in-app messages if enabled
      if (sendInApp) {
        // Insert into notifications table for each user (this triggers realtime + sound)
        const notificationInserts = recipients.map(user => ({
          user_id: user.user_id,
          title: subject || 'Announcement',
          message: message,
          type: 'broadcast',
          is_read: false
        }));

        const { error: notifError } = await supabase
          .from('notifications')
          .insert(notificationInserts);

        if (notifError) {
          console.error('Notification insert error:', notifError);
          toast.error(`In-app notifications failed: ${notifError.message}`);
        }

        // Also send to support chat for conversation history
        for (const user of recipients) {
          const { data: existingRequest } = await supabase
            .from('support_requests')
            .select('id')
            .eq('user_id', user.user_id)
            .eq('status', 'pending')
            .maybeSingle();

          if (existingRequest) {
            await supabase.from('support_messages').insert({
              request_id: existingRequest.id,
              sender_type: 'admin',
              message: `📢 **${subject || 'Announcement'}**\n\n${message}`
            });
          } else {
            const { data: newRequest } = await supabase
              .from('support_requests')
              .insert({
                user_id: user.user_id,
                user_name: user.name,
                user_email: `${user.phone}@zenkaloans.com`,
                message: 'Admin initiated conversation',
                status: 'pending'
              })
              .select()
              .single();

            if (newRequest) {
              await supabase.from('support_messages').insert({
                request_id: newRequest.id,
                sender_type: 'admin',
                message: `📢 **${subject || 'Announcement'}**\n\n${message}`
              });
            }
          }
        }
      }

      // Track sent message
      setSentMessages(prev => [{
        id: Date.now().toString(),
        subject: subject || 'No subject',
        message,
        recipients: selectedUsers.size,
        smsCount: smsSuccessCount,
        date: new Date().toISOString()
      }, ...prev]);

      const deliveryMethods = [];
      if (sendInApp) deliveryMethods.push('in-app');
      if (sendSms) deliveryMethods.push(`SMS (${smsSuccessCount})`);
      
      toast.success(`Broadcast sent via ${deliveryMethods.join(' & ')} to ${selectedUsers.size} users`);
      setMessage("");
      setSubject("");
      setSelectedTemplate("");
      setSelectedUsers(new Set());
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Compose Message */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Megaphone className="w-4 h-4" />
              Compose Broadcast
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Message Templates */}
            <div>
              <label className="text-sm font-medium mb-1 block flex items-center gap-2">
                <FileText className="w-3 h-3" />
                Quick Templates
              </label>
              <Select 
                value={selectedTemplate} 
                onValueChange={(templateId) => {
                  setSelectedTemplate(templateId);
                  const template = MESSAGE_TEMPLATES.find(t => t.id === templateId);
                  if (template) {
                    setSubject(template.subject);
                    setMessage(template.message);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a template..." />
                </SelectTrigger>
                <SelectContent>
                  {MESSAGE_TEMPLATES.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Subject (Optional)</label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., New Feature Announcement"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Message</label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your broadcast message here..."
                className="min-h-[120px]"
              />
            </div>

            {/* Delivery Options */}
            <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
              <p className="text-sm font-medium">Delivery Method</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-muted-foreground" />
                  <Label htmlFor="send-inapp" className="text-sm cursor-pointer">In-App Message</Label>
                </div>
                <Switch
                  id="send-inapp"
                  checked={sendInApp}
                  onCheckedChange={setSendInApp}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-muted-foreground" />
                  <Label htmlFor="send-sms" className="text-sm cursor-pointer">SMS Message</Label>
                </div>
                <Switch
                  id="send-sms"
                  checked={sendSms}
                  onCheckedChange={setSendSms}
                />
              </div>
              {sendSms && (
                <p className="text-xs text-muted-foreground">
                  ⚠️ SMS will be sent via Africa's Talking. Standard rates apply.
                </p>
              )}
            </div>

            <Button 
              onClick={sendBroadcast} 
              disabled={isSending || !message.trim() || selectedUsers.size === 0 || (!sendSms && !sendInApp)}
              className="w-full"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Send to {selectedUsers.size} Recipients
            </Button>
          </CardContent>
        </Card>

        {/* Sent Messages History */}
        {sentMessages.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Recently Sent</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[150px]">
                <div className="space-y-2">
                  {sentMessages.map((sent) => (
                    <div key={sent.id} className="p-2 bg-muted rounded text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{sent.subject}</span>
                        <div className="flex gap-1">
                          <Badge variant="outline">{sent.recipients} users</Badge>
                          {sent.smsCount > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              <Smartphone className="w-3 h-3 mr-1" />
                              {sent.smsCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{sent.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(sent.date).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recipients Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Select Recipients
            </span>
            <Badge variant="secondary">{selectedUsers.size} / {filteredUsers.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by phone, ID number, or name..."
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <Select value={targetGroup} onValueChange={setTargetGroup}>
              <SelectTrigger className="flex-1">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="approved">Approved Loans</SelectItem>
                <SelectItem value="pending">Pending Applications</SelectItem>
                <SelectItem value="rejected">Rejected Applications</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={selectAll}>
              {selectedUsers.size === filteredUsers.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>

          <ScrollArea className="h-[320px]">
            <div className="space-y-2 pr-4">
              {filteredUsers.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  {searchQuery ? 'No users match your search' : 'No users in this group'}
                </p>
              ) : (
                filteredUsers.map((user) => (
                  <div 
                    key={user.user_id}
                    className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                      selectedUsers.has(user.user_id) ? 'bg-primary/10' : 'hover:bg-muted'
                    }`}
                    onClick={() => toggleUser(user.user_id)}
                  >
                    <Checkbox checked={selectedUsers.has(user.user_id)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.phone} • ID: {user.id_number}</p>
                    </div>
                    {selectedUsers.has(user.user_id) && (
                      <CheckCircle className="w-4 h-4 text-primary" />
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
