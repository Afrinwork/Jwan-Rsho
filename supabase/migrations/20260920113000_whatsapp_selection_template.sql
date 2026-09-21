alter table public.user_preferences
  add column if not exists whatsapp_selection_template text;
