
-- Add indexes for all FK columns that were missing a covering index
-- Generated from live advisor check — 12 missing indexes

CREATE INDEX IF NOT EXISTS idx_backup_assignments_placement_id
  ON public.backup_assignments(placement_id);

CREATE INDEX IF NOT EXISTS idx_flagged_content_queue_item_id
  ON public.flagged_content(queue_item_id);

CREATE INDEX IF NOT EXISTS idx_handoff_notes_patient_id
  ON public.handoff_notes(patient_id);

CREATE INDEX IF NOT EXISTS idx_incident_reports_shift_id
  ON public.incident_reports(shift_id);

CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice_id
  ON public.invoice_line_items(invoice_id);

CREATE INDEX IF NOT EXISTS idx_invoices_placement_id
  ON public.invoices(placement_id);

CREATE INDEX IF NOT EXISTS idx_placements_patient_id
  ON public.placements(patient_id);

CREATE INDEX IF NOT EXISTS idx_queued_notifications_notification_id
  ON public.queued_notifications(notification_id);

CREATE INDEX IF NOT EXISTS idx_shift_reassignments_shift_id
  ON public.shift_reassignments(shift_id);

CREATE INDEX IF NOT EXISTS idx_shop_order_items_order_id
  ON public.shop_order_items(order_id);

CREATE INDEX IF NOT EXISTS idx_shop_order_items_product_id
  ON public.shop_order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket_id
  ON public.support_ticket_messages(ticket_id);
