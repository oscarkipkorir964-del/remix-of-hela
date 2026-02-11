import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate, Link } from "react-router-dom";
import { LogIn, UserPlus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import zenkaLogo from "@/assets/zenka-logo.png";
import DecorativeBackground from "@/components/DecorativeBackground";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    idNumber: "",
    phoneNumber: "",
    password: "",
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (!formData.phoneNumber || !formData.password) {
      toast({
        title: "Incomplete Form",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (!isLogin && (!formData.fullName || !formData.idNumber)) {
      toast({
        title: "Incomplete Form",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (!isLogin && !acceptedTerms) {
      toast({
        title: "Terms Required",
        description: "Please accept the terms and conditions to continue",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Validate phone number format (Kenyan format)
    const phoneRegex = /^(254|0)[17]\d{8}$/;
    if (!phoneRegex.test(formData.phoneNumber)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid Kenyan phone number (e.g., 0712345678)",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Validate phone number length
    if (formData.phoneNumber.length < 10 || formData.phoneNumber.length > 12) {
      toast({
        title: "Invalid Phone Number",
        description: "Phone number must be 10-12 digits",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Validate ID number (numeric only and proper length)
    if (!isLogin) {
      if (!/^\d+$/.test(formData.idNumber)) {
        toast({
          title: "Invalid ID Number",
          description: "ID Number must contain only numbers",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      if (formData.idNumber.length < 6 || formData.idNumber.length > 10) {
        toast({
          title: "Invalid ID Number",
          description: "ID Number must be 6-10 digits",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
    }

    if (formData.password.length < 6) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      // Use phone as email (phone@zenkaloans.com)
      const email = `${formData.phoneNumber}@zenkaloans.com`;
      
      if (isLogin) {
        const { data: authData, error } = await supabase.auth.signInWithPassword({
          email,
          password: formData.password,
        });

        if (error) throw error;

        // Check if user has admin role
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", authData.user?.id)
          .eq("role", "admin")
          .maybeSingle();

        toast({
          title: "Login Successful",
          description: "Welcome back!",
        });
        
        // Redirect to admin dashboard if user is admin, otherwise to user dashboard
        if (roleData) {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }
      } else {
        // Direct signup
        const { error } = await supabase.auth.signUp({
          email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName,
              id_number: formData.idNumber,
              phone: formData.phoneNumber,
            }
          }
        });

        if (error) throw error;

        toast({
          title: "Account Created",
          description: "Welcome to Zenka!",
        });
        
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-4 relative">
      <DecorativeBackground />
      <Card className="w-full max-w-md shadow-card relative z-10">
        <CardHeader className="text-center space-y-4">
          <img 
            src={zenkaLogo} 
            alt="Zenka" 
            className="h-16 w-auto mx-auto"
          />
          <div>
            <CardTitle className="text-2xl">
              {isLogin ? "Welcome Back!" : "Join Zenka"}
            </CardTitle>
            <CardDescription>
              {isLogin 
                ? "Sign in to continue your loan application" 
                : "Create an account to get started"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      placeholder="John Doe"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value.slice(0, 100) })}
                      required={!isLogin}
                      maxLength={100}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="idNumber">ID Number</Label>
                    <Input
                      id="idNumber"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="12345678"
                      value={formData.idNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setFormData({ ...formData, idNumber: value });
                      }}
                      required={!isLogin}
                      maxLength={10}
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number (M-Pesa Registered)</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="0712345678"
                  value={formData.phoneNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 12);
                    setFormData({ ...formData, phoneNumber: value });
                  }}
                  required
                  maxLength={12}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>

              {!isLogin && (
                <div className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
                  <Checkbox 
                    id="terms" 
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                  />
                  <label
                    htmlFor="terms"
                    className="text-sm leading-tight cursor-pointer"
                  >
                    I agree to the{" "}
                    <Link to="/terms" className="text-primary hover:underline font-medium">
                      Terms & Conditions
                    </Link>
                  </label>
                </div>
              )}

              <Button
                type="submit" 
                variant="cute" 
                className="w-full" 
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Please wait...
                  </>
                ) : isLogin ? (
                  <>
                    <LogIn className="w-5 h-5" />
                    Sign In
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    Sign Up
                  </>
                )}
              </Button>

              <div className="text-center text-sm space-y-2">
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => navigate('/reset-password')}
                    className="text-primary hover:underline font-medium block w-full"
                  >
                    Forgot Password?
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-primary hover:underline font-medium"
                >
                  {isLogin 
                    ? "Don't have an account? Sign up" 
                    : "Already have an account? Sign in"}
                </button>
              </div>
            </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
