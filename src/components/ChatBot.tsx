import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, X, Send, Loader2, Headset, CheckCircle2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

type Message = { 
  role: "user" | "assistant"; 
  content: string;
  isSupport?: boolean;
  senderType?: "user" | "admin";
};

type SupportRequest = {
  id: string;
  status: string;
  message: string;
  admin_reply: string | null;
};

export const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I'm your Zenka assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSupportForm, setShowSupportForm] = useState(false);
  const [supportMessage, setSupportMessage] = useState("");
  const [adminTyping, setAdminTyping] = useState(false);
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);
  const [currentRequest, setCurrentRequest] = useState<SupportRequest | null>(null);
  const [inSupportMode, setInSupportMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Load previous support messages and check for active conversation when opening chat
  useEffect(() => {
    if (isOpen) {
      loadActiveSupport();
    }
  }, [isOpen]);

  // Subscribe to new messages when in support mode
  useEffect(() => {
    if (!currentRequestId || !isOpen) return;

    const channel = supabase
      .channel(`support-messages-${currentRequestId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `request_id=eq.${currentRequestId}`
        },
        (payload: any) => {
          if (payload.new.sender_type === 'admin') {
            setMessages(prev => [...prev, {
              role: "assistant",
              content: payload.new.message,
              isSupport: true,
              senderType: "admin"
            }]);
            toast.success("New message from support!");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentRequestId, isOpen]);

  // Listen for admin typing
  useEffect(() => {
    if (!currentRequestId || !isOpen) return;

    const channel = supabase.channel(`typing-${currentRequestId}`);
    
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const isTyping = Object.keys(state).length > 0;
        setAdminTyping(isTyping);
      })
      .on('presence', { event: 'join' }, () => {
        setAdminTyping(true);
      })
      .on('presence', { event: 'leave' }, () => {
        setAdminTyping(false);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentRequestId, isOpen]);

  const loadActiveSupport = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check for active (pending) support request
      const { data: activeRequest } = await supabase
        .from("support_requests")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeRequest) {
        setCurrentRequestId(activeRequest.id);
        setCurrentRequest(activeRequest);
        setInSupportMode(true);

        // Load all messages for this conversation
        const { data: supportMsgs } = await supabase
          .from("support_messages")
          .select("*")
          .eq("request_id", activeRequest.id)
          .order("created_at", { ascending: true });

        if (supportMsgs && supportMsgs.length > 0) {
          const loadedMessages: Message[] = supportMsgs.map(msg => ({
            role: msg.sender_type === "user" ? "user" : "assistant",
            content: msg.message,
            isSupport: true,
            senderType: msg.sender_type as "user" | "admin"
          }));
          
          setMessages([
            { role: "assistant", content: "You're connected to support. An admin will respond shortly." },
            ...loadedMessages
          ]);
        } else {
          // Show the initial message
          setMessages([
            { role: "assistant", content: "You're connected to support. An admin will respond shortly." },
            { role: "user", content: activeRequest.message, isSupport: true, senderType: "user" }
          ]);
        }
      }
    } catch (error) {
      console.error("Error loading support:", error);
    }
  };

  const streamChat = async (userMessage: string) => {
    const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
    
    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: [...messages, { role: "user", content: userMessage }] }),
      });

      if (resp.status === 429) {
        toast.error("Rate limit exceeded. Please try again later.");
        return;
      }
      if (resp.status === 402) {
        toast.error("Service temporarily unavailable. Please try again later.");
        return;
      }
      if (!resp.ok || !resp.body) throw new Error("Failed to start stream");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;
      let assistantContent = "";

      // Add empty assistant message
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages((prev) => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = { role: "assistant", content: assistantContent };
                return newMessages;
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Failed to send message. Please try again.");
      setMessages((prev) => prev.slice(0, -1));
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    
    if (inSupportMode && currentRequestId) {
      // Send message to support conversation
      setMessages((prev) => [...prev, { role: "user", content: userMessage, isSupport: true, senderType: "user" }]);
      
      try {
        const { error } = await supabase
          .from("support_messages")
          .insert({
            request_id: currentRequestId,
            sender_type: "user",
            message: userMessage
          });
        
        if (error) throw error;
      } catch (error) {
        console.error("Error sending support message:", error);
        toast.error("Failed to send message");
      }
    } else {
      // Regular AI chat
      setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
      setIsLoading(true);
      await streamChat(userMessage);
      setIsLoading(false);
    }
  };

  const handleSupportRequest = async () => {
    if (!supportMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to contact support");
        return;
      }

      // Create support request
      const { data: newRequest, error } = await supabase
        .from("support_requests")
        .insert({
          user_id: user.id,
          user_email: user.email || "",
          user_name: user.user_metadata?.full_name || user.email || "User",
          message: supportMessage,
        })
        .select()
        .single();

      if (error) throw error;

      if (newRequest) {
        // Add first message to support_messages table
        await supabase
          .from("support_messages")
          .insert({
            request_id: newRequest.id,
            sender_type: "user",
            message: supportMessage
          });

        setCurrentRequestId(newRequest.id);
        setCurrentRequest(newRequest);
        setInSupportMode(true);

        // Switch to support mode
        setMessages([
          { role: "assistant", content: "You're now connected to support. An admin will respond shortly. You can continue chatting here until your issue is resolved." },
          { role: "user", content: supportMessage, isSupport: true, senderType: "user" }
        ]);
      }

      toast.success("Connected to support!");
      setSupportMessage("");
      setShowSupportForm(false);
    } catch (error) {
      console.error("Error sending support request:", error);
      toast.error("Failed to connect to support");
    }
  };

  const handleSettled = async () => {
    if (!currentRequestId) return;

    try {
      const { error } = await supabase
        .from("support_requests")
        .update({ status: "resolved" })
        .eq("id", currentRequestId);

      if (error) throw error;

      toast.success("Support conversation closed!");
      setInSupportMode(false);
      setCurrentRequestId(null);
      setCurrentRequest(null);
      setMessages([
        { role: "assistant", content: "Hi! I'm your Zenka assistant. How can I help you today?" }
      ]);
    } catch (error) {
      console.error("Error closing support:", error);
      toast.error("Failed to close conversation");
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
          size="icon"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed inset-4 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-96 sm:h-[500px] h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] shadow-xl z-50 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                {inSupportMode ? "Support Chat" : "Zenka Assistant"}
              </CardTitle>
              {inSupportMode && (
                <Badge variant="secondary" className="text-xs">Live</Badge>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="w-5 h-5" />
            </Button>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 break-words ${
                        msg.role === "user"
                          ? msg.isSupport 
                            ? "bg-blue-500 text-white"
                            : "bg-primary text-primary-foreground"
                          : msg.senderType === "admin"
                            ? "bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800"
                            : "bg-muted"
                      }`}
                    >
                      {msg.senderType === "admin" && (
                        <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">Admin</p>
                      )}
                      <p className="text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {adminTyping && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg px-4 py-2">
                      <p className="text-sm text-muted-foreground">
                        Admin is typing...
                      </p>
                    </div>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            <div className="border-t p-4">
              {inSupportMode ? (
                <div className="space-y-3">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSend();
                    }}
                    className="flex gap-2"
                  >
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Type your message to support..."
                      disabled={isLoading}
                    />
                    <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </form>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleSettled}
                    className="w-full text-green-600 border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Mark as Settled
                  </Button>
                </div>
              ) : showSupportForm ? (
                <div className="space-y-3">
                  <div className="bg-muted/50 p-3 rounded-lg text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">Contacting Support</p>
                    <p>Please describe your issue in detail. You'll be connected to a live agent who will chat with you until your issue is resolved.</p>
                  </div>
                  <Textarea
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    placeholder="Describe your issue in detail..."
                    className="min-h-[80px]"
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleSupportRequest} className="flex-1">
                      Start Chat
                    </Button>
                    <Button variant="outline" onClick={() => setShowSupportForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex gap-2 mb-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSupportForm(true)}
                      className="w-full"
                    >
                      <Headset className="w-4 h-4 mr-2" />
                      Talk to Support
                    </Button>
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSend();
                    }}
                    className="flex gap-2"
                  >
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask me anything..."
                      disabled={isLoading}
                    />
                    <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </form>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};
