-- Create group_dashboards junction table for many-to-many relationship
CREATE TABLE public.group_dashboards (
    group_id BIGINT NOT NULL,
    dashboard_id BIGINT NOT NULL REFERENCES public.dashboards(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    PRIMARY KEY (group_id, dashboard_id)
);

CREATE INDEX idx_group_dashboards_group_id ON public.group_dashboards(group_id);
CREATE INDEX idx_group_dashboards_dashboard_id ON public.group_dashboards(dashboard_id);
