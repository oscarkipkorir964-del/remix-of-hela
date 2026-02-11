-- Enable realtime for tables used in subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE public.savings_deposits;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_savings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.withdrawals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.loan_applications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.loan_disbursements;