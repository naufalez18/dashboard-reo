-- Create set_updated_at function if not exists
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END
$$;

-- Create groups table
CREATE TABLE public.groups (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add group_id to users table
ALTER TABLE public.users ADD COLUMN group_id BIGINT REFERENCES public.groups(id) ON DELETE SET NULL;

-- Create trigger for groups updated_at
CREATE TRIGGER set_groups_updated_at_trigger
    BEFORE UPDATE ON public.groups
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
