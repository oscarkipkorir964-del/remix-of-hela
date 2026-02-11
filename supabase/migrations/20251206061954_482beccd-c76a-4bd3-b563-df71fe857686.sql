-- Create function to update user savings balance when withdrawal is approved
CREATE OR REPLACE FUNCTION public.handle_withdrawal_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only process when status changes to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Subtract the withdrawal amount from user's savings balance
    UPDATE public.user_savings
    SET balance = balance - NEW.amount,
        updated_at = now()
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to fire after withdrawal update
CREATE TRIGGER on_withdrawal_approved
  AFTER UPDATE ON public.withdrawals
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_withdrawal_approval();