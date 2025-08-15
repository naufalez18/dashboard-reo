CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END
$$;

CREATE TABLE IF NOT EXISTS public.dashboards (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    display_duration DOUBLE PRECISION NOT NULL DEFAULT 30,
    is_active BOOLEAN DEFAULT true NOT NULL,
    sort_order DOUBLE PRECISION DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TRIGGER set_updated_at_trigger
    BEFORE UPDATE ON public.dashboards
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
