-- Create user_savings table to track savings balances
CREATE TABLE public.user_savings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  balance INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT user_savings_user_id_key UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.user_savings ENABLE ROW LEVEL SECURITY;

-- Users can view their own savings
CREATE POLICY "Users can view their own savings"
ON public.user_savings
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own savings record
CREATE POLICY "Users can create their own savings"
ON public.user_savings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create savings_deposits table to track deposit transactions
CREATE TABLE public.savings_deposits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  mpesa_message TEXT NOT NULL,
  transaction_code TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.savings_deposits ENABLE ROW LEVEL SECURITY;

-- Users can view their own deposits
CREATE POLICY "Users can view their own deposits"
ON public.savings_deposits
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own deposits
CREATE POLICY "Users can create their own deposits"
ON public.savings_deposits
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can update deposits (for verification)
CREATE POLICY "Admins can update deposits"
ON public.savings_deposits
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can view all deposits
CREATE POLICY "Admins can view all deposits"
ON public.savings_deposits
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at on user_savings
CREATE TRIGGER update_user_savings_updated_at
BEFORE UPDATE ON public.user_savings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();