-- Enable realtime for support_requests table
ALTER TABLE public.support_requests REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_requests;