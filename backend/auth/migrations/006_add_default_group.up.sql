-- Insert default 'Dashboard All' group if it doesn't exist
INSERT INTO public.groups (name, description)
VALUES ('Dashboard All', 'Default group with access to all dashboards')
ON CONFLICT DO NOTHING;
