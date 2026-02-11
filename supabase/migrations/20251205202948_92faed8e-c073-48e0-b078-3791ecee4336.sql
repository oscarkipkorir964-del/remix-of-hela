-- Add admin policies for loan_disbursements table
CREATE POLICY "Admins can view all disbursements"
ON public.loan_disbursements
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update disbursements"
ON public.loan_disbursements
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));