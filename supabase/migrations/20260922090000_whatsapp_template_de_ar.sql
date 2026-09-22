-- Replaces the single whatsapp_selection_template column with two
-- language-specific templates (the sender's own current app language picks
-- which one is used -- see mapSelectionExportService.ts) plus a toggle list
-- of which message components (name/address/phone/orders/thankYou/eta) are
-- included in the generated WhatsApp text. No production row has ever had
-- whatsapp_selection_template set (confirmed empty before this migration),
-- so this is a clean rename/split, not a data migration.
alter table public.user_preferences
  drop column if exists whatsapp_selection_template,
  add column if not exists whatsapp_template_de text,
  add column if not exists whatsapp_template_ar text,
  add column if not exists whatsapp_components text[];
