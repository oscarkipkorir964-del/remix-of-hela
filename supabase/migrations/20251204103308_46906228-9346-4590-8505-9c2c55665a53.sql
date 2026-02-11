-- Allow users to update their own savings balance
CREATE POLICY "Users can update their own savings"
ON public.user_savings
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);