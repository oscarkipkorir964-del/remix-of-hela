import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { ThemeProvider } from "./components/ThemeProvider";
import { supabase } from "@/integrations/supabase/client";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Terms from "./pages/Terms";
import Application from "./pages/Application";
import LoanLimit from "./pages/LoanLimit";
import LoanSelection from "./pages/LoanSelection";
import Payment from "./pages/Payment";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import AdminApplications from "./pages/AdminApplications";
import Support from "./pages/Support";
import Messages from "./pages/Messages";
import NotFound from "./pages/NotFound";
import Footer from "./components/Footer";
import { ChatBot } from "./components/ChatBot";
import InstallPrompt from "./components/InstallPrompt";

const queryClient = new QueryClient();

const ScrollToTop = () => {
  const location = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  
  return null;
};

// Sign out user on app load and redirect to landing page
const SessionClearer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    const clearSession = async () => {
      // Only clear session on initial app load, not on every route change
      const hasCleared = sessionStorage.getItem('session_cleared');
      if (!hasCleared) {
        await supabase.auth.signOut();
        sessionStorage.setItem('session_cleared', 'true');
        // If user is on a protected page, redirect to landing
        const publicPages = ['/', '/auth', '/reset-password', '/terms'];
        if (!publicPages.includes(location.pathname)) {
          navigate('/', { replace: true });
        }
      }
    };
    clearSession();
  }, []);
  
  return null;
};

const LoanNotifications = () => {
  const location = useLocation();
  
  useEffect(() => {
    // Only show notifications on authenticated pages (not landing or auth pages)
    const authenticatedPages = ['/application', '/loan-limit', '/loan-selection', '/payment'];
    if (!authenticatedPages.includes(location.pathname)) {
      return;
    }

    // Generate random Kenyan phone number with masking
    const generateMaskedPhone = () => {
      const prefix = "+254 7";
      const lastDigits = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
      return `${prefix}** *** ${lastDigits}`;
    };

    // Generate random loan amount within our range
    const generateLoanAmount = () => {
      const min = 3450;
      const max = 14600;
      return Math.floor(Math.random() * (max - min + 1) + min);
    };

    // Show loan notification
    const showLoanNotification = () => {
      const phone = generateMaskedPhone();
      const amount = generateLoanAmount();
      
      toast.success(
        `${phone} just received KSh ${amount.toLocaleString()}!`,
        {
          icon: <CheckCircle2 className="w-5 h-5 text-primary" />,
          duration: 5000,
        }
      );
    };

    // Intervals between 10-15 seconds
    const getRandomInterval = () => {
      return Math.floor(Math.random() * (15000 - 10000 + 1)) + 10000;
    };
    
    // Schedule next notification
    const scheduleNext = () => {
      const randomInterval = getRandomInterval();
      return setTimeout(() => {
        showLoanNotification();
        timeoutId = scheduleNext();
      }, randomInterval);
    };

    // Start the notification cycle after initial delay
    let timeoutId = setTimeout(() => {
      showLoanNotification();
      timeoutId = scheduleNext();
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [location.pathname]);

  return null;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <SessionClearer />
            <LoanNotifications />
            <div className="min-h-screen flex flex-col">
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/admin/applications" element={<AdminApplications />} />
                <Route path="/support" element={<Support />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/application" element={<Application />} />
                <Route path="/loan-limit" element={<LoanLimit />} />
                <Route path="/loan-selection" element={<LoanSelection />} />
                <Route path="/payment" element={<Payment />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Footer />
              <ChatBot />
              <InstallPrompt />
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
