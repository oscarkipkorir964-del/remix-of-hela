import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageSquare, Send, CheckCircle, Clock, 
  User, Headphones, Phone, Mail
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

type SupportMessage = {
  id: string;
  request_id: string;
  sender_type: "user" | "admin";
  message: string;
  created_at: string;
};

type SupportRequest = {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  message: string;
  status: string;
  admin_reply: string | null;
  created_at: string;
  updated_at: string;
};

interface SupportChatProps {
  supportRequests: SupportRequest[];
  onRefresh: () => void;
}

export const SupportChat = ({ supportRequests, onRefresh }: SupportChatProps) => {
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeChatRequest, setActiveChatRequest] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<SupportMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [activeTyping, setActiveTyping] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const filteredSupport = supportRequests.filter(req => {
    return statusFilter === "all" || req.status === statusFilter;
  });

  const activeRequest = supportRequests.find(r => r.id === activeChatRequest);

  // Load chat messages and subscribe to updates
  useEffect(() => {
    if (!activeChatRequest) return;

    const loadMessages = async () => {
      const { data } = await supabase
        .from("support_messages")
        .select("*")
        .eq("request_id", activeChatRequest)
        .order("created_at", { ascending: true });
      
      setChatMessages((data || []).map(msg => ({
        ...msg,
        sender_type: msg.sender_type as "user" | "admin"
      })));
    };

    loadMessages();

    const channel = supabase
      .channel(`admin-chat-${activeChatRequest}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `request_id=eq.${activeChatRequest}`
        },
        (payload: any) => {
          setChatMessages(prev => [...prev, payload.new as SupportMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeChatRequest]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Track typing status
  useEffect(() => {
    if (!activeTyping) return;
    const channel = supabase.channel(`typing-${activeTyping}`);
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          admin_typing: true,
          request_id: activeTyping,
          timestamp: new Date().toISOString()
        });
      }
    });
    return () => { supabase.removeChannel(channel); };
  }, [activeTyping]);

  const sendChatMessage = async () => {
    if (!chatInput.trim() || !activeChatRequest) return;

    try {
      const { error } = await supabase
        .from("support_messages")
        .insert({
          request_id: activeChatRequest,
          sender_type: "admin",
          message: chatInput.trim()
        });

      if (error) throw error;
      setChatInput("");
    } catch (error: any) {
      toast.error("Failed to send message");
    }
  };

  const markAsSettled = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from("support_requests")
        .update({ status: "resolved" })
        .eq("id", requestId);

      if (error) throw error;
      toast.success("Marked as settled!");
      setActiveChatRequest(null);
      setChatMessages([]);
      onRefresh();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const reopenRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from("support_requests")
        .update({ status: "pending" })
        .eq("id", requestId);

      if (error) throw error;
      toast.success("Chat reopened!");
      onRefresh();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "resolved":
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Resolved</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Active</Badge>;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Support Requests List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Headphones className="w-4 h-4" />
            Conversations ({filteredSupport.length})
          </h3>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Active</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredSupport.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No conversations
            </CardContent>
          </Card>
        ) : (
          <ScrollArea className="h-[450px]">
            <div className="space-y-2 pr-4">
              {filteredSupport.map((req) => (
                <Card 
                  key={req.id} 
                  className={`cursor-pointer transition-all ${
                    activeChatRequest === req.id 
                      ? 'ring-2 ring-primary shadow-md' 
                      : 'hover:bg-muted/50 hover:shadow-sm'
                  }`}
                  onClick={() => setActiveChatRequest(req.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-primary" />
                          <p className="font-medium text-sm truncate">{req.user_name}</p>
                        </div>
                        <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-1">
                          <Mail className="w-3 h-3" />
                          {req.user_email}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2 bg-muted p-2 rounded">
                          {req.message}
                        </p>
                      </div>
                      {getStatusBadge(req.status)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(req.created_at).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Chat Area */}
      <Card className="h-[520px] flex flex-col">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-sm">
            {activeRequest ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Chat with {activeRequest.user_name}
                  </span>
                  {activeRequest.status === "pending" ? (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => markAsSettled(activeChatRequest!)} 
                      className="text-green-600 border-green-600 hover:bg-green-50"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Mark Settled
                    </Button>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => reopenRequest(activeChatRequest!)}
                    >
                      Reopen
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {activeRequest.user_email.replace('@zenkaloans.com', '')}
                  </span>
                </div>
              </div>
            ) : (
              <span className="flex items-center gap-2 text-muted-foreground">
                <MessageSquare className="w-4 h-4" />
                Select a conversation
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          {activeChatRequest ? (
            <>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {/* Initial message */}
                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-lg px-3 py-2 bg-muted">
                      <p className="text-xs font-medium mb-1 opacity-70 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {activeRequest?.user_name} (Initial)
                      </p>
                      <p className="text-sm">{activeRequest?.message}</p>
                      <p className="text-xs opacity-50 mt-1">
                        {new Date(activeRequest?.created_at || "").toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_type === "admin" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg px-3 py-2 ${
                          msg.sender_type === "admin"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-xs font-medium mb-1 opacity-70 flex items-center gap-1">
                          {msg.sender_type === "admin" ? (
                            <><Headphones className="w-3 h-3" /> You</>
                          ) : (
                            <><User className="w-3 h-3" /> {activeRequest?.user_name}</>
                          )}
                        </p>
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                        <p className="text-xs opacity-50 mt-1">
                          {new Date(msg.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              {activeRequest?.status === "pending" && (
                <div className="p-4 border-t bg-muted/30">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      sendChatMessage();
                    }}
                    className="flex gap-2"
                  >
                    <Input
                      value={chatInput}
                      onChange={(e) => {
                        setChatInput(e.target.value);
                        setActiveTyping(activeChatRequest);
                      }}
                      onBlur={() => setActiveTyping(null)}
                      placeholder="Type your message..."
                      className="flex-1"
                    />
                    <Button type="submit" size="icon" disabled={!chatInput.trim()}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              )}
              {activeRequest?.status === "resolved" && (
                <div className="p-4 border-t bg-green-50 text-center text-sm text-green-700">
                  This conversation has been marked as resolved
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Select a conversation to start chatting</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
