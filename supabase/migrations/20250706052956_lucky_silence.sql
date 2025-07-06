-- ENABLE RLS
ALTER TABLE public.file_transfers ENABLE ROW LEVEL SECURITY;

-- DROP OLD POLICIES IF NEEDED
DROP POLICY IF EXISTS "Users can read own sent transfers" ON public.file_transfers;
DROP POLICY IF EXISTS "Users can read transfers sent to them" ON public.file_transfers;

-- POLICIES
CREATE POLICY "Users can read own sent transfers"
  ON public.file_transfers FOR SELECT TO authenticated
  USING (sender_id = auth.uid());

CREATE POLICY "Users can read transfers sent to them"
  ON public.file_transfers FOR SELECT TO authenticated
  USING (
    recipient_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  );
