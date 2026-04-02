
-- Remaining 3 unindexed FK columns found in live scan
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id
  ON public.chat_messages(conversation_id);

CREATE INDEX IF NOT EXISTS idx_patient_vitals_patient_id
  ON public.patient_vitals(patient_id);

CREATE INDEX IF NOT EXISTS idx_wishlists_product_id
  ON public.wishlists(product_id);
