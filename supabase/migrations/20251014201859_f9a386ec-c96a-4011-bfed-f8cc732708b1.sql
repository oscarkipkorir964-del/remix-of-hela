-- Create loan applications table
CREATE TABLE public.loan_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  id_number TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  next_of_kin_name TEXT NOT NULL,
  next_of_kin_contact TEXT NOT NULL,
  income_level TEXT NOT NULL,
  employment_status TEXT NOT NULL,
  occupation TEXT NOT NULL,
  contact_person_name TEXT NOT NULL,
  contact_person_phone TEXT NOT NULL,
  loan_reason TEXT,
  loan_limit INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create loan disbursements table
CREATE TABLE public.loan_disbursements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.loan_applications(id) ON DELETE CASCADE NOT NULL,
  loan_amount INTEGER NOT NULL,
  processing_fee INTEGER NOT NULL,
  transaction_code TEXT NOT NULL,
  payment_verified BOOLEAN DEFAULT false,
  disbursed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.loan_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_disbursements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for loan_applications
CREATE POLICY "Users can view their own applications"
  ON public.loan_applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own applications"
  ON public.loan_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own applications"
  ON public.loan_applications FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for loan_disbursements
CREATE POLICY "Users can view their own disbursements"
  ON public.loan_disbursements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.loan_applications
      WHERE loan_applications.id = loan_disbursements.application_id
      AND loan_applications.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own disbursements"
  ON public.loan_disbursements FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.loan_applications
      WHERE loan_applications.id = loan_disbursements.application_id
      AND loan_applications.user_id = auth.uid()
    )
  );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers
CREATE TRIGGER update_loan_applications_updated_at
  BEFORE UPDATE ON public.loan_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loan_disbursements_updated_at
  BEFORE UPDATE ON public.loan_disbursements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();