import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { FileText, Loader2, ArrowLeft } from "lucide-react";
import zenkaLogo from "@/assets/zenka-logo.png";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

const Application = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    fullName: "",
    idNumber: "",
    whatsappNumber: "",
    mpesaNumber: "",
    nextOfKinName: "",
    nextOfKinContact: "",
    incomeLevel: "",
    employmentStatus: "",
    occupation: "",
    hasExistingLoan: "",
    contactPersonName: "",
    contactPersonPhone: "",
    loanReason: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.fullName || !formData.idNumber || !formData.whatsappNumber || !formData.mpesaNumber ||
        !formData.nextOfKinName || !formData.nextOfKinContact || !formData.incomeLevel || 
        !formData.employmentStatus || !formData.occupation || !formData.hasExistingLoan ||
        !formData.contactPersonName || !formData.contactPersonPhone) {
      toast({
        title: "Incomplete Form",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Validate phone numbers
    const phoneRegex = /^(254|0)[17]\d{8}$/;
    if (!phoneRegex.test(formData.whatsappNumber)) {
      toast({
        title: "Invalid WhatsApp Number",
        description: "Please enter a valid Kenyan phone number",
        variant: "destructive",
      });
      return;
    }

    if (!phoneRegex.test(formData.mpesaNumber)) {
      toast({
        title: "Invalid M-Pesa Number",
        description: "Please enter a valid Kenyan phone number",
        variant: "destructive",
      });
      return;
    }

    if (!phoneRegex.test(formData.nextOfKinContact)) {
      toast({
        title: "Invalid Next of Kin Contact",
        description: "Please enter a valid Kenyan phone number",
        variant: "destructive",
      });
      return;
    }

    if (!phoneRegex.test(formData.contactPersonPhone)) {
      toast({
        title: "Invalid Contact Person Phone",
        description: "Please enter a valid Kenyan phone number",
        variant: "destructive",
      });
      return;
    }

    // Validate ID number
    if (formData.idNumber.length < 6 || formData.idNumber.length > 10) {
      toast({
        title: "Invalid ID Number",
        description: "ID Number must be 6-10 digits",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        toast({
          title: "Authentication Error",
          description: "Please log in to submit an application",
          variant: "destructive",
        });
        setIsLoading(false);
        navigate("/auth");
        return;
      }

      // Calculate loan limit based on income and employment status
      // Minimum: 6,200 KES, Maximum: 30,000 KES
      const MIN_LOAN_LIMIT = 6200;
      const MAX_LOAN_LIMIT = 30000;
      
      let baseLoan = 0;
      
      // Base loan calculation by income level
      switch(formData.incomeLevel) {
        case "below-20k":
          baseLoan = 8000;
          break;
        case "20k-50k":
          baseLoan = 15000;
          break;
        case "50k-100k":
          baseLoan = 22000;
          break;
        case "above-100k":
          baseLoan = 28000;
          break;
      }
      
      // Adjust by employment status
      let calculatedLimit = baseLoan;
      switch(formData.employmentStatus) {
        case "employed":
          calculatedLimit = Math.floor(baseLoan * 1.15); // 15% boost
          break;
        case "self-employed":
          calculatedLimit = Math.floor(baseLoan * 1.05); // 5% boost
          break;
        case "student":
          calculatedLimit = Math.floor(baseLoan * 0.85); // 15% reduction
          break;
        case "unemployed":
          calculatedLimit = Math.floor(baseLoan * 0.75); // 25% reduction
          break;
      }
      
      // Clamp to min/max range
      const loanLimit = Math.min(MAX_LOAN_LIMIT, Math.max(MIN_LOAN_LIMIT, calculatedLimit));

      // Simulate processing time before saving to database
      setTimeout(async () => {
        // Save application to database
        const { data: application, error: dbError } = await supabase
          .from("loan_applications")
          .insert({
            user_id: user.id,
            loan_limit: loanLimit,
            full_name: formData.fullName,
            id_number: formData.idNumber,
            whatsapp_number: formData.whatsappNumber,
            next_of_kin_name: formData.nextOfKinName,
            next_of_kin_contact: formData.nextOfKinContact,
            income_level: formData.incomeLevel,
            employment_status: formData.employmentStatus,
            occupation: formData.occupation,
            contact_person_name: formData.contactPersonName,
            contact_person_phone: formData.contactPersonPhone,
            loan_reason: formData.loanReason || "",
            status: "pending"
          })
          .select()
          .single();

        if (dbError) {
          console.error("Database error:", dbError);
          toast({
            title: "Error",
            description: "Failed to submit application. Please try again.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        // Store application ID and loan limit in localStorage for next steps
        localStorage.setItem("currentApplicationId", application.id);
        localStorage.setItem("zenkaLoanLimit", loanLimit.toString());
        
        setIsLoading(false);
        navigate("/loan-limit");
      }, 30000); // 30 seconds
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-soft py-8 px-4">
      <div className="container max-w-2xl mx-auto">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate("/dashboard")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Card className="shadow-card">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Loan Application</CardTitle>
            <CardDescription>
              Fill in your details to apply for a loan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Personal Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value.slice(0, 100) })}
                    required
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="idNumber">ID Number *</Label>
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
                    required
                    maxLength={10}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsappNumber">WhatsApp Number *</Label>
                  <Input
                    id="whatsappNumber"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="0712345678"
                    value={formData.whatsappNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 12);
                      setFormData({ ...formData, whatsappNumber: value });
                    }}
                    required
                    maxLength={12}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mpesaNumber">Registered M-Pesa Number *</Label>
                  <Input
                    id="mpesaNumber"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="0712345678"
                    value={formData.mpesaNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 12);
                      setFormData({ ...formData, mpesaNumber: value });
                    }}
                    required
                    maxLength={12}
                  />
                </div>
              </div>

              {/* Next of Kin */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Next of Kin</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="nextOfKinName">Full Name *</Label>
                  <Input
                    id="nextOfKinName"
                    placeholder="Jane Doe"
                    value={formData.nextOfKinName}
                    onChange={(e) => setFormData({ ...formData, nextOfKinName: e.target.value.slice(0, 100) })}
                    required
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nextOfKinContact">Contact Number *</Label>
                  <Input
                    id="nextOfKinContact"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="0723456789"
                    value={formData.nextOfKinContact}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 12);
                      setFormData({ ...formData, nextOfKinContact: value });
                    }}
                    required
                    maxLength={12}
                  />
                </div>
              </div>

              {/* Financial Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Financial Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="employmentStatus">Employment Status *</Label>
                  <Select 
                    value={formData.employmentStatus}
                    onValueChange={(value) => setFormData({ ...formData, employmentStatus: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select employment status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employed">Employed</SelectItem>
                      <SelectItem value="self-employed">Self-Employed</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="unemployed">Unemployed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="incomeLevel">Income Level *</Label>
                  <Select 
                    value={formData.incomeLevel}
                    onValueChange={(value) => setFormData({ ...formData, incomeLevel: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select income range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="below-20k">Below KES 20,000</SelectItem>
                      <SelectItem value="20k-50k">KES 20,000 - 50,000</SelectItem>
                      <SelectItem value="50k-100k">KES 50,000 - 100,000</SelectItem>
                      <SelectItem value="above-100k">Above KES 100,000</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="occupation">Occupation *</Label>
                  <Input
                    id="occupation"
                    placeholder="e.g., Teacher, Business Owner"
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value.slice(0, 100) })}
                    required
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hasExistingLoan">Do you have another existing loan? *</Label>
                  <Select 
                    value={formData.hasExistingLoan}
                    onValueChange={(value) => setFormData({ ...formData, hasExistingLoan: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Contact Person */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Contact Person</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="contactPersonName">Name *</Label>
                  <Input
                    id="contactPersonName"
                    placeholder="Reference name"
                    value={formData.contactPersonName}
                    onChange={(e) => setFormData({ ...formData, contactPersonName: e.target.value.slice(0, 100) })}
                    required
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPersonPhone">Phone Number *</Label>
                  <Input
                    id="contactPersonPhone"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="0734567890"
                    value={formData.contactPersonPhone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 12);
                      setFormData({ ...formData, contactPersonPhone: value });
                    }}
                    required
                    maxLength={12}
                  />
                </div>
              </div>

              {/* Optional */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Additional Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="loanReason">Reason for Loan (Optional)</Label>
                  <Textarea
                    id="loanReason"
                    placeholder="Tell us why you need this loan..."
                    value={formData.loanReason}
                    onChange={(e) => setFormData({ ...formData, loanReason: e.target.value.slice(0, 500) })}
                    rows={3}
                    maxLength={500}
                  />
                </div>
              </div>

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
                    Calculating Your Loan Limit...
                  </>
                ) : (
                  "Submit Application"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Dialog open={isLoading} onOpenChange={() => {}}>
          <DialogContent className="max-w-[85%] sm:max-w-sm rounded-3xl border-0 shadow-2xl bg-card [&>button]:hidden">
            <DialogHeader>
              <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse overflow-hidden">
                <img src={zenkaLogo} alt="Zenka" className="w-16 h-16 object-contain" />
              </div>
              <DialogTitle className="text-center text-2xl">
                Calculating Your Loan Limit
              </DialogTitle>
              <DialogDescription className="text-center space-y-3 pt-2">
                <p className="text-base font-medium text-foreground">
                  Please don't exit this page!
                </p>
                <p className="text-sm">
                  We're analyzing your information to provide you with the best personalized loan offer...
                </p>
                <div className="flex items-center justify-center gap-2 pt-4">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Application;
