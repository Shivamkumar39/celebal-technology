-- ENABLE RLS
ALTER TABLE public.transfer_notifications ENABLE ROW LEVEL SECURITY;

-- DROP OLD POLICIES IF NEEDED
DROP POLICY IF EXISTS "Users can read notifications" ON public.transfer_notifications;
DROP POLICY IF EXISTS "Users can update notifications" ON public.transfer_notifications;

-- POLICIES
CREATE POLICY "Users can read notifications"
  ON public.transfer_notifications FOR SELECT TO authenticated
  USING (
    recipient_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update notifications"
  ON public.transfer_notifications FOR UPDATE TO authenticated
  USING (
    recipient_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  );
